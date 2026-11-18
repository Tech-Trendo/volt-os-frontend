import type { BusinessRecord, ListFilters, PageResult } from "@/models/common";
import type { Station } from "@/models/stations";
import { getRecords, getStore } from "@/mock/store";
import { delay, rest, useMock } from "./config";
import { deriveStationStatus } from "@/lib/station-status";
import { recordTotals } from "@/lib/record-totals";

export interface CustomerCertification {
  id: number | string;
  name: string;
  issuer: string;
  standard_code: string;
  description: string;
  validity_years: number;
}

export interface PurchasedChargerItem {
  id: string;
  equipmentId: string;
  serialNumber: string;
  name: string;
  brand: string;
  type: "AC" | "DC" | string;
  powerKw: number;
  connectorStandard: string;
  connectorCount: number;
  status: string;
  purchaseDate: string | null;
  warrantyExpiry: string | null;
  stationId: string | null;
  stationName: string;
  stationCode: string;
  amountNpr: number;
  source: string;
}

export interface TimelineEventItem {
  id: string;
  type:
    | "lead"
    | "enquiry"
    | "quotation"
    | "purchase"
    | "installation"
    | "maintenance"
    | "document"
    | "activity";
  title: string;
  status: string;
  date: string;
  actor: string;
  category: string;
  location: string;
  description: string;
  code: string;
}

export interface Customer360Profile {
  customer: BusinessRecord;
  leadStatus: string;
  primaryLead: BusinessRecord | null;
  leads: BusinessRecord[];
  stations: Station[];
  purchasedChargers: PurchasedChargerItem[];
  maintenanceHistory: BusinessRecord[];
  quotations: BusinessRecord[];
  enquiries: BusinessRecord[];
  documents: BusinessRecord[];
  certifications: CustomerCertification[];
  activityTimeline: TimelineEventItem[];
}
function syncEquipment(record: BusinessRecord) {
  if (!record.stationId) return;
  const station = getStore().stations.find((s) => s.id === record.stationId);
  const charger = station?.chargers.find((c) => c.id === record.id);
  if (!station || !charger) return;
  charger.productModel = record.productModel ?? record.name;
  charger.serialNumber = record.serialNumber ?? charger.serialNumber;
  charger.brand = record.brand ?? charger.brand;
  if (["Operational", "Faulted", "Offline", "Under Maintenance"].includes(record.status))
    charger.status = record.status as typeof charger.status;
  station.status = deriveStationStatus(station.lifecycle, station.chargers);
}
export function filterRecords(records: BusinessRecord[], filters: ListFilters = {}) {
  let items = records.filter(
    (r) =>
      (!filters.search ||
        `${r.name} ${r.code} ${r.owner}`.toLowerCase().includes(filters.search.toLowerCase())) &&
      (!filters.status || r.status === filters.status) &&
      (!filters.source || (r.source ?? "").toLowerCase() === filters.source.toLowerCase()),
  );
  if (filters.sortBy) {
    const key = filters.sortBy as keyof BusinessRecord;
    items = [...items].sort(
      (a, b) =>
        String(a[key] ?? "").localeCompare(String(b[key] ?? ""), undefined, { numeric: true }) *
        (filters.sortDirection === "desc" ? -1 : 1),
    );
  }
  return items;
}
export async function listRecords(
  slug: string,
  filters: ListFilters = {},
): Promise<PageResult<BusinessRecord>> {
  if (!useMock)
    return rest(`/${slug}?${new URLSearchParams({ filters: JSON.stringify(filters) })}`);
  await delay();
  const rows = filterRecords(getRecords(slug), filters),
    page = filters.page ?? 1,
    pageSize = filters.pageSize ?? 10;
  return {
    items: rows.slice((page - 1) * pageSize, page * pageSize),
    total: rows.length,
    page,
    pageSize,
  };
}
export async function getRecord(slug: string, id: string) {
  if (!useMock) return rest<BusinessRecord>(`/${slug}/${id}`);
  await delay();
  const record = getRecords(slug).find((r) => r.id === id);
  if (!record) throw new Error("Record not found.");
  return record;
}
export async function saveRecord(slug: string, input: BusinessRecord) {
  const record = recordTotals(input);
  if (!useMock)
    return rest<BusinessRecord>(`/${slug}/${record.id}`, {
      method: "PUT",
      body: JSON.stringify(record),
    });
  await delay();
  const rows = getRecords(slug);
  const index = rows.findIndex((r) => r.id === record.id);
  if (index < 0) rows.unshift(record);
  else rows[index] = record;
  getStore().records.set(slug, rows);
  if (slug === "network/charging-equipment") syncEquipment(record);
  return record;
}
export async function deleteRecord(slug: string, id: string) {
  if (!useMock) return rest<void>(`/${slug}/${id}`, { method: "DELETE" });
  await delay();
  getStore().records.set(
    slug,
    getRecords(slug).filter((r) => r.id !== id),
  );
}
export async function convertRecordToSalesDoc(
  recordId: string,
  targetSlug: "sales/quotations" | "sales/sales-orders",
) {
  return rest<{ message: string; record: BusinessRecord; sourceRecord: BusinessRecord }>(
    "/records/convert/",
    {
      method: "POST",
      body: JSON.stringify({ recordId, targetSlug }),
    },
  );
}

export async function getCustomer360(customerKey: string): Promise<Customer360Profile> {
  if (!useMock) {
    return rest<Customer360Profile>(`/records/customer-360/${encodeURIComponent(customerKey)}`);
  }
  await delay();
  const customers = getRecords("sales/customers-and-accounts");
  const customer =
    customers.find(
      (c) =>
        c.id === customerKey ||
        c.code === customerKey ||
        c.name.toLowerCase() === customerKey.toLowerCase(),
    ) ?? customers[0];
  if (!customer) throw new Error("Customer record not found.");
  const stations = getStore().stations.filter(
    (s) => s.customerId === customer.id || s.owner.toLowerCase() === customer.name.toLowerCase(),
  );
  const purchasedChargers: PurchasedChargerItem[] = stations.flatMap((st) =>
    st.chargers.map((ch) => ({
      id: ch.id,
      equipmentId: ch.equipmentId,
      serialNumber: ch.serialNumber,
      name: ch.productModel,
      brand: ch.brand,
      type: ch.type,
      powerKw: ch.ratedPowerKw,
      connectorStandard: ch.connectorStandard,
      connectorCount: ch.connectorCount,
      status: ch.status,
      purchaseDate: ch.installationDate ?? st.installationDate ?? customer.date,
      warrantyExpiry: ch.warrantyExpiry ?? st.warrantyExpiry,
      stationId: st.id,
      stationName: st.name,
      stationCode: st.stationCode,
      amountNpr: Math.round(ch.ratedPowerKw * (ch.type === "AC" ? 12000 : 28500)),
      source: "Installed Station Hardware",
    })),
  );
  const leads = getRecords("sales/leads").filter(
    (l) =>
      l.customerId === customer.id || l.name.toLowerCase().includes(customer.name.toLowerCase()),
  );
  const quotations = getRecords("sales/quotations").filter(
    (q) =>
      q.customerId === customer.id || q.name.toLowerCase().includes(customer.name.toLowerCase()),
  );
  const maintenanceHistory = getRecords("service/service-requests").filter(
    (s) =>
      s.customerId === customer.id || s.name.toLowerCase().includes(customer.name.toLowerCase()),
  );
  const enquiries = getRecords("sales/enquiries").filter(
    (e) =>
      e.customerId === customer.id || e.name.toLowerCase().includes(customer.name.toLowerCase()),
  );
  return {
    customer,
    leadStatus: leads[0]?.status ?? (stations.length > 0 ? "Won" : "New"),
    primaryLead: leads[0] ?? null,
    leads,
    stations,
    purchasedChargers,
    maintenanceHistory,
    quotations,
    enquiries,
    documents: [],
    certifications: [],
    activityTimeline: [
      ...leads.map((l) => ({
        id: `tl-lead-${l.id}`,
        type: "lead" as const,
        title: `Lead Status: ${l.status} (${l.code})`,
        status: l.status,
        date: l.date,
        actor: l.owner,
        category: "CRM Lead",
        location: l.location ?? customer.location ?? "",
        description: l.description ?? "",
        code: l.code,
      })),
    ],
  };
}
