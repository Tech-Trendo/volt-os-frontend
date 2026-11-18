import type { BusinessRecord } from "@/models/common";
import { calculateVat } from "./formatting";
export function recordTotals(record: BusinessRecord): BusinessRecord {
  if (!record.lineItems?.length) return record;
  const subtotal = record.lineItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPriceNpr,
    0,
  );
  return {
    ...record,
    amountNpr: subtotal,
    subtotalNpr: subtotal,
    vatNpr: calculateVat(subtotal),
    totalNpr: subtotal + calculateVat(subtotal),
  };
}
