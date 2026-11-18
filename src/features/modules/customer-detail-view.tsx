import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Phone,
  Mail,
  Plus,
  FileText,
  Wrench,
  Trash2,
  MapPin,
  Download,
  Zap,
  FileCheck,
  Search,
  Inbox,
  ExternalLink,
  Printer,
  CheckCircle2,
  TrendingUp,
  ArrowRightCircle,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Kpi, PageHeader, Panel, StatusBadge } from "@/components/shared/common";
import type { BusinessRecord } from "@/models/common";
import { npr, displayDate } from "@/lib/formatting";
import { toast } from "sonner";
import { productsQuery } from "@/queries/content";
import {
  convertRecordToSalesDoc,
  deleteRecord,
  getCustomer360,
  saveRecord,
  type Customer360Profile,
} from "@/services/records";

interface CustomerDetailViewProps {
  customer: BusinessRecord;
  profile?: Customer360Profile;
  onBack: () => void;
  onDelete?: (customer: BusinessRecord) => void;
}

const LEAD_STAGES = [
  "New",
  "Contacted",
  "Qualified",
  "Proposal Sent",
  "Negotiation",
  "Won",
  "Lost",
] as const;

const QUOTE_STATUSES = [
  "Draft",
  "Sent",
  "Awaiting Response",
  "Accepted",
  "Revision Requested",
  "Converted",
  "Rejected",
] as const;

export function CustomerDetailView({
  customer: initialCustomer,
  profile: initialProfile,
  onBack,
  onDelete,
}: CustomerDetailViewProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: liveProfile } = useQuery({
    queryKey: ["customer-360", initialCustomer.id],
    queryFn: () => getCustomer360(initialCustomer.id),
    ...(initialProfile ? { initialData: initialProfile } : {}),
  });

  const profile = liveProfile ?? initialProfile;
  const customer = profile?.customer ?? initialCustomer;
  const stations = useMemo(() => profile?.stations ?? [], [profile?.stations]);
  const purchasedChargers = useMemo(
    () => profile?.purchasedChargers ?? [],
    [profile?.purchasedChargers],
  );
  const maintenanceHistory = useMemo(
    () => profile?.maintenanceHistory ?? [],
    [profile?.maintenanceHistory],
  );
  const quotations = useMemo(() => profile?.quotations ?? [], [profile?.quotations]);
  const customerDocs = useMemo(() => profile?.documents ?? [], [profile?.documents]);
  const certifications = useMemo(() => profile?.certifications ?? [], [profile?.certifications]);
  const primaryLead = profile?.primaryLead ?? null;
  const leadStatus = profile?.leadStatus ?? "New";
  const activityTimeline = useMemo(
    () => profile?.activityTimeline ?? [],
    [profile?.activityTimeline],
  );

  const { data: catalogProducts = [] } = useQuery(productsQuery());

  // Modals state
  const [logActivityOpen, setLogActivityOpen] = useState(false);
  const [createQuotationOpen, setCreateQuotationOpen] = useState(false);
  const [recordSaleOpen, setRecordSaleOpen] = useState(false);
  const [bookServiceOpen, setBookServiceOpen] = useState(false);
  const [uploadDocOpen, setUploadDocOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [previewQuote, setPreviewQuote] = useState<BusinessRecord | null>(null);

  // Form states
  const [activityType, setActivityType] = useState("Technical Consultation");
  const [activityNotes, setActivityNotes] = useState("");

  const [quoteModel, setQuoteModel] = useState("Terra 124 Dual DC Fast Charger 120 kW");
  const [quoteQty, setQuoteQty] = useState(1);
  const [quoteUnitPrice, setQuoteUnitPrice] = useState(3250000);
  const [quoteInstallFee, setQuoteInstallFee] = useState(250000);
  const [quoteValidDays, setQuoteValidDays] = useState(30);
  const [quoteTerms, setQuoteTerms] = useState(
    "30% Advance LC, 50% On Customs Clearance, 20% Post-Commissioning",
  );

  const [serviceTask, setServiceTask] = useState(
    "Preventive Earthing Check & Power Module Inspection",
  );
  const [serviceStationId, setServiceStationId] = useState("");
  const [serviceNotes, setServiceNotes] = useState("");

  const [saleModel, setSaleModel] = useState("MaxiCharger DC Fast 120 kW");
  const [saleAmount, setSaleAmount] = useState(3450000);

  const [docTitle, setDocTitle] = useState("");
  const [docCategory, setDocCategory] = useState("NEA Grid Approval");
  const [docNotes, setDocNotes] = useState("");

  const refreshAll = () => {
    void queryClient.invalidateQueries({ queryKey: ["customer-360"] });
    void queryClient.invalidateQueries({ queryKey: ["records"] });
  };

  // Search filter
  const q = searchTerm.trim().toLowerCase();
  const filteredChargers = useMemo(
    () =>
      !q
        ? purchasedChargers
        : purchasedChargers.filter((c) =>
            `${c.name} ${c.brand} ${c.equipmentId} ${c.serialNumber} ${c.stationName}`
              .toLowerCase()
              .includes(q),
          ),
    [purchasedChargers, q],
  );
  const filteredMaintenance = useMemo(
    () =>
      !q
        ? maintenanceHistory
        : maintenanceHistory.filter((m) =>
            `${m.code} ${m.name} ${m.owner} ${m.location ?? ""} ${m.description ?? ""}`
              .toLowerCase()
              .includes(q),
          ),
    [maintenanceHistory, q],
  );
  const filteredQuotations = useMemo(
    () =>
      !q
        ? quotations
        : quotations.filter((qt) =>
            `${qt.code} ${qt.name} ${qt.status} ${qt.description ?? ""}`.toLowerCase().includes(q),
          ),
    [quotations, q],
  );
  const filteredTimeline = useMemo(
    () =>
      !q
        ? activityTimeline
        : activityTimeline.filter((t) =>
            `${t.title} ${t.category} ${t.status} ${t.description} ${t.actor}`
              .toLowerCase()
              .includes(q),
          ),
    [activityTimeline, q],
  );

  // Mutations
  const createActivityMutation = useMutation({
    mutationFn: (notes: string) =>
      saveRecord("administration/audit-trail", {
        id: `aud-${Date.now()}`,
        code: `AUD-${Date.now().toString().slice(-4)}`,
        name: `${activityType} — ${customer.name}`,
        status: "Completed",
        date: new Date().toISOString().slice(0, 10),
        owner: customer.owner || "Volt OS Staff",
        amountNpr: 0,
        category: activityType,
        location: customer.location || "Kathmandu HQ",
        customerId: customer.id,
        description: notes,
      }),
    onSuccess: () => {
      refreshAll();
      setActivityNotes("");
      setLogActivityOpen(false);
      toast.success("Activity logged to customer timeline.");
    },
    onError: (err: Error) => toast.error(`Failed to save activity: ${err.message}`),
  });

  const updateLeadStatusMutation = useMutation({
    mutationFn: async (nextStatus: string) => {
      const today = new Date().toISOString().slice(0, 10);
      if (primaryLead) {
        return saveRecord("sales/leads", {
          ...primaryLead,
          status: nextStatus,
          customerId: customer.id,
        });
      }
      return saveRecord("sales/leads", {
        id: `sales-leads-cust-${Date.now()}`,
        code: `LD-${Date.now().toString().slice(-4)}`,
        name: `${customer.name} — Commercial Account`,
        status: nextStatus,
        date: today,
        owner: customer.owner || "Aarav Shrestha",
        amountNpr: customer.amountNpr || 0,
        expectedValueNpr: customer.amountNpr || 0,
        category: "Charging Infrastructure",
        ...(customer.email ? { email: customer.email } : {}),
        ...(customer.phone ? { phone: customer.phone } : {}),
        ...(customer.location ? { location: customer.location } : {}),
        customerId: customer.id,
        source: customer.source || "Direct",
        description: `Lead stage updated to ${nextStatus} from Customer profile.`,
      });
    },
    onSuccess: (_data, nextStatus) => {
      refreshAll();
      toast.success(`Lead status updated to ${nextStatus}.`);
    },
    onError: (err: Error) => toast.error(`Could not update lead status: ${err.message}`),
  });

  const quoteSubtotal = quoteUnitPrice * quoteQty + quoteInstallFee;
  const quoteVat = Math.round(quoteSubtotal * 0.13);
  const quoteGrandTotal = quoteSubtotal + quoteVat;

  const createQuoteMutation = useMutation({
    mutationFn: () => {
      const validDate = new Date(Date.now() + quoteValidDays * 86400000).toISOString().slice(0, 10);
      const selectedProd = catalogProducts.find((p) => p.name === quoteModel);
      const lineItems = [
        {
          productId: selectedProd ? String(selectedProd.id) : "custom-charger",
          description: quoteModel,
          quantity: quoteQty,
          unitPriceNpr: quoteUnitPrice,
        },
        ...(quoteInstallFee > 0
          ? [
              {
                productId: "turnkey-installation",
                description: "Turnkey Installation, Earthing & Commissioning",
                quantity: 1,
                unitPriceNpr: quoteInstallFee,
              },
            ]
          : []),
      ];
      return saveRecord("sales/quotations", {
        id: `quote-${Date.now()}`,
        code: `QT-2026-${Math.floor(100 + Math.random() * 900)}`,
        name: `${customer.name} — ${quoteModel}${quoteQty > 1 ? ` (×${quoteQty})` : ""}`,
        status: "Sent",
        date: new Date().toISOString().slice(0, 10),
        owner: customer.owner || "Aarav Shrestha",
        amountNpr: quoteSubtotal,
        subtotalNpr: quoteSubtotal,
        vatNpr: quoteVat,
        totalNpr: quoteGrandTotal,
        category: "Equipment Quotation",
        ...(customer.email ? { email: customer.email } : {}),
        ...(customer.phone ? { phone: customer.phone } : {}),
        location: customer.location || "Kathmandu",
        customerId: customer.id,
        source: "Direct",
        lineItems,
        description: `Valid until ${validDate}. Terms: ${quoteTerms}`,
      });
    },
    onSuccess: () => {
      refreshAll();
      setCreateQuotationOpen(false);
      toast.success("Official quotation created and issued to customer.");
    },
    onError: (err: Error) => toast.error(`Failed to save quote: ${err.message}`),
  });

  const updateQuoteStatusMutation = useMutation({
    mutationFn: ({ quote, nextStatus }: { quote: BusinessRecord; nextStatus: string }) =>
      saveRecord("sales/quotations", { ...quote, status: nextStatus }),
    onSuccess: (_data, vars) => {
      refreshAll();
      toast.success(`Quotation ${vars.quote.code} marked as ${vars.nextStatus}.`);
    },
    onError: (err: Error) => toast.error(`Failed to update quotation: ${err.message}`),
  });

  const convertQuoteMutation = useMutation({
    mutationFn: (quoteId: string) => convertRecordToSalesDoc(quoteId, "sales/sales-orders"),
    onSuccess: (res) => {
      refreshAll();
      toast.success(res.message);
    },
    onError: (err: Error) => toast.error(`Conversion failed: ${err.message}`),
  });

  const createServiceMutation = useMutation({
    mutationFn: () =>
      saveRecord("service/service-requests", {
        id: `srv-${Date.now()}`,
        code: `SR-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        name: `${serviceTask} — ${customer.name}`,
        status: "Open",
        date: new Date().toISOString().slice(0, 10),
        owner: "Er. Bikash Rai",
        amountNpr: 0,
        category: "Field Maintenance",
        location: customer.location || "On-site",
        customerId: customer.id,
        ...(serviceStationId ? { stationId: serviceStationId } : {}),
        description: serviceNotes || "Scheduled preventive maintenance & earthing verification.",
      }),
    onSuccess: () => {
      refreshAll();
      setBookServiceOpen(false);
      setServiceNotes("");
      toast.success("Maintenance visit dispatched to field engineering.");
    },
    onError: (err: Error) => toast.error(`Failed to book service: ${err.message}`),
  });

  const recordSaleMutation = useMutation({
    mutationFn: () => {
      const vat = Math.round(saleAmount * 0.13);
      return saveRecord("sales/sales-orders", {
        id: `so-${Date.now()}`,
        code: `SO-2026-${Math.floor(100 + Math.random() * 900)}`,
        name: `${saleModel} — ${customer.name}`,
        status: "Confirmed",
        date: new Date().toISOString().slice(0, 10),
        owner: customer.owner || "Commercial Sales",
        amountNpr: saleAmount,
        subtotalNpr: saleAmount,
        vatNpr: vat,
        totalNpr: saleAmount + vat,
        category: "Charger Purchase",
        ...(customer.email ? { email: customer.email } : {}),
        ...(customer.phone ? { phone: customer.phone } : {}),
        location: customer.location || "Nepal",
        customerId: customer.id,
        description: `Confirmed charger purchase order for ${saleModel}.`,
      });
    },
    onSuccess: () => {
      refreshAll();
      setRecordSaleOpen(false);
      toast.success("Charger sale recorded in customer purchases.");
    },
    onError: (err: Error) => toast.error(`Failed to record sale: ${err.message}`),
  });

  const uploadDocMutation = useMutation({
    mutationFn: () =>
      saveRecord("administration/documents", {
        id: `doc-${Date.now()}`,
        code: `DOC-${Date.now().toString().slice(-4)}`,
        name: docTitle.trim(),
        status: "Verified",
        date: new Date().toISOString().slice(0, 10),
        owner: customer.owner || "Compliance Desk",
        amountNpr: 0,
        category: docCategory,
        location: customer.location || "Kathmandu",
        customerId: customer.id,
        description: docNotes.trim() || `${docCategory} document attached for ${customer.name}.`,
      }),
    onSuccess: () => {
      refreshAll();
      setDocTitle("");
      setDocNotes("");
      setUploadDocOpen(false);
      toast.success("Customer document saved.");
    },
    onError: (err: Error) => toast.error(`Failed to save document: ${err.message}`),
  });

  const deleteCustomerMutation = useMutation({
    mutationFn: () => deleteRecord("sales/customers-and-accounts", customer.id),
    onSuccess: () => {
      toast.success(`Customer ${customer.name} deleted.`);
      if (onDelete) onDelete(customer);
      else onBack();
    },
    onError: (err: Error) => toast.error(`Delete failed: ${err.message}`),
  });

  const customerName = customer.name;
  const phone = customer.phone || "Not specified";
  const email = customer.email || "No email on record";
  const location = customer.location || "Kathmandu, Nepal";
  const totalChargersKw = purchasedChargers.reduce((sum, c) => sum + (c.powerKw || 0), 0);

  return (
    <main className="erp-page">
      <PageHeader
        title={customerName}
        group="Sales & CRM"
        description={`${customer.code || customer.id} · ${location}`}
        actions={
          <>
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft />
              Back
            </Button>
            {phone !== "Not specified" && (
              <Button variant="outline" onClick={() => window.open(`tel:${phone}`)}>
                <Phone />
                Call
              </Button>
            )}
            {email !== "No email on record" && (
              <Button variant="outline" onClick={() => window.open(`mailto:${email}`)}>
                <Mail />
                Email
              </Button>
            )}
            <Button variant="outline" onClick={() => setCreateQuotationOpen(true)}>
              <FileText />
              Issue quotation
            </Button>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(true)}>
              <Trash2 />
              Delete
            </Button>
            <Button onClick={() => setRecordSaleOpen(true)}>
              <Zap />
              Record sale
            </Button>
          </>
        }
      />

      {/* Status strip matching StationRecord */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <StatusBadge status={customer.status || "Active"} />
        <StatusBadge status={leadStatus} />
        <span className="text-xs text-muted-foreground">
          {customer.category || "Commercial Charging Partner"} · Customer since{" "}
          {displayDate(customer.date)}
        </span>
      </div>

      {/* Standard ERP KPI Grid */}
      <div className="kpi-grid mb-6">
        <Kpi
          label="Chargers Purchased"
          value={purchasedChargers.length}
          foot={`${totalChargersKw} kW combined rating`}
          icon={<Zap size={15} />}
          active={activeTab === "chargers"}
          onClick={() => setActiveTab("chargers")}
        />
        <Kpi
          label="Quotations Issued"
          value={quotations.length}
          foot="Commercial & turnkey quotes"
          icon={<FileText size={15} />}
          active={activeTab === "quotations"}
          onClick={() => setActiveTab("quotations")}
        />
        <Kpi
          label="Maintenance Logs"
          value={maintenanceHistory.length}
          foot="Service & preventive history"
          icon={<Wrench size={15} />}
          positive={false}
          active={activeTab === "maintenance"}
          onClick={() => setActiveTab("maintenance")}
        />
        <Kpi
          label="Lead Status"
          value={leadStatus}
          foot={`${stations.length} station(s) · ${npr(customer.amountNpr || 0)}`}
          icon={<TrendingUp size={15} />}
          active={activeTab === "timeline"}
          onClick={() => setActiveTab("timeline")}
        />
      </div>

      {/* Standard ERP Tabs + Filter Input */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList className="h-auto flex-wrap justify-start">
            <TabsTrigger value="overview" className="text-xs">
              Overview
            </TabsTrigger>
            <TabsTrigger value="chargers" className="text-xs">
              Purchased Chargers ({purchasedChargers.length})
            </TabsTrigger>
            <TabsTrigger value="maintenance" className="text-xs">
              Maintenance History ({maintenanceHistory.length})
            </TabsTrigger>
            <TabsTrigger value="quotations" className="text-xs">
              Quotations ({quotations.length})
            </TabsTrigger>
            <TabsTrigger value="documents" className="text-xs">
              Documents ({customerDocs.length + certifications.length})
            </TabsTrigger>
            <TabsTrigger value="timeline" className="text-xs">
              Activity Timeline ({activityTimeline.length})
            </TabsTrigger>
          </TabsList>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 size-3.5 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter records…"
              className="h-8 pl-8 text-xs"
            />
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: OVERVIEW */}
        {/* ========================================================================= */}
        <TabsContent value="overview" className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <Panel title="Customer information">
              <dl className="grid grid-cols-2 gap-5 px-5 pb-6 text-xs">
                {[
                  ["Customer / Organization", customerName],
                  ["Account code", customer.code || customer.id],
                  ["Category", customer.category || "Commercial Partner"],
                  ["Account lead", customer.owner || "Aarav Shrestha"],
                  ["Phone", phone],
                  ["Email", email],
                  ["Customer since", displayDate(customer.date)],
                  ["Total account value", npr(customer.amountNpr || 0)],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="mb-1 text-muted-foreground">{label}</dt>
                    <dd className="font-medium break-words">{value}</dd>
                  </div>
                ))}
              </dl>
            </Panel>

            <Panel title="Location & lead status">
              <div className="space-y-4 px-5 pb-6 text-xs">
                <p className="font-medium">{location}</p>
                {customer.description && (
                  <p className="text-muted-foreground">{customer.description}</p>
                )}
                <div className="rounded border bg-muted p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Current Lead Status</span>
                    <StatusBadge status={leadStatus} />
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {LEAD_STAGES.map((stage) => (
                      <Button
                        key={stage}
                        type="button"
                        size="sm"
                        variant={leadStatus === stage ? "default" : "outline"}
                        className="h-6 px-2 text-[10px]"
                        disabled={updateLeadStatusMutation.isPending}
                        onClick={() => updateLeadStatusMutation.mutate(stage)}
                      >
                        {stage}
                      </Button>
                    ))}
                  </div>
                </div>
                <p className="text-muted-foreground">
                  SLA Coverage: Active 24/7 Dispatch · OCPP 1.6J / 2.0.1
                </p>
              </div>
            </Panel>
          </div>

          <Panel
            title={`Operated charging stations (${stations.length})`}
            subtitle="Stations owned or operated by this customer across the charging network"
          >
            {stations.length === 0 ? (
              <div className="px-5 pb-6 text-xs text-muted-foreground">
                No charging stations linked to this customer account yet.
              </div>
            ) : (
              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Station</th>
                      <th>Code</th>
                      <th>Location</th>
                      <th>Chargers</th>
                      <th>Status</th>
                      <th className="text-right">Record</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stations.map((st) => (
                      <tr key={st.id}>
                        <td className="font-medium">
                          <Link
                            to="/network/stations/$stationId"
                            params={{ stationId: st.id }}
                            className="inline-flex items-center gap-1 text-primary hover:underline"
                          >
                            <MapPin size={12} />
                            {st.name}
                          </Link>
                        </td>
                        <td className="font-mono text-[11px]">{st.stationCode}</td>
                        <td>
                          {st.address}, {st.district}
                        </td>
                        <td>{st.chargers.length}</td>
                        <td>
                          <StatusBadge status={st.status} />
                        </td>
                        <td className="text-right">
                          <Button variant="ghost" size="sm" asChild className="h-7 text-[11px]">
                            <Link to="/network/stations/$stationId" params={{ stationId: st.id }}>
                              Open <ExternalLink size={12} />
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 2: PURCHASED CHARGERS */}
        {/* ========================================================================= */}
        <TabsContent value="chargers">
          <Panel
            title={`Chargers purchased till now (${filteredChargers.length})`}
            subtitle="Installed charging units across customer stations and confirmed hardware sales orders"
            action={
              <Button size="sm" onClick={() => setRecordSaleOpen(true)}>
                <Plus size={14} />
                Record charger sale
              </Button>
            }
          >
            {filteredChargers.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground">
                <Inbox className="mx-auto mb-2 size-6 opacity-40" />
                No purchased chargers recorded for this customer.
              </div>
            ) : (
              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Charger Name / Model</th>
                      <th>Equipment ID</th>
                      <th>Serial number</th>
                      <th>Rating & Connector</th>
                      <th>Station / Source</th>
                      <th>Purchase Date</th>
                      <th>Warranty Expiry</th>
                      <th>Value</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredChargers.map((ch) => (
                      <tr key={ch.id}>
                        <td>
                          <div className="font-medium">{ch.name}</div>
                          <div className="text-[10px] text-muted-foreground">
                            {ch.brand} · {ch.source}
                          </div>
                        </td>
                        <td className="font-mono text-[11px]">{ch.equipmentId}</td>
                        <td className="font-mono text-[11px]">{ch.serialNumber}</td>
                        <td>
                          <div className="font-medium">
                            {ch.powerKw > 0 ? `${ch.powerKw} kW ` : ""}
                            {ch.type}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {ch.connectorStandard} ({ch.connectorCount} gun)
                          </div>
                        </td>
                        <td>
                          {ch.stationId ? (
                            <Link
                              to="/network/stations/$stationId"
                              params={{ stationId: ch.stationId }}
                              className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                            >
                              {ch.stationName}
                              <ExternalLink size={11} />
                            </Link>
                          ) : (
                            ch.stationName
                          )}
                        </td>
                        <td className="whitespace-nowrap">{displayDate(ch.purchaseDate)}</td>
                        <td className="whitespace-nowrap">{displayDate(ch.warrantyExpiry)}</td>
                        <td className="whitespace-nowrap font-medium">{npr(ch.amountNpr)}</td>
                        <td>
                          <StatusBadge status={ch.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 3: MAINTENANCE HISTORY */}
        {/* ========================================================================= */}
        <TabsContent value="maintenance">
          <Panel
            title={`Charger maintenance history (${filteredMaintenance.length})`}
            subtitle="Preventive inspections, earthing checks, firmware calibration, and breakdown tickets"
            action={
              <Button size="sm" onClick={() => setBookServiceOpen(true)}>
                <Plus size={14} />
                Book maintenance
              </Button>
            }
          >
            {filteredMaintenance.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground">
                <Inbox className="mx-auto mb-2 size-6 opacity-40" />
                No maintenance records logged yet for this customer.
              </div>
            ) : (
              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Job Card #</th>
                      <th>Maintenance Task</th>
                      <th>Date</th>
                      <th>Engineer</th>
                      <th>Site / Location</th>
                      <th>Category</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMaintenance.map((srv) => (
                      <tr key={srv.id}>
                        <td className="font-mono font-medium text-primary whitespace-nowrap">
                          {srv.code}
                        </td>
                        <td>
                          <div className="font-medium">{srv.name}</div>
                          {srv.description && (
                            <div className="text-[10px] text-muted-foreground">
                              {srv.description}
                            </div>
                          )}
                        </td>
                        <td className="whitespace-nowrap">{displayDate(srv.date)}</td>
                        <td className="whitespace-nowrap">{srv.owner}</td>
                        <td>{srv.location || "On-site"}</td>
                        <td>{srv.category || "Maintenance"}</td>
                        <td>
                          <StatusBadge status={srv.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 4: QUOTATIONS ISSUED */}
        {/* ========================================================================= */}
        <TabsContent value="quotations">
          <Panel
            title={`Quotations issued (${filteredQuotations.length})`}
            subtitle="Commercial hardware and turnkey installation quotations synced with the public storefront portal"
            action={
              <Button size="sm" onClick={() => setCreateQuotationOpen(true)}>
                <Plus size={14} />
                Issue quotation
              </Button>
            }
          >
            {filteredQuotations.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground">
                <Inbox className="mx-auto mb-2 size-6 opacity-40" />
                No quotations issued to this customer yet.
              </div>
            ) : (
              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Quote #</th>
                      <th>Date</th>
                      <th>Equipment / Proposal</th>
                      <th>Subtotal</th>
                      <th>VAT (13%)</th>
                      <th>Total (NPR)</th>
                      <th>Status</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredQuotations.map((qt) => {
                      const sub = qt.subtotalNpr || qt.amountNpr || 0;
                      const vat = qt.vatNpr || Math.round(sub * 0.13);
                      const grand = qt.totalNpr || sub + vat;
                      return (
                        <tr key={qt.id}>
                          <td className="font-mono font-medium text-primary whitespace-nowrap">
                            {qt.code}
                          </td>
                          <td className="whitespace-nowrap">{displayDate(qt.date)}</td>
                          <td>
                            <div className="font-medium">{qt.name}</div>
                            {qt.description && (
                              <div className="text-[10px] text-muted-foreground line-clamp-1">
                                {qt.description}
                              </div>
                            )}
                          </td>
                          <td className="whitespace-nowrap">{npr(sub)}</td>
                          <td className="whitespace-nowrap text-muted-foreground">{npr(vat)}</td>
                          <td className="whitespace-nowrap font-medium">{npr(grand)}</td>
                          <td>
                            <select
                              aria-label={`Quotation status for ${qt.code}`}
                              value={qt.status}
                              onChange={(e) =>
                                updateQuoteStatusMutation.mutate({
                                  quote: qt,
                                  nextStatus: e.target.value,
                                })
                              }
                              className="h-7 rounded border bg-background px-2 text-[11px]"
                            >
                              {QUOTE_STATUSES.map((st) => (
                                <option key={st} value={st}>
                                  {st}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-[11px]"
                                onClick={() => setPreviewQuote(qt)}
                              >
                                <Printer size={12} />
                                Print
                              </Button>
                              {qt.status !== "Converted" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 text-[11px]"
                                  disabled={convertQuoteMutation.isPending}
                                  onClick={() => convertQuoteMutation.mutate(qt.id)}
                                >
                                  <ArrowRightCircle size={12} />
                                  To Order
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 5: DOCUMENTS */}
        {/* ========================================================================= */}
        <TabsContent value="documents" className="space-y-5">
          <Panel
            title={`Customer documents (${customerDocs.length})`}
            subtitle="Contracts, NEA grid approvals, single-line diagrams, and commissioning dossiers"
            action={
              <Button size="sm" onClick={() => setUploadDocOpen(true)}>
                <Upload size={14} />
                Attach document
              </Button>
            }
          >
            {customerDocs.length === 0 ? (
              <div className="py-10 text-center text-xs text-muted-foreground">
                No customer-specific documents attached yet.
              </div>
            ) : (
              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Document #</th>
                      <th>Title</th>
                      <th>Category</th>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerDocs.map((doc) => (
                      <tr key={doc.id}>
                        <td className="font-mono text-[11px]">{doc.code}</td>
                        <td>
                          <div className="font-medium">{doc.name}</div>
                          {doc.description && (
                            <div className="text-[10px] text-muted-foreground">
                              {doc.description}
                            </div>
                          )}
                        </td>
                        <td>{doc.category}</td>
                        <td className="whitespace-nowrap">{displayDate(doc.date)}</td>
                        <td>
                          <StatusBadge status={doc.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>

          {certifications.length > 0 && (
            <Panel
              title={`Compliance & grid certificates (${certifications.length})`}
              subtitle="IEC 61851, CE, TÜV, and grid compliance standards applicable to customer hardware"
            >
              <div className="grid gap-3 px-5 pb-6 md:grid-cols-2">
                {certifications.map((cert) => (
                  <div
                    key={cert.id}
                    className="flex items-start justify-between gap-3 rounded-md border p-3 text-xs"
                  >
                    <div className="flex items-start gap-2.5">
                      <FileCheck size={15} className="mt-0.5 shrink-0 text-primary" />
                      <div>
                        <div className="font-medium">{cert.name}</div>
                        <div className="mt-0.5 text-[10px] text-muted-foreground">
                          {cert.issuer} · {cert.standard_code} · {cert.validity_years} yrs validity
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 shrink-0"
                      onClick={() => toast.success(`Opened ${cert.standard_code} certificate.`)}
                    >
                      <Download size={13} />
                    </Button>
                  </div>
                ))}
              </div>
            </Panel>
          )}
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 6: ACTIVITY TIMELINE (WITH LEAD STATUS) */}
        {/* ========================================================================= */}
        <TabsContent value="timeline" className="space-y-5">
          <Panel
            title="CRM lead status"
            subtitle="Synced directly with Sales & CRM → Leads"
            action={
              <Button size="sm" onClick={() => setLogActivityOpen(true)}>
                <Plus size={14} />
                Log activity
              </Button>
            }
          >
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 pb-5">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">Current stage:</span>
                <StatusBadge status={leadStatus} />
                {primaryLead && (
                  <span className="font-mono text-[11px] text-muted-foreground">
                    · {primaryLead.code}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {LEAD_STAGES.map((stage) => (
                  <Button
                    key={stage}
                    size="sm"
                    variant={leadStatus === stage ? "default" : "outline"}
                    className="h-7 text-xs"
                    disabled={updateLeadStatusMutation.isPending}
                    onClick={() => updateLeadStatusMutation.mutate(stage)}
                  >
                    {leadStatus === stage && <CheckCircle2 size={12} />}
                    {stage}
                  </Button>
                ))}
              </div>
            </div>
          </Panel>

          <Panel
            title={`Activity timeline (${filteredTimeline.length})`}
            subtitle="Chronological history of lead status, enquiries, quotations, purchases, installations, maintenance, and documents"
          >
            {filteredTimeline.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground">
                No timeline activity recorded yet.
              </div>
            ) : (
              <div className="space-y-4 px-5 pb-6">
                {filteredTimeline.map((item) => (
                  <div
                    key={item.id}
                    className="border-l-2 border-primary pl-4 py-1 text-xs space-y-1"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-foreground">{item.title}</span>
                        <StatusBadge status={item.status} />
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        {displayDate(item.date)}
                      </span>
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {item.category}
                      {item.code ? ` · ${item.code}` : ""} · {item.actor}
                      {item.location ? ` · ${item.location}` : ""}
                    </div>
                    {item.description && <p className="text-xs">{item.description}</p>}
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </TabsContent>
      </Tabs>

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}

      <Dialog open={!!previewQuote} onOpenChange={(open) => !open && setPreviewQuote(null)}>
        <DialogContent className="max-w-2xl">
          {previewQuote && (
            <>
              <DialogHeader>
                <DialogTitle>Official Quotation — {previewQuote.code}</DialogTitle>
                <DialogDescription>
                  Volt OS Energy Nepal Pvt. Ltd. · Issued {displayDate(previewQuote.date)} ·{" "}
                  {previewQuote.status}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 text-xs py-2">
                <div className="grid grid-cols-2 gap-4 rounded border bg-muted/40 p-3.5">
                  <div>
                    <div className="text-[10px] uppercase text-muted-foreground font-semibold">
                      Quoted To
                    </div>
                    <div className="font-semibold mt-0.5">{customerName}</div>
                    <div className="text-muted-foreground">{email}</div>
                    <div className="text-muted-foreground">{phone}</div>
                    <div className="text-muted-foreground">{location}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] uppercase text-muted-foreground font-semibold">
                      Reference
                    </div>
                    <div className="font-mono font-semibold mt-0.5">{previewQuote.code}</div>
                    <div className="text-muted-foreground">Owner: {previewQuote.owner}</div>
                    <div className="text-muted-foreground">
                      Source: {previewQuote.source || "Direct"}
                    </div>
                  </div>
                </div>

                <div className="table-scroll rounded border">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Item / Specification</th>
                        <th className="text-right">Qty</th>
                        <th className="text-right">Unit Price</th>
                        <th className="text-right">Line Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(previewQuote.lineItems && previewQuote.lineItems.length > 0
                        ? previewQuote.lineItems
                        : [
                            {
                              description: previewQuote.name,
                              quantity: 1,
                              unitPriceNpr: previewQuote.subtotalNpr || previewQuote.amountNpr,
                            },
                          ]
                      ).map((item, idx) => (
                        <tr key={idx}>
                          <td className="font-medium">{item.description}</td>
                          <td className="text-right">{item.quantity}</td>
                          <td className="text-right">{npr(item.unitPriceNpr)}</td>
                          <td className="text-right font-medium">
                            {npr(item.quantity * item.unitPriceNpr)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {(() => {
                  const sub = previewQuote.subtotalNpr || previewQuote.amountNpr || 0;
                  const vat = previewQuote.vatNpr || Math.round(sub * 0.13);
                  const total = previewQuote.totalNpr || sub + vat;
                  return (
                    <div className="ml-auto max-w-xs space-y-1.5 rounded border bg-muted/40 p-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>{npr(sub)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Nepal VAT (13%)</span>
                        <span>{npr(vat)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-1.5 font-semibold text-primary">
                        <span>Grand Total</span>
                        <span>{npr(total)}</span>
                      </div>
                    </div>
                  );
                })()}

                {previewQuote.description && (
                  <p className="rounded border p-3 text-muted-foreground">
                    <span className="font-medium text-foreground">Terms & Notes: </span>
                    {previewQuote.description}
                  </p>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" size="sm" onClick={() => setPreviewQuote(null)}>
                  Close
                </Button>
                <Button size="sm" onClick={() => window.print()}>
                  <Printer size={13} />
                  Print / Save PDF
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={createQuotationOpen} onOpenChange={setCreateQuotationOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Issue Official Commercial Quotation</DialogTitle>
            <DialogDescription>
              Generate a VAT-inclusive EV charger quotation for {customerName}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2 text-xs">
            <div className="space-y-1">
              <Label>Charger Model</Label>
              <select
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                value={quoteModel}
                onChange={(e) => {
                  const selected = catalogProducts.find((p) => p.name === e.target.value);
                  setQuoteModel(e.target.value);
                  if (selected?.price_npr) setQuoteUnitPrice(Number(selected.price_npr));
                }}
              >
                {catalogProducts.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name} ({p.power_kw} kW — {npr(p.price_npr)})
                  </option>
                ))}
                {!catalogProducts.some((p) => p.name === quoteModel) && (
                  <option value={quoteModel}>{quoteModel}</option>
                )}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  min={1}
                  value={quoteQty}
                  onChange={(e) => setQuoteQty(Math.max(1, Number(e.target.value)))}
                />
              </div>
              <div className="space-y-1">
                <Label>Unit Price (NPR)</Label>
                <Input
                  type="number"
                  min={0}
                  value={quoteUnitPrice}
                  onChange={(e) => setQuoteUnitPrice(Number(e.target.value))}
                />
              </div>
              <div className="space-y-1">
                <Label>Install Fee (NPR)</Label>
                <Input
                  type="number"
                  min={0}
                  value={quoteInstallFee}
                  onChange={(e) => setQuoteInstallFee(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Valid For (Days)</Label>
                <Input
                  type="number"
                  min={7}
                  value={quoteValidDays}
                  onChange={(e) => setQuoteValidDays(Number(e.target.value))}
                />
              </div>
              <div className="space-y-1">
                <Label>Commercial Terms</Label>
                <Input value={quoteTerms} onChange={(e) => setQuoteTerms(e.target.value)} />
              </div>
            </div>
            <div className="rounded border bg-muted/40 p-3 space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{npr(quoteSubtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">13% Nepal VAT</span>
                <span>{npr(quoteVat)}</span>
              </div>
              <div className="flex justify-between font-semibold text-primary border-t pt-1">
                <span>Grand Total</span>
                <span>{npr(quoteGrandTotal)}</span>
              </div>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" size="sm" onClick={() => setCreateQuotationOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={createQuoteMutation.isPending}
              onClick={() => createQuoteMutation.mutate()}
            >
              {createQuoteMutation.isPending ? "Generating…" : "Issue Quotation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={logActivityOpen} onOpenChange={setLogActivityOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Log Customer Activity</DialogTitle>
            <DialogDescription>
              Add a call, site inspection, or negotiation note to {customerName}&apos;s timeline.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2 text-xs">
            <div className="space-y-1">
              <Label>Interaction Type</Label>
              <select
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                value={activityType}
                onChange={(e) => setActivityType(e.target.value)}
              >
                <option>Site Inspection & Grid Survey</option>
                <option>Technical Consultation</option>
                <option>Quotation Follow-up</option>
                <option>Shipment Handover</option>
                <option>Commissioning & Testing</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label>Summary Notes</Label>
              <Textarea
                placeholder="Enter details of call, inspection, or decision…"
                value={activityNotes}
                onChange={(e) => setActivityNotes(e.target.value)}
                className="text-xs h-24"
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" size="sm" onClick={() => setLogActivityOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={createActivityMutation.isPending}
              onClick={() => {
                if (!activityNotes.trim()) {
                  toast.error("Please add activity notes.");
                  return;
                }
                createActivityMutation.mutate(activityNotes);
              }}
            >
              {createActivityMutation.isPending ? "Saving…" : "Save Activity"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={recordSaleOpen} onOpenChange={setRecordSaleOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Charger Purchase</DialogTitle>
            <DialogDescription>
              Record a confirmed EV charger sale for {customerName}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2 text-xs">
            <div className="space-y-1">
              <Label>Charger Model</Label>
              <select
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                value={saleModel}
                onChange={(e) => {
                  const selected = catalogProducts.find((p) => p.name === e.target.value);
                  setSaleModel(e.target.value);
                  if (selected?.price_npr) setSaleAmount(Number(selected.price_npr));
                }}
              >
                {catalogProducts.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name} ({p.power_kw} kW)
                  </option>
                ))}
                {!catalogProducts.some((p) => p.name === saleModel) && (
                  <option value={saleModel}>{saleModel}</option>
                )}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Sale Value (NPR, excl. VAT)</Label>
              <Input
                type="number"
                value={saleAmount}
                onChange={(e) => setSaleAmount(Number(e.target.value))}
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" size="sm" onClick={() => setRecordSaleOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={recordSaleMutation.isPending}
              onClick={() => recordSaleMutation.mutate()}
            >
              {recordSaleMutation.isPending ? "Recording…" : "Confirm Sale"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={bookServiceOpen} onOpenChange={setBookServiceOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Book Charger Maintenance Visit</DialogTitle>
            <DialogDescription>Dispatch field engineering for {customerName}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2 text-xs">
            {stations.length > 0 && (
              <div className="space-y-1">
                <Label>Station / Hub</Label>
                <select
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                  value={serviceStationId}
                  onChange={(e) => setServiceStationId(e.target.value)}
                >
                  <option value="">All / General Account Site</option>
                  {stations.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.stationCode})
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="space-y-1">
              <Label>Maintenance Task</Label>
              <Input value={serviceTask} onChange={(e) => setServiceTask(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Engineer Notes</Label>
              <Textarea
                placeholder="Earthing resistance, connector gun check, firmware update…"
                value={serviceNotes}
                onChange={(e) => setServiceNotes(e.target.value)}
                className="text-xs h-20"
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" size="sm" onClick={() => setBookServiceOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={createServiceMutation.isPending}
              onClick={() => createServiceMutation.mutate()}
            >
              {createServiceMutation.isPending ? "Booking…" : "Dispatch Maintenance"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={uploadDocOpen} onOpenChange={setUploadDocOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Attach Customer Document</DialogTitle>
            <DialogDescription>
              Register a contract, grid approval, customs receipt, or SLD for {customerName}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2 text-xs">
            <div className="space-y-1">
              <Label>Document Title</Label>
              <Input
                placeholder="e.g. NEA 3-Phase Load Approval Certificate"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Category</Label>
              <select
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                value={docCategory}
                onChange={(e) => setDocCategory(e.target.value)}
              >
                <option>NEA Grid Approval</option>
                <option>Commercial Supply Contract</option>
                <option>Single-Line Electrical Diagram</option>
                <option>Customs & Import Dossier</option>
                <option>OEM Warranty Certificate</option>
                <option>Commissioning Handover Report</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label>Notes / File Reference</Label>
              <Textarea
                placeholder="Reference number, issue date, or file link…"
                value={docNotes}
                onChange={(e) => setDocNotes(e.target.value)}
                className="text-xs h-20"
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" size="sm" onClick={() => setUploadDocOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={uploadDocMutation.isPending}
              onClick={() => {
                if (!docTitle.trim()) {
                  toast.error("Please enter a document title.");
                  return;
                }
                uploadDocMutation.mutate();
              }}
            >
              {uploadDocMutation.isPending ? "Saving…" : "Save Document"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {customer.code || customerName}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes {customerName} from the database. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteCustomerMutation.isPending}
              onClick={() => deleteCustomerMutation.mutate()}
            >
              Delete customer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
