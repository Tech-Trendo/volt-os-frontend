import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowDown,
  ArrowUp,
  Copy,
  ExternalLink,
  Eye,
  FileText,
  Globe,
  Image as ImageIcon,
  Inbox,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Send,
  Shield,
  Trash2,
  UploadCloud,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Kpi, PageHeader, Panel, StatusBadge } from "@/components/shared/common";
import { useAuth } from "@/stores/auth";
import { npr } from "@/lib/formatting";
import {
  cmsAdminApi,
  type CmsAuditEntry,
  type CmsBrand,
  type CmsCategory,
  type CmsCharger,
  type CmsDashboardData,
  type CmsFaq,
  type CmsMediaAsset,
  type CmsNavLink,
  type CmsPageSection,
  type CmsServiceItem,
  type CmsTestimonial,
  type CmsVersionEntry,
} from "@/services/cms-admin";
import { toast } from "sonner";

export type CmsSectionTab =
  | "dashboard"
  | "pages"
  | "chargers"
  | "brands"
  | "categories"
  | "testimonials"
  | "faqs"
  | "navigation"
  | "settings"
  | "media"
  | "versions";

const ERP_BACKEND_ORIGIN = (
  (import.meta.env["VITE_API_BASE_URL"] as string | undefined) || "http://127.0.0.1:8000/api"
)
  .replace(/\/api\/?$/, "")
  .replace(/\/$/, "");

function resolvePreviewUrl(url: string): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/media/")) return `${ERP_BACKEND_ORIGIN}${url}`;
  if (url.startsWith("/uploads/")) return `${ERP_BACKEND_ORIGIN}/media${url}`;
  return url;
}

export function CmsWorkspace({ section = "dashboard" }: { section?: CmsSectionTab }) {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "Super Administrator" || user?.is_superuser;

  const [loading, setLoading] = useState(false);
  const [dashboard, setDashboard] = useState<CmsDashboardData | null>(null);
  const [pages, setPages] = useState<CmsPageSection[]>([]);
  const [selectedSectionKey, setSelectedSectionKey] = useState("");
  const [pageDraft, setPageDraft] = useState<Record<string, unknown>>({});
  const [services, setServices] = useState<CmsServiceItem[]>([]);
  const [newService, setNewService] = useState<Partial<CmsServiceItem>>({
    title: "",
    slug: "",
    summary: "",
    description: "",
    icon: "Wrench",
    is_visible: true,
    order: 0,
  });

  const [chargers, setChargers] = useState<CmsCharger[]>([]);
  const [brands, setBrands] = useState<CmsBrand[]>([]);
  const [categories, setCategories] = useState<CmsCategory[]>([]);
  const [editingCharger, setEditingCharger] = useState<Partial<CmsCharger> | null>(null);
  const [connectorsStr, setConnectorsStr] = useState("CCS2, GB/T");
  const [imagesStr, setImagesStr] = useState("/uploads/chargers/abb-terra-54.jpg");
  const [specsStr, setSpecsStr] = useState("{}");

  const [brandDraft, setBrandDraft] = useState<Partial<CmsBrand>>({
    name: "",
    slug: "",
    country: "China",
    origin_port: "Shenzhen Port",
    website: "",
    description: "",
    logo_url: "",
    is_active: true,
    order: 0,
  });
  const [catDraft, setCatDraft] = useState<Partial<CmsCategory>>({
    name: "",
    slug: "",
    description: "",
    icon: "Zap",
    is_active: true,
    order: 0,
  });

  const [testimonials, setTestimonials] = useState<CmsTestimonial[]>([]);
  const [testDraft, setTestDraft] = useState<Partial<CmsTestimonial>>({
    client_name: "",
    role: "",
    company: "",
    station_location: "Kathmandu",
    equipment_purchased: "DC Fast Charger",
    feedback: "",
    rating: 5,
    is_featured: true,
    order: 0,
  });

  const [faqs, setFaqs] = useState<CmsFaq[]>([]);
  const [faqDraft, setFaqDraft] = useState<Partial<CmsFaq>>({
    question: "",
    answer: "",
    category: "General",
    is_active: true,
    order: 0,
  });

  const [navLinks, setNavLinks] = useState<CmsNavLink[]>([]);
  const [navDraft, setNavDraft] = useState<Partial<CmsNavLink>>({
    location: "HEADER",
    label: "",
    href: "/",
    is_visible: true,
    open_in_new_tab: false,
    order: 0,
  });

  const [settingsForm, setSettingsForm] = useState<Record<string, unknown>>({});
  const [mediaFiles, setMediaFiles] = useState<CmsMediaAsset[]>([]);
  const [mediaSearch, setMediaSearch] = useState("");
  const [auditLogs, setAuditLogs] = useState<CmsAuditEntry[]>([]);
  const [versions, setVersions] = useState<CmsVersionEntry[]>([]);
  const [expandedAudit, setExpandedAudit] = useState<number | null>(null);

  const loadSection = async () => {
    if (!isSuperAdmin) return;
    setLoading(true);
    try {
      if (section === "dashboard") {
        setDashboard(await cmsAdminApi.dashboard());
      } else if (section === "pages") {
        const [pRes, sRes] = await Promise.all([
          cmsAdminApi.listPages(),
          cmsAdminApi.listServices(),
        ]);
        setPages(pRes.sections);
        setServices(sRes.services);
        if (pRes.sections[0] && !selectedSectionKey) {
          setSelectedSectionKey(pRes.sections[0].section_key);
          setPageDraft(structuredClone(pRes.sections[0].draft_content || {}));
        }
      } else if (section === "chargers") {
        const res = await cmsAdminApi.listChargers();
        setChargers(res.chargers);
        setBrands(res.brands);
        setCategories(res.categories);
      } else if (section === "brands") {
        setBrands((await cmsAdminApi.listBrands()).brands);
      } else if (section === "categories") {
        setCategories((await cmsAdminApi.listCategories()).categories);
      } else if (section === "testimonials") {
        setTestimonials((await cmsAdminApi.listTestimonials()).testimonials);
      } else if (section === "faqs") {
        setFaqs((await cmsAdminApi.listFaqs()).faqs);
      } else if (section === "navigation") {
        setNavLinks((await cmsAdminApi.listNav()).links);
      } else if (section === "settings") {
        setSettingsForm((await cmsAdminApi.getSettings()).settings);
      } else if (section === "media") {
        setMediaFiles((await cmsAdminApi.listMedia(mediaSearch)).files);
      } else if (section === "versions") {
        const [vRes, aRes] = await Promise.all([
          cmsAdminApi.listVersions(),
          cmsAdminApi.listAudit(),
        ]);
        setVersions(vRes.versions);
        setAuditLogs(aRes.logs);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to load CMS data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section, isSuperAdmin]);

  if (!isSuperAdmin) {
    return (
      <main className="erp-page">
        <PageHeader
          title="Storefront CMS"
          group="Administration"
          description="Restricted to Super Administrators."
        />
        <div className="flex min-h-72 flex-col items-center justify-center gap-3 rounded-lg border bg-card p-8 text-center">
          <Shield className="text-muted-foreground" />
          <p className="text-sm font-medium">Super Administrator access required.</p>
          <p className="text-xs text-muted-foreground">
            Only Super Administrators can edit public storefront CMS content.
          </p>
        </div>
      </main>
    );
  }

  const triggerRevalidateAll = async () => {
    try {
      const res = await cmsAdminApi.revalidateAll();
      toast.success(
        res.revalidation["ok"]
          ? "Storefront cache revalidated immediately."
          : "Revalidation dispatched (check storefront URL if offline).",
      );
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Revalidate failed.");
    }
  };

  const openStorefrontPreview = async () => {
    try {
      const { previewUrl } = await cmsAdminApi.createPreviewToken();
      window.open(previewUrl, "_blank", "noopener,noreferrer");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to generate preview token.");
    }
  };

  const titleMap: Record<CmsSectionTab, { title: string; desc: string }> = {
    dashboard: {
      title: "CMS Dashboard",
      desc: "Single source of truth for the public Next.js EV charger storefront.",
    },
    pages: {
      title: "Pages & Content",
      desc: "Edit public page sections & services with draft/publish and instant webhook sync.",
    },
    chargers: {
      title: "Storefront Chargers",
      desc: "Full CRUD catalog synced live to the public storefront.",
    },
    brands: {
      title: "Brands & OEM Partners",
      desc: "Manage partner logos, descriptions, and order.",
    },
    categories: { title: "Categories & Filters", desc: "Manage storefront catalog categories." },
    testimonials: { title: "Testimonials", desc: "Manage customer reviews on the public site." },
    faqs: { title: "FAQs", desc: "Manage storefront FAQ accordion items." },
    navigation: { title: "Navigation Menus", desc: "Edit header and footer menu links and order." },
    settings: {
      title: "Site Settings & SEO",
      desc: "Title, SEO metadata, accent color, logo, contact info, map embed, and enquiry email template.",
    },
    media: {
      title: "Media Library",
      desc: "Upload images to local storage or Cloudinary and copy URLs across CMS.",
    },
    versions: {
      title: "Preview, Publish & Audit Trail",
      desc: "Publish drafts, revert to previous snapshots, and inspect field-level audit logs.",
    },
  };

  const headerInfo = titleMap[section];

  return (
    <main className="erp-page">
      <PageHeader
        title={headerInfo.title}
        group="Storefront CMS"
        description={headerInfo.desc}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => void openStorefrontPreview()}>
              <Eye size={14} className="mr-1.5" />
              Preview Drafts
            </Button>
            <Button variant="outline" size="sm" onClick={() => void triggerRevalidateAll()}>
              <RefreshCw size={14} className="mr-1.5" />
              Revalidate All
            </Button>
            <Button
              size="sm"
              onClick={async () => {
                await cmsAdminApi.publishAll();
                toast.success("All CMS drafts published and synced to storefront.");
                void loadSection();
              }}
            >
              <Send size={14} className="mr-1.5" />
              Publish All
            </Button>
          </>
        }
      />

      {/* 1. DASHBOARD */}
      {section === "dashboard" && (
        <div className="space-y-5">
          <div className="kpi-grid">
            <Kpi
              label="Storefront Chargers"
              value={dashboard?.counts.totalChargers ?? 0}
              foot={`${dashboard?.counts.publishedChargers ?? 0} published · ${dashboard?.counts.draftChargers ?? 0} draft`}
              icon={<Zap size={15} />}
            />
            <Kpi
              label="Website Enquiries"
              value={dashboard?.counts.websiteEnquiries ?? 0}
              foot={`${dashboard?.counts.totalEnquiries ?? 0} total in Sales & CRM`}
              icon={<Inbox size={15} />}
            />
            <Kpi
              label="Draft Page Sections"
              value={dashboard?.counts.draftSections ?? 0}
              foot="Pending publish to storefront"
              icon={<FileText size={15} />}
            />
            <Kpi
              label="Media Assets"
              value={dashboard?.counts.media ?? 0}
              foot={`${dashboard?.counts.customers ?? 0} registered storefront customers`}
              icon={<ImageIcon size={15} />}
            />
          </div>

          <Panel
            title="Storefront Live Sync"
            subtitle="Changes published here trigger a signed HMAC webhook to revalidate the Next.js storefront within seconds"
            action={
              dashboard?.storefrontUrl && (
                <a
                  href={dashboard.storefrontUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                >
                  Open Public Storefront <ExternalLink size={13} />
                </a>
              )
            }
          >
            <div className="flex flex-wrap gap-2 px-5 pb-5">
              <Button variant="outline" size="sm" asChild>
                <Link to="/modules/$" params={{ _splat: "sales/enquiries" }}>
                  View Website Enquiries in CRM
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to="/cms/$section" params={{ section: "chargers" }}>
                  Manage Chargers
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to="/cms/$section" params={{ section: "pages" }}>
                  Edit Page Sections
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to="/cms/$section" params={{ section: "settings" }}>
                  Site Settings & Accent Color
                </Link>
              </Button>
            </div>
          </Panel>

          <Panel
            title="Recent CMS Audit Activity"
            subtitle="Every CMS write logs actor, action, and diffs"
          >
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Action</th>
                    <th>Entity</th>
                    <th>Summary</th>
                    <th>Actor</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {(dashboard?.recentAudit ?? []).map((log) => (
                    <tr key={log.id}>
                      <td className="font-mono text-[11px] font-semibold text-primary">
                        {log.action}
                      </td>
                      <td>{log.entity_type}</td>
                      <td>{log.summary}</td>
                      <td>{log.actor_email}</td>
                      <td className="text-muted-foreground">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {!loading && (dashboard?.recentAudit?.length ?? 0) === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-xs text-muted-foreground">
                        No CMS changes logged yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      )}

      {/* 2. PAGES & CONTENT */}
      {section === "pages" && (
        <div className="space-y-6">
          <div className="grid gap-5 lg:grid-cols-12">
            <div className="space-y-1.5 lg:col-span-4">
              {pages.map((sec) => (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => {
                    setSelectedSectionKey(sec.section_key);
                    setPageDraft(structuredClone(sec.draft_content || {}));
                  }}
                  className={`flex w-full items-center justify-between rounded-lg border px-3.5 py-2.5 text-left text-xs transition ${
                    sec.section_key === selectedSectionKey
                      ? "border-primary bg-primary/5 font-semibold"
                      : "bg-card hover:bg-muted/40"
                  }`}
                >
                  <div>
                    <div>{sec.label}</div>
                    <div className="font-mono text-[10px] text-muted-foreground">
                      {sec.section_key}
                    </div>
                  </div>
                  <StatusBadge status={sec.publish_status === "PUBLISHED" ? "Active" : "Draft"} />
                </button>
              ))}
            </div>

            <div className="lg:col-span-8">
              {selectedSectionKey && (
                <Panel
                  title={
                    pages.find((p) => p.section_key === selectedSectionKey)?.label ||
                    selectedSectionKey
                  }
                  subtitle={`Section key: ${selectedSectionKey}`}
                  action={
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          await cmsAdminApi.savePage({
                            section_key: selectedSectionKey,
                            content: pageDraft,
                            publish: false,
                          });
                          toast.success("Saved section draft.");
                          void loadSection();
                        }}
                      >
                        <Save size={13} className="mr-1" /> Save Draft
                      </Button>
                      <Button
                        size="sm"
                        onClick={async () => {
                          await cmsAdminApi.savePage({
                            section_key: selectedSectionKey,
                            content: pageDraft,
                            publish: true,
                          });
                          toast.success("Published & synced to storefront.");
                          void loadSection();
                        }}
                      >
                        <Send size={13} className="mr-1" /> Publish Live
                      </Button>
                    </div>
                  }
                >
                  <div className="space-y-4 px-5 pb-5">
                    {Object.entries(pageDraft).map(([k, v]) => (
                      <div key={k}>
                        <Label className="text-xs capitalize">{k}</Label>
                        {typeof v === "string" ? (
                          v.length > 90 ? (
                            <Textarea
                              className="mt-1.5 text-xs"
                              rows={3}
                              value={v}
                              onChange={(e) => setPageDraft({ ...pageDraft, [k]: e.target.value })}
                            />
                          ) : (
                            <Input
                              className="mt-1.5 h-8 text-xs"
                              value={v}
                              onChange={(e) => setPageDraft({ ...pageDraft, [k]: e.target.value })}
                            />
                          )
                        ) : (
                          <Textarea
                            className="mt-1.5 font-mono text-[11px]"
                            rows={5}
                            value={JSON.stringify(v, null, 2)}
                            onChange={(e) => {
                              try {
                                setPageDraft({ ...pageDraft, [k]: JSON.parse(e.target.value) });
                              } catch {
                                // wait for valid json
                              }
                            }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </Panel>
              )}
            </div>
          </div>

          <Panel title="Storefront Services" subtitle="Displayed on the public /services page">
            <div className="space-y-4 px-5 pb-5">
              <div className="grid gap-3 sm:grid-cols-3">
                <Input
                  placeholder="Service title"
                  className="h-8 text-xs"
                  value={newService.title || ""}
                  onChange={(e) =>
                    setNewService({
                      ...newService,
                      title: e.target.value,
                      slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
                    })
                  }
                />
                <Input
                  placeholder="Short summary"
                  className="h-8 text-xs"
                  value={newService.summary || ""}
                  onChange={(e) => setNewService({ ...newService, summary: e.target.value })}
                />
                <Button
                  size="sm"
                  className="h-8 text-xs"
                  onClick={async () => {
                    if (!newService.title) return;
                    await cmsAdminApi.saveService(newService);
                    toast.success("Service saved & synced.");
                    setNewService({
                      title: "",
                      slug: "",
                      summary: "",
                      description: "",
                      icon: "Wrench",
                      is_visible: true,
                      order: services.length + 1,
                    });
                    void loadSection();
                  }}
                >
                  <Plus size={13} className="mr-1" /> Add Service
                </Button>
              </div>
              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Summary</th>
                      <th className="text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {services.map((s) => (
                      <tr key={s.id}>
                        <td className="font-medium">{s.title}</td>
                        <td className="text-muted-foreground">{s.summary}</td>
                        <td className="text-right">
                          {s.id && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="size-7 text-destructive"
                              onClick={async () => {
                                await cmsAdminApi.deleteService(s.id!);
                                toast.success("Service removed.");
                                void loadSection();
                              }}
                            >
                              <Trash2 size={13} />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Panel>
        </div>
      )}

      {/* 3. CHARGERS CRUD */}
      {section === "chargers" && (
        <div className="space-y-5">
          {editingCharger && (
            <Panel
              title={editingCharger.id ? `Edit ${editingCharger.name}` : "Add Storefront Charger"}
              action={
                <Button size="sm" variant="outline" onClick={() => setEditingCharger(null)}>
                  Cancel
                </Button>
              }
            >
              <form
                className="space-y-4 px-5 pb-5"
                onSubmit={async (e) => {
                  e.preventDefault();
                  let parsedSpecs: Record<string, string> = {};
                  try {
                    parsedSpecs = JSON.parse(specsStr || "{}");
                  } catch {
                    toast.error("Specifications must be valid JSON.");
                    return;
                  }
                  const connectors = connectorsStr
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean);
                  const images = imagesStr
                    .split("\n")
                    .map((s) => s.trim())
                    .filter(Boolean);
                  await cmsAdminApi.saveCharger({
                    ...editingCharger,
                    connectors,
                    connector_type: connectors.join(", ") || "CCS2",
                    images,
                    specifications: parsedSpecs,
                  });
                  toast.success("Charger saved & synced to storefront.");
                  setEditingCharger(null);
                  void loadSection();
                }}
              >
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <Label className="text-xs">Name</Label>
                    <Input
                      required
                      className="mt-1 h-8 text-xs"
                      value={editingCharger.name || ""}
                      onChange={(e) =>
                        setEditingCharger({
                          ...editingCharger,
                          name: e.target.value,
                          slug: editingCharger.id
                            ? (editingCharger.slug ?? "")
                            : e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Slug</Label>
                    <Input
                      required
                      className="mt-1 h-8 font-mono text-xs"
                      value={editingCharger.slug || ""}
                      onChange={(e) =>
                        setEditingCharger({ ...editingCharger, slug: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label className="text-xs">SKU</Label>
                    <Input
                      required
                      className="mt-1 h-8 font-mono text-xs"
                      value={editingCharger.sku || ""}
                      onChange={(e) =>
                        setEditingCharger({ ...editingCharger, sku: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Model Number</Label>
                    <Input
                      required
                      className="mt-1 h-8 text-xs"
                      value={editingCharger.model_number || ""}
                      onChange={(e) =>
                        setEditingCharger({ ...editingCharger, model_number: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Brand</Label>
                    <select
                      className="erp-select mt-1 h-8 w-full text-xs"
                      value={editingCharger.brand ?? ""}
                      onChange={(e) =>
                        setEditingCharger({
                          ...editingCharger,
                          brand: Number(e.target.value) || null,
                        })
                      }
                    >
                      {brands.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs">Category</Label>
                    <select
                      className="erp-select mt-1 h-8 w-full text-xs"
                      value={editingCharger.category ?? ""}
                      onChange={(e) =>
                        setEditingCharger({ ...editingCharger, category: Number(e.target.value) })
                      }
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs">Type (AC/DC)</Label>
                    <select
                      className="erp-select mt-1 h-8 w-full text-xs"
                      value={editingCharger.charger_type || "DC"}
                      onChange={(e) =>
                        setEditingCharger({
                          ...editingCharger,
                          charger_type: e.target.value === "AC" ? "AC" : "DC",
                        })
                      }
                    >
                      <option value="AC">AC</option>
                      <option value="DC">DC</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs">Power (kW)</Label>
                    <Input
                      type="number"
                      className="mt-1 h-8 text-xs"
                      value={editingCharger.power_kw ?? 60}
                      onChange={(e) =>
                        setEditingCharger({ ...editingCharger, power_kw: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Price (NPR)</Label>
                    <Input
                      type="number"
                      className="mt-1 h-8 text-xs"
                      value={editingCharger.price_npr ?? 0}
                      onChange={(e) =>
                        setEditingCharger({ ...editingCharger, price_npr: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Connectors (comma-separated)</Label>
                    <Input
                      className="mt-1 h-8 text-xs"
                      value={connectorsStr}
                      onChange={(e) => setConnectorsStr(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Stock Status</Label>
                    <select
                      className="erp-select mt-1 h-8 w-full text-xs"
                      value={editingCharger.status || "In Stock"}
                      onChange={(e) =>
                        setEditingCharger({ ...editingCharger, status: e.target.value })
                      }
                    >
                      {["In Stock", "Low Stock", "Pre-Order", "Out of Stock"].map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs">Publish Status</Label>
                    <select
                      className="erp-select mt-1 h-8 w-full text-xs"
                      value={editingCharger.publish_status || "PUBLISHED"}
                      onChange={(e) =>
                        setEditingCharger({
                          ...editingCharger,
                          publish_status: e.target.value === "DRAFT" ? "DRAFT" : "PUBLISHED",
                        })
                      }
                    >
                      <option value="PUBLISHED">Published</option>
                      <option value="DRAFT">Draft</option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label className="text-xs">Image URLs (one per line)</Label>
                    <Textarea
                      rows={2}
                      className="mt-1 font-mono text-[11px]"
                      value={imagesStr}
                      onChange={(e) => setImagesStr(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Specifications Table (JSON)</Label>
                    <Textarea
                      rows={2}
                      className="mt-1 font-mono text-[11px]"
                      value={specsStr}
                      onChange={(e) => setSpecsStr(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs">Description (Rich HTML — sanitized on save)</Label>
                  <Textarea
                    rows={3}
                    className="mt-1 text-xs"
                    value={editingCharger.description || ""}
                    onChange={(e) =>
                      setEditingCharger({ ...editingCharger, description: e.target.value })
                    }
                  />
                </div>

                <div className="flex flex-wrap items-center gap-5 text-xs">
                  <label className="inline-flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={editingCharger.show_price !== false}
                      onChange={(e) =>
                        setEditingCharger({ ...editingCharger, show_price: e.target.checked })
                      }
                    />
                    Show price on storefront
                  </label>
                  <label className="inline-flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={Boolean(editingCharger.is_featured)}
                      onChange={(e) =>
                        setEditingCharger({ ...editingCharger, is_featured: e.target.checked })
                      }
                    />
                    Featured on Home
                  </label>
                  <Button type="submit" size="sm" className="ml-auto">
                    <Save size={13} className="mr-1" /> Save Charger
                  </Button>
                </div>
              </form>
            </Panel>
          )}

          <Panel
            title={`Chargers Catalog (${chargers.length})`}
            action={
              <Button
                size="sm"
                onClick={() => {
                  setEditingCharger({
                    name: "",
                    slug: "",
                    sku: `EV-${Date.now().toString().slice(-4)}`,
                    model_number: "DC-60",
                    brand: brands[0]?.id ?? null,
                    category: categories[0]?.id ?? 1,
                    charger_type: "DC",
                    power_kw: 60,
                    warranty_years: 3,
                    price_npr: 1950000,
                    show_price: true,
                    status: "In Stock",
                    publish_status: "PUBLISHED",
                    is_featured: false,
                    order: chargers.length + 1,
                    description: "<p>Certified EV charger imported directly for Nepal.</p>",
                  });
                  setConnectorsStr("CCS2, GB/T");
                  setImagesStr("/uploads/charger-dc.svg");
                  setSpecsStr('{"Efficiency": "95.2%"}');
                }}
              >
                <Plus size={13} className="mr-1" /> Add Charger
              </Button>
            }
          >
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Charger</th>
                    <th>Type / Power</th>
                    <th>Price (NPR)</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {chargers.map((c, idx) => (
                    <tr key={c.id}>
                      <td>
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-6"
                            disabled={idx === 0}
                            onClick={async () => {
                              const next = [...chargers];
                              const [m] = next.splice(idx, 1);
                              if (!m) return;
                              next.splice(idx - 1, 0, m);
                              setChargers(next);
                              await cmsAdminApi.reorderChargers(next.map((x) => x.id!));
                              toast.success("Order synced.");
                            }}
                          >
                            <ArrowUp size={12} />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-6"
                            disabled={idx === chargers.length - 1}
                            onClick={async () => {
                              const next = [...chargers];
                              const [m] = next.splice(idx, 1);
                              if (!m) return;
                              next.splice(idx + 1, 0, m);
                              setChargers(next);
                              await cmsAdminApi.reorderChargers(next.map((x) => x.id!));
                              toast.success("Order synced.");
                            }}
                          >
                            <ArrowDown size={12} />
                          </Button>
                        </div>
                      </td>
                      <td>
                        <div className="font-medium">{c.name}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {c.brand_name} · {c.sku}
                        </div>
                      </td>
                      <td>
                        {c.charger_type} · {c.power_kw} kW
                      </td>
                      <td>{npr(c.price_npr)}</td>
                      <td>
                        <StatusBadge
                          status={c.publish_status === "PUBLISHED" ? "Active" : "Draft"}
                        />
                      </td>
                      <td className="text-right space-x-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-7"
                          onClick={() => {
                            setEditingCharger(structuredClone(c));
                            setConnectorsStr(
                              (c.connectors && c.connectors.length > 0
                                ? c.connectors
                                : [c.connector_type]
                              ).join(", "),
                            );
                            setImagesStr((c.images || []).join("\n"));
                            setSpecsStr(JSON.stringify(c.specifications || {}, null, 2));
                          }}
                        >
                          <Pencil size={13} />
                        </Button>
                        {c.id && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-7 text-destructive"
                            onClick={async () => {
                              await cmsAdminApi.deleteCharger(c.id!);
                              toast.success("Charger deleted.");
                              void loadSection();
                            }}
                          >
                            <Trash2 size={13} />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      )}

      {/* 4. BRANDS */}
      {section === "brands" && (
        <div className="space-y-5">
          <Panel title={brandDraft.id ? "Edit Brand" : "Add Brand"}>
            <div className="grid gap-3 px-5 pb-5 sm:grid-cols-3">
              <Input
                placeholder="Brand Name"
                className="h-8 text-xs"
                value={brandDraft.name || ""}
                onChange={(e) =>
                  setBrandDraft({
                    ...brandDraft,
                    name: e.target.value,
                    slug: brandDraft.id
                      ? (brandDraft.slug ?? "")
                      : e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
                  })
                }
              />
              <Input
                placeholder="Country"
                className="h-8 text-xs"
                value={brandDraft.country || ""}
                onChange={(e) => setBrandDraft({ ...brandDraft, country: e.target.value })}
              />
              <Input
                placeholder="Logo URL"
                className="h-8 text-xs"
                value={brandDraft.logo_url || ""}
                onChange={(e) => setBrandDraft({ ...brandDraft, logo_url: e.target.value })}
              />
              <Input
                placeholder="Description"
                className="sm:col-span-2 h-8 text-xs"
                value={brandDraft.description || ""}
                onChange={(e) => setBrandDraft({ ...brandDraft, description: e.target.value })}
              />
              <Button
                size="sm"
                className="h-8 text-xs"
                onClick={async () => {
                  if (!brandDraft.name) return;
                  await cmsAdminApi.saveBrand(brandDraft);
                  toast.success("Brand saved & synced.");
                  setBrandDraft({
                    name: "",
                    slug: "",
                    country: "China",
                    origin_port: "Shenzhen Port",
                    website: "",
                    description: "",
                    logo_url: "",
                    is_active: true,
                    order: brands.length + 1,
                  });
                  void loadSection();
                }}
              >
                <Save size={13} className="mr-1" /> Save Brand
              </Button>
            </div>
          </Panel>
          <Panel title={`Brands (${brands.length})`}>
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Brand</th>
                    <th>Country</th>
                    <th>Description</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {brands.map((b) => (
                    <tr key={b.id}>
                      <td className="font-medium">{b.name}</td>
                      <td>{b.country}</td>
                      <td className="text-muted-foreground">{b.description}</td>
                      <td className="text-right space-x-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-7"
                          onClick={() => setBrandDraft(b)}
                        >
                          <Pencil size={13} />
                        </Button>
                        {b.id && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-7 text-destructive"
                            onClick={async () => {
                              await cmsAdminApi.deleteBrand(b.id!);
                              toast.success("Brand deleted.");
                              void loadSection();
                            }}
                          >
                            <Trash2 size={13} />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      )}

      {/* 5. CATEGORIES */}
      {section === "categories" && (
        <div className="space-y-5">
          <Panel title={catDraft.id ? "Edit Category" : "Add Category"}>
            <div className="grid gap-3 px-5 pb-5 sm:grid-cols-3">
              <Input
                placeholder="Category Name"
                className="h-8 text-xs"
                value={catDraft.name || ""}
                onChange={(e) =>
                  setCatDraft({
                    ...catDraft,
                    name: e.target.value,
                    slug: catDraft.id
                      ? (catDraft.slug ?? "")
                      : e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
                  })
                }
              />
              <Input
                placeholder="Description"
                className="h-8 text-xs"
                value={catDraft.description || ""}
                onChange={(e) => setCatDraft({ ...catDraft, description: e.target.value })}
              />
              <Button
                size="sm"
                className="h-8 text-xs"
                onClick={async () => {
                  if (!catDraft.name) return;
                  await cmsAdminApi.saveCategory(catDraft);
                  toast.success("Category saved & synced.");
                  setCatDraft({
                    name: "",
                    slug: "",
                    description: "",
                    icon: "Zap",
                    is_active: true,
                    order: categories.length + 1,
                  });
                  void loadSection();
                }}
              >
                <Save size={13} className="mr-1" /> Save Category
              </Button>
            </div>
          </Panel>
          <Panel title={`Categories (${categories.length})`}>
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Slug</th>
                    <th>Description</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((c) => (
                    <tr key={c.id}>
                      <td className="font-medium">{c.name}</td>
                      <td className="font-mono text-[11px]">{c.slug}</td>
                      <td className="text-muted-foreground">{c.description}</td>
                      <td className="text-right space-x-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-7"
                          onClick={() => setCatDraft(c)}
                        >
                          <Pencil size={13} />
                        </Button>
                        {c.id && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-7 text-destructive"
                            onClick={async () => {
                              try {
                                await cmsAdminApi.deleteCategory(c.id!);
                                toast.success("Category deleted.");
                                void loadSection();
                              } catch (e: unknown) {
                                toast.error(e instanceof Error ? e.message : "Delete failed.");
                              }
                            }}
                          >
                            <Trash2 size={13} />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      )}

      {/* 6. TESTIMONIALS */}
      {section === "testimonials" && (
        <div className="space-y-5">
          <Panel title={testDraft.id ? "Edit Testimonial" : "Add Testimonial"}>
            <div className="grid gap-3 px-5 pb-5 sm:grid-cols-3">
              <Input
                placeholder="Client Name"
                className="h-8 text-xs"
                value={testDraft.client_name || ""}
                onChange={(e) => setTestDraft({ ...testDraft, client_name: e.target.value })}
              />
              <Input
                placeholder="Company"
                className="h-8 text-xs"
                value={testDraft.company || ""}
                onChange={(e) => setTestDraft({ ...testDraft, company: e.target.value })}
              />
              <Input
                placeholder="Role"
                className="h-8 text-xs"
                value={testDraft.role || ""}
                onChange={(e) => setTestDraft({ ...testDraft, role: e.target.value })}
              />
              <Textarea
                rows={2}
                placeholder="Customer review quote..."
                className="sm:col-span-2 text-xs"
                value={testDraft.feedback || ""}
                onChange={(e) => setTestDraft({ ...testDraft, feedback: e.target.value })}
              />
              <Button
                size="sm"
                className="h-8 self-end text-xs"
                onClick={async () => {
                  if (!testDraft.client_name || !testDraft.feedback) return;
                  await cmsAdminApi.saveTestimonial(testDraft);
                  toast.success("Testimonial saved & synced.");
                  setTestDraft({
                    client_name: "",
                    role: "",
                    company: "",
                    station_location: "Kathmandu",
                    equipment_purchased: "DC Fast Charger",
                    feedback: "",
                    rating: 5,
                    is_featured: true,
                    order: testimonials.length + 1,
                  });
                  void loadSection();
                }}
              >
                <Save size={13} className="mr-1" /> Save Review
              </Button>
            </div>
          </Panel>
          <Panel title={`Testimonials (${testimonials.length})`}>
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Quote</th>
                    <th>Visible</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {testimonials.map((t) => (
                    <tr key={t.id}>
                      <td>
                        <div className="font-medium">{t.client_name}</div>
                        <div className="text-[10px] text-muted-foreground">{t.company}</div>
                      </td>
                      <td className="max-w-md text-muted-foreground">{t.feedback}</td>
                      <td>
                        <StatusBadge status={t.is_featured ? "Active" : "Inactive"} />
                      </td>
                      <td className="text-right space-x-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-7"
                          onClick={() => setTestDraft(t)}
                        >
                          <Pencil size={13} />
                        </Button>
                        {t.id && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-7 text-destructive"
                            onClick={async () => {
                              await cmsAdminApi.deleteTestimonial(t.id!);
                              toast.success("Testimonial deleted.");
                              void loadSection();
                            }}
                          >
                            <Trash2 size={13} />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      )}

      {/* 7. FAQS */}
      {section === "faqs" && (
        <div className="space-y-5">
          <Panel title={faqDraft.id ? "Edit FAQ" : "Add FAQ"}>
            <div className="grid gap-3 px-5 pb-5 sm:grid-cols-3">
              <Input
                placeholder="Question"
                className="sm:col-span-2 h-8 text-xs"
                value={faqDraft.question || ""}
                onChange={(e) => setFaqDraft({ ...faqDraft, question: e.target.value })}
              />
              <Input
                placeholder="Category"
                className="h-8 text-xs"
                value={faqDraft.category || ""}
                onChange={(e) => setFaqDraft({ ...faqDraft, category: e.target.value })}
              />
              <Textarea
                rows={2}
                placeholder="Answer"
                className="sm:col-span-2 text-xs"
                value={faqDraft.answer || ""}
                onChange={(e) => setFaqDraft({ ...faqDraft, answer: e.target.value })}
              />
              <Button
                size="sm"
                className="h-8 self-end text-xs"
                onClick={async () => {
                  if (!faqDraft.question || !faqDraft.answer) return;
                  await cmsAdminApi.saveFaq(faqDraft);
                  toast.success("FAQ saved & synced.");
                  setFaqDraft({
                    question: "",
                    answer: "",
                    category: "General",
                    is_active: true,
                    order: faqs.length + 1,
                  });
                  void loadSection();
                }}
              >
                <Save size={13} className="mr-1" /> Save FAQ
              </Button>
            </div>
          </Panel>
          <Panel title={`FAQs (${faqs.length})`}>
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Question</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {faqs.map((f) => (
                    <tr key={f.id}>
                      <td>{f.category}</td>
                      <td>
                        <div className="font-medium">{f.question}</div>
                        <div className="text-[11px] text-muted-foreground">{f.answer}</div>
                      </td>
                      <td className="text-right space-x-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-7"
                          onClick={() => setFaqDraft(f)}
                        >
                          <Pencil size={13} />
                        </Button>
                        {f.id && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-7 text-destructive"
                            onClick={async () => {
                              await cmsAdminApi.deleteFaq(f.id!);
                              toast.success("FAQ deleted.");
                              void loadSection();
                            }}
                          >
                            <Trash2 size={13} />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      )}

      {/* 8. NAVIGATION */}
      {section === "navigation" && (
        <div className="space-y-5">
          <Panel title={navDraft.id ? "Edit Menu Link" : "Add Menu Link"}>
            <div className="grid gap-3 px-5 pb-5 sm:grid-cols-4">
              <select
                className="erp-select h-8 text-xs"
                value={navDraft.location || "HEADER"}
                onChange={(e) =>
                  setNavDraft({
                    ...navDraft,
                    location: e.target.value === "FOOTER" ? "FOOTER" : "HEADER",
                  })
                }
              >
                <option value="HEADER">Header Menu</option>
                <option value="FOOTER">Footer Menu</option>
              </select>
              <Input
                placeholder="Label"
                className="h-8 text-xs"
                value={navDraft.label || ""}
                onChange={(e) => setNavDraft({ ...navDraft, label: e.target.value })}
              />
              <Input
                placeholder="/chargers"
                className="h-8 font-mono text-xs"
                value={navDraft.href || ""}
                onChange={(e) => setNavDraft({ ...navDraft, href: e.target.value })}
              />
              <Button
                size="sm"
                className="h-8 text-xs"
                onClick={async () => {
                  if (!navDraft.label || !navDraft.href) return;
                  await cmsAdminApi.saveNav(navDraft);
                  toast.success("Navigation link saved & synced.");
                  setNavDraft({
                    location: "HEADER",
                    label: "",
                    href: "/",
                    is_visible: true,
                    open_in_new_tab: false,
                    order: navLinks.length + 1,
                  });
                  void loadSection();
                }}
              >
                <Save size={13} className="mr-1" /> Save Link
              </Button>
            </div>
          </Panel>
          <Panel title={`Navigation Links (${navLinks.length})`}>
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Location</th>
                    <th>Label</th>
                    <th>Href</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {navLinks.map((n) => (
                    <tr key={n.id}>
                      <td className="font-mono text-[11px]">{n.location}</td>
                      <td className="font-medium">{n.label}</td>
                      <td className="font-mono text-[11px] text-muted-foreground">{n.href}</td>
                      <td className="text-right space-x-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-7"
                          onClick={() => setNavDraft(n)}
                        >
                          <Pencil size={13} />
                        </Button>
                        {n.id && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-7 text-destructive"
                            onClick={async () => {
                              await cmsAdminApi.deleteNav(n.id!);
                              toast.success("Navigation link removed.");
                              void loadSection();
                            }}
                          >
                            <Trash2 size={13} />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      )}

      {/* 9. SITE SETTINGS */}
      {section === "settings" && (
        <Panel
          title="Storefront SEO, Branding, Contact & Email Templates"
          action={
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  await cmsAdminApi.saveSettings({ ...settingsForm, publish: false });
                  toast.success("Saved settings draft.");
                }}
              >
                <Save size={13} className="mr-1" /> Save Draft
              </Button>
              <Button
                size="sm"
                onClick={async () => {
                  await cmsAdminApi.saveSettings({ ...settingsForm, publish: true });
                  toast.success("Site settings published & synced.");
                }}
              >
                <Send size={13} className="mr-1" /> Publish Settings
              </Button>
            </div>
          }
        >
          <div className="grid gap-4 px-5 pb-5 sm:grid-cols-2">
            {(
              [
                ["site_title", "Site Title"],
                ["tagline", "Site Tagline"],
                ["accent_color", "Public Accent Color (Hex)"],
                ["logo_url", "Logo URL"],
                ["og_image", "Open Graph Image URL"],
                ["favicon_url", "Favicon URL"],
                ["company_name", "Company Name"],
                ["email", "Public Contact Email"],
                ["phone", "Primary Phone"],
                ["alt_phone", "Secondary Phone"],
                ["address", "Address"],
                ["support_hours", "Business Hours"],
                ["staff_notification_email", "Staff Enquiry Alert Email (Optional)"],
                ["enquiry_email_subject", "Customer Confirmation Email Subject"],
              ] as const
            ).map(([key, label]) => (
              <div key={key}>
                <Label className="text-xs">{label}</Label>
                <Input
                  type={key === "accent_color" ? "color" : "text"}
                  className="mt-1 h-8 text-xs"
                  value={String(settingsForm[key] ?? "")}
                  onChange={(e) => setSettingsForm({ ...settingsForm, [key]: e.target.value })}
                />
              </div>
            ))}
            <div className="sm:col-span-2">
              <Label className="text-xs">Meta Description (SEO)</Label>
              <Textarea
                rows={2}
                className="mt-1 text-xs"
                value={String(settingsForm["meta_description"] ?? "")}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, meta_description: e.target.value })
                }
              />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs">Map Embed URL</Label>
              <Input
                className="mt-1 h-8 font-mono text-xs"
                value={String(settingsForm["map_embed_url"] ?? "")}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, map_embed_url: e.target.value })
                }
              />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs">
                Customer Confirmation Email Template (placeholders: {"{name}"}, {"{code}"},{" "}
                {"{charger_name}"}, {"{company_name}"}, {"{phone}"})
              </Label>
              <Textarea
                rows={4}
                className="mt-1 text-xs"
                value={String(settingsForm["enquiry_email_body"] ?? "")}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, enquiry_email_body: e.target.value })
                }
              />
            </div>
          </div>
        </Panel>
      )}

      {/* 10. MEDIA LIBRARY */}
      {section === "media" && (
        <Panel
          title={`Media Library (${mediaFiles.length})`}
          subtitle="Local storage by default; automatically switches to Cloudinary when CLOUDINARY_* env vars are set"
          action={
            <div className="flex items-center gap-2">
              <Input
                placeholder="Search files..."
                className="h-8 w-44 text-xs"
                value={mediaSearch}
                onChange={(e) => {
                  setMediaSearch(e.target.value);
                  void cmsAdminApi.listMedia(e.target.value).then((r) => setMediaFiles(r.files));
                }}
              />
              <label className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground">
                <UploadCloud size={14} /> Upload Image
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    try {
                      await cmsAdminApi.uploadMedia(f);
                      toast.success("Image uploaded to Media Library.");
                      void loadSection();
                    } catch (err: unknown) {
                      toast.error(err instanceof Error ? err.message : "Upload failed.");
                    }
                  }}
                />
              </label>
            </div>
          }
        >
          <div className="grid gap-4 px-5 pb-5 sm:grid-cols-2 lg:grid-cols-4">
            {mediaFiles.map((f) => (
              <div key={f.id} className="overflow-hidden rounded-lg border bg-card">
                <div className="aspect-[16/10] overflow-hidden bg-muted/30">
                  <img
                    src={resolvePreviewUrl(f.url)}
                    alt={f.alt_text || f.filename}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="space-y-1.5 p-3 text-xs">
                  <div className="truncate font-medium">{f.filename}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {(f.size_bytes / 1024).toFixed(1)} KB
                    {f.width && f.height ? ` · ${f.width}×${f.height}` : ""} · {f.storage_provider}
                  </div>
                  <div className="flex justify-between pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 text-[10px]"
                      onClick={() => {
                        void navigator.clipboard.writeText(f.url);
                        toast.success("Image URL copied.");
                      }}
                    >
                      <Copy size={11} className="mr-1" /> Copy URL
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-6 text-destructive"
                      onClick={async () => {
                        await cmsAdminApi.deleteMedia(f.id);
                        toast.success("Media deleted.");
                        void loadSection();
                      }}
                    >
                      <Trash2 size={12} />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {mediaFiles.length === 0 && (
              <p className="col-span-full py-8 text-center text-xs text-muted-foreground">
                No uploaded media assets yet. Upload an image above.
              </p>
            )}
          </div>
        </Panel>
      )}

      {/* 11. VERSIONS & AUDIT TRAIL */}
      {section === "versions" && (
        <div className="space-y-5">
          <Panel
            title="Content Version History & Revert"
            subtitle="Every page section and setting save creates a version snapshot you can restore at any time"
          >
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Version</th>
                    <th>Entity</th>
                    <th>Note</th>
                    <th>Author</th>
                    <th>Timestamp</th>
                    <th className="text-right">Revert</th>
                  </tr>
                </thead>
                <tbody>
                  {versions.map((v) => (
                    <tr key={v.id}>
                      <td className="font-mono font-semibold text-primary">v{v.version_number}</td>
                      <td>
                        {v.entity_type}: <span className="font-mono">{v.entity_key}</span>
                      </td>
                      <td>{v.note}</td>
                      <td>{v.created_by_email}</td>
                      <td className="text-muted-foreground">
                        {new Date(v.created_at).toLocaleString()}
                      </td>
                      <td className="text-right space-x-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[11px]"
                          onClick={async () => {
                            await cmsAdminApi.revertVersion(v.id, false);
                            toast.success(`Restored v${v.version_number} into draft.`);
                            void loadSection();
                          }}
                        >
                          <RotateCcw size={11} className="mr-1" /> To Draft
                        </Button>
                        <Button
                          size="sm"
                          className="h-7 text-[11px]"
                          onClick={async () => {
                            await cmsAdminApi.revertVersion(v.id, true);
                            toast.success(`Restored & published v${v.version_number}.`);
                            void loadSection();
                          }}
                        >
                          Restore & Publish
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel
            title="Full CMS Audit Log"
            subtitle="Who changed what, when, with old and new JSON values"
          >
            <div className="divide-y px-5 pb-4 text-xs">
              {auditLogs.map((log) => (
                <div key={log.id} className="py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="mr-2 rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] font-semibold">
                        {log.action}
                      </span>
                      <span className="font-medium">{log.summary}</span>
                      <span className="ml-2 text-muted-foreground">by {log.actor_email}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 text-[11px]"
                        onClick={() => setExpandedAudit(expandedAudit === log.id ? null : log.id)}
                      >
                        <Globe size={11} className="mr-1" />
                        {expandedAudit === log.id ? "Hide diff" : "View diff"}
                      </Button>
                    </div>
                  </div>
                  {expandedAudit === log.id && (
                    <div className="mt-2 grid gap-3 sm:grid-cols-2">
                      <pre className="max-h-40 overflow-auto rounded border bg-muted/40 p-2.5 text-[10px]">
                        OLD: {JSON.stringify(log.old_value, null, 2)}
                      </pre>
                      <pre className="max-h-40 overflow-auto rounded border bg-muted/40 p-2.5 text-[10px]">
                        NEW: {JSON.stringify(log.new_value, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Panel>
        </div>
      )}
    </main>
  );
}
