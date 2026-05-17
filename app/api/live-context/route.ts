import { NextResponse } from "next/server";
import { getRealtimeContextSnapshot } from "@/lib/weather";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { context?: unknown };
    const snapshot = await getRealtimeContextSnapshot(body.context);

    return NextResponse.json(snapshot);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "The live context could not be loaded.",
      },
      { status: 500 },
    );
  }
}
