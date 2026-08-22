import type { EtsyProduct, Platform, PostCopy } from "./types";

const stop = new Set(["and", "the", "for", "with", "from", "this", "that", "your"]);

export function hashtags(product: EtsyProduct, limit = 8) {
  const values = product.tags.length ? product.tags : product.title.split(/[,|–-]/);
  return [...new Set(values.map((tag) => tag.replace(/[^a-zA-Z0-9 ]/g, " ").split(/\s+/).filter((w) => w && !stop.has(w.toLowerCase())).map((w) => w[0].toUpperCase() + w.slice(1)).join("")).filter((tag) => tag.length > 2).map((tag) => `#${tag}`))].slice(0, limit);
}

function conciseDescription(text: string, max = 230) {
  const cleaned = text.replace(/\s+/g, " ").trim();
  const sentences = cleaned.match(/[^.!?]+[.!?]+/g)?.slice(0, 2).join(" ") || cleaned;
  return sentences.length <= max ? sentences : `${sentences.slice(0, max - 1).trim()}…`;
}

export function createCopy(product: EtsyProduct, platform: Platform): PostCopy {
  const title = product.title.length <= 95 ? product.title : `${product.title.slice(0, 94).trim()}…`;
  const description = conciseDescription(product.description);
  const tags = hashtags(product, platform === "x" ? 3 : 8);
  const facts = `${product.type} · ${product.price}`;
  if (platform === "x") {
    const suffix = `${product.url} ${tags.join(" ")}`;
    const available = 280 - 1 - suffix.length;
    const lead = `${title} — ${facts}. ${description}`;
    return { title, description, hashtags: tags, caption: `${lead.slice(0, Math.max(20, available)).trim()}\n${suffix}` };
  }
  if (platform === "instagram") {
    const bio = process.env.INSTAGRAM_BIO_HAS_SHOP_LINK === "true" ? "\nShop via the link in bio." : "";
    return { title, description, hashtags: tags, caption: `${title}\n\n${description}\n\n${facts}\n${product.url}${bio}\n\n${tags.join(" ")}` };
  }
  if (platform === "pinterest") {
    return { title, description: `${description} ${facts}. ${tags.join(" ")}`.slice(0, 800), caption: "", hashtags: tags };
  }
  return { title, description, hashtags: tags, caption: `${title}\n\n${description}\n\n${facts}\nShop on Etsy: ${product.url}\n\n${tags.join(" ")}` };
}
