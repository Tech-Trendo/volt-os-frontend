import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/ui/providers";
import { getSiteBootstrap } from "@/lib/cms";
import { resolveMediaUrl } from "@/lib/erp-client";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const { settings } = await getSiteBootstrap();
  const title = String(settings.site_title || "EV Charger Storefront");
  const description = String(settings.meta_description || settings.tagline || "");
  const ogImage = resolveMediaUrl(String(settings.og_image || ""));
  const favicon = resolveMediaUrl(String(settings.favicon_url || ""));

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: ogImage ? [{ url: ogImage }] : [],
    },
    icons: {
      icon: [
        { url: favicon || "/favicon.ico", sizes: "any" },
        { url: "/logo.png", type: "image/png" },
      ],
      shortcut: favicon || "/favicon.ico",
      apple: "/logo.png",
    },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { settings } = await getSiteBootstrap();
  const accentColor = String(settings.accent_color || "#0f766e");
  const lang = String(settings.default_language || "en");

  return (
    <html lang={lang} className={inter.variable} suppressHydrationWarning>
      <body style={{ ["--accent-color" as string]: accentColor }}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
