import { NextResponse } from "next/server";
import { getAssistantReply } from "@/lib/chat-service";
import { applyRateLimit, getClientId } from "@/lib/guardrails";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const clientId = getClientId(request);
  const rateLimit = applyRateLimit(clientId);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: "Too many requests. Please wait a few minutes before sending more messages.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(
            Math.ceil((rateLimit.retryAfterMs ?? 0) / 1000),
          ),
        },
      },
    );
  }

  try {
    const body = (await request.json()) as { messages?: unknown; context?: unknown };
    const reply = await getAssistantReply(body.messages, body.context);

    return NextResponse.json({
      reply: reply.content,
      model: reply.model,
      publicModelId: reply.publicModelId,
      conversationalModel: reply.conversationalModel,
      source: reply.source,
      usage: reply.usage,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "The chat request could not be processed.",
      },
      { status: 500 },
    );
  }
}
