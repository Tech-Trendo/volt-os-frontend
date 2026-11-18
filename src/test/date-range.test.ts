import { it, expect } from "vitest";
import { rangeFactor } from "@/lib/date-range";
it("custom date range includes both endpoints in demo period totals", () =>
  expect(rangeFactor("Custom range", "2026-11-01", "2026-11-15")).toBe(0.5));
it("reversed date range does not produce negative totals", () =>
  expect(rangeFactor("Custom range", "2026-11-15", "2026-11-01")).toBe(0));
