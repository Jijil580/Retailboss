import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Shape of You",
    short_name: "Shape of You",
    description: "Women’s fashion products, inventory, sales, and billing.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#101a26",
    theme_color: "#101a26",
    orientation: "any",
    categories: ["business", "finance", "productivity"],
    shortcuts: [
      {
        name: "New sale",
        short_name: "Sell",
        description: "Open the point of sale",
        url: "/pos",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Products",
        short_name: "Products",
        description: "Open the product catalog",
        url: "/products",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
    ],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
