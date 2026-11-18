import { getApiBaseUrl, rest } from "./config";

export interface CmsDashboardData {
  counts: {
    totalChargers: number;
    publishedChargers: number;
    draftChargers: number;
    draftSections: number;
    websiteEnquiries: number;
    totalEnquiries: number;
    brands: number;
    categories: number;
    testimonials: number;
    faqs: number;
    media: number;
    customers: number;
  };
  storefrontUrl: string;
  recentAudit: CmsAuditEntry[];
}

export interface CmsAuditEntry {
  id: number;
  actor_email: string;
  action: string;
  entity_type: string;
  entity_id: string;
  summary: string;
  old_value: unknown;
  new_value: unknown;
  created_at: string;
}

export interface CmsVersionEntry {
  id: number;
  entity_type: string;
  entity_key: string;
  version_number: number;
  snapshot: unknown;
  created_by_email: string;
  note: string;
  created_at: string;
}

export interface CmsPageSection {
  id: number;
  page_key: string;
  section_key: string;
  label: string;
  draft_content: Record<string, unknown>;
  published_content: Record<string, unknown>;
  publish_status: "DRAFT" | "PUBLISHED";
  order: number;
  updated_at: string;
}

export interface CmsCharger {
  id?: number;
  name: string;
  slug: string;
  sku: string;
  model_number: string;
  category: number;
  category_name?: string;
  brand: number | null;
  brand_name?: string;
  charger_type: "AC" | "DC";
  power_kw: number;
  connector_type: string;
  connectors: string[];
  phase: string;
  dimensions: string;
  input_voltage: string;
  output_voltage: string;
  current_rating: string;
  ip_rating: string;
  warranty_years: number;
  price_npr: number;
  show_price: boolean;
  stock_quantity: number;
  status: string;
  description: string;
  specifications: Record<string, string>;
  images: string[];
  is_featured: boolean;
  publish_status: "DRAFT" | "PUBLISHED";
  order: number;
}

export interface CmsBrand {
  id?: number;
  name: string;
  slug: string;
  country: string;
  origin_port: string;
  website: string;
  description: string;
  logo_url: string;
  order: number;
  is_active: boolean;
}

export interface CmsCategory {
  id?: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
  order: number;
  is_active: boolean;
}

export interface CmsTestimonial {
  id?: number;
  client_name: string;
  role: string;
  company: string;
  station_location: string;
  equipment_purchased: string;
  feedback: string;
  rating: number;
  is_featured: boolean;
  order: number;
}

export interface CmsFaq {
  id?: number;
  question: string;
  answer: string;
  category: string;
  order: number;
  is_active: boolean;
}

export interface CmsNavLink {
  id?: number;
  location: "HEADER" | "FOOTER";
  label: string;
  href: string;
  order: number;
  is_visible: boolean;
  open_in_new_tab: boolean;
}

export interface CmsServiceItem {
  id?: number;
  title: string;
  slug: string;
  summary: string;
  description: string;
  icon: string;
  image_url: string;
  is_visible: boolean;
  order: number;
}

export interface CmsMediaAsset {
  id: number;
  filename: string;
  url: string;
  mime_type: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
  alt_text: string;
  storage_provider: string;
  created_at: string;
}

export const cmsAdminApi = {
  dashboard: () => rest<CmsDashboardData>("/admin/cms/dashboard/"),
  revalidateAll: () =>
    rest<{ revalidation: Record<string, unknown> }>("/admin/cms/revalidate/", { method: "POST" }),
  createPreviewToken: () =>
    rest<{ token: string; previewUrl: string }>("/admin/cms/preview-token/", { method: "POST" }),

  listPages: () => rest<{ sections: CmsPageSection[] }>("/admin/cms/pages/"),
  savePage: (payload: {
    section_key: string;
    content: Record<string, unknown>;
    publish: boolean;
    note?: string;
  }) =>
    rest<{ section: CmsPageSection }>("/admin/cms/pages/", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  publishAll: () => rest<{ message: string }>("/admin/cms/pages/publish-all/", { method: "POST" }),

  listChargers: () =>
    rest<{ chargers: CmsCharger[]; brands: CmsBrand[]; categories: CmsCategory[] }>(
      "/admin/cms/chargers/",
    ),
  saveCharger: (payload: Partial<CmsCharger>) =>
    rest<{ charger: CmsCharger }>("/admin/cms/chargers/", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  deleteCharger: (id: number) =>
    rest<{ deleted: boolean }>(`/admin/cms/chargers/?id=${id}`, { method: "DELETE" }),
  reorderChargers: (orderedIds: number[]) =>
    rest<{ ok: boolean }>("/admin/cms/chargers/reorder/", {
      method: "POST",
      body: JSON.stringify({ orderedIds }),
    }),

  listBrands: () => rest<{ brands: CmsBrand[] }>("/admin/cms/brands/"),
  saveBrand: (payload: Partial<CmsBrand>) =>
    rest<{ brand: CmsBrand }>("/admin/cms/brands/", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  reorderBrands: (orderedIds: number[]) =>
    rest<{ ok: boolean }>("/admin/cms/brands/", {
      method: "PATCH",
      body: JSON.stringify({ orderedIds }),
    }),
  deleteBrand: (id: number) =>
    rest<{ deleted: boolean }>(`/admin/cms/brands/?id=${id}`, { method: "DELETE" }),

  listCategories: () => rest<{ categories: CmsCategory[] }>("/admin/cms/categories/"),
  saveCategory: (payload: Partial<CmsCategory>) =>
    rest<{ category: CmsCategory }>("/admin/cms/categories/", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  deleteCategory: (id: number) =>
    rest<{ deleted: boolean }>(`/admin/cms/categories/?id=${id}`, { method: "DELETE" }),

  listTestimonials: () => rest<{ testimonials: CmsTestimonial[] }>("/admin/cms/testimonials/"),
  saveTestimonial: (payload: Partial<CmsTestimonial>) =>
    rest<{ testimonial: CmsTestimonial }>("/admin/cms/testimonials/", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  deleteTestimonial: (id: number) =>
    rest<{ deleted: boolean }>(`/admin/cms/testimonials/?id=${id}`, { method: "DELETE" }),

  listFaqs: () => rest<{ faqs: CmsFaq[] }>("/admin/cms/faqs/"),
  saveFaq: (payload: Partial<CmsFaq>) =>
    rest<{ faq: CmsFaq }>("/admin/cms/faqs/", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  deleteFaq: (id: number) =>
    rest<{ deleted: boolean }>(`/admin/cms/faqs/?id=${id}`, { method: "DELETE" }),

  listNav: () => rest<{ links: CmsNavLink[] }>("/admin/cms/navigation/"),
  saveNav: (payload: Partial<CmsNavLink>) =>
    rest<{ link: CmsNavLink }>("/admin/cms/navigation/", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  reorderNav: (orderedIds: number[]) =>
    rest<{ ok: boolean }>("/admin/cms/navigation/", {
      method: "PATCH",
      body: JSON.stringify({ orderedIds }),
    }),
  deleteNav: (id: number) =>
    rest<{ deleted: boolean }>(`/admin/cms/navigation/?id=${id}`, { method: "DELETE" }),

  listServices: () => rest<{ services: CmsServiceItem[] }>("/admin/cms/services/"),
  saveService: (payload: Partial<CmsServiceItem>) =>
    rest<{ service: CmsServiceItem }>("/admin/cms/services/", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  deleteService: (id: number) =>
    rest<{ deleted: boolean }>(`/admin/cms/services/?id=${id}`, { method: "DELETE" }),

  getSettings: () => rest<{ settings: Record<string, unknown> }>("/admin/cms/settings/"),
  saveSettings: (payload: Record<string, unknown>) =>
    rest<{ settings: Record<string, unknown> }>("/admin/cms/settings/", {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  listMedia: (q = "") =>
    rest<{ files: CmsMediaAsset[] }>(`/admin/cms/media/${q ? `?q=${encodeURIComponent(q)}` : ""}`),
  uploadMedia: async (file: File, altText = "") => {
    const base = getApiBaseUrl();
    const token =
      typeof window !== "undefined" ? localStorage.getItem("voltos_access_token") : null;
    const form = new FormData();
    form.append("file", file);
    if (altText) form.append("alt_text", altText);
    const res = await fetch(`${base}/admin/cms/media/`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    const data = (await res.json()) as { file?: CmsMediaAsset; error?: string };
    if (!res.ok || !data.file) throw new Error(data.error || "Upload failed.");
    return data.file;
  },
  deleteMedia: (id: number) =>
    rest<{ deleted: boolean }>(`/admin/cms/media/?id=${id}`, { method: "DELETE" }),

  listAudit: () => rest<{ logs: CmsAuditEntry[] }>("/admin/cms/audit/"),
  listVersions: () => rest<{ versions: CmsVersionEntry[] }>("/admin/cms/versions/"),
  revertVersion: (id: number, publish: boolean) =>
    rest<{ reverted: boolean }>(`/admin/cms/versions/${id}/revert/`, {
      method: "POST",
      body: JSON.stringify({ publish }),
    }),
};
