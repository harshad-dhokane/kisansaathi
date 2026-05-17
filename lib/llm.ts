import { appConfig, requireGroqApiKey, requireOpenRouterApiKey } from "@/lib/config";
import {
  getConversationalModelDefinition,
  resolveConversationalModel,
  type ConversationalModelId,
  type ConversationalProvider,
} from "@/lib/conversational-models";
import type { ChatMessage } from "@/lib/guardrails";
import { AGRI_JSON_RESPONSE_RULES, AGRI_SYSTEM_PROMPT } from "@/lib/prompt";

type ProviderResponse = {
  id?: string;
  model?: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  choices?: Array<{
    message?: {
      role?: string;
      content?: string;
    };
  }>;
};

type StructuredAgriReply = {
  direct_answer?: string;
  safe_next_steps_title?: string;
  safe_next_steps?: string[];
  need_more_info_title?: string;
  need_more_info?: string[];
  local_help_title?: string;
  local_help?: string;
};

type ProviderConfig = {
  provider: ConversationalProvider;
  endpoint: string;
  requestModel: string;
  apiKey: string;
};

type ReplyEnvelope = {
  content: string;
  model: string;
  publicModelId: string;
  provider: ConversationalProvider;
  conversationalModel: ConversationalModelId;
  usage?: ProviderResponse["usage"];
};

function stripThinkBlocks(text: string) {
  return text
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/^\s*thinking[\s.:_-]*$/gim, "")
    .trim();
}

function normalizeAssistantText(text: string) {
  const stripped = stripThinkBlocks(text);

  return stripped
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
}

function normalizeList(items: unknown) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function cleanInlineMarkdown(text: string) {
  return text.replace(/\*\*(.*?)\*\*/g, "$1").trim();
}

function toDisplayText(reply: StructuredAgriReply) {
  const parts: string[] = [];
  const directAnswer = cleanInlineMarkdown(reply.direct_answer || "");
  const nextSteps = normalizeList(reply.safe_next_steps).map(cleanInlineMarkdown);
  const needMoreInfo = normalizeList(reply.need_more_info).map(cleanInlineMarkdown);
  const localHelp = cleanInlineMarkdown(reply.local_help || "");

  if (directAnswer) {
    parts.push(directAnswer);
  }

  if (nextSteps.length > 0) {
    parts.push(nextSteps.map((item) => `- ${item}`).join("\n"));
  }

  if (needMoreInfo.length > 0) {
    parts.push([`If you can, tell me:`, ...needMoreInfo.map((item) => `- ${item}`)].join("\n"));
  }

  if (localHelp) {
    parts.push(localHelp);
  }

  return parts.join("\n\n").trim();
}

function looksLikeJsonObject(text: string) {
  const trimmed = text.trim();
  return trimmed.startsWith("{") && trimmed.endsWith("}");
}

function tryParseStructuredReply(text: string) {
  if (!looksLikeJsonObject(text)) {
    return null;
  }

  try {
    return JSON.parse(text) as StructuredAgriReply;
  } catch {
    return null;
  }
}

function buildSystemMessages(realtimeContext?: string) {
  const systemMessages = [{ role: "system", content: AGRI_SYSTEM_PROMPT }];

  if (realtimeContext) {
    systemMessages.push({
      role: "system",
      content: realtimeContext,
    });
  }

  return systemMessages;
}

function buildBaseMessages(
  messages: ChatMessage[],
  mode: "structured" | "plain_text",
  realtimeContext?: string,
) {
  const extraSystemMessage =
    mode === "structured"
      ? {
          role: "system" as const,
          content: AGRI_JSON_RESPONSE_RULES,
        }
      : {
          role: "system" as const,
          content: `Return only the final answer in plain text.
- No markdown headings.
- No bold markers.
- No <think> tags.
- Keep the answer compact and complete.
- Sound natural, direct, and human.
- Do not mention local experts or extension workers unless the case is high-risk or impossible to judge safely from chat.
- If real-time date, time, location, or weather context is provided and relevant, weave it in naturally.
- Use at most 110 words or 5 short bullet lines.
- Prefer 1 short answer paragraph followed by a few short bullet lines.
- If helpful, use short hyphen bullets.`,
        };

  return [
    ...buildSystemMessages(realtimeContext),
    extraSystemMessage,
    ...messages.map((message) => ({
      role: message.role,
      content: message.content,
    })),
  ];
}

function buildProviderPayload(
  providerConfig: ProviderConfig,
  messages: ChatMessage[],
  mode: "structured" | "plain_text",
  realtimeContext?: string,
) {
  const isGroq = providerConfig.provider === "groq";
  const basePayload: Record<string, unknown> = {
    model: providerConfig.requestModel,
    temperature: 0.2,
    messages: buildBaseMessages(messages, mode, realtimeContext),
  };

  if (mode === "structured") {
    basePayload.response_format = { type: "json_object" };
  }

  if (isGroq) {
    basePayload.max_completion_tokens = mode === "structured" ? 700 : 650;
    basePayload.reasoning_format = "hidden";
    basePayload.reasoning_effort = "none";
    return basePayload;
  }

  basePayload.max_tokens = mode === "structured" ? 700 : 650;
  return basePayload;
}

function buildProviderHeaders(providerConfig: ProviderConfig) {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${providerConfig.apiKey}`,
    "Content-Type": "application/json",
  };

  if (providerConfig.provider === "openrouter") {
    headers["HTTP-Referer"] = appConfig.appBaseUrl;
    headers["X-OpenRouter-Title"] = appConfig.name;
  }

  return headers;
}

function shouldUseStructuredMode(providerConfig: ProviderConfig) {
  return providerConfig.provider === "groq";
}

async function callProvider(providerConfig: ProviderConfig, payload: Record<string, unknown>) {
  const response = await fetch(providerConfig.endpoint, {
    method: "POST",
    headers: buildProviderHeaders(providerConfig),
    body: JSON.stringify(payload),
    cache: "no-store",
    signal: AbortSignal.timeout(45000),
  });

  const responseText = await response.text();

  if (!response.ok) {
    const providerLabel = providerConfig.provider === "groq" ? "Groq" : "OpenRouter";
    throw new Error(`${providerLabel} upstream failed: ${response.status} ${responseText}`);
  }

  return JSON.parse(responseText) as ProviderResponse;
}

async function runPlainTextReply(
  providerConfig: ProviderConfig,
  modelId: ConversationalModelId,
  publicModelId: string,
  messages: ChatMessage[],
  realtimeContext?: string,
): Promise<ReplyEnvelope> {
  const fallbackData = await callProvider(
    providerConfig,
    buildProviderPayload(providerConfig, messages, "plain_text", realtimeContext),
  );
  const fallbackContent = normalizeAssistantText(
    fallbackData.choices?.[0]?.message?.content?.trim() || "",
  );

  if (!fallbackContent) {
    throw new Error("The model returned an empty assistant message.");
  }

  return {
    content: fallbackContent,
    model: fallbackData.model || providerConfig.requestModel,
    publicModelId,
    provider: providerConfig.provider,
    conversationalModel: modelId,
    usage: fallbackData.usage,
  };
}

function getProviderConfig(modelInput?: unknown): {
  providerConfig: ProviderConfig;
  modelId: ConversationalModelId;
  publicModelId: string;
} {
  const modelId = resolveConversationalModel(modelInput);
  const definition = getConversationalModelDefinition(modelId);

  if (definition.provider === "groq") {
    return {
      modelId,
      publicModelId: definition.publicModelId,
      providerConfig: {
        provider: "groq",
        endpoint: appConfig.groqEndpoint,
        requestModel: definition.requestModel,
        apiKey: requireGroqApiKey(),
      },
    };
  }

  return {
    modelId,
    publicModelId: definition.publicModelId,
    providerConfig: {
      provider: "openrouter",
      endpoint: appConfig.openRouterEndpoint,
      requestModel: definition.requestModel,
      apiKey: requireOpenRouterApiKey(),
    },
  };
}

export async function generateConversationalReply(
  modelInput: unknown,
  messages: ChatMessage[],
  realtimeContext?: string,
) {
  const { modelId, publicModelId, providerConfig } = getProviderConfig(modelInput);

  if (!shouldUseStructuredMode(providerConfig)) {
    return runPlainTextReply(
      providerConfig,
      modelId,
      publicModelId,
      messages,
      realtimeContext,
    );
  }

  try {
    const data = await callProvider(
      providerConfig,
      buildProviderPayload(providerConfig, messages, "structured", realtimeContext),
    );
    const rawContent = normalizeAssistantText(data.choices?.[0]?.message?.content?.trim() || "");
    const parsed = tryParseStructuredReply(rawContent);
    let content = rawContent;

    if (parsed) {
      content = toDisplayText(parsed);
    }

    if (!content) {
      throw new Error("The model returned an empty assistant message.");
    }

    return {
      content,
      model: data.model || providerConfig.requestModel,
      publicModelId,
      provider: providerConfig.provider,
      conversationalModel: modelId,
      usage: data.usage,
    };
  } catch (structuredError) {
    console.error(
      `Structured ${providerConfig.provider} call failed. Retrying with plain-text mode.`,
      structuredError,
    );
  }

  return runPlainTextReply(
    providerConfig,
    modelId,
    publicModelId,
    messages,
    realtimeContext,
  );
}
