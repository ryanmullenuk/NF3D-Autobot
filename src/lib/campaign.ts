import { getActiveProducts } from "./etsy";
import { publish, configuration } from "./platforms";
import { recentProductIds, saveRun } from "./store";
import { selectProducts } from "./select";
import { platformNames, type Platform, type PublishResult } from "./types";

export async function runCampaign(counts: Partial<Record<Platform, number>>, trigger: "manual" | "schedule") {
  const requested = Object.entries(counts).filter(([name, count]) => platformNames.includes(name as Platform) && Number(count) > 0) as [Platform, number][];
  if (!requested.length) throw new Error("Select at least one platform and one post.");
  const config = configuration() as Record<Platform, { configured: boolean; missing: string[] }>;
  const max = Math.min(20, Math.max(...requested.map(([, count]) => Math.floor(count))));
  const products = selectProducts(await getActiveProducts(), max, await recentProductIds());
  const results: PublishResult[] = [];
  for (const [platform, rawCount] of requested) {
    const count = Math.min(20, Math.max(1, Math.floor(rawCount)));
    if (!config[platform].configured) {
      results.push(...products.slice(0, count).map((product) => ({ platform, productId: product.id, productTitle: product.title, status: "skipped" as const, error: `Missing configuration: ${config[platform].missing.join(", ")}` })));
      continue;
    }
    for (const product of products.slice(0, count)) results.push(await publish(platform, product));
  }
  const runId = crypto.randomUUID();
  await saveRun(runId, products, results, trigger);
  return {
    runId,
    products: products.map(({ id, title, price, type, url }) => ({ id, title, price, type, url })),
    posts: results,
    summary: {
      succeeded: results.filter((r) => r.status === "published").length,
      failed: results.filter((r) => r.status === "failed").length,
      skipped: results.filter((r) => r.status === "skipped").length,
    },
  };
}
