import { NextResponse } from "next/server";
import { getAssistantReply } from "@/lib/chat-service";
import { buildOpenAIChatCompletion } from "@/lib/openai-compatible";
import { applyRateLimit, getClientId } from "@/lib/guardrails";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type OpenAIChatCompletionRequest = {
  model?: string;
  messages?: unknown;
  context?: unknown;
};

export async function POST(request: Request) {
  const clientId = getClientId(request);
  const rateLimit = applyRateLimit(clientId);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: { message: "Rate limit exceeded." } },
      { status: 429 },
    );
  }

  try {
    const body = (await request.json()) as OpenAIChatCompletionRequest;
    const reply = await getAssistantReply(body.messages, body.context);

    return NextResponse.json(
      buildOpenAIChatCompletion({
        content: reply.content,
        model: reply.publicModelId,
        completionTokens: reply.usage?.completion_tokens,
        promptTokens: reply.usage?.prompt_tokens,
      }),
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: {
          message: "Unable to create a chat completion.",
          type: "server_error",
        },
      },
      { status: 500 },
    );
  }
}
