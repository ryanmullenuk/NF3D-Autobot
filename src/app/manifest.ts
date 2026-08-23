import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NF3D Auto Bot",
    short_name: "NF3D",
    description: "Etsy-first social publishing for NewForest3D",
    start_url: "/",
    display: "standalone",
    background_color: "#eaf1f4",
    theme_color: "#123d55",
    icons: [
      { src: "/nf3d-logo.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/apple-touch-icon.png", sizes: "180x180", type: "image/png", purpose: "any" },
    ],
  };
}
