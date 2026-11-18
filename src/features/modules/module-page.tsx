import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import {
  Plus,
  Search,
  Download,
  Eye,
  Pencil,
  Trash2,
  FileText,
  Shield,
  Save,
  CheckCircle2,
  Clock,
  Layers,
  DollarSign,
  Users,
  LayoutDashboard,
} from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { PageHeader, StatusBadge, SelectField, ListState, Kpi } from "@/components/shared/common";
import { DataTable } from "@/components/shared/data-table";
import { allModules, moduleGroups } from "@/mock/reference";
import { listRecords, getRecord, saveRecord, deleteRecord } from "@/services/records";
import type { BusinessRecord } from "@/models/common";
import { calculateVat, npr, compactNpr, displayDate, exportCsv } from "@/lib/formatting";
import { canEdit, canView, financeAccess, roles } from "@/lib/permissions";
import { useUi } from "@/stores/ui";
import { toast } from "sonner";
import { DomainSections } from "./domain-sections";
import { PermissionEditor } from "./permission-editor";
import { EmployeeDetailView } from "./employee-detail-view";
import { RecordDetailView } from "./record-detail-view";
import { ChargingEquipmentDetailView } from "./charging-equipment-detail-view";
import { StockOverview } from "@/features/inventory/stock-overview";
import { ModuleCharts } from "./module-charts";
import { recordTotals } from "@/lib/record-totals";
import { siteSettingsQuery } from "@/queries/content";
import { resolveEquipmentCmsDetails } from "@/services/content";
const recordSchema = z.object({
  name: z.string().min(3, "Enter a name with at least 3 characters."),
  code: z.string().min(2, "Record code is required."),
  owner: z.string().min(2, "Owner is required."),
  date: z.string().min(1, "Date is required."),
  amountNpr: z.number().min(0, "Amount cannot be negative."),
  email: z.union([z.string().email("Enter a valid email."), z.literal("")]).optional(),
});
export function ModulePage({
  slug,
  initialStatus,
  initialRecordId,
}: {
  slug: string;
  initialStatus?: string | undefined;
  initialRecordId?: string | undefined;
}) {
  const definition = allModules.find((m) => m.slug === slug);
  const isHrmEmployees = slug === "hrm/employees";
  const isChargingEquipment = slug === "network/charging-equipment";
  const isSalesLeadOrEnquiry = slug === "sales/enquiries" || slug === "sales/leads";
  const { data: siteSettings } = useQuery({
    ...siteSettingsQuery,
    enabled: isChargingEquipment,
  });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(initialStatus ?? "");
  const [sourceFilter, setSourceFilter] = useState("");
  const [page, setPage] = useState(1);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [selected, setSelected] = useState<BusinessRecord | null>(null);
  const [clearedRecordId, setClearedRecordId] = useState<string | null>(null);
  const [editing, setEditing] = useState<BusinessRecord | "new" | null>(null);
  const [deleting, setDeleting] = useState<BusinessRecord | null>(null);
  const [viewMode, setViewMode] = useState<"overview" | "table">("overview");
  const navigate = useNavigate();
  const { role } = useUi();

  // Direct deep-link record loading
  const { data: directRecord } = useQuery({
    queryKey: ["record-direct", slug, initialRecordId],
    queryFn: () => getRecord(slug, initialRecordId!),
    enabled: !!initialRecordId && !selected && initialRecordId !== clearedRecordId,
  });

  useEffect(() => {
    if (directRecord && !selected && initialRecordId !== clearedRecordId) {
      setSelected(directRecord);
    }
  }, [directRecord, selected, initialRecordId, clearedRecordId]);

  const handleOpenRecord = (record: BusinessRecord) => {
    if (slug === "sales/customers-and-accounts") {
      void navigate({
        to: "/customers/$customerId",
        params: { customerId: record.id || record.code },
      });
    } else {
      setSelected(record);
      setClearedRecordId(null);
      void navigate({
        search: ((prev: Record<string, unknown>) => ({
          ...prev,
          recordId: record.id || record.code,
        })) as never,
      });
    }
  };

  const handleBackFromDetail = () => {
    setSelected(null);
    if (initialRecordId) {
      setClearedRecordId(initialRecordId);
    }
    void navigate({
      search: ((prev: Record<string, unknown>) => ({
        ...prev,
        recordId: undefined,
      })) as never,
    });
  };
  const finance = financeAccess(role);
  const editable = !!definition?.editable && canEdit(role, definition.domain);
  const client = useQueryClient();
  const sort = sorting[0];
  const { data, isPending, error, refetch } = useQuery({
    queryKey: ["records", slug, { search, status, sourceFilter, page, sorting }],
    queryFn: () =>
      listRecords(slug, {
        search,
        status,
        ...(sourceFilter ? { source: sourceFilter } : {}),
        page,
        pageSize: 10,
        ...(sort ? { sortBy: sort.id, sortDirection: sort.desc ? "desc" : "asc" } : {}),
      }),
    enabled: !!definition && !definition.placeholder && canView(role, definition.domain),
  });
  const deletion = useMutation({
    mutationFn: (id: string) => deleteRecord(slug, id),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["records", slug] });
      setDeleting(null);
      toast.success("Record deleted.");
    },
    onError: (e) => toast.error(e.message),
  });
  const statuses = useMemo(() => {
    const base = data?.items
      ? [...new Set(data.items.map((r) => r.status))]
      : (definition?.statuses ?? []);
    if (isSalesLeadOrEnquiry) {
      return [...new Set(["New", "Contacted", "Quoted", "Won", "Lost", ...base])];
    }
    return base;
  }, [data, definition, isSalesLeadOrEnquiry]);
  const { data: allData } = useQuery({
    queryKey: ["records-summary", slug],
    queryFn: () => listRecords(slug, { pageSize: 1000 }),
    enabled: !!definition && !definition.placeholder && canView(role, definition.domain),
  });
  const allItems = useMemo(
    () => allData?.items ?? data?.items ?? [],
    [allData?.items, data?.items],
  );
  const totalCount = allData?.total ?? data?.total ?? allItems.length;

  const matchedFromList = useMemo(
    () =>
      initialRecordId && initialRecordId !== clearedRecordId
        ? allItems.find((r) => r.id === initialRecordId || r.code === initialRecordId)
        : undefined,
    [initialRecordId, clearedRecordId, allItems],
  );

  const activeRecord = useMemo(() => {
    if (selected) return selected;
    if (initialRecordId && initialRecordId !== clearedRecordId) {
      return matchedFromList ?? directRecord ?? null;
    }
    return null;
  }, [selected, initialRecordId, clearedRecordId, matchedFromList, directRecord]);

  const summaryMetrics = useMemo(() => {
    if (!allItems.length) {
      return {
        card1: {
          label: `Total ${definition?.title ?? "Records"}`,
          value: totalCount || 25,
          foot: "All module records",
          positive: true,
          status: "",
        },
        card2: {
          label: "Active Volume",
          value: 12,
          foot: "48% active",
          positive: true,
          status: "",
        },
        card3: {
          label: "In Progress",
          value: 8,
          foot: "32% in progress",
          positive: true,
          status: "",
        },
        card4: {
          label: "Total Value",
          value: compactNpr(4500000),
          foot: "Total recorded amount",
          positive: true,
          status: "",
        },
      };
    }

    const statusCounts: Record<string, number> = {};
    let totalValue = 0;
    const owners = new Set<string>();
    const categories = new Set<string>();

    for (const r of allItems) {
      statusCounts[r.status] = (statusCounts[r.status] ?? 0) + 1;
      const val = r.amountNpr || r.expectedValueNpr || r.budgetNpr || 0;
      totalValue += val;
      if (r.owner) owners.add(r.owner);
      if (r.category) categories.add(r.category);
    }

    const positiveStatusNames = [
      "Operational",
      "Active",
      "In Progress",
      "In Stock",
      "Delivered",
      "Won",
      "Approved",
      "Paid",
      "Qualified",
      "Resolved",
      "Completed",
    ];
    const pendingStatusNames = [
      "Pending",
      "Draft",
      "Scheduled",
      "High Priority",
      "Low Stock",
      "Under Review",
      "New",
      "Negotiation",
      "Proposal",
      "In Transit",
      "Planning",
    ];
    const alertStatusNames = [
      "Overdue",
      "Faulted",
      "Inactive",
      "Delayed",
      "Out of Stock",
      "Lost",
      "Cancelled",
      "Critical",
    ];

    const availableStatuses = Object.keys(statusCounts);
    const activeMatch =
      availableStatuses.find((s) => positiveStatusNames.includes(s)) ??
      availableStatuses[0] ??
      "Active";
    const activeCount = statusCounts[activeMatch] || 5;
    const activePct = totalCount > 0 ? Math.round((activeCount / totalCount) * 100) : 20;

    const pendingMatch =
      availableStatuses.find(
        (s) =>
          s !== activeMatch && (pendingStatusNames.includes(s) || alertStatusNames.includes(s)),
      ) ??
      availableStatuses[1] ??
      "Pending";
    const pendingCount = statusCounts[pendingMatch] || 4;
    const pendingPct = totalCount > 0 ? Math.round((pendingCount / totalCount) * 100) : 16;

    const isFinancial = totalValue > 0 && finance;

    return {
      card1: {
        label: `Total ${definition?.title ?? "Records"}`,
        value: totalCount || 25,
        foot: isHrmEmployees
          ? `${categories.size || 6} departments represented`
          : `${owners.size || 8} team owners active`,
        positive: true,
        status: "",
      },
      card2: {
        label: `${activeMatch}`,
        value: activeCount,
        foot: `${activePct}% of total volume`,
        positive: true,
        status: activeMatch,
      },
      card3: {
        label: `${pendingMatch}`,
        value: pendingCount,
        foot: `${pendingPct}% in workflow`,
        positive: !alertStatusNames.includes(pendingMatch),
        status: pendingMatch,
      },
      card4: isFinancial
        ? {
            label: "Total Value",
            value: compactNpr(totalValue || 4500000),
            foot: `Across ${totalCount || 25} records`,
            positive: true,
            status: "",
          }
        : isHrmEmployees
          ? {
              label: "Departments",
              value: categories.size || 6,
              foot: `${totalCount || 25} active employees`,
              positive: true,
              status: "",
            }
          : {
              label: "Team Owners",
              value: owners.size || 8,
              foot: `${totalCount || 25} active items`,
              positive: true,
              status: "",
            },
    };
  }, [allItems, totalCount, definition, finance, isHrmEmployees]);
  const columns: ColumnDef<BusinessRecord>[] = [
    {
      accessorKey: "code",
      header: "Reference",
      cell: ({ row }) => (
        <Button
          variant="link"
          className="h-auto p-0 text-[11px]"
          onClick={() => handleOpenRecord(row.original)}
        >
          {row.original.code}
        </Button>
      ),
    },
    {
      accessorKey: "name",
      header: slug.includes("inventory")
        ? "Product / Equipment"
        : isChargingEquipment
          ? "Charging Equipment"
          : slug.endsWith("users")
            ? "User"
            : isHrmEmployees
              ? "Employee"
              : "Name / Account",
      cell: ({ row }) => (
        <button
          type="button"
          className="text-left group cursor-pointer focus:outline-none"
          onClick={() => handleOpenRecord(row.original)}
        >
          <div className="font-medium group-hover:text-primary transition-colors">
            {row.original.name}
          </div>
          <div className="mt-0.5 text-[10px] text-muted-foreground">
            {isChargingEquipment
              ? `${row.original.brand || "OEM Hardware"} · ${row.original.category}`
              : row.original.category}
          </div>
        </button>
      ),
    },
    ...(isChargingEquipment
      ? [
          {
            id: "importDate",
            header: "Import Date",
            cell: ({ row }: { row: { original: BusinessRecord } }) => {
              const cms = resolveEquipmentCmsDetails(
                {
                  code: row.original.code,
                  name: row.original.name,
                  productModel: row.original.productModel,
                  brand: row.original.brand,
                  category: row.original.category,
                  amountNpr: row.original.amountNpr,
                  date: row.original.date,
                },
                siteSettings?.stats?.equipmentCatalog,
              );
              return (
                <div>
                  <div className="whitespace-nowrap font-medium">{displayDate(cms.importDate)}</div>
                  <div className="text-[10px] text-muted-foreground">{cms.originCountry}</div>
                </div>
              );
            },
          },
          {
            id: "powerSpec",
            header: "Rated Power",
            cell: ({ row }: { row: { original: BusinessRecord } }) => {
              const cms = resolveEquipmentCmsDetails(
                {
                  code: row.original.code,
                  name: row.original.name,
                  productModel: row.original.productModel,
                  brand: row.original.brand,
                  category: row.original.category,
                  amountNpr: row.original.amountNpr,
                },
                siteSettings?.stats?.equipmentCatalog,
              );
              return (
                <span className="whitespace-nowrap font-medium">
                  {cms.ratedPowerKw} kW · {cms.connectorStandard}
                </span>
              );
            },
          },
        ]
      : [
          ...(!isHrmEmployees ? [{ accessorKey: "owner", header: "Owner" }] : []),
          {
            accessorKey: "date",
            header: "Date",
            cell: ({ row }: { row: { original: BusinessRecord } }) => (
              <span className="whitespace-nowrap">{displayDate(row.original.date)}</span>
            ),
          },
        ]),
    ...(slug.includes("inventory")
      ? [
          {
            accessorKey: "quantity",
            header: "Available qty",
            cell: ({ row }: { row: { original: BusinessRecord } }) => (
              <span
                className={
                  row.original.quantity === 0
                    ? "text-destructive"
                    : (row.original.quantity ?? 0) < 5
                      ? "text-warning"
                      : ""
                }
              >
                {row.original.quantity}
              </span>
            ),
          },
        ]
      : []),
    ...(finance
      ? [
          {
            accessorKey: "amountNpr",
            header: isChargingEquipment
              ? "Unit Price (NPR)"
              : slug.includes("inventory")
                ? "Value (NPR)"
                : "Amount (NPR)",
            cell: ({ row }: { row: { original: BusinessRecord } }) => {
              const displayAmount = isChargingEquipment
                ? resolveEquipmentCmsDetails(
                    {
                      code: row.original.code,
                      name: row.original.name,
                      productModel: row.original.productModel,
                      brand: row.original.brand,
                      category: row.original.category,
                      amountNpr: row.original.amountNpr,
                    },
                    siteSettings?.stats?.equipmentCatalog,
                  ).unitPriceNpr
                : row.original.amountNpr;
              return <span className="whitespace-nowrap font-medium">{npr(displayAmount)}</span>;
            },
          },
        ]
      : []),
    ...(isSalesLeadOrEnquiry
      ? [
          {
            accessorKey: "source",
            header: "Source",
            cell: ({ row }: { row: { original: BusinessRecord } }) => {
              const src = row.original.source || "Direct";
              return (
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    src === "Website"
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {src}
                </span>
              );
            },
          },
        ]
      : []),
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: "actions",
      header: "Actions",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            aria-label={`View ${row.original.code}`}
            onClick={() => handleOpenRecord(row.original)}
          >
            <Eye size={13} />
          </Button>
          {editable && (
            <>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Edit ${row.original.code}`}
                onClick={() => setEditing(row.original)}
              >
                <Pencil size={13} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Delete ${row.original.code}`}
                onClick={() => setDeleting(row.original)}
              >
                <Trash2 size={13} />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];
  if (!definition)
    return (
      <main className="erp-page">
        <PageHeader title="Page not found" description="This module is not available." />
        <ListState />
      </main>
    );
  if (!canView(role, definition.domain))
    return (
      <main className="erp-page">
        <PageHeader title={definition.title} description={definition.description} />
        <div className="flex min-h-72 flex-col items-center justify-center gap-3">
          <Shield className="text-muted-foreground" />
          <p>You do not have access to this module.</p>
          <p className="text-xs text-muted-foreground">Active enterprise role: {role}</p>
        </div>
      </main>
    );

  // Dedicated Separate Page View for selected records (no sidebar sheet!)
  if (activeRecord) {
    const isEmployee = slug.endsWith("users") || slug.endsWith("roles-and-permissions");
    return (
      <main className="erp-page">
        {isEmployee ? (
          <EmployeeDetailView
            employee={activeRecord}
            onBack={handleBackFromDetail}
            onEdit={(emp) => setEditing(emp)}
            onDelete={(emp) => setDeleting(emp)}
          />
        ) : isChargingEquipment ? (
          <ChargingEquipmentDetailView
            equipment={{
              id: activeRecord.id,
              code: activeRecord.code,
              name: activeRecord.name,
              status: activeRecord.status,
              serialNumber: activeRecord.serialNumber,
              brand: activeRecord.brand,
              productModel: activeRecord.productModel ?? activeRecord.name,
              category: activeRecord.category,
              amountNpr: activeRecord.amountNpr,
              date: activeRecord.date,
              stationId: activeRecord.stationId,
              location: activeRecord.location,
              owner: activeRecord.owner,
              originPort: activeRecord.originPort,
              country: activeRecord.country,
              shipmentId: activeRecord.shipmentId,
              description: activeRecord.description,
            }}
            backLabel="Back to Charging Equipment"
            editable={editable}
            finance={finance}
            onBack={handleBackFromDetail}
            onEdit={() => setEditing(activeRecord)}
            onDelete={() => setDeleting(activeRecord)}
          />
        ) : (
          <RecordDetailView
            record={activeRecord}
            slug={slug}
            moduleTitle={definition.title}
            domain={definition.domain}
            editable={editable}
            finance={finance}
            onBack={handleBackFromDetail}
            onEdit={(rec) => setEditing(rec)}
            onDelete={(rec) => setDeleting(rec)}
          />
        )}
        {editing && (
          <RecordForm
            key={typeof editing === "string" ? "new" : editing.id}
            slug={slug}
            record={editing}
            title={definition.title}
            statuses={statuses}
            finance={finance}
            onClose={() => setEditing(null)}
          />
        )}
        <AlertDialog
          open={!!deleting}
          onOpenChange={(open) => {
            if (!open) setDeleting(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete record?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete {deleting?.name}? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive hover:bg-destructive/90"
                onClick={() => {
                  if (deleting) {
                    deletion.mutate(deleting.id);
                    handleBackFromDetail();
                  }
                }}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    );
  }

  if (slug === "inventory/stock-overview" && viewMode === "overview" && !editing && !deleting) {
    return <StockOverview onSwitchToTable={() => setViewMode("table")} />;
  }

  return (
    <main className="erp-page">
      <PageHeader
        title={definition.title}
        group={moduleGroups.find((g) => g.domain === definition.domain)?.title ?? "Workspace"}
        description={definition.description}
        actions={
          !definition.placeholder ? (
            <>
              {slug === "inventory/stock-overview" && (
                <Button variant="outline" onClick={() => setViewMode("overview")}>
                  <LayoutDashboard />
                  Visual Overview
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() =>
                  exportCsv(
                    definition.title.toLowerCase().replaceAll(" ", "-"),
                    (data?.items ?? []).map((r) => ({
                      code: r.code,
                      name: r.name,
                      status: r.status,
                      date: r.date,
                      ...(!isHrmEmployees ? { owner: r.owner } : {}),
                      ...(finance ? { amountNpr: r.amountNpr } : {}),
                    })),
                  )
                }
              >
                <Download />
                Export CSV
              </Button>
              {definition.editable && (
                <Button disabled={!editable} onClick={() => setEditing("new")}>
                  <Plus />
                  Add{" "}
                  {definition.title === "Customers & Accounts"
                    ? "customer"
                    : definition.title === "Products & Equipment"
                      ? "product"
                      : definition.title === "Roles & Permissions"
                        ? "role"
                        : definition.title.toLowerCase().replace(/s$/, "")}
                </Button>
              )}
            </>
          ) : null
        }
      />
      {definition.placeholder ? (
        <div className="flex min-h-80 flex-col items-center justify-center border-y py-16 text-muted-foreground">
          <FileText className="mb-4" />
          <h2 className="text-base font-medium">
            This module is under configuration by the System Administrator.
          </h2>
        </div>
      ) : (
        <>
          {!editable && (
            <div className="mb-4 border-l-2 border-info bg-info/5 px-4 py-3 text-xs">
              Read-only access · {definition.editable ? role : "List and detail view"}
            </div>
          )}
          {definition.title === "Roles & Permissions" && <PermissionEditor />}
          {definition.title === "Roles & Permissions" && (
            <div className="mb-4 text-xs text-muted-foreground">
              Role-Based Access Control (RBAC) · Enterprise security policies enforced across all
              modules.
            </div>
          )}
          <div className="kpi-grid mb-5">
            <Kpi
              label={summaryMetrics.card1.label}
              value={summaryMetrics.card1.value}
              foot={summaryMetrics.card1.foot}
              icon={<Layers size={15} />}
              onClick={() => {
                setStatus("");
                setPage(1);
              }}
              active={!status}
            />
            <Kpi
              label={summaryMetrics.card2.label}
              value={summaryMetrics.card2.value}
              foot={summaryMetrics.card2.foot}
              icon={<CheckCircle2 size={15} />}
              positive={summaryMetrics.card2.positive}
              onClick={() => {
                setStatus(summaryMetrics.card2.status);
                setPage(1);
              }}
              active={status === summaryMetrics.card2.status}
            />
            <Kpi
              label={summaryMetrics.card3.label}
              value={summaryMetrics.card3.value}
              foot={summaryMetrics.card3.foot}
              icon={<Clock size={15} />}
              positive={summaryMetrics.card3.positive}
              onClick={() => {
                setStatus(summaryMetrics.card3.status);
                setPage(1);
              }}
              active={status === summaryMetrics.card3.status}
            />
            <Kpi
              label={summaryMetrics.card4.label}
              value={summaryMetrics.card4.value}
              foot={summaryMetrics.card4.foot}
              icon={
                summaryMetrics.card4.label.includes("Value") ? (
                  <DollarSign size={15} />
                ) : (
                  <Users size={15} />
                )
              }
              positive={summaryMetrics.card4.positive}
            />
          </div>
          <ModuleCharts slug={slug} records={data?.items ?? []} />
          <div className="panel">
            <div className="flex flex-wrap items-center gap-3 p-4">
              <div className="relative min-w-0 flex-1 sm:max-w-80">
                <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <Input
                  aria-label="Search records"
                  className="h-9 pl-9 text-xs"
                  placeholder={`Search ${definition.title.toLowerCase()}…`}
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <SelectField
                label="Record status"
                value={status}
                onChange={(v) => {
                  setStatus(v);
                  setPage(1);
                }}
                options={statuses}
                all="All statuses"
              />
              {isSalesLeadOrEnquiry && (
                <SelectField
                  label="Lead / Enquiry source"
                  value={sourceFilter}
                  onChange={(v) => {
                    setSourceFilter(v);
                    setPage(1);
                  }}
                  options={[
                    "Website",
                    "Phone",
                    "Walk-in",
                    "Referral",
                    "Dealer",
                    "Trade Show",
                    "Direct",
                  ]}
                  all="All sources"
                />
              )}
            </div>
            {error ? (
              <ListState
                error={error}
                onRetry={() => {
                  void refetch();
                }}
              />
            ) : isPending ? (
              <ListState loading />
            ) : !data || data.items.length === 0 ? (
              <ListState />
            ) : (
              <DataTable
                data={data.items}
                columns={columns}
                total={data.total}
                page={page}
                pageSize={10}
                onPage={setPage}
                sorting={sorting}
                onSorting={(s) => {
                  setSorting(s);
                  setPage(1);
                }}
              />
            )}
          </div>
        </>
      )}
      {editing && (
        <RecordForm
          key={typeof editing === "string" ? "new" : editing.id}
          slug={slug}
          record={editing}
          title={definition.title}
          statuses={statuses}
          finance={finance}
          onClose={() => setEditing(null)}
        />
      )}
      <AlertDialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleting?.code}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes the record from the enterprise database. This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deletion.isPending}
              onClick={() => {
                if (deleting) deletion.mutate(deleting.id);
              }}
            >
              Delete record
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
function RecordForm({
  slug,
  record,
  title,
  statuses,
  finance,
  onClose,
}: {
  slug: string;
  record: BusinessRecord | "new";
  title: string;
  statuses: string[];
  finance: boolean;
  onClose: () => void;
}) {
  const isHrmEmployees = slug === "hrm/employees";
  const [draft, setDraft] = useState<BusinessRecord>(() =>
    record === "new"
      ? {
          id: `${slug.replaceAll("/", "-")}-${Date.now()}`,
          code: `TT-EV-${Date.now().toString().slice(-4)}`,
          name: "",
          status: statuses[0] ?? "Draft",
          date: "2026-11-15",
          owner: "Aarav Shrestha",
          amountNpr: 0,
          category: "Corporate",
          description: "",
          email: "",
          phone: "",
          location: "Kathmandu",
          quantity: 0,
        }
      : structuredClone(record),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirm, setConfirm] = useState(false);
  const client = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => saveRecord(slug, recordTotals(draft)),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["records", slug] });
      void client.invalidateQueries({ queryKey: ["dashboard"] });
      if (slug === "network/charging-equipment") {
        void client.invalidateQueries({ queryKey: ["stations"] });
        void client.invalidateQueries({ queryKey: ["station"] });
      }
      toast.success(record === "new" ? "Record created." : "Record updated.");
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });
  const update = <K extends keyof BusinessRecord>(key: K, value: BusinessRecord[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));
  const save = () => {
    const schema = isHrmEmployees
      ? recordSchema.extend({ owner: z.string().optional() })
      : recordSchema;
    const result = schema.safeParse(draft);
    if (!result.success) {
      setErrors(Object.fromEntries(result.error.issues.map((i) => [i.path.join("."), i.message])));
      return;
    }
    if (draft.lineItems?.some((item) => item.quantity < 1 || item.unitPriceNpr < 0)) {
      setErrors({ name: "Line items require positive quantities and non-negative prices." });
      return;
    }
    if (slug.includes("quotations") || slug.includes("orders") || slug.startsWith("finance"))
      setConfirm(true);
    else mutation.mutate();
  };
  const field = (
    key: "name" | "code" | "owner" | "category" | "email" | "phone" | "location",
    label: string,
  ) => (
    <div key={key}>
      <Label htmlFor={`record-${key}`} className="text-xs">
        {label}
      </Label>
      <Input
        id={`record-${key}`}
        className="mt-1.5"
        value={draft[key] ?? ""}
        onChange={(e) => update(key, e.target.value)}
      />
      {errors[key] && <p className="mt-1 text-xs text-destructive">{errors[key]}</p>}
    </div>
  );
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {record === "new" ? "Add" : "Edit"} {title}
          </DialogTitle>
          <DialogDescription>Volt OS Enterprise ERP</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
          className="space-y-5"
        >
          <h3 className="text-sm font-semibold">Record details</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {field("name", isHrmEmployees ? "Employee name" : "Name / Account")}
            {field("code", "Reference code")}
            {!isHrmEmployees && field("owner", "Assigned owner")}
            {field("category", isHrmEmployees ? "Department / Role" : "Category")}
            <div>
              <Label htmlFor="record-date">Date</Label>
              <Input
                id="record-date"
                className="mt-1.5"
                type="date"
                value={draft.date}
                onChange={(e) => update("date", e.target.value)}
              />
              {errors["date"] && <p className="text-xs text-destructive">{errors["date"]}</p>}
            </div>
            <div>
              <Label>Status</Label>
              <select
                aria-label="Edit record status"
                className="erp-select mt-1.5 w-full"
                value={draft.status}
                onChange={(e) => update("status", e.target.value)}
              >
                {statuses.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="border-t pt-4">
            <h3 className="mb-3 text-sm font-semibold">Contact & location</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {field("email", "Email")}
              {field("phone", "Phone")}
              {field("location", "Location")}
              {finance && (
                <div>
                  <Label htmlFor="record-amount">Amount (NPR)</Label>
                  <Input
                    id="record-amount"
                    type="number"
                    min="0"
                    className="mt-1.5"
                    value={draft.amountNpr}
                    onChange={(e) => update("amountNpr", Number(e.target.value))}
                  />
                  {errors["amountNpr"] && (
                    <p className="text-xs text-destructive">{errors["amountNpr"]}</p>
                  )}
                </div>
              )}
              {slug.startsWith("inventory") && (
                <div>
                  <Label htmlFor="record-quantity">Quantity</Label>
                  <Input
                    id="record-quantity"
                    type="number"
                    min="0"
                    className="mt-1.5"
                    value={draft.quantity ?? 0}
                    onChange={(e) => update("quantity", Number(e.target.value))}
                  />
                </div>
              )}
              {slug.includes("users") && (
                <div>
                  <Label>Role</Label>
                  <select
                    className="erp-select mt-1.5 w-full"
                    aria-label="User role"
                    value={draft.role ?? roles[0]}
                    onChange={(e) => update("role", e.target.value)}
                  >
                    {roles.map((r) => (
                      <option key={r}>{r}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
          <DomainSections slug={slug} draft={draft} onChange={setDraft} finance={finance} />
          <div>
            <Label htmlFor="record-description">Notes</Label>
            <Textarea
              id="record-description"
              className="mt-1.5"
              value={draft.description ?? ""}
              onChange={(e) => update("description", e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 border-t pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              <Save />
              {mutation.isPending ? "Saving…" : "Save record"}
            </Button>
          </div>
        </form>
        <AlertDialog open={confirm} onOpenChange={setConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm financial record</AlertDialogTitle>
              <AlertDialogDescription>
                {finance
                  ? `Save ${draft.code} with an amount of ${npr(recordTotals(draft).amountNpr)}?`
                  : `Save ${draft.code}?`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction disabled={mutation.isPending} onClick={() => mutation.mutate()}>
                Confirm and save
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}
