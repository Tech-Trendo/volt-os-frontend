import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { BusinessRecord } from "@/models/common";
import { calculateVat, npr } from "@/lib/formatting";
import { provinces } from "@/models/stations";
import { listRecords } from "@/services/records";
import { teamMembersQuery } from "@/queries/content";

type FieldKey = keyof BusinessRecord;

export function DomainSections({
  slug,
  draft,
  onChange,
  finance,
}: {
  slug: string;
  draft: BusinessRecord;
  onChange: (record: BusinessRecord) => void;
  finance: boolean;
}) {
  const { data: customerRecords } = useQuery({
    queryKey: ["domain-section-customers"],
    queryFn: () => listRecords("sales/customers-and-accounts", { pageSize: 50 }),
  });
  const customerList = useMemo(
    () => customerRecords?.items?.map((c) => ({ label: c.name, value: c.id })) ?? [],
    [customerRecords],
  );

  const { data: employeeRecords } = useQuery({
    queryKey: ["domain-section-employees"],
    queryFn: () => listRecords("administration/employees", { pageSize: 50 }),
  });
  const { data: teamMembers } = useQuery(teamMembersQuery);

  const ownerList = useMemo(() => {
    if (employeeRecords?.items && employeeRecords.items.length > 0) {
      return employeeRecords.items.map((e) => ({ label: e.name, value: e.id }));
    }
    if (teamMembers && teamMembers.length > 0) {
      return teamMembers.map((t) => ({ label: t.name, value: String(t.id) }));
    }
    return [];
  }, [employeeRecords, teamMembers]);

  const set = (key: FieldKey, value: string | number) => onChange({ ...draft, [key]: value });
  const text = (key: FieldKey, label: string, type = "text") => (
    <div key={key}>
      <Label htmlFor={`domain-${key}`} className="text-xs">
        {label}
      </Label>
      <Input
        id={`domain-${key}`}
        type={type}
        min={type === "number" ? 0 : undefined}
        className="mt-1.5"
        value={String(draft[key] ?? "")}
        onChange={(e) => set(key, type === "number" ? Number(e.target.value) : e.target.value)}
      />
    </div>
  );
  const select = (key: FieldKey, label: string, options: { value: string; label: string }[]) => (
    <div key={key}>
      <Label htmlFor={`domain-${key}`} className="text-xs">
        {label}
      </Label>
      <select
        id={`domain-${key}`}
        className="erp-select mt-1.5 w-full"
        value={String(draft[key] ?? "")}
        onChange={(e) => set(key, e.target.value)}
      >
        <option value="">Select {label.toLowerCase()}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
  const plain = (values: string[]) => values.map((value) => ({ value, label: value }));
  const customer = select(
    "customerId",
    "Customer",
    customerList.length > 0 ? customerList : [{ label: "Loading customers…", value: "" }],
  );
  const warehouse = select(
    "warehouseId",
    "Warehouse",
    ["Kathmandu Central", "Pokhara Regional", "Biratnagar Depot", "Birgunj Import Hub"].map(
      (label, i) => ({ label, value: `inventory-warehouses-${i + 1}` }),
    ),
  );
  const technician = select(
    "technicianId",
    "Assigned technician",
    ownerList.length > 0 ? ownerList : [{ label: "Loading staff…", value: "" }],
  );
  const station = text("stationId", "Station ID");
  const fields: React.ReactNode[] = [];
  if (slug === "sales/leads")
    fields.push(
      select(
        "source",
        "Lead source",
        plain(["Website", "Referral", "Dealer", "Trade Show", "Direct"]),
      ),
      text("nextFollowUp", "Next follow-up", "date"),
      ...(finance ? [text("expectedValueNpr", "Expected deal value (NPR)", "number")] : []),
    );
  if (["sales/enquiries", "sales/quotations", "sales/sales-orders"].includes(slug))
    fields.push(customer, warehouse, text("projectId", "Linked project ID"));
  if (slug === "sales/quotations")
    fields.push(
      text("revisionNumber", "Revision number", "number"),
      text("validityDate", "Valid until", "date"),
    );
  if (slug === "sales/sales-orders") fields.push(text("deliveryDate", "Delivery date", "date"));
  if (slug.startsWith("inventory"))
    fields.push(
      warehouse,
      text("sku", "SKU"),
      text("brand", "Brand"),
      text("productModel", "Product model"),
      text("reorderLevel", "Reorder threshold", "number"),
      text("reserved", "Reserved quantity", "number"),
      ...(finance ? [text("salePriceNpr", "Sale price (NPR)", "number")] : []),
    );
  if (slug === "inventory/warehouses")
    fields.splice(
      0,
      fields.length,
      text("location", "Warehouse address"),
      select(
        "managerId",
        "Warehouse manager",
        ownerList.length > 0 ? ownerList : [{ label: "Loading staff…", value: "" }],
      ),
    );
  if (slug === "procurement/suppliers")
    fields.push(
      select("country", "Country", plain(["China", "India", "Germany", "South Korea"])),
      select("currency", "Currency", plain(["USD", "CNY", "INR", "EUR"])),
    );
  if (slug === "procurement/purchase-orders")
    fields.push(
      text("supplierId", "Supplier ID"),
      select("currency", "Currency", plain(["USD", "CNY", "INR", "EUR"])),
      text("exchangeRate", "Exchange rate to NPR", "number"),
      text("eta", "Expected delivery", "date"),
    );
  if (slug === "procurement/import-shipments")
    fields.push(
      text("purchaseOrderId", "Purchase order ID"),
      text("carrier", "Carrier"),
      text("originPort", "Origin port"),
      text("destinationPort", "Destination port"),
      text("etd", "Departure date", "date"),
      text("eta", "Arrival ETA", "date"),
    );
  if (slug === "procurement/goods-receiving")
    fields.push(
      warehouse,
      text("shipmentId", "Shipment ID"),
      text("purchaseOrderId", "Purchase order ID"),
      text("receivedQuantity", "Received quantity", "number"),
      text("shortQuantity", "Short quantity", "number"),
      text("damagedQuantity", "Damaged quantity", "number"),
    );
  if (slug.startsWith("projects") || slug === "network/network-projects")
    fields.push(
      customer,
      station,
      technician,
      text("startDate", "Start date", "date"),
      text("deadline", "Project deadline", "date"),
      text("progress", "Progress (%)", "number"),
      ...(finance
        ? [
            text("budgetNpr", "Budget (NPR)", "number"),
            text("actualCostNpr", "Actual cost (NPR)", "number"),
          ]
        : []),
    );
  if (slug.startsWith("service"))
    fields.push(
      station,
      technician,
      select("priority", "Priority", plain(["Low", "Medium", "High", "Critical"])),
      text("dueDate", "Due date", "date"),
      ...(slug === "service/work-orders"
        ? [
            text("serviceRequestId", "Service request ID"),
            text("scheduledDate", "Scheduled date", "date"),
          ]
        : []),
    );
  if (slug.startsWith("network"))
    fields.push(
      station,
      text("serialNumber", "Equipment serial number"),
      text("brand", "Brand"),
      text("productModel", "Model"),
      text("scheduledDate", "Scheduled date", "date"),
    );
  if (slug.startsWith("administration")) fields.push(text("department", "Department"));
  const withItems = [
    "sales/enquiries",
    "sales/quotations",
    "sales/sales-orders",
    "procurement/purchase-orders",
  ].includes(slug);
  const items = draft.lineItems ?? [];
  const subtotal = items.reduce((n, i) => n + i.quantity * i.unitPriceNpr, 0);
  return (
    <>
      <div className="border-t pt-4">
        <h3 className="mb-3 text-sm font-semibold">
          {slug.startsWith("service")
            ? "Service assignment"
            : slug.startsWith("procurement")
              ? "Procurement details"
              : slug.startsWith("projects")
                ? "Project planning"
                : "Additional details"}
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">{fields}</div>
      </div>
      {withItems && (
        <div className="border-t pt-4">
          <h3 className="mb-3 text-sm font-semibold">Line items</h3>
          <div className="space-y-3">
            {items.map((item, i) => (
              <div
                key={i}
                className="grid grid-cols-[minmax(100px,1fr)_55px_100px_28px] items-end gap-2"
              >
                <div>
                  <Label className="text-[10px]">Product</Label>
                  <Input
                    aria-label={`Item ${i + 1} description`}
                    value={item.description}
                    onChange={(e) =>
                      onChange({
                        ...draft,
                        lineItems: items.map((r, j) =>
                          i === j ? { ...r, description: e.target.value } : r,
                        ),
                      })
                    }
                  />
                </div>
                <div>
                  <Label className="text-[10px]">Qty</Label>
                  <Input
                    aria-label={`Item ${i + 1} quantity`}
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) =>
                      onChange({
                        ...draft,
                        lineItems: items.map((r, j) =>
                          i === j ? { ...r, quantity: Number(e.target.value) } : r,
                        ),
                      })
                    }
                  />
                </div>
                {finance ? (
                  <div>
                    <Label className="text-[10px]">Price (NPR)</Label>
                    <Input
                      aria-label={`Item ${i + 1} price`}
                      type="number"
                      min={0}
                      value={item.unitPriceNpr}
                      onChange={(e) =>
                        onChange({
                          ...draft,
                          lineItems: items.map((r, j) =>
                            i === j ? { ...r, unitPriceNpr: Number(e.target.value) } : r,
                          ),
                        })
                      }
                    />
                  </div>
                ) : (
                  <div />
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  aria-label={`Remove item ${i + 1}`}
                  onClick={() => onChange({ ...draft, lineItems: items.filter((_, j) => i !== j) })}
                >
                  <Trash2 size={13} />
                </Button>
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() =>
              onChange({
                ...draft,
                lineItems: [
                  ...items,
                  {
                    productId: "inventory-products-and-equipment-1",
                    description: "Terra DC Fast Charger 60 kW",
                    quantity: 1,
                    unitPriceNpr: 85000,
                  },
                ],
              })
            }
          >
            <Plus />
            Add item
          </Button>
          {finance && (
            <div className="mt-4 space-y-2 rounded border bg-muted p-3 text-xs">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <strong>{npr(subtotal)}</strong>
              </div>
              <div className="flex justify-between">
                <span>VAT (13%)</span>
                <strong>{npr(calculateVat(subtotal))}</strong>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span>Total</span>
                <strong>{npr(subtotal + calculateVat(subtotal))}</strong>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
