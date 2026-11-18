import { it, expect } from "vitest";
import { recordTotals } from "@/lib/record-totals";
it("derives subtotal, 13% VAT and total from quantities and prices", () => {
  const result = recordTotals({
    id: "q1",
    code: "Q1",
    name: "Fleet quotation",
    status: "Draft",
    date: "2026-11-15",
    owner: "Priya",
    category: "Fleet",
    amountNpr: 0,
    lineItems: [
      { productId: "p1", description: "DC charger", quantity: 2, unitPriceNpr: 100000 },
      { productId: "p2", description: "Cable", quantity: 3, unitPriceNpr: 1000 },
    ],
  });
  expect(result.subtotalNpr).toBe(203000);
  expect(result.vatNpr).toBe(26390);
  expect(result.totalNpr).toBe(229390);
});
