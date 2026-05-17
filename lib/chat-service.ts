import { appConfig } from "@/lib/config";
import {
  getConversationalModelDefinition,
  isConversationalModelConfigured,
  resolveConversationalModel,
} from "@/lib/conversational-models";
import {
  getLatestUserMessage,
  moderateLatestUserMessage,
  sanitizeMessages,
  type ChatMessage,
} from "@/lib/guardrails";
import { generateConversationalReply } from "@/lib/llm";
import { buildRealtimeContextMessage } from "@/lib/weather";

type ChatReply = {
  content: string;
  model: string;
  publicModelId: string;
  conversationalModel: "qwen" | "nemotron_super";
  source: "groq" | "openrouter" | "guardrail" | "fallback";
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
};

export async function getAssistantReply(
  messagesInput: unknown,
  contextInput?: unknown,
  modelInput?: unknown,
): Promise<ChatReply> {
  const messages = sanitizeMessages(messagesInput);
  const latestUserMessage = getLatestUserMessage(messages);
  const moderation = moderateLatestUserMessage(latestUserMessage);
  const conversationalModel = resolveConversationalModel(modelInput);
  const modelDefinition = getConversationalModelDefinition(conversationalModel);

  if (moderation.kind === "respond") {
    return {
      content: moderation.response,
      model: "guardrail-policy",
      publicModelId: modelDefinition.publicModelId,
      conversationalModel,
      source: "guardrail",
    };
  }

  const totalChars = messages.reduce((sum, message) => sum + message.content.length, 0);

  if (totalChars > appConfig.maxRequestChars) {
    return {
      content:
        "This conversation is too long for one request. Please start a new chat and include only the most recent farming context.",
      model: "guardrail-policy",
      publicModelId: modelDefinition.publicModelId,
      conversationalModel,
      source: "guardrail",
    };
  }

  if (!latestUserMessage) {
    return {
      content:
        "Please ask a farming question. Include the crop, location, growth stage, weather conditions, and the issue you are seeing if possible.",
      model: "guardrail-policy",
      publicModelId: modelDefinition.publicModelId,
      conversationalModel,
      source: "guardrail",
    };
  }

  if (!isConversationalModelConfigured(conversationalModel)) {
    return {
      content:
        conversationalModel === "nemotron_super"
          ? "The Nemotron Super backend is not configured yet. Add a valid OPENROUTER_API_KEY or switch the conversational model back to Qwen."
          : "The Qwen backend is not configured yet. Add a valid GROQ_API_KEY or switch the conversational model to Nemotron Super.",
      model: modelDefinition.requestModel,
      publicModelId: modelDefinition.publicModelId,
      conversationalModel,
      source: "fallback",
    };
  }

  try {
    const realtimeContext = await buildRealtimeContextMessage(contextInput);
    const reply = await generateConversationalReply(
      conversationalModel,
      messages as ChatMessage[],
      realtimeContext,
    );

    return {
      content: reply.content,
      model: reply.model,
      publicModelId: reply.publicModelId,
      conversationalModel: reply.conversationalModel,
      source: reply.provider,
      usage: reply.usage,
    };
  } catch (error) {
    console.error(error);

    return {
      content:
        "I could not prepare a proper farming answer right now. Please try again in a minute. If this is a severe crop-loss or chemical-safety issue, check with a local agriculture expert.",
      model: modelDefinition.requestModel,
      publicModelId: modelDefinition.publicModelId,
      conversationalModel,
      source: "fallback",
    };
  }
}
