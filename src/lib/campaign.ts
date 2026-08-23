import { addPrimaryImages, getActiveProducts } from "./etsy";
import { publish, configuration } from "./platforms";
import { recentProductIds, saveRun } from "./store";
import { selectProducts } from "./select";
import { platformNames, type Platform, type PublishResult } from "./types";

export async function runCampaign(counts: Partial<Record<Platform, number>>, trigger: "manual" | "schedule") {
  const requested = Object.entries(counts).filter(([name, count]) => platformNames.includes(name as Platform) && Number(count) > 0) as [Platform, number][];
  if (!requested.length) throw new Error("Select at least one platform and one post.");
  const config = configuration() as Record<Platform, { configured: boolean; missing: string[] }>;
  const max = Math.min(20, Math.max(...requested.map(([, count]) => Math.floor(count))));
  const selected = selectProducts(await getActiveProducts(), max, await recentProductIds());
  const products = await addPrimaryImages(selected);
  const results: PublishResult[] = [];
  for (const [platform, rawCount] of requested) {
    const count = Math.min(20, Math.max(1, Math.floor(rawCount)));
    if (!config[platform].configured) {
      results.push(...products.slice(0, count).map((product) => ({ platform, productId: product.id, productTitle: product.title, status: "skipped" as const, error: `Missing configuration: ${config[platform].missing.join(", ")}` })));
      continue;
    }
    const platformProducts = products.slice(0, count);
    for (let index = 0; index < platformProducts.length; index += 1) {
      results.push(await publish(platform, platformProducts[index]));
      if (index < platformProducts.length - 1) await new Promise((resolve) => setTimeout(resolve, 1800));
    }
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
