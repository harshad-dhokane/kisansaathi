export function buildOpenAIChatCompletion(args: {
  content: string;
  model: string;
  completionTokens?: number;
  promptTokens?: number;
}) {
  const created = Math.floor(Date.now() / 1000);
  const promptTokens = args.promptTokens ?? 0;
  const completionTokens = args.completionTokens ?? 0;

  return {
    id: `chatcmpl_${crypto.randomUUID()}`,
    object: "chat.completion",
    created,
    model: args.model,
    choices: [
      {
        index: 0,
        finish_reason: "stop",
        message: {
          role: "assistant",
          content: args.content,
        },
      },
    ],
    usage: {
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: promptTokens + completionTokens,
    },
  };
}
