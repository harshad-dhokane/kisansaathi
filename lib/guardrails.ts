import { appConfig } from "@/lib/config";

export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

type GuardrailDecision =
  | { kind: "allow" }
  | { kind: "respond"; response: string; tag: string };

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

const disallowedPatterns = [
  /\b(suicide|kill myself|self[- ]harm|end my life)\b/i,
  /\b(make a bomb|build a bomb|explosive device|weaponize)\b/i,
  /\b(credit card fraud|steal passwords|phishing kit|malware|ransomware)\b/i,
  /\b(how to poison|poison someone)\b/i,
];

const humanMedicalPatterns = [
  /\b(chest pain|pregnant|fever|blood pressure|diabetes medicine)\b/i,
  /\b(human medicine|medical diagnosis|hospital)\b/i,
];

const nonAgriculturePatterns = [
  /\b(stock market|crypto|bitcoin|forex)\b/i,
  /\b(write code|python script|javascript bug)\b/i,
  /\b(movie review|dating advice|breakup)\b/i,
];

const unsafeAgriPatterns = [
  /\b(exact pesticide dose|exact herbicide dose|chemical dose)\b/i,
  /\b(mix diesel|mix bleach|unlabelled chemical)\b/i,
  /\b(guaranteed yield|certain weather prediction)\b/i,
];

export function sanitizeMessages(input: unknown): ChatMessage[] {
  if (!Array.isArray(input)) {
    return [];
  }

  const sanitized = input
    .filter((item): item is { role?: unknown; content?: unknown } => Boolean(item))
    .map((item) => ({
      role: (item.role === "assistant" ? "assistant" : "user") as ChatRole,
      content: typeof item.content === "string" ? item.content.trim() : "",
    }))
    .filter((item) => item.content.length > 0)
    .slice(-appConfig.maxTurns)
    .map((item) => ({
      ...item,
      content: item.content.slice(0, appConfig.maxMessageChars),
    }));

  return sanitized;
}

export function getLatestUserMessage(messages: ChatMessage[]): string {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index]?.role === "user") {
      return messages[index].content;
    }
  }

  return "";
}

export function applyRateLimit(clientId: string) {
  const now = Date.now();
  const existing = rateLimitStore.get(clientId);

  if (!existing || now >= existing.resetAt) {
    rateLimitStore.set(clientId, {
      count: 1,
      resetAt: now + appConfig.rateLimitWindowMs,
    });

    return { allowed: true, remaining: appConfig.rateLimitMaxRequests - 1 };
  }

  if (existing.count >= appConfig.rateLimitMaxRequests) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: existing.resetAt - now,
    };
  }

  existing.count += 1;
  rateLimitStore.set(clientId, existing);

  return {
    allowed: true,
    remaining: appConfig.rateLimitMaxRequests - existing.count,
  };
}

export function getClientId(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");

  return forwarded?.split(",")[0]?.trim() || realIp || "local-client";
}

export function moderateLatestUserMessage(text: string): GuardrailDecision {
  const normalized = text.trim();

  if (!normalized) {
    return {
      kind: "respond",
      tag: "empty",
      response:
        "Please send a farming question, for example your crop, location, growth stage, or the issue you are observing.",
    };
  }

  if (normalized.length > appConfig.maxMessageChars) {
    return {
      kind: "respond",
      tag: "too_long",
      response:
        "Your message is too long for one turn. Please shorten it and include only the crop, location, growth stage, symptoms, and what you already tried.",
    };
  }

  if (disallowedPatterns.some((pattern) => pattern.test(normalized))) {
    return {
      kind: "respond",
      tag: "harmful",
      response:
        "I cannot help with self-harm, violence, weapons, poisoning, fraud, or cyber abuse. If this is about a safety emergency, contact local emergency services or a trusted person immediately.",
    };
  }

  if (humanMedicalPatterns.some((pattern) => pattern.test(normalized))) {
    return {
      kind: "respond",
      tag: "human_medical",
      response:
        "I am a farming advisory assistant, not a medical system. Please contact a qualified doctor or local health service for human health questions.",
    };
  }

  if (nonAgriculturePatterns.some((pattern) => pattern.test(normalized))) {
    return {
      kind: "respond",
      tag: "out_of_scope",
      response:
        "I am focused on agriculture and smallholder farmer support. Ask me about crops, pests, weather impacts, irrigation, soils, input safety, or farm planning.",
    };
  }

  if (unsafeAgriPatterns.some((pattern) => pattern.test(normalized))) {
    return {
      kind: "respond",
      tag: "unsafe_agri",
      response:
        "I should not give exact chemical dosing, unlabeled mixing instructions, or guaranteed yield or weather claims without verified local product labels and conditions. Share your crop, district, growth stage, and the product label details, and I can provide high-level safety guidance and questions to verify with a local agronomist or extension worker.",
    };
  }

  return { kind: "allow" };
}
