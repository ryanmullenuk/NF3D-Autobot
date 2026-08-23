import { NextRequest, NextResponse } from "next/server";
import { latestRun } from "@/lib/store";

export async function GET(request: NextRequest) {
  if (!process.env.DASHBOARD_KEY || request.headers.get("x-dashboard-key") !== process.env.DASHBOARD_KEY) {
    return NextResponse.json({ error: "Invalid dashboard key." }, { status: 401 });
  }
  try {
    return NextResponse.json({ run: await latestRun() });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Run history is unavailable." }, { status: 500 });
  }
}
