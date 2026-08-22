export const platformNames = ["instagram", "pinterest", "facebook", "x", "tiktok"] as const;
export type Platform = (typeof platformNames)[number];

export type EtsyProduct = {
  id: string;
  title: string;
  description: string;
  price: string;
  currency: string;
  type: "Digital download" | "Physical product";
  url: string;
  imageUrl: string;
  tags: string[];
};

export type PostCopy = {
  title: string;
  description: string;
  caption: string;
  hashtags: string[];
};

export type PublishResult = {
  platform: Platform;
  productId: string;
  productTitle: string;
  status: "published" | "failed" | "skipped";
  postUrl?: string;
  error?: string;
};
