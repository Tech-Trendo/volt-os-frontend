import { rest, useMock } from "./config";

export interface PowerDemandPoint {
  hour: string;
  kw: number;
  sessions: number;
}

export interface WeeklyEnergyPoint {
  day: string;
  kwh: number;
  sessions: number;
}

export interface StationArchitectureCms {
  gridInflowTitle: string;
  gridInflowBadge: string;
  transformerTitle: string;
  transformerSubtitle: string;
  transformerSpec: string;
  distributionTitle: string;
  distributionSubtitle: string;
  distributionSpec: string;
  ocppProtocol: string;
}

export interface EquipmentCmsProfile {
  id: string;
  equipmentCode: string;
  modelName: string;
  brand: string;
  chargerType: "DC" | "AC";
  ratedPowerKw: number;
  connectorStandard: string;
  connectorCount: number;
  unitPriceNpr: number;
  fobPriceUsd: number;
  landedCostNpr: number;
  customsDutyPct: number;
  vatPct: number;
  importDate: string;
  customsClearanceDate: string;
  originCountry: string;
  originPort: string;
  entryPort: string;
  hsCode: string;
  shipmentRef: string;
  supplierName: string;
  warrantyYears: number;
  warrantyExpiry: string;
  amcStatus: string;
  inputVoltage: string;
  outputVoltage: string;
  maxCurrentA: number;
  efficiencyPct: number;
  ipRating: string;
  coolingType: string;
  ocppVersion: string;
  certifications: string;
  dimensionsMm: string;
  weightKg: number;
  notes: string;
}

export const DEFAULT_POWER_DEMAND_24H: PowerDemandPoint[] = [
  { hour: "00:00", kw: 120, sessions: 4 },
  { hour: "03:00", kw: 85, sessions: 3 },
  { hour: "06:00", kw: 210, sessions: 8 },
  { hour: "09:00", kw: 520, sessions: 19 },
  { hour: "12:00", kw: 760, sessions: 28 },
  { hour: "15:00", kw: 865, sessions: 32 },
  { hour: "18:00", kw: 940, sessions: 36 },
  { hour: "21:00", kw: 580, sessions: 21 },
];

export const DEFAULT_WEEKLY_ENERGY: WeeklyEnergyPoint[] = [
  { day: "Sun", kwh: 4850, sessions: 142 },
  { day: "Mon", kwh: 4320, sessions: 128 },
  { day: "Tue", kwh: 4510, sessions: 134 },
  { day: "Wed", kwh: 4720, sessions: 139 },
  { day: "Thu", kwh: 4980, sessions: 148 },
  { day: "Fri", kwh: 5890, sessions: 174 },
  { day: "Sat", kwh: 6450, sessions: 192 },
];

export const DEFAULT_STATION_ARCHITECTURE: StationArchitectureCms = {
  gridInflowTitle: "NEA 11kV Grid Inflow",
  gridInflowBadge: "50 Hz · 3-Phase AC",
  transformerTitle: "Step-Down Substation",
  transformerSubtitle: "Dedicated Transformer",
  transformerSpec: "11kV to 400V Dyn11",
  distributionTitle: "AC Distribution Panel",
  distributionSubtitle: "MCCB + Class I/II SPD",
  distributionSpec: "Surge Protected 40kA",
  ocppProtocol: "OCPP 1.6J / 2.0.1 Cloud Active",
};

export const DEFAULT_EQUIPMENT_CATALOG: EquipmentCmsProfile[] = [
  {
    id: "eq-cms-1",
    equipmentCode: "EQ-DC-180",
    modelName: "ABB Terra 184 Dual CCS2",
    brand: "ABB E-Mobility",
    chargerType: "DC",
    ratedPowerKw: 180,
    connectorStandard: "Dual CCS2",
    connectorCount: 2,
    unitPriceNpr: 4650000,
    fobPriceUsd: 26800,
    landedCostNpr: 3920000,
    customsDutyPct: 1,
    vatPct: 13,
    importDate: "2026-01-18",
    customsClearanceDate: "2026-01-24",
    originCountry: "Switzerland / Italy",
    originPort: "Genoa / Rotterdam Port",
    entryPort: "Birgunj ICD Dry Port",
    hsCode: "8504.40.90",
    shipmentRef: "BL-RTM-BRJ-2026-0118",
    supplierName: "ABB E-Mobility AG (Zurich)",
    warrantyYears: 5,
    warrantyExpiry: "2031-01-18",
    amcStatus: "Active · 24/7 Priority SLA",
    inputVoltage: "380V - 415V AC, 3-Phase, 50Hz",
    outputVoltage: "150V - 1000V DC",
    maxCurrentA: 300,
    efficiencyPct: 95.5,
    ipRating: "IP55 / IK10",
    coolingType: "Dual-Channel Forced Air Cooling",
    ocppVersion: "OCPP 1.6J / 2.0.1 Ready",
    certifications: "CE, IEC 61851-1, IEC 61851-23, TÜV, NEA Approved",
    dimensionsMm: "1900 × 770 × 670 mm",
    weightKg: 385,
    notes: "Highway fast-charging flagship unit with dynamic power sharing across two CCS2 guns.",
  },
  {
    id: "eq-cms-2",
    equipmentCode: "EQ-DC-120",
    modelName: "StarCharge Titan 120kW DC",
    brand: "StarCharge",
    chargerType: "DC",
    ratedPowerKw: 120,
    connectorStandard: "Dual CCS2",
    connectorCount: 2,
    unitPriceNpr: 3150000,
    fobPriceUsd: 18200,
    landedCostNpr: 2640000,
    customsDutyPct: 1,
    vatPct: 13,
    importDate: "2026-02-09",
    customsClearanceDate: "2026-02-14",
    originCountry: "China",
    originPort: "Shenzhen Yantian Port",
    entryPort: "Birgunj ICD Dry Port",
    hsCode: "8504.40.90",
    shipmentRef: "BL-SZX-BRJ-2026-0209",
    supplierName: "Wanbang Digital Energy (StarCharge)",
    warrantyYears: 5,
    warrantyExpiry: "2031-02-09",
    amcStatus: "Active · Preventive Quarterly",
    inputVoltage: "380V - 415V AC, 3-Phase, 50Hz",
    outputVoltage: "200V - 1000V DC",
    maxCurrentA: 250,
    efficiencyPct: 95.2,
    ipRating: "IP55 / IK10",
    coolingType: "Intelligent Forced Air",
    ocppVersion: "OCPP 1.6J / 2.0.1",
    certifications: "CE, IEC 61851, ISO 15118 Plug & Charge, NEA Approved",
    dimensionsMm: "1800 × 720 × 620 mm",
    weightKg: 310,
    notes: "Commercial fleet and intercity highway DC charger with modular 30kW power stacks.",
  },
  {
    id: "eq-cms-3",
    equipmentCode: "EQ-DC-60",
    modelName: "Autel MaxiCharger DC Fast 60kW",
    brand: "Autel Energy",
    chargerType: "DC",
    ratedPowerKw: 60,
    connectorStandard: "CCS2 + GB/T",
    connectorCount: 2,
    unitPriceNpr: 1950000,
    fobPriceUsd: 11400,
    landedCostNpr: 1620000,
    customsDutyPct: 1,
    vatPct: 13,
    importDate: "2026-03-04",
    customsClearanceDate: "2026-03-09",
    originCountry: "China",
    originPort: "Shanghai Yangshan Port",
    entryPort: "Rasuwagadhi Customs Hub",
    hsCode: "8504.40.90",
    shipmentRef: "BL-SHA-RSW-2026-0304",
    supplierName: "Autel Intelligent Technology Corp.",
    warrantyYears: 4,
    warrantyExpiry: "2030-03-04",
    amcStatus: "Active · Standard SLA",
    inputVoltage: "380V - 415V AC, 3-Phase, 50Hz",
    outputVoltage: "150V - 950V DC",
    maxCurrentA: 200,
    efficiencyPct: 95.0,
    ipRating: "IP54 / IK10",
    coolingType: "Smart Air Duct Cooling",
    ocppVersion: "OCPP 1.6J",
    certifications: "CE, TÜV Rheinland, IEC 61851, NEA Approved",
    dimensionsMm: "1650 × 680 × 540 mm",
    weightKg: 240,
    notes: "Compact urban fast charger ideal for malls, dealerships, and hotel forecourts.",
  },
  {
    id: "eq-cms-4",
    equipmentCode: "EQ-AC-22",
    modelName: "Delta AC MAX 22kW Commercial Wallbox",
    brand: "Delta Electronics",
    chargerType: "AC",
    ratedPowerKw: 22,
    connectorStandard: "Type 2",
    connectorCount: 1,
    unitPriceNpr: 165000,
    fobPriceUsd: 920,
    landedCostNpr: 132000,
    customsDutyPct: 1,
    vatPct: 13,
    importDate: "2026-04-12",
    customsClearanceDate: "2026-04-16",
    originCountry: "Taiwan / Thailand",
    originPort: "Kaohsiung Port",
    entryPort: "Birgunj ICD Dry Port",
    hsCode: "8504.40.90",
    shipmentRef: "BL-KHH-BRJ-2026-0412",
    supplierName: "Delta Electronics Inc.",
    warrantyYears: 3,
    warrantyExpiry: "2029-04-12",
    amcStatus: "Active · Annual Inspection",
    inputVoltage: "400V AC, 3-Phase, 50Hz",
    outputVoltage: "400V AC (32A per phase)",
    maxCurrentA: 32,
    efficiencyPct: 98.2,
    ipRating: "IP55 / IK09",
    coolingType: "Natural Convection",
    ocppVersion: "OCPP 1.6J",
    certifications: "CE, IEC 61851-1, RCD Type B Built-in",
    dimensionsMm: "371 × 218 × 167 mm",
    weightKg: 6.8,
    notes: "Destination AC charger for workplaces, residential apartments, and hospitality hubs.",
  },
];

export interface SiteSettings {
  id: string;
  site_title: string;
  tagline: string;
  company_name: string;
  email: string;
  phone: string;
  alt_phone: string;
  address: string;
  city: string;
  country: string;
  pan_vat_number: string;
  footer_text: string;
  hero_badge: string;
  hero_title: string;
  hero_description: string;
  support_hours: string;
  stats: {
    sla_uptime?: string;
    active_dealers?: number;
    peak_efficiency?: string;
    chargers_deployed?: number;
    districts_covered?: number;
    provinces_covered?: number;
    annual_import_capacity_mva?: number;
    powerDemand24h?: PowerDemandPoint[];
    weeklyEnergyDispensed?: WeeklyEnergyPoint[];
    stationArchitecture?: StationArchitectureCms;
    equipmentCatalog?: EquipmentCmsProfile[];
    [key: string]: unknown;
  };
  social_links: {
    twitter?: string;
    facebook?: string;
    linkedin?: string;
    [key: string]: unknown;
  };
  updated_at: string;
}

export interface ProductCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
  order: number;
  is_active: boolean;
  product_count: number;
  created_at: string;
}

export interface BrandSupplier {
  id: number;
  name: string;
  slug: string;
  country: string;
  logo_url: string;
  website: string;
  description: string;
  is_active: boolean;
  product_count: number;
  created_at: string;
}

export interface ProductItem {
  id: number;
  name: string;
  slug: string;
  category: number;
  category_name: string;
  brand: number;
  brand_name: string;
  sku: string;
  model_number: string;
  power_kw: number;
  input_voltage: string;
  output_voltage: string;
  connector_type: string;
  ip_rating: string;
  warranty_years: number;
  price_npr: number;
  stock_quantity: number;
  status: "In Stock" | "Low Stock" | "Backorder" | "Custom Import";
  is_featured: boolean;
  image_url: string;
  description: string;
  specifications: Record<string, unknown>;
  created_at: string;
}

export interface ImportProcessStep {
  id: number;
  step_number: number;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  lead_time_days: number;
}

export interface Testimonial {
  id: number;
  client_name: string;
  client_title: string;
  company_name: string;
  location: string;
  content: string;
  rating: number;
  avatar_url: string;
  project_delivered: string;
  created_at: string;
}

export interface FAQItem {
  id: number;
  question: string;
  answer: string;
  category: string;
  order: number;
  is_active: boolean;
}

export interface CertificationItem {
  id: number;
  name: string;
  issuer: string;
  standard_code: string;
  description: string;
  badge_url: string;
  validity_years: number;
}

export interface BlogPostItem {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: string;
  published_at: string;
  is_published: boolean;
  read_time_minutes: number;
}

export interface TeamMemberItem {
  id: number;
  name: string;
  role: string;
  department: string;
  email: string;
  phone: string;
  bio: string;
  avatar_url: string;
  order: number;
}

export interface DealerInquiryInput {
  full_name: string;
  company_name: string;
  email: string;
  phone: string;
  province?: string;
  district?: string;
  business_type?: string;
  message: string;
}

export interface ContentStats {
  categories_count: number;
  products_count: number;
  brands_count: number;
  testimonials_count: number;
  faqs_count: number;
  process_steps_count: number;
  certifications_count: number;
  team_count: number;
  articles_count: number;
  chargers_deployed: number;
  districts_covered: number;
  provinces_covered: number;
  peak_efficiency: string;
  sla_uptime: string;
}

function buildDefaultSiteSettings(): SiteSettings {
  return {
    id: "default",
    site_title: "Volt OS",
    tagline: "Enterprise EV Charging Equipment Importer & Infrastructure Supply",
    company_name: "Volt OS Energy Nepal Pvt. Ltd.",
    email: "imports@voltos.internal",
    phone: "+977-1-4589201",
    alt_phone: "+977-9844971857",
    address: "Volt OS Logistics Hub, Birgunj Dry Port Corridor / Tripureshwor, Kathmandu",
    city: "Kathmandu",
    country: "Nepal",
    pan_vat_number: "609823412",
    footer_text: "© 2026 Volt OS. All rights reserved.",
    hero_badge: "Nepal's Premier EV Charging Hardware Importer",
    hero_title: "High-Power EV Charging Equipment Direct from Global OEMs",
    hero_description:
      "Official importer and turnkey distributor of AC & DC fast chargers across Nepal.",
    support_hours: "24/7 Field Dispatch & Technical Support Hotline",
    stats: {
      sla_uptime: "99.4%",
      active_dealers: 25,
      peak_efficiency: "96.2%",
      chargers_deployed: 30,
      districts_covered: 18,
      provinces_covered: 7,
      annual_import_capacity_mva: 42,
      powerDemand24h: DEFAULT_POWER_DEMAND_24H,
      weeklyEnergyDispensed: DEFAULT_WEEKLY_ENERGY,
      stationArchitecture: DEFAULT_STATION_ARCHITECTURE,
      equipmentCatalog: DEFAULT_EQUIPMENT_CATALOG,
    },
    social_links: {},
    updated_at: "2026-11-18T00:00:00Z",
  };
}

let mockSiteSettingsCache: SiteSettings | null = null;

function withCmsDefaults(settings: SiteSettings): SiteSettings {
  const stats = settings.stats ?? {};
  return {
    ...settings,
    stats: {
      ...stats,
      powerDemand24h:
        Array.isArray(stats.powerDemand24h) && stats.powerDemand24h.length > 0
          ? stats.powerDemand24h
          : DEFAULT_POWER_DEMAND_24H,
      weeklyEnergyDispensed:
        Array.isArray(stats.weeklyEnergyDispensed) && stats.weeklyEnergyDispensed.length > 0
          ? stats.weeklyEnergyDispensed
          : DEFAULT_WEEKLY_ENERGY,
      stationArchitecture: {
        ...DEFAULT_STATION_ARCHITECTURE,
        ...(stats.stationArchitecture ?? {}),
      },
      equipmentCatalog:
        Array.isArray(stats.equipmentCatalog) && stats.equipmentCatalog.length > 0
          ? stats.equipmentCatalog
          : DEFAULT_EQUIPMENT_CATALOG,
    },
  };
}

export function resolveEquipmentCmsDetails(
  input: {
    code?: string | undefined | null;
    name?: string | undefined | null;
    productModel?: string | undefined | null;
    brand?: string | undefined | null;
    category?: string | undefined | null;
    chargerType?: string | undefined | null;
    ratedPowerKw?: number | undefined | null;
    connectorStandard?: string | undefined | null;
    connectorCount?: number | undefined | null;
    amountNpr?: number | undefined | null;
    date?: string | undefined | null;
    warrantyExpiry?: string | undefined | null;
    originPort?: string | undefined | null;
    country?: string | undefined | null;
    shipmentId?: string | undefined | null;
    description?: string | undefined | null;
  },
  catalog?: EquipmentCmsProfile[] | undefined,
): EquipmentCmsProfile {
  const list = catalog && catalog.length > 0 ? catalog : DEFAULT_EQUIPMENT_CATALOG;
  const codeKey = (input.code ?? "").trim().toLowerCase();
  const modelKey = (input.productModel ?? input.name ?? "").trim().toLowerCase();
  const brandKey = (input.brand ?? "").trim().toLowerCase();

  const exactCode = list.find((item) => item.equipmentCode.toLowerCase() === codeKey);
  const exactModel =
    exactCode ??
    list.find(
      (item) =>
        modelKey.length > 0 &&
        (item.modelName.toLowerCase().includes(modelKey) ||
          modelKey.includes(item.modelName.toLowerCase()) ||
          (brandKey.length > 0 && item.brand.toLowerCase().includes(brandKey))),
    );

  const isAc =
    (input.chargerType ?? input.category ?? "").toUpperCase().includes("AC") ||
    modelKey.includes("ac ") ||
    modelKey.includes("wallbox") ||
    (input.ratedPowerKw != null && input.ratedPowerKw <= 22);

  const powerMatch =
    exactModel ??
    (input.ratedPowerKw
      ? list.reduce((best, curr) =>
          Math.abs(curr.ratedPowerKw - input.ratedPowerKw!) <
          Math.abs(best.ratedPowerKw - input.ratedPowerKw!)
            ? curr
            : best,
        )
      : undefined) ??
    list.find((item) => item.chargerType === (isAc ? "AC" : "DC")) ??
    list[0]!;

  const ratedPowerKw = input.ratedPowerKw || powerMatch.ratedPowerKw || (isAc ? 22 : 120);
  const unitPriceNpr =
    input.amountNpr && input.amountNpr > 0 ? input.amountNpr : powerMatch.unitPriceNpr;
  const landedCostNpr =
    powerMatch.landedCostNpr > 0 && unitPriceNpr === powerMatch.unitPriceNpr
      ? powerMatch.landedCostNpr
      : Math.round(unitPriceNpr * 0.82);
  const fobPriceUsd =
    powerMatch.fobPriceUsd > 0 && unitPriceNpr === powerMatch.unitPriceNpr
      ? powerMatch.fobPriceUsd
      : Math.max(450, Math.round(landedCostNpr / 146));

  return {
    ...powerMatch,
    equipmentCode: input.code || powerMatch.equipmentCode,
    modelName: input.productModel || input.name || powerMatch.modelName,
    brand: input.brand || powerMatch.brand,
    chargerType: isAc ? "AC" : "DC",
    ratedPowerKw,
    connectorStandard: input.connectorStandard || powerMatch.connectorStandard,
    connectorCount: input.connectorCount || powerMatch.connectorCount || (isAc ? 1 : 2),
    unitPriceNpr,
    fobPriceUsd,
    landedCostNpr,
    importDate: powerMatch.importDate || input.date || "2026-02-12",
    customsClearanceDate: powerMatch.customsClearanceDate || "2026-02-17",
    originCountry: input.country || powerMatch.originCountry,
    originPort: input.originPort || powerMatch.originPort,
    shipmentRef: input.shipmentId || powerMatch.shipmentRef,
    warrantyExpiry: input.warrantyExpiry || powerMatch.warrantyExpiry,
    notes: input.description || powerMatch.notes,
  };
}

// API client functions
export async function getSiteSettings(): Promise<SiteSettings> {
  if (useMock) {
    if (!mockSiteSettingsCache) mockSiteSettingsCache = buildDefaultSiteSettings();
    return structuredClone(mockSiteSettingsCache);
  }
  try {
    const data = await rest<SiteSettings>("/content/settings/");
    return withCmsDefaults(data);
  } catch {
    return buildDefaultSiteSettings();
  }
}

export async function updateSiteSettings(patch: Partial<SiteSettings>): Promise<SiteSettings> {
  if (useMock) {
    const current = mockSiteSettingsCache ?? buildDefaultSiteSettings();
    mockSiteSettingsCache = withCmsDefaults({
      ...current,
      ...patch,
      stats: { ...current.stats, ...(patch.stats ?? {}) },
      updated_at: new Date().toISOString(),
    });
    return structuredClone(mockSiteSettingsCache);
  }
  const updated = await rest<SiteSettings>("/content/settings/", {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
  return withCmsDefaults(updated);
}

export async function getContentStats(): Promise<ContentStats> {
  return rest<ContentStats>("/content/stats/");
}

export async function getProductCategories(): Promise<ProductCategory[]> {
  return rest<ProductCategory[]>("/content/categories/");
}

export async function getProductCategory(slug: string): Promise<ProductCategory> {
  return rest<ProductCategory>(`/content/categories/${slug}/`);
}

export async function getBrandSuppliers(): Promise<BrandSupplier[]> {
  return rest<BrandSupplier[]>("/content/brands/");
}

export async function getProducts(params?: {
  category?: string;
  brand?: string;
  search?: string;
  status?: string;
  featured?: boolean;
}): Promise<ProductItem[]> {
  const query = new URLSearchParams();
  if (params?.category) query.set("category", params.category);
  if (params?.brand) query.set("brand", params.brand);
  if (params?.search) query.set("search", params.search);
  if (params?.status) query.set("status", params.status);
  if (params?.featured !== undefined) query.set("featured", String(params.featured));
  const qs = query.toString();
  return rest<ProductItem[]>(`/content/products/${qs ? `?${qs}` : ""}`);
}

export async function getProduct(slug: string): Promise<ProductItem> {
  return rest<ProductItem>(`/content/products/${slug}/`);
}

export async function getImportProcessSteps(): Promise<ImportProcessStep[]> {
  return rest<ImportProcessStep[]>("/content/process/");
}

export async function getTestimonials(): Promise<Testimonial[]> {
  return rest<Testimonial[]>("/content/testimonials/");
}

export async function getFaqs(category?: string): Promise<FAQItem[]> {
  const qs = category ? `?category=${encodeURIComponent(category)}` : "";
  return rest<FAQItem[]>(`/content/faqs/${qs}`);
}

export async function getCertifications(): Promise<CertificationItem[]> {
  return rest<CertificationItem[]>("/content/certifications/");
}

export async function getBlogPosts(): Promise<BlogPostItem[]> {
  return rest<BlogPostItem[]>("/content/blog/");
}

export async function getBlogPost(slug: string): Promise<BlogPostItem> {
  return rest<BlogPostItem>(`/content/blog/${slug}/`);
}

export async function getTeamMembers(): Promise<TeamMemberItem[]> {
  return rest<TeamMemberItem[]>("/content/team/");
}

export async function submitDealerInquiry(
  data: DealerInquiryInput,
): Promise<{ message: string; id: number }> {
  return rest<{ message: string; id: number }>("/content/inquiries/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
