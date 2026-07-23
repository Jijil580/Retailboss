import type { Metadata } from "next";
import { RegisterServiceWorker } from "./register-service-worker";
import "./globals.css";

export function generateMetadata(): Metadata {
  const description =
    "A modern retail operations dashboard for sales, inventory, customers, purchases, expenses, and reporting.";
  const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (productionHost ? `https://${productionHost}` : "http://localhost:3000");

  return {
    metadataBase: new URL(siteUrl),
    title: "RetailBoss — Retail Management, Simplified",
    description,
    applicationName: "RetailBoss",
    manifest: "/manifest.webmanifest",
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: "RetailBoss",
    },
    openGraph: {
      title: "RetailBoss — Retail Management, Simplified",
      description,
      type: "website",
      images: [{ url: "/og.png", width: 1680, height: 945, alt: "RetailBoss retail operations dashboard" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "RetailBoss — Retail Management, Simplified",
      description,
      images: ["/og.png"],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
