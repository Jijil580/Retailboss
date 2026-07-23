import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RetailBoss",
    short_name: "RetailBoss",
    description: "Retail sales, inventory, customers, purchases, and reporting.",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f6fa",
    theme_color: "#6957e8",
    orientation: "any",
    icons: [
      {
        src: "/favicon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
