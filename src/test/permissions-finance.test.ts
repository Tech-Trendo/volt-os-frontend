import { describe, it, expect } from "vitest";
import { calculateVat } from "@/lib/formatting";
import { financeAccess, canEdit, canView, roles, saveDemoPermissions } from "@/lib/permissions";
describe("Finance rules", () => {
  it("charges 13% VAT on NPR 100000", () => expect(calculateVat(100000)).toBe(13000));
  it("rounds VAT to two decimal places", () => expect(calculateVat(123.45)).toBe(16.05));
  it("limits financial access to administrator, management and accountant", () =>
    expect(roles.filter(financeAccess)).toEqual([
      "Super Administrator",
      "Management",
      "Accountant",
    ]));
});
describe("Demo access rules", () => {
  it("Report Viewer cannot edit any module", () =>
    expect(
      ["sales", "inventory", "network", "service", "administration"].map((d) =>
        canEdit("Report Viewer", d),
      ),
    ).toEqual([false, false, false, false, false]));
  it("Sales Manager edits sales but cannot edit inventory", () => {
    expect(canEdit("Sales Manager", "sales")).toBe(true);
    expect(canEdit("Sales Manager", "inventory")).toBe(false);
  });
  it("Service Manager views the network and edits service", () => {
    expect(canView("Service Manager", "network")).toBe(true);
    expect(canEdit("Service Manager", "service")).toBe(true);
  });
  it("saved demo overrides affect module permissions", () => {
    saveDemoPermissions("Inventory Manager", {
      finance: false,
      modules: { sales: { view: true, edit: true } },
    });
    expect(canView("Inventory Manager", "sales")).toBe(true);
    expect(canEdit("Inventory Manager", "sales")).toBe(true);
    saveDemoPermissions("Inventory Manager", { finance: false, modules: {} });
  });
});
