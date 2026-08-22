import { describe, expect, it } from "vitest";
import { createCopy, hashtags } from "./copy";
import type { EtsyProduct } from "./types";

const product: EtsyProduct = {
  id: "1",
  title: "Minimalist Scribble Cat Wall Art",
  description: "A clean black and white cat drawing. Perfect for a modern room.",
  price: "£3.00",
  currency: "GBP",
  type: "Digital download",
  url: "https://www.etsy.com/uk/listing/1/example",
  imageUrl: "https://example.com/image.jpg",
  tags: ["cat wall art", "cat lover gift", "minimalist print"],
};

describe("platform copy", () => {
  it("keeps X copy within 280 characters", () => expect(createCopy(product, "x").caption.length).toBeLessThanOrEqual(280));
  it("creates natural hashtags from Etsy tags", () => expect(hashtags(product)).toContain("#CatWallArt"));
  it("states the product type and price", () => expect(createCopy(product, "facebook").caption).toContain("Digital download · £3.00"));
});
