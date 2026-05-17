import { NextResponse } from "next/server";
import {
  getConversationalModelCatalog,
  getDefaultConversationalModel,
  isConversationalModelConfigured,
} from "@/lib/conversational-models";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "kisansaathi",
    defaultConversationalModel: getDefaultConversationalModel(),
    conversationalModels: getConversationalModelCatalog().map((model) => ({
      id: model.id,
      label: model.label,
      provider: model.provider,
      requestModel: model.requestModel,
      configured: isConversationalModelConfigured(model.id),
    })),
  });
}
