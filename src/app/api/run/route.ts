import { NextRequest, NextResponse } from "next/server";
import { runCampaign } from "@/lib/campaign";
import type { Platform } from "@/lib/types";

export async function POST(request: NextRequest) {
  if (!process.env.DASHBOARD_KEY || request.headers.get("x-dashboard-key") !== process.env.DASHBOARD_KEY) return NextResponse.json({ error: "Invalid dashboard key." }, { status: 401 });
  try {
    const body = await request.json() as { counts?: Partial<Record<Platform, number>> };
    return NextResponse.json(await runCampaign(body.counts || {}, "manual"));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Campaign failed." }, { status: 500 });
  }
}
