import { lazy, Suspense, useState, useMemo } from "react";
import { ClientOnly, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  ArrowRight,
  CalendarDays,
  Download,
  TrendingUp,
  Wallet,
  Users,
  MapPin,
  FolderKanban,
  Package,
  Wrench,
  Truck,
  AlertTriangle,
  Zap,
  CheckCircle2,
  MoreHorizontal,
  Loader2,
  Inbox,
  Clock,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel, Kpi, StatusBadge, ViewAll } from "@/components/shared/common";
import { getDashboardKpis } from "@/services/dashboard";
import { rangeFactor } from "@/lib/date-range";
import { listRecords } from "@/services/records";
import { stationsQuery } from "@/queries/stations";
import { compactNpr, npr, exportCsv } from "@/lib/formatting";
import { useUi } from "@/stores/ui";
import { financeAccess } from "@/lib/permissions";
import { dashboardQuery } from "@/queries/dashboard";
import { siteSettingsQuery, contentStatsQuery } from "@/queries/content";
import {
  SalesChart,
  WarehouseChart,
  DonutChart,
  ChargerTierChart,
  PipelineFunnelChart,
} from "./charts";
const NepalMap = lazy(() => import("@/features/network/nepal-map"));

export function Dashboard() {
  const [range, setRange] = useState("This month");
  const [warehouse, setWarehouse] = useState("All warehouses");
  const [custom, setCustom] = useState(false);
  const [start, setStart] = useState("2026-11-01");
  const [end, setEnd] = useState("2026-11-15");
  const { data: initial } = useSuspenseQuery(dashboardQuery);
  const { data: kpi = initial } = useQuery({
    queryKey: ["dashboard", range, warehouse, start, end],
    queryFn: () => getDashboardKpis(range, warehouse, start, end),
  });
  const { data: stations } = useSuspenseQuery(stationsQuery());
  const { data: siteSettings } = useQuery(siteSettingsQuery);
  const { data: contentStats } = useQuery(contentStatsQuery);
  const { role } = useUi();
  const finance = financeAccess(role);
  const navigate = useNavigate();
  const go = (slug: string, status?: string) => {
    void navigate({ to: "/modules/$", params: { _splat: slug }, search: { status } });
  };

  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ["dashboard-recent-orders"],
    queryFn: () => listRecords("sales/sales-orders", { pageSize: 5 }),
  });
  const recentOrders = ordersData?.items ?? [];

  const { data: shipmentsData, isLoading: shipmentsLoading } = useQuery({
    queryKey: ["dashboard-recent-shipments"],
    queryFn: () => listRecords("procurement/import-shipments", { pageSize: 5 }),
  });
  const shipments = shipmentsData?.items ?? [];

  const { data: auditData, isLoading: auditLoading } = useQuery({
    queryKey: ["dashboard-recent-audit"],
    queryFn: () => listRecords("administration/audit-trail", { pageSize: 5 }),
  });
  const recentActivities = auditData?.items ?? [];

  const { data: projectsData } = useQuery({
    queryKey: ["dashboard-projects-distribution"],
    queryFn: () => listRecords("projects/projects", { pageSize: 20 }),
  });
  const projectList = useMemo(() => projectsData?.items ?? [], [projectsData?.items]);
  const projectDistribution = useMemo(() => {
    const inProg =
      projectList.filter((p) => p.status === "In Progress").length || kpi.projects || 2;
    const completed = projectList.filter((p) => p.status === "Completed").length || 1;
    const planning =
      projectList.filter((p) => ["Planning", "Draft", "New"].includes(p.status)).length || 1;
    const onHold = projectList.filter((p) => ["On Hold", "Delayed"].includes(p.status)).length || 1;
    const total = inProg + completed + planning + onHold;
    return {
      total,
      data: [
        { name: "In Progress", value: inProg, color: "--primary" },
        { name: "Completed", value: completed, color: "--chart-2" },
        { name: "Planning", value: planning, color: "--info" },
        { name: "On Hold", value: onHold, color: "--warning" },
      ],
      breakdown: [
        ["In progress", inProg, "bg-primary"],
        ["Completed", completed, "bg-chart-2"],
        ["Planning", planning, "bg-info"],
        ["On hold", onHold, "bg-warning"],
      ] as const,
    };
  }, [projectList, kpi.projects]);

  const { data: enquiriesData } = useQuery({
    queryKey: ["dashboard-enquiries-count"],
    queryFn: () => listRecords("sales/enquiries", { pageSize: 1 }),
  });
  const { data: quotationsData } = useQuery({
    queryKey: ["dashboard-quotations-count"],
    queryFn: () => listRecords("sales/quotations", { pageSize: 1 }),
  });

  const pipelineCounts = useMemo(() => {
    const enqCount = enquiriesData?.total || kpi.leads || 8;
    const quotCount = quotationsData?.total || kpi.quotations || 4;
    const ordCount = ordersData?.total || kpi.orders || 3;
    return [
      ["Enquiries", enqCount, "sales/enquiries"],
      ["Quotations", quotCount, "sales/quotations"],
      ["Sales orders", ordCount, "sales/sales-orders"],
    ] as const;
  }, [
    enquiriesData?.total,
    quotationsData?.total,
    ordersData?.total,
    kpi.leads,
    kpi.quotations,
    kpi.orders,
  ]);

  const attentionItems = useMemo(
    () => [
      {
        icon: AlertTriangle,
        title: `${kpi.lowStock || 1} hardware items low on stock`,
        sub: "DC power modules, connectors & liquid-cooled cables",
        slug: "inventory/stock-overview",
        status: "Low Stock",
        color: "text-warning",
      },
      {
        icon: Wrench,
        title: `${kpi.service || 1} open technical service requests`,
        sub: "High-voltage insulation tests & diagnostic maintenance",
        slug: "service/service-requests",
        status: "Open",
        color: "text-destructive",
      },
      {
        icon: CalendarDays,
        title: `${kpi.maintenance || 2} upcoming preventive inspections`,
        sub: "Quarterly earthing checks & thermal telemetry logs",
        slug: "service/preventive-maintenance",
        status: undefined,
        color: "text-info",
      },
      {
        icon: FolderKanban,
        title: `${projectDistribution.data[0]?.value || 2} turnkey commissioning projects`,
        sub: "Highway fast-charging hub installations across Nepal",
        slug: "projects/projects",
        status: "In Progress",
        color: "text-primary",
      },
    ],
    [kpi.lowStock, kpi.service, kpi.maintenance, projectDistribution.data],
  );
  return (
    <main className="erp-page">
      <PageHeader
        title="EV Charging Equipment Operations Dashboard"
        description="Real-time imported charging hardware inventory, dealer shipments, and station deployments across Nepal."
        actions={
          <>
            <select
              aria-label="Date range"
              className="erp-select"
              value={range}
              onChange={(e) => {
                setRange(e.target.value);
                setCustom(e.target.value === "Custom range");
              }}
            >
              {["This month", "This quarter", "This fiscal year", "Custom range"].map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                exportCsv("business-dashboard", [
                  {
                    period: range,
                    warehouse,
                    sales: finance ? kpi.sales : "Restricted",
                    stations: kpi.network.total,
                    customers: kpi.customers,
                  },
                ])
              }
            >
              <Download />
              Export report
            </Button>
          </>
        }
      />
      {custom && (
        <div className="mb-4 flex flex-wrap gap-2">
          <input
            aria-label="Start date"
            type="date"
            className="erp-select"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
          <input
            aria-label="End date"
            type="date"
            className="erp-select"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />
        </div>
      )}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <CalendarDays size={13} />
          <span>
            {custom
              ? `${start} – ${end}`
              : range === "This quarter"
                ? "01 Oct – 31 Dec 2026"
                : range === "This fiscal year"
                  ? "16 Jul 2026 – 15 Jul 2027"
                  : "01 Nov – 30 Nov 2026"}
          </span>
          <span className="mx-1 text-border">|</span>
          <span>Updated just now</span>
          <span className="stat-dot operational" />
        </div>
        <select
          aria-label="Warehouse filter"
          className="erp-select !h-7 !border-0 !bg-transparent"
          value={warehouse}
          onChange={(e) => setWarehouse(e.target.value)}
        >
          {[
            "All warehouses",
            "Kathmandu Central",
            "Pokhara Regional",
            "Biratnagar Depot",
            "Birgunj Import Hub",
          ].map((w) => (
            <option key={w}>{w}</option>
          ))}
        </select>
      </div>
      <div className="kpi-grid mb-4">
        {finance ? (
          <>
            <Kpi
              label="Total sales"
              value={compactNpr(kpi.sales)}
              foot="18.6% vs. last month"
              icon={<TrendingUp size={15} />}
              href="sales/sales-orders"
            />
            <Kpi
              label="Outstanding receivables"
              value={compactNpr(kpi.receivables)}
              foot="12 invoices awaiting payment"
              icon={<Wallet size={15} />}
              href="finance/receivables"
              positive={false}
            />
          </>
        ) : (
          <>
            <Kpi
              label="Open leads"
              value={kpi.leads}
              foot="Across the sales pipeline"
              icon={<TrendingUp size={15} />}
              href="sales/leads"
            />
            <Kpi
              label="Confirmed sales orders"
              value={kpi.orders}
              foot="Ready for fulfilment"
              icon={<Package size={15} />}
              href="sales/sales-orders"
              search="Confirmed"
            />
          </>
        )}
        <Kpi
          label="Active customers"
          value={kpi.customers}
          foot="4 new customers this month"
          icon={<Users size={15} />}
          href="sales/customers-and-accounts"
        />
        <Kpi
          label="Charging stations"
          value={
            <>
              {kpi.network.total}
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                <span className="stat-dot operational mr-1" />
                {kpi.network.operational} operational
              </span>
            </>
          }
          foot="Across all 7 provinces"
          icon={<MapPin size={15} />}
        />
      </div>
      <div className="kpi-grid mb-6">
        <Kpi
          label="Active installation projects"
          value={kpi.projects}
          foot="3 projects nearing deadline"
          icon={<FolderKanban size={15} />}
          href="projects/projects"
          search="In Progress"
        />
        <Kpi
          label={finance ? "Total inventory value" : "Inventory products"}
          value={finance ? compactNpr(kpi.inventory) : 30}
          foot="6 items require restocking"
          icon={<Package size={15} />}
          href="inventory/stock-overview"
        />
        <Kpi
          label="Open service requests"
          value={kpi.service}
          foot="3 high-priority requests"
          icon={<Wrench size={15} />}
          href="service/service-requests"
          search="Open"
          positive={false}
        />
        <Kpi
          label="Incoming shipments"
          value={kpi.shipments}
          foot="2 expected this week"
          icon={<Truck size={15} />}
          href="procurement/import-shipments"
        />
      </div>
      <div className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-3 border-y py-3">
        {[
          { label: "Open leads", value: kpi.leads, slug: "sales/leads" },
          {
            label: "Awaiting quotations",
            value: kpi.quotations,
            slug: "sales/quotations",
            status: "Awaiting Response",
          },
          {
            label: "Confirmed orders",
            value: kpi.orders,
            slug: "sales/sales-orders",
            status: "Confirmed",
          },
          {
            label: "Low stock",
            value: kpi.lowStock,
            slug: "inventory/stock-overview",
            status: "Low Stock",
          },
          {
            label: "Pending purchase orders",
            value: kpi.purchaseOrders,
            slug: "procurement/purchase-orders",
          },
          {
            label: "Overdue maintenance",
            value: kpi.maintenance,
            slug: "service/preventive-maintenance",
          },
        ].map((item) => (
          <Button
            key={item.label}
            variant="ghost"
            size="sm"
            className="h-auto gap-2 px-0 text-[11px]"
            onClick={() => go(item.slug, item.status)}
          >
            <span className="text-muted-foreground">{item.label}</span>
            <strong>{item.value}</strong>
          </Button>
        ))}
      </div>
      <div className="mb-5 grid gap-5 xl:grid-cols-[1.65fr_1fr]">
        {finance ? (
          <Panel
            title="Sales & revenue"
            subtitle="Monthly performance · NPR in lakhs"
            action={
              <div className="flex items-center gap-3 text-[10px]">
                <span className="flex items-center gap-1">
                  <span className="stat-dot !bg-primary" />
                  Sales
                </span>
                <span className="flex items-center gap-1">
                  <span className="stat-dot !bg-chart-2" />
                  Revenue
                </span>
              </div>
            }
          >
            <div className="px-3 pb-5">
              <ClientOnly
                fallback={<div className="h-[232px] w-full animate-pulse rounded bg-muted/40" />}
              >
                <SalesChart
                  multiplier={rangeFactor(range, start, end)}
                  onClick={() => go("sales/sales-orders")}
                />
              </ClientOnly>
            </div>
          </Panel>
        ) : (
          <Panel title="Enquiry-to-order conversion" subtitle="Current sales pipeline">
            <ClientOnly
              fallback={<div className="h-44 w-full animate-pulse rounded bg-muted/40" />}
            >
              <PipelineFunnelChart onClick={(slug) => go(slug)} />
            </ClientOnly>
          </Panel>
        )}
        <Panel
          title="Charging network"
          subtitle={`${kpi.network.total} stations connecting Nepal`}
          action={
            <Button variant="link" asChild size="sm">
              <Link to="/network/locations">
                Open map
                <ArrowUpRight />
              </Link>
            </Button>
          }
        >
          <div className="mini-map">
            <ClientOnly fallback={<div className="h-full bg-muted" />}>
              <Suspense fallback={<div className="h-full bg-muted" />}>
                <NepalMap
                  stations={stations.items.filter((s) => s.status !== "Pipeline")}
                  mini
                  onSelect={() => {
                    void navigate({ to: "/network/locations" });
                  }}
                />
              </Suspense>
            </ClientOnly>
            <div className="pointer-events-none absolute bottom-4 left-3 z-10 flex gap-2 rounded border bg-card p-2 text-[9px]">
              <span>
                <span className="stat-dot operational mr-1" />
                {kpi.network.operational || 14} Active
              </span>
              <span>
                <span className="stat-dot partially-active mr-1" />
                {kpi.network.partial || 5} Partial
              </span>
              <span>
                <span className="stat-dot inactive mr-1" />
                {kpi.network.inactive || 3} Inactive
              </span>
            </div>
          </div>
        </Panel>
      </div>
      <div className="mb-5 grid gap-5 xl:grid-cols-[1.65fr_1fr]">
        <Panel
          title="Recent sales orders"
          subtitle="Latest orders across your customer accounts"
          action={<ViewAll slug="sales/sales-orders" />}
        >
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order / Customer</th>
                  <th>Date</th>
                  {finance && <th>Amount</th>}
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {ordersLoading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs text-muted-foreground">
                      <Loader2 className="mx-auto mb-2 size-5 animate-spin text-primary" />
                      Loading sales orders…
                    </td>
                  </tr>
                ) : recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs text-muted-foreground">
                      <Inbox className="mx-auto mb-2 size-5 opacity-40" />
                      No sales orders found
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <Link
                          className="font-medium text-primary"
                          to="/modules/$"
                          params={{ _splat: "sales/sales-orders" }}
                          search={{ status: r.status }}
                        >
                          {r.code}
                        </Link>
                        <div className="mt-1 text-[10px] text-muted-foreground">{r.name}</div>
                      </td>
                      <td className="whitespace-nowrap">{r.date}</td>
                      {finance && (
                        <td className="whitespace-nowrap font-medium">{npr(r.amountNpr)}</td>
                      )}
                      <td>
                        <StatusBadge status={r.status} />
                      </td>
                      <td>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => go("sales/sales-orders", r.status)}
                          aria-label={`Open ${r.code}`}
                        >
                          <ArrowUpRight size={13} />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Panel>
        <Panel
          title="Attention required"
          subtitle="Hardware & operations that need action"
          action={
            <span className="rounded bg-warning/10 px-2 py-1 text-[10px] font-medium text-foreground">
              {attentionItems.length} active monitors
            </span>
          }
        >
          <div className="px-5">
            {attentionItems.map((item) => (
              <Button
                key={item.title}
                variant="ghost"
                className="flex h-auto w-full justify-start gap-3 rounded-none border-b py-4 last:border-b-0"
                onClick={() => go(item.slug, item.status)}
              >
                <item.icon size={17} className={item.color} />
                <div className="flex-1 text-left">
                  <div className="text-[11px] font-medium">{item.title}</div>
                  <div className="mt-1 text-[10px] font-normal text-muted-foreground">
                    {item.sub}
                  </div>
                </div>
                <ArrowUpRight size={12} className="text-muted-foreground" />
              </Button>
            ))}
          </div>
        </Panel>
      </div>
      <div className="mb-5 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <Panel
          title="Inventory by warehouse"
          subtitle={finance ? "Stock valuation · NPR in lakhs" : "Available stock distribution"}
          action={
            <Button
              variant="ghost"
              size="icon"
              aria-label="Warehouse details"
              onClick={() => go("inventory/warehouses")}
            >
              <MoreHorizontal />
            </Button>
          }
        >
          <div className="px-3 pb-3">
            <ClientOnly
              fallback={<div className="h-[180px] w-full animate-pulse rounded bg-muted/40" />}
            >
              <WarehouseChart financial={finance} onClick={() => go("inventory/stock-overview")} />
            </ClientOnly>
          </div>
        </Panel>
        <Panel
          title="Charger power tier mix"
          subtitle="Hardware ratings imported & deployed"
          action={
            <Button
              variant="ghost"
              size="icon"
              aria-label="Charger products"
              onClick={() => go("inventory/products-and-equipment")}
            >
              <MoreHorizontal />
            </Button>
          }
        >
          <div className="px-3 pb-3">
            <ClientOnly
              fallback={<div className="h-[180px] w-full animate-pulse rounded bg-muted/40" />}
            >
              <ChargerTierChart onClick={() => go("inventory/chargers")} />
            </ClientOnly>
          </div>
        </Panel>
        <Panel
          title="Project status"
          subtitle={`${projectDistribution.total} turnkey projects across Nepal`}
        >
          <div className="flex items-center px-4 pb-4">
            <div className="min-w-0 flex-1">
              <ClientOnly
                fallback={<div className="h-44 w-full animate-pulse rounded bg-muted/40" />}
              >
                <DonutChart
                  center={String(projectDistribution.total)}
                  data={projectDistribution.data}
                  onClick={(name) => go("projects/projects", name)}
                />
              </ClientOnly>
            </div>
            <div className="w-28 space-y-3 text-[10px]">
              {projectDistribution.breakdown.map(([name, value, color]) => (
                <div className="flex items-center gap-2" key={name}>
                  <span className={`stat-dot ${color}`} />
                  <span className="text-muted-foreground">{name}</span>
                  <strong className="ml-auto">{value}</strong>
                </div>
              ))}
            </div>
          </div>
        </Panel>
        <Panel
          title="Incoming shipments"
          subtitle="Scheduled international freight arrivals"
          action={<ViewAll slug="procurement/import-shipments" />}
        >
          <div className="px-5 pb-2">
            {shipmentsLoading ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                <Loader2 className="mx-auto mb-2 size-5 animate-spin text-primary" />
                Loading import consignments…
              </div>
            ) : shipments.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                <Inbox className="mx-auto mb-2 size-5 opacity-40" />
                No pending import consignments
              </div>
            ) : (
              shipments.map((r) => (
                <Button
                  key={r.id}
                  variant="ghost"
                  className="h-auto w-full justify-start gap-3 rounded-none border-b px-0 py-4 last:border-0"
                  onClick={() => go("procurement/import-shipments", r.status)}
                >
                  <span className="activity-icon">
                    <ShipIcon />
                  </span>
                  <div className="min-w-0 flex-1 text-left">
                    <div className="text-[11px] font-medium truncate">
                      {r.code} · {r.name}
                    </div>
                    <div className="mt-1 text-[10px] text-muted-foreground truncate">
                      {r.location || r.category || "Birgunj / Kolkata Corridor"}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[10px]">{r.date}</div>
                    <div className="mt-1">
                      <StatusBadge status={r.status} />
                    </div>
                  </div>
                </Button>
              ))
            )}
          </div>
        </Panel>
      </div>
      <div className="grid gap-5 md:grid-cols-[1.4fr_1fr]">
        <Panel title="Recent activity" action={<ViewAll slug="administration/audit-trail" />}>
          {auditLoading ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              <Loader2 className="mx-auto mb-2 size-5 animate-spin text-primary" />
              Loading system audit trail…
            </div>
          ) : recentActivities.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              <Inbox className="mx-auto mb-2 size-5 opacity-40" />
              No activity logged yet
            </div>
          ) : (
            recentActivities.map((a) => (
              <div key={a.id} className="activity-row">
                <span className="activity-icon">
                  <Activity size={14} className="text-primary" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-medium leading-snug truncate">{a.name}</div>
                  <div className="mt-0.5 text-[10px] text-muted-foreground truncate">
                    {a.location || a.category || "System"} · {a.owner}
                  </div>
                </div>
                <span className="text-[9px] text-muted-foreground whitespace-nowrap">{a.date}</span>
              </div>
            ))
          )}
          <div className="h-3" />
        </Panel>
        <Panel title="Sales pipeline" subtitle="Commercial equipment conversion">
          <div className="space-y-3 px-5 pb-5">
            {pipelineCounts.map(([name, value, slug]) => (
              <Button
                key={name}
                variant="ghost"
                className="h-8 w-full justify-start px-0"
                onClick={() => go(String(slug))}
              >
                <span className="w-24 text-left text-[11px] text-muted-foreground">{name}</span>
                <span
                  className={`pipeline-bar ${name === "Enquiries" ? "full" : name === "Quotations" ? "medium" : "small"}`}
                />
                <strong className="ml-auto text-xs">{value}</strong>
                <ArrowRight size={12} />
              </Button>
            ))}
          </div>
        </Panel>
      </div>
    </main>
  );
}
function ShipIcon() {
  return <Truck size={15} />;
}
