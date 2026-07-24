import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Shape of You",
    short_name: "Shape of You",
    description: "Women’s fashion products, inventory, sales, and billing.",
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
