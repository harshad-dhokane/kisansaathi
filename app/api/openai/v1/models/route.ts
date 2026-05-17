import { NextResponse } from "next/server";
import {
  getConversationalModelDefinition,
  getDefaultConversationalModel,
  isConversationalModelConfigured,
} from "@/lib/conversational-models";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const activeModel = getConversationalModelDefinition(getDefaultConversationalModel());

  return NextResponse.json({
    object: "list",
    data: [
      {
        id: activeModel.publicModelId,
        object: "model",
        owned_by: activeModel.provider,
        root: activeModel.requestModel,
        label: activeModel.label,
        configured: isConversationalModelConfigured(activeModel.id),
      },
    ],
  });
}
