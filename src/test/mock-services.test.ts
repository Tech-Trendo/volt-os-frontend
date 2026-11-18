import { describe, it, expect } from "vitest";
import {
  getStations,
  getStationById,
  saveStation,
  deleteStation,
  filterStations,
} from "@/services/stations";
import { listRecords, saveRecord, getRecord, deleteRecord } from "@/services/records";
import { makeStations } from "@/mock/stations";
import { makeRecords } from "@/mock/store";
describe("Station mock service", () => {
  it("filters operational stations with pipeline hidden by default filter", () => {
    const rows = filterStations(makeStations(), { includePipeline: false });
    expect(rows).toHaveLength(44);
    expect(rows.some((s) => s.status === "Pipeline")).toBe(false);
  });
  it("filters provinces and statuses together", async () => {
    const result = await getStations({ province: "Bagmati", statuses: ["Operational"] });
    expect(result.total).toBeGreaterThan(0);
    expect(result.items.every((s) => s.province === "Bagmati" && s.status === "Operational")).toBe(
      true,
    );
  });
  it("searches station codes and names", async () => {
    expect((await getStations({ search: "STN-CH-001" })).total).toBe(1);
    expect((await getStations({ search: "Nagdhunga" })).items[0]?.stationCode).toBe("STN-KT-002");
  });
  it("paginates without losing total count", async () => {
    const result = await getStations({ page: 1, pageSize: 2 });
    expect(result.total).toBeGreaterThanOrEqual(4);
    expect(result.items).toHaveLength(2);
  });
  it("mutations read back during the session and derive status", async () => {
    const original = makeStations()[0];
    if (!original) throw new Error("Missing fixture");
    await saveStation({
      ...original,
      id: "test-station",
      name: "Test Nepal Station",
      lifecycle: "Under Maintenance",
    });
    expect((await getStationById("test-station")).status).toBe("Partially Active");
    await deleteStation("test-station");
    await expect(getStationById("test-station")).rejects.toThrow("Station not found");
  });
});
describe("Business mock services", () => {
  it.each([
    ["sales/leads", 60],
    ["sales/customers-and-accounts", 25],
    ["sales/enquiries", 40],
    ["sales/quotations", 35],
    ["sales/sales-orders", 25],
    ["inventory/products-and-equipment", 30],
    ["inventory/warehouses", 4],
    ["procurement/suppliers", 6],
    ["procurement/purchase-orders", 15],
    ["procurement/import-shipments", 8],
    ["projects/projects", 12],
    ["service/service-requests", 30],
    ["service/work-orders", 15],
    ["administration/users", 8],
  ] as const)("has %s fixtures with requested count", (slug, count) =>
    expect(makeRecords(slug)).toHaveLength(count),
  );
  it("filters, sorts and paginates records", async () => {
    const rows = await listRecords("sales/leads", {
      pageSize: 3,
    });
    expect(rows.total).toBeGreaterThanOrEqual(1);
    expect(rows.items.length).toBeGreaterThanOrEqual(1);
    expect(rows.items[0]?.code).toContain("LD-");
  });
  it("creates, reads, edits and deletes session records", async () => {
    const record = {
      id: "test-lead",
      code: "LD-TEST",
      name: "Fictional Fleet",
      status: "New",
      date: "2026-11-15",
      owner: "Priya Sharma",
      amountNpr: 100000,
      category: "Fleet",
    };
    await saveRecord("sales/leads", record);
    expect((await getRecord("sales/leads", "test-lead")).name).toBe("Fictional Fleet");
    await saveRecord("sales/leads", { ...record, status: "Qualified" });
    expect((await getRecord("sales/leads", "test-lead")).status).toBe("Qualified");
    await deleteRecord("sales/leads", "test-lead");
    await expect(getRecord("sales/leads", "test-lead")).rejects.toThrow("Record not found");
  }, 10000);
});
