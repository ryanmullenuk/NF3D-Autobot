import type { EtsyProduct } from "./types";

function shuffle<T>(values: T[]) {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function selectProducts(products: EtsyProduct[], count: number, recent = new Set<string>()) {
  const available = shuffle(products.filter((product) => !recent.has(product.id)));
  const fallback = shuffle(products.filter((product) => recent.has(product.id)));
  return [...available, ...fallback].slice(0, Math.min(count, products.length));
}
