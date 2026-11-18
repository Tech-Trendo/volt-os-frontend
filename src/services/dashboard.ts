import { getRecords, getStore } from "@/mock/store";
import { stationCounts } from "@/lib/station-status";
import { delay, rest, useMock } from "./config";
import { rangeFactor } from "@/lib/date-range";
function makeKpis(range: string, warehouse: string, start?: string, end?: string) {
  const factor = rangeFactor(range, start, end);
  const warehouseFactor = warehouse === "All warehouses" ? 1 : 0.36;
  return {
    sales: 18450000 * factor * warehouseFactor,
    receivables: 4250000 * warehouseFactor,
    customers: getRecords("sales/customers-and-accounts").length,
    leads: getRecords("sales/leads").filter((r) => !["Won", "Lost"].includes(r.status)).length,
    quotations: getRecords("sales/quotations").filter((r) => r.status === "Awaiting Response")
      .length,
    orders: getRecords("sales/sales-orders").filter((r) => r.status === "Confirmed").length,
    network: stationCounts(getStore().stations),
    projects: getRecords("projects/projects").filter((r) => r.status === "In Progress").length,
    deadlines: 3,
    inventory: 32600000 * warehouseFactor,
    lowStock: getRecords("inventory/stock-overview").filter((r) => r.status === "Low Stock").length,
    purchaseOrders: getRecords("procurement/purchase-orders").length,
    shipments: getRecords("procurement/import-shipments").length,
    service: getRecords("service/service-requests").filter((r) => r.status === "Open").length,
    maintenance: 4,
  };
}
export async function getDashboardKpis(
  range = "This month",
  warehouse = "All warehouses",
  start?: string,
  end?: string,
): Promise<ReturnType<typeof makeKpis>> {
  if (!useMock)
    return rest(
      `/dashboard?${new URLSearchParams({ range, warehouse, start: start ?? "", end: end ?? "" })}`,
    );
  await delay();
  return makeKpis(range, warehouse, start, end);
}
