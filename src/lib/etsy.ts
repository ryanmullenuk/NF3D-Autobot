import type { EtsyProduct } from "./types";

type EtsyMoney = { amount: number; divisor: number; currency_code: string };
type EtsyListing = {
  listing_id: number;
  title: string;
  description: string;
  url: string;
  tags?: string[];
  price: EtsyMoney;
  converted_price?: EtsyMoney;
  listing_type?: string;
  type?: string;
  is_digital?: boolean;
};

const api = "https://openapi.etsy.com/v3/application";

function headers() {
  const key = process.env.ETSY_API_KEY;
  if (!key) throw new Error("ETSY_API_KEY is not configured.");
  return { "x-api-key": key };
}

async function etsyFetch<T>(path: string): Promise<T> {
  const response = await fetch(`${api}${path}`, { headers: headers(), cache: "no-store" });
  if (!response.ok) throw new Error(`Etsy returned ${response.status}: ${await response.text()}`);
  return response.json() as Promise<T>;
}

function formatMoney(value: EtsyMoney) {
  const amount = value.amount / value.divisor;
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: value.currency_code }).format(amount);
}

async function primaryImage(listingId: number) {
  const data = await etsyFetch<{ results: Array<{ rank: number; url_fullxfull: string; url_570xN: string }> }>(`/listings/${listingId}/images`);
  const image = [...data.results].sort((a, b) => a.rank - b.rank)[0];
  if (!image) throw new Error(`Listing ${listingId} has no public Etsy image.`);
  return image.url_fullxfull || image.url_570xN;
}

function productType(listing: EtsyListing): EtsyProduct["type"] {
  const digital = listing.is_digital || listing.type === "download" || listing.listing_type === "download";
  return digital ? "Digital download" : "Physical product";
}

async function normalise(listing: EtsyListing): Promise<EtsyProduct> {
  const money = listing.converted_price?.currency_code === "GBP" ? listing.converted_price : listing.price;
  return {
    id: String(listing.listing_id),
    title: listing.title.trim(),
    description: listing.description.trim(),
    price: formatMoney(money),
    currency: money.currency_code,
    type: productType(listing),
    url: listing.url.split("?")[0],
    imageUrl: await primaryImage(listing.listing_id),
    tags: listing.tags || [],
  };
}

export async function getActiveProducts(): Promise<EtsyProduct[]> {
  const shopId = process.env.ETSY_SHOP_ID;
  if (!shopId) throw new Error("ETSY_SHOP_ID is not configured.");
  const first = await etsyFetch<{ count: number; results: EtsyListing[] }>(`/shops/${shopId}/listings/active?limit=100&offset=0`);
  const listings = [...first.results];
  for (let offset = 100; offset < first.count; offset += 100) {
    const page = await etsyFetch<{ results: EtsyListing[] }>(`/shops/${shopId}/listings/active?limit=100&offset=${offset}`);
    listings.push(...page.results);
  }
  return Promise.all(listings.map(normalise));
}

export async function getProductById(id: string): Promise<EtsyProduct> {
  const listing = await etsyFetch<EtsyListing>(`/listings/${encodeURIComponent(id)}`);
  if ((listing as EtsyListing & { state?: string }).state !== "active") throw new Error("The Etsy listing is not active.");
  return normalise(listing);
}
