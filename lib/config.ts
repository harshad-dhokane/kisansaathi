export const appConfig = {
  name: "AgriSmart",
  tagline: "Practical, multilingual crop guidance for smallholder farmers.",
  appPort: process.env.APP_PORT || "3001",
  appBaseUrl:
    process.env.APP_BASE_URL || `http://localhost:${process.env.APP_PORT || "3001"}`,
  groqModel: process.env.GROQ_MODEL || "qwen/qwen3-32b",
  groqEndpoint: "https://api.groq.com/openai/v1/chat/completions",
  openRouterModel:
    process.env.OPENROUTER_MODEL || "nvidia/nemotron-3-super-120b-a12b",
  openRouterEndpoint: "https://openrouter.ai/api/v1/chat/completions",
  defaultConversationalModel: process.env.CONVERSATIONAL_MODEL || "qwen",
  maxTurns: 12,
  maxMessageChars: 2500,
  maxRequestChars: 12000,
  rateLimitWindowMs: 5 * 60 * 1000,
  rateLimitMaxRequests: 30,
};

export function requireGroqApiKey() {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error("Missing GROQ_API_KEY environment variable.");
  }

  return apiKey;
}

export function requireOpenRouterApiKey() {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error("Missing OPENROUTER_API_KEY environment variable.");
  }

  return apiKey;
}
