import { NextResponse } from "next/server";
import { configuration } from "@/lib/platforms";

export async function GET() {
  return NextResponse.json({
    etsy: { configured: Boolean(process.env.ETSY_API_KEY && process.env.ETSY_SHOP_ID) },
    database: { configured: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) },
    platforms: configuration(),
  });
}
