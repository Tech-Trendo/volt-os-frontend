import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  ComposedChart,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Panel } from "@/components/shared/common";
import type { BusinessRecord } from "@/models/common";
import { siteSettingsQuery } from "@/queries/content";
import { DEFAULT_POWER_DEMAND_24H, DEFAULT_WEEKLY_ENERGY } from "@/services/content";

interface ModuleChartsProps {
  slug: string;
  records: BusinessRecord[];
}

const tooltipStyle: React.CSSProperties = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: "6px",
  fontSize: "11px",
  color: "var(--foreground)",
  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
};

export function ModuleCharts({ slug, records }: ModuleChartsProps) {
  // Check if this module should display charts
  const hasCharts =
    slug.startsWith("reports/") ||
    slug === "hrm/performance" ||
    slug === "sales/crm-overview" ||
    slug === "projects/project-overview" ||
    slug === "service/service-overview" ||
    slug === "finance/finance-overview" ||
    slug === "procurement/shipment-tracking" ||
    slug === "sales/sales-orders" ||
    slug === "procurement/purchase-orders" ||
    slug === "procurement/import-shipments" ||
    slug === "inventory/chargers" ||
    slug === "service/service-requests" ||
    slug === "service/complaints-and-breakdowns" ||
    slug === "projects/projects";

  if (!hasCharts) return null;

  return (
    <div className="mb-5">
      {/* 1. BUSINESS PERFORMANCE */}
      {slug === "reports/business-performance" && <BusinessPerformanceCharts />}

      {/* 2. SALES & CRM */}
      {(slug === "reports/sales-analytics" ||
        slug === "sales/crm-overview" ||
        slug === "sales/sales-orders") && <SalesCrmCharts />}

      {/* 3. INVENTORY & CHARGERS */}
      {(slug === "reports/inventory-analytics" || slug === "inventory/chargers") && (
        <InventoryCharts />
      )}

      {/* 4. PROCUREMENT & IMPORTS */}
      {(slug === "reports/procurement-analytics" ||
        slug === "procurement/shipment-tracking" ||
        slug === "procurement/purchase-orders" ||
        slug === "procurement/import-shipments") && <ProcurementCharts />}

      {/* 5. STATION OPERATIONS */}
      {(slug === "reports/station-operations" || slug === "network/station-reports") && (
        <StationOperationsCharts />
      )}

      {/* 6. SERVICE & MAINTENANCE */}
      {(slug === "reports/service-analytics" ||
        slug === "service/service-overview" ||
        slug === "service/service-requests" ||
        slug === "service/complaints-and-breakdowns") && <ServiceCharts />}

      {/* 7. FINANCIAL ANALYTICS */}
      {(slug === "reports/financial-analytics" || slug === "finance/finance-overview") && (
        <FinanceCharts />
      )}

      {/* 8. PROJECT PROFITABILITY */}
      {(slug === "reports/project-profitability" ||
        slug === "projects/project-overview" ||
        slug === "projects/projects") && <ProjectProfitabilityCharts />}

      {/* 9. HRM PERFORMANCE */}
      {slug === "hrm/performance" && <HrmPerformanceCharts />}

      {/* 10. GENERIC / FALLBACK REPORTS */}
      {![
        "reports/business-performance",
        "reports/sales-analytics",
        "sales/crm-overview",
        "sales/sales-orders",
        "reports/inventory-analytics",
        "inventory/chargers",
        "reports/procurement-analytics",
        "procurement/shipment-tracking",
        "procurement/purchase-orders",
        "procurement/import-shipments",
        "reports/station-operations",
        "network/station-reports",
        "reports/service-analytics",
        "service/service-overview",
        "service/service-requests",
        "service/complaints-and-breakdowns",
        "reports/financial-analytics",
        "finance/finance-overview",
        "reports/project-profitability",
        "projects/project-overview",
        "projects/projects",
        "hrm/performance",
      ].includes(slug) && <GenericModuleCharts records={records} />}
    </div>
  );
}

/* =========================================================================
   1. BUSINESS PERFORMANCE CHARTS
   ========================================================================= */
function BusinessPerformanceCharts() {
  const trends = [
    { month: "Jun", revenue: 85, landedCost: 62, grossMargin: 23 },
    { month: "Jul", revenue: 115, landedCost: 82, grossMargin: 33 },
    { month: "Aug", revenue: 105, landedCost: 74, grossMargin: 31 },
    { month: "Sep", revenue: 142, landedCost: 98, grossMargin: 44 },
    { month: "Oct", revenue: 130, landedCost: 89, grossMargin: 41 },
    { month: "Nov", revenue: 184, landedCost: 122, grossMargin: 62 },
  ];

  const categoryShare = [
    { name: "DC Fast Chargers (60-180kW)", value: 58, color: "#2563eb" },
    { name: "AC Commercial Wallboxes (7-22kW)", value: 24, color: "#059669" },
    { name: "Cables & Connectors (CCS2/GB-T)", value: 11, color: "#d97706" },
    { name: "Spare Parts & Power Modules", value: 7, color: "#7c3aed" },
  ];

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Panel
          title="Revenue vs. Landed Import Cost vs. Gross Margin"
          subtitle="Monthly financial trajectory · NPR in lakhs"
        >
          <div className="p-4">
            <ResponsiveContainer width="100%" height={230}>
              <ComposedChart data={trends} margin={{ left: 0, right: 20, top: 10, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 9, fill: "var(--muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}L`}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(val) => `NPR ${Number(val).toFixed(1)} L`}
                />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "5px" }} />
                <Bar
                  dataKey="landedCost"
                  name="Landed Cost (CIF+Duty)"
                  fill="#94a3b8"
                  radius={[4, 4, 0, 0]}
                  barSize={18}
                />
                <Bar
                  dataKey="grossMargin"
                  name="Gross Margin"
                  fill="#059669"
                  radius={[4, 4, 0, 0]}
                  barSize={18}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  name="Total Revenue"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <div>
        <Panel title="Revenue by Equipment Category" subtitle="Hardware sales distribution">
          <div className="p-4">
            <ResponsiveContainer width="100%" height={170}>
              <PieChart>
                <Pie
                  data={categoryShare}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={3}
                >
                  {categoryShare.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => `${v}% of total`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 space-y-1 text-[10px]">
              {categoryShare.map((c) => (
                <div key={c.name} className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 truncate">
                    <span className="size-2 rounded-full" style={{ backgroundColor: c.color }} />
                    <span className="truncate text-muted-foreground">{c.name}</span>
                  </span>
                  <span className="font-semibold">{c.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}

/* =========================================================================
   2. SALES & CRM CHARTS
   ========================================================================= */
function SalesCrmCharts() {
  const funnelData = [
    { stage: "Dealer Enquiries", count: 180, fill: "#3b82f6" },
    { stage: "Feasibility Validated", count: 124, fill: "#06b6d4" },
    { stage: "Quotations Issued", count: 86, fill: "#8b5cf6" },
    { stage: "Sales Orders Signed", count: 42, fill: "#10b981" },
    { stage: "Commissioned & Paid", count: 36, fill: "#059669" },
  ];

  const channelComparison = [
    { channel: "Fuel Stations", orders: 18, revenue: 64 },
    { channel: "Malls / Hubs", orders: 12, revenue: 42 },
    { channel: "Highway Resorts", orders: 9, revenue: 38 },
    { channel: "Fleet Operators", orders: 6, revenue: 31 },
    { channel: "Regional Dealers", orders: 15, revenue: 26 },
  ];

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Panel
        title="Sales Pipeline Conversion Funnel"
        subtitle="Deal volume through qualification and contracting stages"
      >
        <div className="p-4">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={funnelData}
              layout="vertical"
              margin={{ left: 10, right: 30, top: 5, bottom: 0 }}
            >
              <CartesianGrid horizontal={false} stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis
                type="number"
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                dataKey="stage"
                type="category"
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                width={120}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v) => [`${v} Deals`, "Pipeline Volume"]}
              />
              <Bar dataKey="count" name="Deals" radius={[0, 4, 4, 0]} barSize={16}>
                {funnelData.map((d) => (
                  <Cell key={d.stage} fill={d.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <Panel
        title="Revenue by Customer Segment / Channel"
        subtitle="NPR Lakhs vs. Equipment Units Sold"
      >
        <div className="p-4">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={channelComparison} margin={{ left: 0, right: 20, top: 10, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis
                dataKey="channel"
                tick={{ fontSize: 9, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
              <Bar
                dataKey="revenue"
                name="Revenue (Lakhs NPR)"
                fill="#2563eb"
                radius={[4, 4, 0, 0]}
                barSize={18}
              />
              <Bar
                dataKey="orders"
                name="Units Sold"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
                barSize={18}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>
    </div>
  );
}

/* =========================================================================
   3. INVENTORY & CHARGERS CHARTS
   ========================================================================= */
function InventoryCharts() {
  const agingData = [
    { period: "0-30 Days (Fast Moving)", value: 48, color: "#10b981" },
    { period: "31-60 Days (Normal)", value: 28, color: "#3b82f6" },
    { period: "61-90 Days (Buffer)", value: 16, color: "#f59e0b" },
    { period: ">90 Days (Slow/Reserve)", value: 8, color: "#ef4444" },
  ];

  const warehouseValuation = [
    { name: "Kathmandu Central", dcChargers: 42, acWallboxes: 85, cablesParts: 140 },
    { name: "Birgunj Bonded ICD", dcChargers: 32, acWallboxes: 40, cablesParts: 95 },
    { name: "Pokhara Regional", dcChargers: 14, acWallboxes: 36, cablesParts: 55 },
    { name: "Biratnagar East", dcChargers: 12, acWallboxes: 28, cablesParts: 45 },
  ];

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Panel
        title="Warehouse Valuation & Equipment Breakdown"
        subtitle="Stock distribution across regional hubs"
      >
        <div className="p-4">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={warehouseValuation} margin={{ left: 0, right: 20, top: 10, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 9, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
              <Bar dataKey="dcChargers" name="DC Chargers" fill="#2563eb" stackId="a" />
              <Bar dataKey="acWallboxes" name="AC Wallboxes" fill="#059669" stackId="a" />
              <Bar dataKey="cablesParts" name="Cables & Spares" fill="#d97706" stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <Panel title="Inventory Aging Profile" subtitle="Capital allocation by stock age bracket">
        <div className="p-4">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={agingData}
                dataKey="value"
                nameKey="period"
                innerRadius={45}
                outerRadius={75}
                paddingAngle={3}
              >
                {agingData.map((d) => (
                  <Cell key={d.period} fill={d.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v) => [`${v}% of Inventory`, "Share"]}
              />
              <Legend wrapperStyle={{ fontSize: "10px" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Panel>
    </div>
  );
}

/* =========================================================================
   4. PROCUREMENT & IMPORT CHARTS
   ========================================================================= */
function ProcurementCharts() {
  const landedCostComponents = [
    { item: "FOB Ex-Factory Hardware", percentage: 72, color: "#2563eb" },
    { item: "Maritime Ocean Freight", percentage: 6.5, color: "#06b6d4" },
    { item: "Indian Rail Transit", percentage: 4.5, color: "#8b5cf6" },
    { item: "Nepal Customs Duty (1%)", percentage: 1.0, color: "#10b981" },
    { item: "Nepal VAT (13%)", percentage: 13.0, color: "#f59e0b" },
    { item: "Insurance & Port Handling", percentage: 3.0, color: "#ef4444" },
  ];

  const leadTimeHistory = [
    { consignment: "PO-088", factoryLead: 18, maritimeDays: 14, customsDays: 4, deliveryDays: 2 },
    { consignment: "PO-092", factoryLead: 20, maritimeDays: 15, customsDays: 3, deliveryDays: 2 },
    { consignment: "PO-095", factoryLead: 16, maritimeDays: 13, customsDays: 5, deliveryDays: 3 },
    { consignment: "PO-099", factoryLead: 19, maritimeDays: 14, customsDays: 3, deliveryDays: 2 },
    { consignment: "PO-104", factoryLead: 17, maritimeDays: 12, customsDays: 4, deliveryDays: 2 },
  ];

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Panel
        title="Landed Cost Structure (CIF Birgunj + Duties)"
        subtitle="Percentage cost breakdown per import consignment"
      >
        <div className="p-4">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={landedCostComponents}
                dataKey="percentage"
                nameKey="item"
                innerRadius={45}
                outerRadius={75}
                paddingAngle={3}
              >
                {landedCostComponents.map((d) => (
                  <Cell key={d.item} fill={d.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}%`, "Cost Share"]} />
              <Legend wrapperStyle={{ fontSize: "10px" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <Panel
        title="Consignment Lead Time History (Days)"
        subtitle="Production, ocean shipping, customs, and inland delivery"
      >
        <div className="p-4">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={leadTimeHistory} margin={{ left: 0, right: 20, top: 10, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis
                dataKey="consignment"
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
              <Bar dataKey="factoryLead" name="OEM Production" fill="#2563eb" stackId="t" />
              <Bar dataKey="maritimeDays" name="Ocean Freight" fill="#06b6d4" stackId="t" />
              <Bar dataKey="customsDays" name="Customs Clearance" fill="#f59e0b" stackId="t" />
              <Bar dataKey="deliveryDays" name="Highway Transit" fill="#10b981" stackId="t" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>
    </div>
  );
}

/* =========================================================================
   5. STATION OPERATIONS CHARTS
   ========================================================================= */
function StationOperationsCharts() {
  const { data: siteSettings } = useQuery(siteSettingsQuery);
  const hourlyLoadCurve = (
    siteSettings?.stats?.powerDemand24h && siteSettings.stats.powerDemand24h.length > 0
      ? siteSettings.stats.powerDemand24h
      : DEFAULT_POWER_DEMAND_24H
  ).map((p) => ({
    hour: p.hour,
    loadKw: p.kw,
    sessions: p.sessions,
  }));

  const weeklyEnergy =
    siteSettings?.stats?.weeklyEnergyDispensed &&
    siteSettings.stats.weeklyEnergyDispensed.length > 0
      ? siteSettings.stats.weeklyEnergyDispensed
      : DEFAULT_WEEKLY_ENERGY;

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Panel
        title="24-Hour Charging Load Curve (Grid Demand)"
        subtitle="CMS-managed concurrent kW load across Nepal fast-charging corridors"
      >
        <div className="p-4">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={hourlyLoadCurve} margin={{ left: 0, right: 20, top: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="opLoadGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis
                dataKey="hour"
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}kW`}
              />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} kW`, "Grid Load"]} />
              <Area
                type="monotone"
                dataKey="loadKw"
                name="Grid Load (kW)"
                stroke="#2563eb"
                fillOpacity={1}
                fill="url(#opLoadGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <Panel
        title="Weekly Energy Throughput & Sessions"
        subtitle="Kilowatt-hours dispensed and vehicle sessions by day"
      >
        <div className="p-4">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weeklyEnergy} margin={{ left: 0, right: 20, top: 10, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
              <Bar
                dataKey="kwh"
                name="Energy (kWh)"
                fill="#059669"
                radius={[4, 4, 0, 0]}
                barSize={18}
              />
              <Bar
                dataKey="sessions"
                name="Sessions"
                fill="#d97706"
                radius={[4, 4, 0, 0]}
                barSize={18}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>
    </div>
  );
}

/* =========================================================================
   6. SERVICE & MAINTENANCE CHARTS
   ========================================================================= */
function ServiceCharts() {
  const mttrTrend = [
    { month: "Jun", mttrHours: 6.2, firstTimeFix: 84 },
    { month: "Jul", mttrHours: 5.4, firstTimeFix: 87 },
    { month: "Aug", mttrHours: 4.8, firstTimeFix: 89 },
    { month: "Sep", mttrHours: 4.2, firstTimeFix: 91 },
    { month: "Oct", mttrHours: 3.6, firstTimeFix: 93 },
    { month: "Nov", mttrHours: 3.1, firstTimeFix: 95 },
  ];

  const rootCauses = [
    { name: "Grid Voltage Fluctuation", value: 38, color: "#ef4444" },
    { name: "Gun / Cable Mechanical Wear", value: 24, color: "#f59e0b" },
    { name: "OCPP Network / SIM Drop", value: 18, color: "#3b82f6" },
    { name: "Power Module Over-Temp", value: 12, color: "#8b5cf6" },
    { name: "Protocol / Firmware Mismatch", value: 8, color: "#10b981" },
  ];

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Panel
        title="Mean Time To Repair (MTTR) vs. First-Time-Fix Trend"
        subtitle="Resolution speed in hours vs. first-visit success rate"
      >
        <div className="p-4">
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={mttrTrend} margin={{ left: 0, right: 20, top: 10, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}h`}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
              <Bar
                yAxisId="left"
                dataKey="mttrHours"
                name="MTTR (Hours)"
                fill="#ef4444"
                radius={[4, 4, 0, 0]}
                barSize={18}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="firstTimeFix"
                name="First-Time-Fix %"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={{ r: 3 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <Panel
        title="Breakdown Root Cause Distribution"
        subtitle="Field failure modes across Nepal climate and grid conditions"
      >
        <div className="p-4">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={rootCauses}
                dataKey="value"
                nameKey="name"
                innerRadius={45}
                outerRadius={75}
                paddingAngle={3}
              >
                {rootCauses.map((d) => (
                  <Cell key={d.name} fill={d.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v) => [`${v}% of incidents`, "Incidence"]}
              />
              <Legend wrapperStyle={{ fontSize: "10px" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Panel>
    </div>
  );
}

/* =========================================================================
   7. FINANCIAL CHARTS
   ========================================================================= */
function FinanceCharts() {
  const cashflowTimeline = [
    { month: "Jun", inflows: 85, outflows: 70, netCash: 15 },
    { month: "Jul", inflows: 115, outflows: 90, netCash: 25 },
    { month: "Aug", inflows: 105, outflows: 82, netCash: 23 },
    { month: "Sep", inflows: 142, outflows: 108, netCash: 34 },
    { month: "Oct", inflows: 130, outflows: 98, netCash: 32 },
    { month: "Nov", inflows: 184, outflows: 135, netCash: 49 },
  ];

  const receivablesAging = [
    { bucket: "Current (0-30d)", amountLakhs: 78, color: "#10b981" },
    { bucket: "31-60 Days", amountLakhs: 32, color: "#3b82f6" },
    { bucket: "61-90 Days", amountLakhs: 14, color: "#f59e0b" },
    { bucket: ">90d Overdue", amountLakhs: 6, color: "#ef4444" },
  ];

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Panel
        title="Cash Inflows vs. Outflows vs. Net Liquidity"
        subtitle="Monthly operating liquidity · NPR in lakhs"
      >
        <div className="p-4">
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart
              data={cashflowTimeline}
              margin={{ left: 0, right: 20, top: 10, bottom: 0 }}
            >
              <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}L`}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v) => `NPR ${Number(v).toFixed(1)} L`}
              />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
              <Bar
                dataKey="inflows"
                name="Cash Inflows"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
                barSize={16}
              />
              <Bar
                dataKey="outflows"
                name="Outflows (Imports+Tax)"
                fill="#94a3b8"
                radius={[4, 4, 0, 0]}
                barSize={16}
              />
              <Line
                type="monotone"
                dataKey="netCash"
                name="Net Cashflow"
                stroke="#2563eb"
                strokeWidth={2.5}
                dot={{ r: 3 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <Panel
        title="Accounts Receivable Aging Breakdown"
        subtitle="Outstanding balances across commercial accounts"
      >
        <div className="p-4">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={receivablesAging} margin={{ left: 0, right: 20, top: 10, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis
                dataKey="bucket"
                tick={{ fontSize: 9, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}L`}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v) => [`NPR ${v} Lakhs`, "Receivable"]}
              />
              <Bar dataKey="amountLakhs" name="Amount (Lakhs)" radius={[4, 4, 0, 0]} barSize={22}>
                {receivablesAging.map((d) => (
                  <Cell key={d.bucket} fill={d.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>
    </div>
  );
}

/* =========================================================================
   8. PROJECT PROFITABILITY CHARTS
   ========================================================================= */
function ProjectProfitabilityCharts() {
  const projectMargins = [
    { name: "Kurintar Hub", actualCost: 36, revenue: 52 },
    { name: "Pokhara Ultra", actualCost: 44, revenue: 64 },
    { name: "Birgunj Fleet", actualCost: 55, revenue: 76 },
    { name: "Ring Road Fast", actualCost: 32, revenue: 48 },
    { name: "Itahari Hub", actualCost: 27, revenue: 39 },
  ];

  const projectCostBreakdown = [
    { component: "EVSE Hardware", share: 64, color: "#2563eb" },
    { component: "Civil & Canopy", share: 14, color: "#06b6d4" },
    { component: "Transformer", share: 12, color: "#8b5cf6" },
    { component: "Electrical & Breakers", share: 7, color: "#f59e0b" },
    { component: "Commissioning", share: 3, color: "#10b981" },
  ];

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Panel
        title="Project Financial Performance (NPR Lakhs)"
        subtitle="Contract value vs. actual installation cost"
      >
        <div className="p-4">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={projectMargins} margin={{ left: 0, right: 20, top: 10, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 9, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => `NPR ${v} Lakhs`} />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
              <Bar
                dataKey="revenue"
                name="Contract Value"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
                barSize={18}
              />
              <Bar
                dataKey="actualCost"
                name="Actual Cost"
                fill="#94a3b8"
                radius={[4, 4, 0, 0]}
                barSize={18}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <Panel
        title="Turnkey Project Cost Breakdown"
        subtitle="Capital allocation across installation components"
      >
        <div className="p-4">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={projectCostBreakdown}
                dataKey="share"
                nameKey="component"
                innerRadius={45}
                outerRadius={75}
                paddingAngle={3}
              >
                {projectCostBreakdown.map((d) => (
                  <Cell key={d.component} fill={d.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}%`, "Cost Share"]} />
              <Legend wrapperStyle={{ fontSize: "10px" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Panel>
    </div>
  );
}

/* =========================================================================
   9. HRM PERFORMANCE CHARTS
   ========================================================================= */
function HrmPerformanceCharts() {
  const departmentScores = [
    { department: "Field Engineering", target: 85, achieved: 94 },
    { department: "Logistics", target: 85, achieved: 92 },
    { department: "Sales & Dealers", target: 80, achieved: 88 },
    { department: "HV Testing Lab", target: 90, achieved: 96 },
    { department: "NOC Support", target: 85, achieved: 91 },
  ];

  const technicianPerformance = [
    { tech: "Bikash S.", jobs: 24, sla: 98 },
    { tech: "Sunil T.", jobs: 21, sla: 96 },
    { tech: "Pradeep J.", jobs: 19, sla: 95 },
    { tech: "Ramesh A.", jobs: 18, sla: 94 },
    { tech: "Anil G.", jobs: 16, sla: 92 },
  ];

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Panel
        title="Departmental Performance vs. Benchmark Target"
        subtitle="KPI achievement score across operational divisions"
      >
        <div className="p-4">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={departmentScores} margin={{ left: 0, right: 20, top: 10, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis
                dataKey="department"
                tick={{ fontSize: 9, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
                domain={[70, 100]}
              />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => `${v}%`} />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
              <Bar
                dataKey="achieved"
                name="Achieved Score %"
                fill="#2563eb"
                radius={[4, 4, 0, 0]}
                barSize={18}
              />
              <Bar
                dataKey="target"
                name="Benchmark Target %"
                fill="#94a3b8"
                radius={[4, 4, 0, 0]}
                barSize={18}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <Panel
        title="Field Technician SLA Compliance & Jobs Completed"
        subtitle="Work orders executed and SLA adherence rate"
      >
        <div className="p-4">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={technicianPerformance}
              margin={{ left: 0, right: 20, top: 10, bottom: 0 }}
            >
              <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis
                dataKey="tech"
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
              <Bar
                dataKey="jobs"
                name="Jobs Completed"
                fill="#059669"
                radius={[4, 4, 0, 0]}
                barSize={18}
              />
              <Bar
                dataKey="sla"
                name="SLA Compliance %"
                fill="#2563eb"
                radius={[4, 4, 0, 0]}
                barSize={18}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>
    </div>
  );
}

/* =========================================================================
   10. GENERIC / FALLBACK CHARTS
   ========================================================================= */
function GenericModuleCharts({ records }: { records: BusinessRecord[] }) {
  const activeCount =
    records.filter((r) => r.status === "Active" || r.status === "Operational").length || 18;
  const pendingCount =
    records.filter((r) => r.status === "Pending" || r.status === "Partially Active").length || 6;
  const otherCount =
    records.filter(
      (r) => !["Active", "Operational", "Pending", "Partially Active"].includes(r.status),
    ).length || 3;

  const statusDistribution = [
    { name: "Active / Operational", value: activeCount, color: "#10b981" },
    { name: "Pending", value: pendingCount, color: "#f59e0b" },
    { name: "Draft / Backlog", value: otherCount, color: "#94a3b8" },
  ];

  const trendData = [
    { period: "M-5", volume: 14, completed: 12 },
    { period: "M-4", volume: 18, completed: 16 },
    { period: "M-3", volume: 22, completed: 20 },
    { period: "M-2", volume: 28, completed: 25 },
    { period: "M-1", volume: 34, completed: 31 },
    { period: "Current", volume: 42, completed: 39 },
  ];

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Panel
        title="Activity Throughput vs. Completion Trend"
        subtitle="Recent operational cycle volume"
      >
        <div className="p-4">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trendData} margin={{ left: 0, right: 20, top: 10, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis
                dataKey="period"
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
              <Area
                type="monotone"
                dataKey="volume"
                name="Total Volume"
                stroke="#2563eb"
                fill="#2563eb"
                fillOpacity={0.15}
              />
              <Area
                type="monotone"
                dataKey="completed"
                name="Completed"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <Panel title="Status Composition" subtitle="Record lifecycle distribution">
        <div className="p-4">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={statusDistribution}
                dataKey="value"
                nameKey="name"
                innerRadius={45}
                outerRadius={75}
                paddingAngle={3}
              >
                {statusDistribution.map((d) => (
                  <Cell key={d.name} fill={d.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Panel>
    </div>
  );
}
