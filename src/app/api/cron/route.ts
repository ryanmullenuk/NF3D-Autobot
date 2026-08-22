import { NextRequest, NextResponse } from "next/server";
import { runCampaign } from "@/lib/campaign";
import { alreadyRanToday } from "@/lib/store";

export async function POST(request: NextRequest) {
  if (!process.env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  const hour = Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", hour: "2-digit", hour12: false }).format(new Date()));
  if (hour !== 9) return NextResponse.json({ status: "ignored", reason: "It is not 09:00 in Europe/London." });
  if (await alreadyRanToday()) return NextResponse.json({ status: "ignored", reason: "Today's scheduled campaign is already recorded." });
  return NextResponse.json(await runCampaign({ instagram: 5, pinterest: 5, facebook: 5, x: 5, tiktok: 5 }, "schedule"));
}
