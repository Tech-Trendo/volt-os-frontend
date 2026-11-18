import { cookies } from "next/headers";
import { fetchErpPublic, resolveMediaUrl } from "./erp-client";

export const PREVIEW_TOKEN_COOKIE = "erp_preview_token";

export interface PublicCharger {
  id: string;
  slug: string;
  name: string;
  type: "AC" | "DC";
  powerKw: number;
  connectors: string[];
  phase: string;
  dimensions: string;
  warrantyMonths: number;
  priceNpr: number | null;
  showPrice: boolean;
  stockStatus: string;
  description: string;
  specs: Record<string, string>;
  images: string[];
  isFeatured: boolean;
  brand: { id: string; name: string; slug: string; country?: string };
  category: { id: string; name: string; slug: string };
}

export interface PublicSiteData {
  preview: boolean;
  settings: Record<string, unknown>;
  navigation: {
    header: { id: number; label: string; href: string; open_in_new_tab: boolean }[];
    footer: { id: number; label: string; href: string; open_in_new_tab: boolean }[];
  };
  brands: { id: number; name: string; slug: string; logo_url: string; description: string; country: string }[];
  categories: { id: number; name: string; slug: string; description: string }[];
  services: { id: number; title: string; slug: string; summary: string; description: string; icon: string; image_url: string }[];
  featuredChargers: PublicCharger[];
}

export async function getPreviewToken(explicit?: string | null): Promise<string | null> {
  if (explicit) return explicit;
  try {
    const store = await cookies();
    return store.get(PREVIEW_TOKEN_COOKIE)?.value ?? null;
  } catch {
    return null;
  }
}

export async function getSiteBootstrap(previewToken?: string | null): Promise<PublicSiteData> {
  const token = await getPreviewToken(previewToken);
  const data = await fetchErpPublic<PublicSiteData>("/public/site", {
    tags: ["site", "settings", "navigation"],
    previewToken: token,
    fallbackValue: {
      preview: false,
      settings: {},
      navigation: { header: [], footer: [] },
      brands: [],
      categories: [],
      services: [],
      featuredChargers: [],
    },
  });

  return {
    ...data,
    brands: (data.brands ?? []).map((b) => ({ ...b, logo_url: resolveMediaUrl(b.logo_url) })),
    featuredChargers: (data.featuredChargers ?? []).map((c) => ({
      ...c,
      images: (c.images ?? []).map(resolveMediaUrl),
    })),
  };
}

export async function getPublicPage(pageKey: string, previewToken?: string | null) {
  const token = await getPreviewToken(previewToken);
  return fetchErpPublic<{
    pageKey: string;
    preview: boolean;
    sections: Record<string, { label: string; content: Record<string, unknown>; status: string }>;
    team?: { id: number; name: string; role: string; department: string; bio: string }[];
    services?: { id: number; title: string; slug: string; summary: string; description: string; icon: string; image_url: string }[];
  }>(`/public/pages/${pageKey}`, {
    tags: ["pages", `page:${pageKey}`],
    previewToken: token,
    fallbackValue: { pageKey, preview: false, sections: {} },
  });
}

export async function getPublicChargers(previewToken?: string | null) {
  const token = await getPreviewToken(previewToken);
  const data = await fetchErpPublic<{
    items: PublicCharger[];
    total: number;
    facets: {
      connectors: string[];
      brands: { id: number; name: string; slug: string }[];
      categories: { id: number; name: string; slug: string }[];
    };
  }>("/public/chargers?page_size=100", {
    tags: ["chargers"],
    previewToken: token,
    fallbackValue: { items: [], total: 0, facets: { connectors: [], brands: [], categories: [] } },
  });
  return {
    ...data,
    items: (data.items ?? []).map((c) => ({
      ...c,
      images: (c.images ?? []).map(resolveMediaUrl),
    })),
  };
}

export async function getPublicChargerBySlug(slug: string, previewToken?: string | null) {
  const token = await getPreviewToken(previewToken);
  const data = await fetchErpPublic<{ charger?: PublicCharger; related?: PublicCharger[] }>(
    `/public/chargers/${slug}`,
    {
      tags: ["chargers", `charger:${slug}`],
      previewToken: token,
      fallbackValue: {},
    },
  );
  if (!data.charger) return null;
  return {
    charger: { ...data.charger, images: (data.charger.images ?? []).map(resolveMediaUrl) },
    related: (data.related ?? []).map((r) => ({ ...r, images: (r.images ?? []).map(resolveMediaUrl) })),
  };
}

export async function getPublicTestimonials(previewToken?: string | null) {
  const token = await getPreviewToken(previewToken);
  const data = await fetchErpPublic<{
    items: {
      id: number;
      client_name: string;
      role: string;
      company: string;
      station_location: string;
      feedback: string;
      rating: number;
    }[];
  }>("/public/testimonials", {
    tags: ["testimonials"],
    previewToken: token,
    fallbackValue: { items: [] },
  });
  return data.items ?? [];
}

export async function getPublicFaqs(previewToken?: string | null) {
  const token = await getPreviewToken(previewToken);
  const data = await fetchErpPublic<{
    items: { id: number; question: string; answer: string; category: string }[];
  }>("/public/faqs", {
    tags: ["faqs"],
    previewToken: token,
    fallbackValue: { items: [] },
  });
  return data.items ?? [];
}

export function strField(
  sections: Record<string, { content: Record<string, unknown> }> | undefined,
  sectionKey: string,
  field: string,
  fallback = "",
): string {
  const val = sections?.[sectionKey]?.content?.[field];
  return typeof val === "string" ? val : fallback;
}
