import type { Metadata } from "next";
import { InstallAppButton } from "./install-app-button";
import { MobileNav } from "./mobile-nav";
import { RegisterServiceWorker } from "./register-service-worker";
import "./globals.css";

export function generateMetadata(): Metadata {
  const description =
    "Shape of You women’s fashion retail management for products, inventory, sales, and billing.";
  const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (productionHost ? `https://${productionHost}` : "http://localhost:3000");

  return {
    metadataBase: new URL(siteUrl),
    title: "Shape of You — Women’s Fashion",
    description,
    applicationName: "Shape of You",
    manifest: "/manifest.webmanifest",
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: "Shape of You",
    },
    openGraph: {
      title: "Shape of You — Women’s Fashion",
      description,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "Shape of You — Women’s Fashion",
      description,
    },
    icons: {
      icon: [
        { url: "/favicon.svg", type: "image/svg+xml" },
        { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      ],
      apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
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
        <MobileNav />
        <InstallAppButton />
        <footer className="global-credit">
          Powered by <strong>Lumier Technologies</strong>
          <span>·</span>
          © {new Date().getFullYear()} All rights reserved
        </footer>
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
