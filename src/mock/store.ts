import { makeStations } from "./stations";
import { allModules, customers, owners } from "./reference";
import type { BusinessRecord } from "@/models/common";
import { roles } from "@/lib/permissions";
import { recordTotals } from "@/lib/record-totals";
const counts: Record<string, number> = {
  "sales/leads": 60,
  "sales/customers-and-accounts": 25,
  "sales/enquiries": 40,
  "sales/quotations": 35,
  "sales/sales-orders": 25,
  "inventory/products-and-equipment": 30,
  "inventory/stock-overview": 30,
  "inventory/warehouses": 4,
  "procurement/suppliers": 6,
  "procurement/purchase-orders": 15,
  "procurement/import-shipments": 8,
  "projects/projects": 12,
  "service/service-requests": 30,
  "service/work-orders": 15,
  "administration/users": 8,
};
const specialStatuses: Record<string, string[]> = {
  "sales/leads": ["New", "Contacted", "Qualified", "Proposal", "Negotiation", "Won", "Lost"],
  "sales/quotations": ["Awaiting Response", "Accepted", "Draft", "Expired"],
  "sales/sales-orders": ["Confirmed", "Processing", "Delivered", "Pending"],
  "inventory/stock-overview": ["In Stock", "Low Stock", "Out of Stock"],
  "procurement/import-shipments": [
    "In Transit",
    "Customs Clearance",
    "Draft",
    "Received",
    "Closed",
  ],
  "projects/projects": ["Planning", "Approved", "In Progress", "On Hold", "Completed", "Cancelled"],
  "service/service-requests": ["Open", "In Progress", "Resolved", "Overdue"],
  "service/work-orders": ["Scheduled", "In Progress", "Completed", "Pending"],
};
const products = [
  "Terra DC Fast Charger 60 kW (Dual CCS2/CHAdeMO)",
  "Autel MaxiCharger DC 120 kW (Dual Liquid-Cooled CCS2)",
  "Star Charge Titan DC 180 kW High-Power Charger",
  "Sinexcel 240 kW Ultra-Fast DC Charging Station",
  "Delta DC Wallbox 30 kW Commercial Unit",
  "Pulsar Plus AC Wallbox 22 kW (Type 2 Socket)",
  "Commercial Smart AC Charger 11 kW (RFID/OCPP 1.6J)",
  "Dual-Socket Commercial AC Pedestal 2x22 kW",
  "Residential & Hotel Smart Wallbox 7.4 kW",
  "Portable Commercial Recovery Charger 7.4 kW (Type 2 + CEE)",
  "Heavy-Duty Portable EV Charger 3.3 kW (Schuko/16A)",
  "Universal Multi-Plug Portable Charger 11 kW (3-Phase)",
  "CCS2 Charging Gun (250A DC Liquid-Cooled 5m)",
  "Type 2 to Type 2 Charging Cable 5m (32A 22kW)",
  "CHAdeMO DC Fast Charging Connector (125A)",
  "GB/T DC Fast Charging Gun (250A)",
  "Type 2 to GB/T Interoperability Adapter",
  "Stainless Steel Outdoor Dual Pedestal (IP55)",
  "Protective Anti-Collision Steel Bollard Set",
  "Heavy-Duty Retractable Cable Management Arm",
  "Weatherproof Canopy & LED Illuminated Header",
  "Dynamic Load Balancing (DLB) Hub Controller",
  "4G LTE / Ethernet Smart OCPP 1.6J/2.0.1 Gateway",
  "Digital Multi-Channel Energy Billing Sub-Meter",
  "30 kW High-Efficiency AC-DC Power Rectifier Module",
  "Main Control Board PCB with Linux Firmware",
  "High-Voltage DC Contactor (750V / 250A)",
  "Industrial High-CFM Dual Cooling Fan Assembly",
  "Emergency Stop Push-Button Switch & Shunt Trip",
  "Heavy-Duty Rubber Cable Protector Ramp (10-Ton)",
  "Pre-Cast Reinforced Concrete Station Foundation Base",
  "Type 2 Connector Holster & Cable Docking Station",
  "Type 1 + Type 2 Surge Protection Device (SPD 40kA)",
];
export function makeRecords(slug: string): BusinessRecord[] {
  if (slug === "network/charging-equipment")
    return makeStations().flatMap((station) =>
      station.chargers.map((c) => ({
        id: c.id,
        code: c.equipmentId,
        name: c.productModel,
        status: c.status,
        date: c.installationDate ?? "2026-03-15",
        owner: station.owner,
        amountNpr: c.type === "DC" ? 850000 : 95000,
        category: c.type,
        stationId: station.id,
        serialNumber: c.serialNumber,
        brand: c.brand,
        productModel: c.productModel,
        description: `${c.ratedPowerKw} kW · ${c.connectorStandard} · ${station.name}`,
      })),
    );
  const module = allModules.find((m) => m.slug === slug);
  const count = counts[slug] ?? 25;
  return Array.from({ length: count }, (_, i) => {
    const statuses = specialStatuses[slug] ??
      module?.statuses ?? ["Active", "Pending", "Completed"];
    let name = customers[i % 25] ?? "Himalayan Mobility Pvt. Ltd.";
    let category =
      ["Corporate", "Fleet Operator", "Hotel", "Dealer", "Individual"][i % 5] ?? "Corporate";
    if (slug.includes("inventory")) {
      name = products[i % products.length] ?? "DC Fast Charger";
      category =
        [
          "DC Fast Chargers",
          "AC Chargers & Wall Boxes",
          "Portable Chargers",
          "Charging Cables & Connectors",
          "Station Hardware & Enclosures",
          "Load Management & Smart Units",
          "Spare Parts",
          "Installation Accessories",
        ][i % 8] ?? "Charging Equipment";
    }
    if (slug.endsWith("warehouses")) {
      name =
        ["Kathmandu Central", "Pokhara Regional", "Biratnagar Depot", "Birgunj Import Hub"][i] ??
        "Warehouse";
      category = "Warehouse";
    }
    if (slug.endsWith("suppliers")) {
      name =
        [
          "Shenzhen Charge Systems",
          "Delta Mobility India",
          "Rhein Electric GmbH",
          "Seoul Power Co.",
          "Guangzhou EV Components",
          "Pune Connector Works",
        ][i] ?? "Supplier";
      category = ["China", "India", "Germany", "South Korea", "China", "India"][i] ?? "China";
    }
    if (slug.endsWith("projects")) {
      name = `${["Lakeside EV Hub", "Kathmandu Fleet Depot", "Birgunj Highway Station", "Pokhara Airport Charging", "Koshi Mobility Project", "Terai Corridor Expansion"][i % 6]} ${i > 5 ? "Phase II" : ""}`;
      category = "Installation";
    }
    if (slug.includes("service")) {
      name =
        [
          "DC charger power module fault",
          "Connector replacement",
          "Scheduled preventive maintenance",
          "Station connectivity issue",
          "AC charger inspection",
        ][i % 5] ?? "Inspection";
      category = "Maintenance";
    }
    if (slug.endsWith("users") || slug.endsWith("roles-and-permissions")) {
      name = slug.endsWith("users")
        ? (owners[i % 8] ?? "Aarav Shrestha")
        : (roles[i % 8] ?? "Report Viewer");
      category = roles[i % 8] ?? "Report Viewer";
    }
    const prefix = slug.includes("sales-orders")
      ? "SO"
      : slug.includes("quotations")
        ? "QT"
        : slug.includes("leads")
          ? "LD"
          : slug.includes("shipments")
            ? "IMP"
            : slug.includes("service")
              ? "SR"
              : slug.includes("projects")
                ? "PRJ"
                : slug.includes("inventory")
                  ? "INV"
                  : "VN";
    return {
      id: `${slug.replaceAll("/", "-")}-${i + 1}`,
      code: `${prefix}-2026-${String(i + 1).padStart(3, "0")}`,
      name,
      status: statuses[i % statuses.length] ?? "Draft",
      date: `2026-11-${String((i % 25) + 1).padStart(2, "0")}`,
      owner: owners[i % 8] ?? "Aarav Shrestha",
      amountNpr: 85000 + ((i * 137500) % 2450000),
      category,
      email: `contact${i + 1}@example.com`,
      phone: `+977-980000${String(i + 1).padStart(4, "0")}`,
      location: ["Kathmandu", "Pokhara", "Biratnagar", "Birgunj"][i % 4] ?? "Kathmandu",
      description: `${name} — Volt OS EV Operations`,
      customerId: `sales-customers-and-accounts-${(i % 25) + 1}`,
      warehouseId: `inventory-warehouses-${(i % 4) + 1}`,
      ...(i % 3 === 0 ? { projectId: `projects-projects-${(i % 12) + 1}` } : {}),
      stationId: `station-${(i % 48) + 1}`,
      priority: ["High", "Medium", "Low", "Critical"][i % 4] ?? "Medium",
      revisionNumber: (i % 3) + 1,
      validityDate: "2026-12-15",
      quantity: i % 11 === 0 ? 0 : i % 7 === 0 ? 2 : 15 + i,
      reorderLevel: 5,
      currency: ["USD", "INR", "EUR", "CNY"][i % 4] ?? "USD",
      eta: `2026-11-${String(17 + (i % 10)).padStart(2, "0")}`,
      budgetNpr: 2500000 + i * 250000,
      actualCostNpr: 1850000 + i * 145000,
      receivedQuantity: 20 - (i % 3),
      shortQuantity: i % 3,
      damagedQuantity: i % 4 === 0 ? 1 : 0,
      role: roles[i % 8] ?? "Report Viewer",
      source: ["Website", "Referral", "Dealer"][i % 3] ?? "Website",
      expectedValueNpr: 85000 + i * 137500,
      nextFollowUp: "2026-11-20",
      sku: `VN-${String(i + 1).padStart(4, "0")}`,
      brand: ["ABB", "Delta", "Autel", "Wallbox"][i % 4] ?? "ABB",
      productModel: name,
      unit: "pcs",
      reserved: i % 4,
      salePriceNpr: 105000 + i * 145000,
      managerId: `administration-users-${(i % 8) + 1}`,
      country: category,
      exchangeRate: slug.endsWith("suppliers") ? 0 : 135,
      supplierId: `procurement-suppliers-${(i % 6) + 1}`,
      purchaseOrderId: `procurement-purchase-orders-${(i % 15) + 1}`,
      shipmentId: `procurement-import-shipments-${(i % 8) + 1}`,
      carrier: "Himalayan Freight",
      originPort: "Shenzhen",
      destinationPort: "Birgunj",
      etd: "2026-11-01",
      startDate: "2026-10-01",
      deadline: `2026-11-${String(20 + (i % 10)).padStart(2, "0")}`,
      progress: [15, 40, 65, 20, 100, 0][i % 6] ?? 0,
      technicianId: `administration-users-${(i % 8) + 1}`,
      dueDate: "2026-11-22",
      serviceRequestId: `service-service-requests-${(i % 30) + 1}`,
      scheduledDate: "2026-11-20",
      department: ["Management", "Sales", "Inventory", "Service"][i % 4] ?? "Management",
      action: ["Created", "Updated", "Approved"][i % 3] ?? "Created",
      entityType: slug.split("/")[0] ?? "Record",
      entityId: `record-${i + 1}`,
      timestamp: "2026-11-15T08:30:00Z",
      ...([
        "sales/enquiries",
        "sales/quotations",
        "sales/sales-orders",
        "procurement/purchase-orders",
      ].includes(slug)
        ? {
            lineItems: [
              {
                productId: `inventory-products-and-equipment-${(i % 30) + 1}`,
                description: products[i % products.length] ?? "DC Charger",
                quantity: 1 + (i % 3),
                unitPriceNpr: 85000 + ((i * 137500) % 2450000),
              },
            ],
          }
        : {}),
    };
  }).map(recordTotals);
}
export function createStore() {
  return { stations: makeStations(), records: new Map<string, BusinessRecord[]>() };
}
let browserStore: ReturnType<typeof createStore> | undefined;
export function getStore() {
  if (typeof window === "undefined") return createStore();
  browserStore ??= createStore();
  return browserStore;
}
export function getRecords(slug: string) {
  const store = getStore();
  if (!store.records.has(slug)) store.records.set(slug, makeRecords(slug));
  return store.records.get(slug) ?? [];
}
