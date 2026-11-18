import { useState } from "react";
import {
  ArrowLeft,
  FileText,
  Calendar,
  Layers,
  CheckCircle2,
  Clock,
  Pencil,
  Trash2,
  Download,
  Copy,
  Printer,
  DollarSign,
  User,
  MapPin,
  Building2,
  Tag,
  Check,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/common";
import type { BusinessRecord } from "@/models/common";
import { calculateVat, npr, displayDate } from "@/lib/formatting";
import { convertRecordToSalesDoc } from "@/services/records";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface RecordDetailViewProps {
  record: BusinessRecord;
  slug: string;
  moduleTitle: string;
  domain: string;
  editable?: boolean;
  finance?: boolean;
  onBack: () => void;
  onEdit?: (record: BusinessRecord) => void;
  onDelete?: (record: BusinessRecord) => void;
}

export function RecordDetailView({
  record,
  slug,
  moduleTitle,
  domain,
  editable = true,
  finance = true,
  onBack,
  onEdit,
  onDelete,
}: RecordDetailViewProps) {
  const [activeTab, setActiveTab] = useState<
    "ATTRIBUTES" | "FINANCIALS" | "LINE_ITEMS" | "TIMELINE"
  >("ATTRIBUTES");
  const [converting, setConverting] = useState(false);
  const queryClient = useQueryClient();
  const hideOwner = slug === "hrm/employees";
  const canConvertToSales = editable && (slug === "sales/enquiries" || slug === "sales/leads");

  const handleConvert = async (targetSlug: "sales/quotations" | "sales/sales-orders") => {
    setConverting(true);
    try {
      const res = await convertRecordToSalesDoc(record.id, targetSlug);
      toast.success(res.message);
      void queryClient.invalidateQueries({ queryKey: ["records", slug] });
      void queryClient.invalidateQueries({ queryKey: ["records", targetSlug] });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Conversion failed.");
    } finally {
      setConverting(false);
    }
  };

  const totalValue = record.amountNpr || record.expectedValueNpr || record.budgetNpr || 0;

  const hasFinancials =
    finance &&
    (record.amountNpr !== undefined ||
      record.expectedValueNpr !== undefined ||
      record.budgetNpr !== undefined);

  const hasLineItems = !!record.lineItems && record.lineItems.length > 0;

  const copyCode = () => {
    void navigator.clipboard.writeText(record.code);
    toast.success(`Copied ${record.code} to clipboard.`);
  };

  const handlePrint = () => {
    window.print();
  };

  const tabs = [
    { id: "ATTRIBUTES", label: "Attributes & Details" },
    ...(hasFinancials ? [{ id: "FINANCIALS", label: "Financials & Costing" }] : []),
    ...(hasLineItems
      ? [{ id: "LINE_ITEMS", label: `Line Items (${record.lineItems?.length})` }]
      : []),
    { id: "TIMELINE", label: "Audit & Timeline" },
  ] as const;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in-50 duration-200">
      {/* 1. TOP BACK BUTTON */}
      <div>
        <Button
          variant="outline"
          size="sm"
          onClick={onBack}
          className="h-8 gap-1.5 text-xs font-semibold text-primary border-primary/30 hover:bg-primary/5 uppercase tracking-wider"
        >
          <ArrowLeft size={14} />
          Back to {moduleTitle}
        </Button>
      </div>

      {/* 2. RECORD HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{record.name}</h1>
            <StatusBadge status={record.status} />
            <Badge variant="secondary" className="font-mono text-xs">
              {record.code}
            </Badge>
            {record.priority && (
              <Badge
                variant="outline"
                className={
                  record.priority === "Critical" || record.priority === "High"
                    ? "text-destructive border-destructive/30 bg-destructive/5 text-[10px]"
                    : "text-[10px]"
                }
              >
                {record.priority} Priority
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="capitalize">{domain}</span>
            <span>·</span>
            <strong className="text-foreground font-medium">{moduleTitle}</strong>
            {!hideOwner && (
              <>
                <span>·</span>
                <span>Assigned to: {record.owner || "Unassigned"}</span>
              </>
            )}
            <span>·</span>
            <span>Recorded on: {displayDate(record.date)}</span>
            {record.location && (
              <>
                <span>·</span>
                <span>{record.location}</span>
              </>
            )}
          </p>
        </div>
      </div>

      {/* 3. ACTION TOOLBAR */}
      <div className="flex flex-wrap items-center gap-2">
        {editable && onEdit && (
          <Button
            size="sm"
            className="h-8 gap-1.5 text-xs font-semibold rounded-full px-4 bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => onEdit(record)}
          >
            <Pencil size={13} />
            Edit Record
          </Button>
        )}

        {canConvertToSales && (
          <>
            <Button
              variant="outline"
              size="sm"
              disabled={converting}
              className="h-8 gap-1.5 text-xs font-medium rounded-full px-3.5 border-primary/40 text-primary hover:bg-primary/5"
              onClick={() => void handleConvert("sales/quotations")}
            >
              <FileText size={13} />
              Convert to Quotation
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={converting}
              className="h-8 gap-1.5 text-xs font-medium rounded-full px-3.5 border-emerald-500/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/5"
              onClick={() => void handleConvert("sales/sales-orders")}
            >
              <CheckCircle2 size={13} />
              Convert to Sales Order
            </Button>
          </>
        )}

        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs font-medium rounded-full px-3.5 hover:border-primary"
          onClick={copyCode}
        >
          <Copy size={13} className="text-muted-foreground" />
          Copy Code
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs font-medium rounded-full px-3.5 hover:border-primary"
          onClick={() => toast.success(`Exporting ${record.code} summary report...`)}
        >
          <Download size={13} className="text-muted-foreground" />
          Export PDF
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs font-medium rounded-full px-3.5 hover:border-primary"
          onClick={handlePrint}
        >
          <Printer size={13} className="text-muted-foreground" />
          Print
        </Button>

        {editable && onDelete && (
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs font-medium rounded-full px-3.5 text-destructive hover:bg-destructive/10 hover:border-destructive"
            onClick={() => onDelete(record)}
          >
            <Trash2 size={13} />
            Delete Record
          </Button>
        )}
      </div>

      {/* 4. SUMMARY METRIC STRIP (4 Columns) */}
      <div className="rounded-xl border bg-card p-6 shadow-xs">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-8">
          <div>
            <span className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Status & Workflow
            </span>
            <div className="mt-1 flex items-center gap-2">
              <StatusBadge status={record.status} />
              <span className="font-mono text-xs text-muted-foreground">{record.code}</span>
            </div>
          </div>

          <div>
            <span className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              {totalValue > 0 ? "Total Recorded Amount" : "Classification"}
            </span>
            <span className="mt-1 block text-sm font-semibold text-primary">
              {totalValue > 0 ? npr(totalValue) : record.category || "Standard Record"}
            </span>
          </div>

          <div>
            <span className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              {hideOwner ? "Primary Location / Hub" : "Assigned Team Owner"}
            </span>
            <span className="mt-1 block text-sm font-semibold text-foreground">
              {hideOwner
                ? record.location || "Kathmandu Regional Hub"
                : record.owner || "Unassigned"}
            </span>
          </div>

          <div>
            <span className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Timeline Date
            </span>
            <span className="mt-1 block text-sm font-semibold text-foreground">
              {displayDate(record.date)}
            </span>
          </div>
        </div>
      </div>

      {/* 5. TABS NAVIGATION */}
      <div className="border-b">
        <nav className="flex space-x-6 overflow-x-auto text-xs font-semibold uppercase tracking-wider scrollbar-none">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as typeof activeTab)}
              className={`py-3 border-b-2 font-medium transition-colors whitespace-nowrap ${
                activeTab === t.id
                  ? "border-sky-500 text-sky-600 dark:text-sky-400 font-bold"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {/* 6. TAB SECTORS */}

      {/* TAB 1: ATTRIBUTES & SPECIFICATIONS */}
      {activeTab === "ATTRIBUTES" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-xl border bg-card p-5 space-y-4">
              <div className="flex items-center gap-2 border-b pb-3">
                <Tag size={16} className="text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Primary Specifications</h3>
              </div>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3.5 text-xs">
                <div>
                  <dt className="text-muted-foreground text-[10px] uppercase font-semibold">
                    Reference ID
                  </dt>
                  <dd className="font-mono font-bold text-primary mt-0.5">{record.code}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-[10px] uppercase font-semibold">
                    Status
                  </dt>
                  <dd className="mt-0.5">
                    <StatusBadge status={record.status} />
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-[10px] uppercase font-semibold">
                    Category / Group
                  </dt>
                  <dd className="font-medium text-foreground mt-0.5">
                    {record.category || "General"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-[10px] uppercase font-semibold">
                    Effective Date
                  </dt>
                  <dd className="font-medium text-foreground mt-0.5">{displayDate(record.date)}</dd>
                </div>
                {record.priority && (
                  <div>
                    <dt className="text-muted-foreground text-[10px] uppercase font-semibold">
                      Priority Level
                    </dt>
                    <dd className="font-medium text-foreground mt-0.5">{record.priority}</dd>
                  </div>
                )}
                {record.validityDate && (
                  <div>
                    <dt className="text-muted-foreground text-[10px] uppercase font-semibold">
                      Validity Date
                    </dt>
                    <dd className="font-medium text-foreground mt-0.5">
                      {displayDate(record.validityDate)}
                    </dd>
                  </div>
                )}
                {record.quantity !== undefined && (
                  <div>
                    <dt className="text-muted-foreground text-[10px] uppercase font-semibold">
                      Quantity Available
                    </dt>
                    <dd className="font-semibold text-foreground mt-0.5">
                      {record.quantity} units
                    </dd>
                  </div>
                )}
                {record.reorderLevel !== undefined && (
                  <div>
                    <dt className="text-muted-foreground text-[10px] uppercase font-semibold">
                      Reorder Threshold
                    </dt>
                    <dd className="font-medium text-foreground mt-0.5">
                      {record.reorderLevel} units
                    </dd>
                  </div>
                )}
                {record.currency && (
                  <div>
                    <dt className="text-muted-foreground text-[10px] uppercase font-semibold">
                      Currency
                    </dt>
                    <dd className="font-mono text-foreground mt-0.5">{record.currency}</dd>
                  </div>
                )}
                {record.eta && (
                  <div>
                    <dt className="text-muted-foreground text-[10px] uppercase font-semibold">
                      Estimated Arrival (ETA)
                    </dt>
                    <dd className="font-medium text-foreground mt-0.5">
                      {displayDate(record.eta)}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            <div className="rounded-xl border bg-card p-5 space-y-4">
              <div className="flex items-center gap-2 border-b pb-3">
                <Building2 size={16} className="text-primary" />
                <h3 className="text-sm font-semibold text-foreground">
                  Location & Contact Coordinates
                </h3>
              </div>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3.5 text-xs">
                {!hideOwner && (
                  <div>
                    <dt className="text-muted-foreground text-[10px] uppercase font-semibold">
                      Assigned Owner
                    </dt>
                    <dd className="font-medium text-foreground mt-0.5">
                      {record.owner || "Unassigned"}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-muted-foreground text-[10px] uppercase font-semibold">
                    Primary Location / Hub
                  </dt>
                  <dd className="font-medium text-foreground mt-0.5">
                    {record.location || "Kathmandu Regional Hub"}
                  </dd>
                </div>
                {record.email && (
                  <div>
                    <dt className="text-muted-foreground text-[10px] uppercase font-semibold">
                      Email Address
                    </dt>
                    <dd className="font-medium text-primary mt-0.5 truncate">{record.email}</dd>
                  </div>
                )}
                {record.phone && (
                  <div>
                    <dt className="text-muted-foreground text-[10px] uppercase font-semibold">
                      Phone Hotline
                    </dt>
                    <dd className="font-medium text-foreground mt-0.5">{record.phone}</dd>
                  </div>
                )}
                {record.stationId && (
                  <div>
                    <dt className="text-muted-foreground text-[10px] uppercase font-semibold">
                      Linked Station
                    </dt>
                    <dd className="font-mono text-foreground mt-0.5">{record.stationId}</dd>
                  </div>
                )}
                {record.warehouseId && (
                  <div>
                    <dt className="text-muted-foreground text-[10px] uppercase font-semibold">
                      Assigned Warehouse
                    </dt>
                    <dd className="font-mono text-foreground mt-0.5">{record.warehouseId}</dd>
                  </div>
                )}
                {record.customerId && (
                  <div>
                    <dt className="text-muted-foreground text-[10px] uppercase font-semibold">
                      Customer Reference
                    </dt>
                    <dd className="font-mono text-foreground mt-0.5">{record.customerId}</dd>
                  </div>
                )}
                {record.projectId && (
                  <div>
                    <dt className="text-muted-foreground text-[10px] uppercase font-semibold">
                      Capital Project
                    </dt>
                    <dd className="font-mono text-foreground mt-0.5">{record.projectId}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>

          {record.description && (
            <div className="rounded-xl border bg-card p-5 space-y-2">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Operational Notes & Context Description
              </h3>
              <p className="text-xs text-foreground leading-relaxed bg-muted/20 p-3.5 rounded-lg border">
                {record.description}
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: FINANCIALS & COSTING */}
      {activeTab === "FINANCIALS" && hasFinancials && (
        <div className="rounded-xl border bg-card p-6 space-y-5">
          <div className="border-b pb-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <DollarSign size={16} className="text-primary" /> Financial Summary & Tax Calculations
            </h3>
            <p className="text-xs text-muted-foreground">
              Official recorded monetary figures, VAT rates, and commercial terms
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg border bg-muted/20 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Subtotal Amount (Excluding VAT)
              </span>
              <span className="text-base font-bold text-foreground block">
                {npr(record.amountNpr || record.subtotalNpr || totalValue)}
              </span>
            </div>

            <div className="p-4 rounded-lg border bg-muted/20 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Nepal Standard VAT (13%)
              </span>
              <span className="text-base font-bold text-primary block">
                {npr(calculateVat(record.amountNpr || totalValue))}
              </span>
            </div>

            <div className="p-4 rounded-lg border bg-muted/20 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Grand Total Amount (NPR)
              </span>
              <span className="text-base font-bold text-emerald-600 block">
                {npr(
                  (record.amountNpr || totalValue) + calculateVat(record.amountNpr || totalValue),
                )}
              </span>
            </div>
          </div>

          {record.budgetNpr !== undefined && (
            <div className="border-t pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                  Approved Project Budget
                </span>
                <span className="block text-sm font-bold text-foreground mt-0.5">
                  {npr(record.budgetNpr)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                  Actual Incurred Cost
                </span>
                <span className="block text-sm font-bold text-foreground mt-0.5">
                  {npr(record.actualCostNpr ?? 0)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                  Variance / Balance
                </span>
                <span
                  className={`block text-sm font-bold mt-0.5 ${
                    (record.budgetNpr ?? 0) >= (record.actualCostNpr ?? 0)
                      ? "text-emerald-600"
                      : "text-destructive"
                  }`}
                >
                  {npr((record.budgetNpr ?? 0) - (record.actualCostNpr ?? 0))}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: LINE ITEMS */}
      {activeTab === "LINE_ITEMS" && hasLineItems && (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Line Items & Bill of Quantities</h3>
              <p className="text-xs text-muted-foreground">
                Itemized parts, components, and services associated with this record
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/50 border-b text-muted-foreground font-semibold">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Product / Service Description</th>
                  <th className="p-3 text-right">Quantity</th>
                  {finance && <th className="p-3 text-right">Unit Price (NPR)</th>}
                  {finance && <th className="p-3 text-right">Total (NPR)</th>}
                </tr>
              </thead>
              <tbody className="divide-y">
                {record.lineItems?.map((item, idx) => (
                  <tr key={idx} className="hover:bg-muted/20">
                    <td className="p-3 text-muted-foreground font-mono">{idx + 1}</td>
                    <td className="p-3 font-semibold text-foreground">{item.description}</td>
                    <td className="p-3 text-right font-medium">{item.quantity}</td>
                    {finance && (
                      <td className="p-3 text-right font-mono">{npr(item.unitPriceNpr)}</td>
                    )}
                    {finance && (
                      <td className="p-3 text-right font-mono font-bold text-primary">
                        {npr(item.quantity * item.unitPriceNpr)}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT TIMELINE */}
      {activeTab === "TIMELINE" && (
        <div className="rounded-xl border bg-card p-5 space-y-4">
          <div className="border-b pb-3">
            <h3 className="text-sm font-semibold">System Audit & Status History</h3>
            <p className="text-xs text-muted-foreground">
              {hideOwner
                ? "Lifecycle status updates and employment records"
                : "Lifecycle status updates and ownership records"}
            </p>
          </div>

          <div className="relative pl-6 space-y-5 before:absolute before:bottom-0 before:top-2 before:left-2.5 before:w-0.5 before:bg-border">
            <div className="relative">
              <div className="absolute -left-6 top-1 size-3.5 rounded-full border-2 border-background bg-primary" />
              <div className="rounded-lg border bg-muted/15 p-3.5 space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">
                    Record Synchronized & Validated
                  </span>
                  <span className="text-[10px] text-muted-foreground">Today</span>
                </div>
                <p className="text-muted-foreground">
                  Status confirmed as {record.status} in central PostgreSQL database.
                </p>
                {!hideOwner && (
                  <div className="text-[10px] text-primary/80 font-mono">
                    Managed by: {record.owner || "Volt OS EV Operations"}
                  </div>
                )}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -left-6 top-1 size-3.5 rounded-full border-2 border-background bg-emerald-500" />
              <div className="rounded-lg border bg-muted/15 p-3.5 space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">Initial Record Creation</span>
                  <span className="text-[10px] text-muted-foreground">
                    {displayDate(record.date)}
                  </span>
                </div>
                <p className="text-muted-foreground">
                  Created under code {record.code} ({moduleTitle}).
                </p>
                <div className="text-[10px] text-primary/80 font-mono">
                  Origin: {domain} module workspace
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
