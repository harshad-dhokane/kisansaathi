import { appConfig } from "@/lib/config";

export type ConversationalModelId = "qwen" | "nemotron_super";
export type ConversationalProvider = "groq" | "openrouter";

export type ConversationalModelDefinition = {
  id: ConversationalModelId;
  label: string;
  shortLabel: string;
  provider: ConversationalProvider;
  publicModelId: string;
  requestModel: string;
  envVarName: "GROQ_API_KEY" | "OPENROUTER_API_KEY";
};

const CONVERSATIONAL_MODEL_DEFINITIONS: Record<
  ConversationalModelId,
  ConversationalModelDefinition
> = {
  qwen: {
    id: "qwen",
    label: "Qwen 3 32B",
    shortLabel: "Qwen",
    provider: "groq",
    publicModelId: "agri-advisory-qwen32b",
    requestModel: appConfig.groqModel,
    envVarName: "GROQ_API_KEY",
  },
  nemotron_super: {
    id: "nemotron_super",
    label: "Nemotron Super",
    shortLabel: "Nemotron",
    provider: "openrouter",
    publicModelId: "agri-advisory-nemotron-super",
    requestModel: appConfig.openRouterModel,
    envVarName: "OPENROUTER_API_KEY",
  },
};

const CONVERSATIONAL_MODEL_ALIASES: Record<string, ConversationalModelId> = {
  qwen: "qwen",
  "qwen3-32b": "qwen",
  "qwen/qwen3-32b": "qwen",
  "agri-advisory-qwen32b": "qwen",
  nemotron: "nemotron_super",
  nemotronsuper: "nemotron_super",
  nemotron_super: "nemotron_super",
  "nemotron-super": "nemotron_super",
  "nvidia/nemotron-3-super-120b-a12b": "nemotron_super",
  "agri-advisory-nemotron-super": "nemotron_super",
};

function normalizeModelInput(input: unknown) {
  if (typeof input !== "string") {
    return "";
  }

  return input.trim().toLowerCase();
}

export function getConversationalModelCatalog() {
  return Object.values(CONVERSATIONAL_MODEL_DEFINITIONS);
}

export function getConversationalModelDefinition(modelId: ConversationalModelId) {
  return CONVERSATIONAL_MODEL_DEFINITIONS[modelId];
}

export function resolveConversationalModel(input?: unknown): ConversationalModelId {
  const normalized = normalizeModelInput(input);

  if (normalized in CONVERSATIONAL_MODEL_ALIASES) {
    return CONVERSATIONAL_MODEL_ALIASES[normalized];
  }

  if (normalized.includes("nemotron")) {
    return "nemotron_super";
  }

  if (normalized.includes("qwen")) {
    return "qwen";
  }

  const configuredDefault = normalizeModelInput(appConfig.defaultConversationalModel);

  if (configuredDefault in CONVERSATIONAL_MODEL_ALIASES) {
    return CONVERSATIONAL_MODEL_ALIASES[configuredDefault];
  }

  return "qwen";
}

export function getDefaultConversationalModel() {
  return resolveConversationalModel(appConfig.defaultConversationalModel);
}

export function isConversationalModelConfigured(modelId: ConversationalModelId) {
  const definition = getConversationalModelDefinition(modelId);
  return Boolean(process.env[definition.envVarName]);
}
