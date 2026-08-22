import { NextResponse } from "next/server";
import { getProductById } from "@/lib/etsy";

export async function GET(
  _request: Request,
  context: { params: Promise<{ listingId: string }> },
) {
  try {
    const { listingId } = await context.params;
    const product = await getProductById(listingId);
    const image = await fetch(product.imageUrl);
    if (!image.ok || !image.body) {
      return NextResponse.json({ error: "Etsy image unavailable." }, { status: 502 });
    }

    return new NextResponse(image.body, {
      headers: {
        "content-type": image.headers.get("content-type") || "image/jpeg",
        "cache-control": "public, max-age=3600, s-maxage=86400",
        "x-content-type-options": "nosniff",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Image unavailable." },
      { status: 404 },
    );
  }
}
