import { NextResponse } from "next/server";
import { getResultsSummaryJson } from "@/lib/results-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(getResultsSummaryJson());
}
