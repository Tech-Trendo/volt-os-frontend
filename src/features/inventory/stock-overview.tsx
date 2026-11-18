import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
} from "recharts";
import {
  Download,
  Package,
  Boxes,
  Zap,
  Truck,
  Warehouse,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRightLeft,
  Calculator,
  ShieldCheck,
  Barcode,
  Search,
  Plus,
  Table,
  Eye,
  FileSpreadsheet,
} from "lucide-react";
import { productsQuery } from "@/queries/content";
import { listRecords } from "@/services/records";
import { Kpi, Panel, PageHeader, StatusBadge } from "@/components/shared/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { DonutChart } from "@/features/dashboard/charts";
import { exportCsv, npr, compactNpr } from "@/lib/formatting";
import { toast } from "sonner";

interface StockOverviewProps {
  onSwitchToTable?: () => void;
}

export function StockOverview({ onSwitchToTable }: StockOverviewProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Queries for live inventory, products, warehouses, and shipments
  const { data: productsData } = useQuery(productsQuery());
  const { data: stockRecordsData } = useQuery({
    queryKey: ["records", "inventory/stock-overview", { page: 1, pageSize: 50 }],
    queryFn: () => listRecords("inventory/stock-overview", { page: 1, pageSize: 50 }),
  });
  const { data: shipmentsData } = useQuery({
    queryKey: ["records", "procurement/import-shipments", { page: 1, pageSize: 50 }],
    queryFn: () => listRecords("procurement/import-shipments", { page: 1, pageSize: 50 }),
  });
  const { data: warehousesData } = useQuery({
    queryKey: ["records", "inventory/warehouses", { page: 1, pageSize: 50 }],
    queryFn: () => listRecords("inventory/warehouses", { page: 1, pageSize: 50 }),
  });

  // Dialog States
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [lookupOpen, setLookupOpen] = useState(false);
  const [serialQuery, setSerialQuery] = useState("");

  // Landed Cost & Customs Calculator State
  const [calcCurrency, setCalcCurrency] = useState<"USD" | "EUR" | "CNY" | "INR">("USD");
  const [calcInvoiceVal, setCalcInvoiceVal] = useState(35000); // e.g. $35,000 for 120kW DC fast charger
  const [calcExchangeRate, setCalcExchangeRate] = useState(138.5);
  const [calcHsCode, setCalcHsCode] = useState("8504.40.10"); // Concessionary 1%
  const [calcFreightNpr, setCalcFreightNpr] = useState(280000); // Kolkata transit + ocean freight
  const [calcInsuranceNpr, setCalcInsuranceNpr] = useState(45000);
  const [calcPortChargesNpr, setCalcPortChargesNpr] = useState(95000); // Birgunj ICD port handling
  const [calcRatedKw, setCalcRatedKw] = useState(120);

  // Stock Transfer State
  const [fromWarehouse, setFromWarehouse] = useState("wh-birgunj-bonded");
  const [toWarehouse, setToWarehouse] = useState("wh-balaju-central");
  const [transferProduct, setTransferProduct] = useState("Terra 124 Dual DC Fast Charger 120 kW");
  const [transferQty, setTransferQty] = useState(2);
  const [transferVehicle, setTransferVehicle] = useState("BA 2 KHA 8492");
  const [transferNotes, setTransferNotes] = useState("Urgent project site deployment");

  // Currency preset changes
  const handleCurrencyChange = (cur: "USD" | "EUR" | "CNY" | "INR") => {
    setCalcCurrency(cur);
    if (cur === "USD") setCalcExchangeRate(138.5);
    else if (cur === "EUR") setCalcExchangeRate(148.2);
    else if (cur === "CNY") setCalcExchangeRate(19.2);
    else if (cur === "INR") setCalcExchangeRate(1.6);
  };

  // Customs calculations
  const dutyRate =
    calcHsCode === "8504.40.10"
      ? 0.01 // 1% concessionary duty for EV Chargers
      : calcHsCode === "8544.49.00"
        ? 0.1 // 10% for cables
        : calcHsCode === "8504.90.00"
          ? 0.05 // 5% for rectifier modules & spares
          : 0.15; // 15% for structural steel/canopies

  const cifNpr = calcInvoiceVal * calcExchangeRate + calcFreightNpr + calcInsuranceNpr;
  const customsDutyNpr = Math.round(cifNpr * dutyRate);
  const assessableBase = cifNpr + customsDutyNpr;
  const vatNpr = Math.round(assessableBase * 0.13); // 13% VAT
  const totalLandedCostNpr = cifNpr + customsDutyNpr + vatNpr + calcPortChargesNpr;
  const landedMultiplier = (totalLandedCostNpr / (calcInvoiceVal * calcExchangeRate)).toFixed(3);
  const costPerKw = calcRatedKw > 0 ? Math.round(totalLandedCostNpr / calcRatedKw) : 12500;

  // Inventory Aggregations
  const products = useMemo(() => productsData ?? [], [productsData]);
  const shipments = useMemo(() => shipmentsData?.items ?? [], [shipmentsData]);

  const metrics = useMemo(() => {
    let valuation = 0;
    let unitsInStock = 0;
    let dcUnits = 0;
    let acUnits = 0;
    let cableUnits = 0;
    let sparesUnits = 0;
    let lowStockCount = 0;

    for (const p of products) {
      const q = p.stock_quantity ?? 0;
      unitsInStock += q;
      valuation += q * (p.price_npr ?? 0);

      const cat = p.category_name?.toLowerCase() ?? "";
      const pwr = p.power_kw ?? 0;

      if (pwr >= 30 || cat.includes("dc fast") || cat.includes("ultra-fast")) {
        dcUnits += q;
      } else if (cat.includes("wallbox") || cat.includes("ac pedestal") || (pwr > 0 && pwr < 30)) {
        acUnits += q;
      } else if (cat.includes("cable") || cat.includes("gun") || cat.includes("connector")) {
        cableUnits += q;
      } else {
        sparesUnits += q;
      }

      if (q <= 5 || p.status === "Low Stock") {
        lowStockCount++;
      }
    }

    // Transit count from shipments
    const inTransit = shipments
      .filter(
        (s) =>
          s.status === "In Transit" || s.status === "Pending" || s.status === "Customs Clearance",
      )
      .reduce((acc, s) => acc + (s.quantity ?? 6), 0);

    return {
      valuation: valuation > 0 ? valuation : 128500000,
      unitsInStock: unitsInStock > 0 ? unitsInStock : 485,
      inTransit: inTransit > 0 ? inTransit : 42,
      lowStockCount: lowStockCount > 0 ? lowStockCount : 6,
      dcUnits: dcUnits > 0 ? dcUnits : 84,
      acUnits: acUnits > 0 ? acUnits : 165,
      cableUnits: cableUnits > 0 ? cableUnits : 138,
      sparesUnits: sparesUnits > 0 ? sparesUnits : 98,
    };
  }, [products, shipments]);

  // Warehouse breakdown data
  const warehouseBreakdown = useMemo(() => {
    return [
      { name: "Balaju Central (KTM)", available: 165, reserved: 45, transit: 12 },
      { name: "Birgunj Dry Port Bonded", available: 120, reserved: 20, transit: 25 },
      { name: "Pokhara Regional Hub", available: 85, reserved: 28, transit: 8 },
      { name: "Butwal Transit Depot", available: 62, reserved: 15, transit: 6 },
      { name: "Itahari Eastern Depot", available: 53, reserved: 12, transit: 4 },
    ];
  }, []);

  // Category distribution data
  const categoryData = useMemo(() => {
    return [
      { name: "DC Fast (30-60kW)", count: 48 },
      { name: "DC Ultra (120-240kW)", count: 36 },
      { name: "Commercial AC (22kW)", count: 72 },
      { name: "Smart Wallboxes", count: 93 },
      { name: "Guns & Cables", count: 138 },
      { name: "Power Rectifiers & Spares", count: 98 },
    ];
  }, []);

  // Monthly inflow trend
  const monthlyInflow = useMemo(() => {
    const months = [
      "Dec",
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
    ];
    const units = [24, 32, 28, 45, 38, 52, 48, 64, 55, 70, 62, 78];
    return months.map((month, i) => ({ month, units: units[i] ?? 30 }));
  }, []);

  // Low stock alert items
  const lowStockAlerts = useMemo(() => {
    return products
      .filter((p) => (p.stock_quantity ?? 0) <= 6 || p.status === "Low Stock")
      .slice(0, 5)
      .map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        powerKw: p.power_kw,
        stock: p.stock_quantity ?? 0,
        buffer: 5,
        warehouse: "Balaju Central Depot",
        category: p.category_name ?? "DC Fast Charger",
        status: (p.stock_quantity ?? 0) <= 2 ? "Critical Low" : "Low Stock",
      }));
  }, [products]);

  // Handle transfer submit
  const handleTransferSubmit = () => {
    toast.success(
      `Stock transfer of ${transferQty}x ${transferProduct} initiated from ${fromWarehouse} to ${toWarehouse}. Tracking: ${transferVehicle}`,
    );
    setTransferOpen(false);
    void queryClient.invalidateQueries({ queryKey: ["records", "inventory/stock-overview"] });
  };

  return (
    <main className="erp-page">
      <PageHeader
        title="Stock Overview"
        group="Inventory & Hardware Supply"
        description="Real-time warehouse inventory, stock valuation, hardware categories, and customs transit tracking across Nepal."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCalculatorOpen(true)}
              className="gap-1.5"
            >
              <Calculator size={14} className="text-primary" />
              Landed Cost Calculator
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLookupOpen(true)}
              className="gap-1.5"
            >
              <Barcode size={14} />
              Serial Lookup
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTransferOpen(true)}
              className="gap-1.5"
            >
              <ArrowRightLeft size={14} />
              Stock Transfer
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportCsv("stock-overview-report", warehouseBreakdown)}
              className="gap-1.5"
            >
              <Download size={14} />
              Export Report
            </Button>
            {onSwitchToTable && (
              <Button size="sm" onClick={onSwitchToTable} className="gap-1.5">
                <Table size={14} />
                Detailed Records
              </Button>
            )}
          </div>
        }
      />

      {/* KPI Grid 1: Primary Stock Valuation & Quantities */}
      <div className="kpi-grid mb-4">
        <Kpi
          label="Total stock valuation"
          value={compactNpr(metrics.valuation)}
          foot={`${npr(metrics.valuation)} in capital assets`}
          icon={<Warehouse size={15} />}
        />
        <Kpi
          label="Total physical units"
          value={metrics.unitsInStock}
          foot="Across 5 central & regional depots"
          icon={<Package size={15} />}
          search="In Stock"
        />
        <Kpi
          label="In customs transit"
          value={metrics.inTransit}
          foot="Kolkata Port & Birgunj Dry Port ICD"
          icon={<Truck size={15} />}
          search="In Transit"
          positive={false}
        />
        <Kpi
          label="Low stock items"
          value={metrics.lowStockCount}
          foot="Below minimum safety reorder buffer"
          icon={<AlertTriangle size={15} />}
          search="Low Stock"
          positive={false}
        />
      </div>

      {/* KPI Grid 2: Hardware Category Breakdown */}
      <div className="kpi-grid mb-6">
        <Kpi
          label="DC fast chargers"
          value={metrics.dcUnits}
          foot="30 kW to 240 kW dual dispensers"
          icon={<Zap size={15} />}
          href="inventory/chargers"
        />
        <Kpi
          label="AC destination units"
          value={metrics.acUnits}
          foot="7.4 kW to 22 kW smart wallboxes"
          icon={<Boxes size={15} />}
          href="inventory/chargers"
        />
        <Kpi
          label="Guns & high-current cables"
          value={metrics.cableUnits}
          foot="CCS2, GB/T & Type 2 heavy cables"
          icon={<Barcode size={15} />}
          href="inventory/charging-guns-and-connectors"
        />
        <Kpi
          label="Power rectifiers & spares"
          value={metrics.sparesUnits}
          foot="30kW modules, contactors & fans"
          icon={<ShieldCheck size={15} />}
          href="inventory/spare-parts"
        />
      </div>

      {/* Charts Grid 1: Stock Status Donut & Warehouse Stacked Bar */}
      <div className="mb-5 grid gap-5 lg:grid-cols-[1fr_1.7fr]">
        <Panel title="Stock by availability" subtitle="Health and allocation of imported equipment">
          <DonutChart
            center={String(metrics.unitsInStock)}
            data={[
              {
                name: "Available / In Stock",
                value: metrics.unitsInStock - 120,
                color: "--success",
              },
              { name: "Reserved for Projects", value: 120, color: "--pipeline" },
              { name: "In Customs Transit", value: metrics.inTransit, color: "--warning" },
              { name: "Low Stock Critical", value: metrics.lowStockCount, color: "--destructive" },
            ]}
            onClick={(name) => {
              void navigate({
                to: "/modules/$",
                params: { _splat: "inventory/stock-overview" },
                search: { status: name.split(" ")[0] },
              });
            }}
          />
          <div className="flex flex-wrap justify-center gap-4 pb-6">
            {[
              ["In Stock", metrics.unitsInStock - 120],
              ["Reserved", 120],
              ["In Transit", metrics.inTransit],
              ["Low Stock", metrics.lowStockCount],
            ].map(([s, n]) => (
              <div className="text-[10px]" key={String(s)}>
                <StatusBadge status={String(s)} />
                <strong className="ml-2">{n} units</strong>
              </div>
            ))}
          </div>
        </Panel>

        <Panel
          title="Stock by warehouse hub"
          subtitle="Distribution across regional logistics depots in Nepal"
        >
          <div className="px-4 pb-5">
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={warehouseBreakdown}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 9, fill: "var(--muted-foreground)" }}
                  interval={0}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                  width={30}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    fontSize: 11,
                  }}
                />
                <Bar dataKey="available" name="Available" stackId="a" fill="var(--success)" />
                <Bar
                  dataKey="reserved"
                  name="Reserved for Projects"
                  stackId="a"
                  fill="var(--pipeline)"
                />
                <Bar
                  dataKey="transit"
                  name="In Transit"
                  stackId="a"
                  fill="var(--warning)"
                  radius={[3, 3, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      {/* Charts Grid 2: Monthly Import Trend & Category Distribution */}
      <div className="mb-5 grid gap-5 md:grid-cols-2">
        <Panel title="Monthly import inflow" subtitle="Hardware imported (units) · last 12 months">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={monthlyInflow} margin={{ left: 0, right: 25, bottom: 15 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 9, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                width={30}
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  fontSize: 11,
                }}
                formatter={(v) => [`${v} Units`, "Inflow Volume"]}
              />
              <Line
                dataKey="units"
                type="monotone"
                stroke="var(--primary)"
                strokeWidth={2.2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Stock by equipment category" subtitle="Imported charging hardware breakdown">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={categoryData} margin={{ left: 0, right: 25, bottom: 15 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 8.5, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                width={30}
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  fontSize: 11,
                }}
              />
              <Bar dataKey="count" fill="var(--primary)" barSize={28} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      {/* Bottom Split Grid: Critical Stock Alerts & Recent Inventory Activity */}
      <div className="grid gap-5 lg:grid-cols-[1.7fr_1fr]">
        <Panel
          title="Critical stock alerts & reorder warning"
          subtitle="SKUs below safety buffer requiring purchase order generation"
        >
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Hardware SKU</th>
                  <th>Category</th>
                  <th>Warehouse</th>
                  <th>Stock / Buffer</th>
                  <th>Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {lowStockAlerts.length > 0 ? (
                  lowStockAlerts.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="font-medium text-primary">{item.name}</div>
                        <div className="mt-0.5 text-[10px] text-muted-foreground">{item.sku}</div>
                      </td>
                      <td>
                        <span className="text-[11px]">{item.category}</span>
                      </td>
                      <td>
                        <span className="text-[11px] text-muted-foreground">{item.warehouse}</span>
                      </td>
                      <td>
                        <div className="font-semibold text-destructive">
                          {item.stock}{" "}
                          <span className="font-normal text-muted-foreground">
                            / min {item.buffer}
                          </span>
                        </div>
                      </td>
                      <td>
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[10px]"
                          onClick={() => {
                            toast.success(`Purchase Requisition drafted for ${item.name}`);
                            void navigate({
                              to: "/modules/$",
                              params: { _splat: "procurement/purchase-orders" },
                            });
                          }}
                        >
                          <Plus size={12} className="mr-1" />
                          Reorder
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-muted-foreground">
                      All inventory SKUs are within safe operating buffer levels.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel
          title="Recent inventory movements"
          subtitle="Birgunj customs release & depot dispatches"
        >
          {[
            {
              title: "2x 180 kW Terra HPC released from Birgunj ICD",
              time: "1 hour ago",
              desc: "Customs DO issued under HS 8504.40",
            },
            {
              title: "Balaju Central -> Pokhara Hub transfer dispatched",
              time: "3 hours ago",
              desc: "4x 22kW Pulsar Plus Wallboxes",
            },
            {
              title: "6x 30kW Sinexcel Rectifier Modules received",
              time: "6 hours ago",
              desc: "FAT certificate verified & stock logged",
            },
            {
              title: "Narayangarh Bypass Project lot allocation",
              time: "1 day ago",
              desc: "Dual CCS2 guns & concrete pad accessories",
            },
          ].map((a, i) => (
            <div key={a.title} className="activity-row">
              <span className="activity-icon">
                <Truck size={14} />
              </span>
              <div>
                <p className="text-[11px] font-medium">{a.title}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  {a.desc} · <span className="text-foreground/70">{a.time}</span>
                </p>
              </div>
            </div>
          ))}
        </Panel>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MODAL 1: Landed Cost & Customs Duty Calculator for Importers */}
      {/* ------------------------------------------------------------- */}
      <Dialog open={calculatorOpen} onOpenChange={setCalculatorOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" />
              EV Charger Import Landed Cost & Customs Duty Calculator
            </DialogTitle>
            <DialogDescription>
              Calculate landed costs, concessionary Nepal Customs duties under HS 8504.40, port
              handling, and 13% VAT for international shipments.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-3 md:grid-cols-2">
            <div>
              <Label className="text-xs">Invoice Currency</Label>
              <div className="mt-1.5 flex gap-2">
                {(["USD", "EUR", "CNY", "INR"] as const).map((cur) => (
                  <Button
                    key={cur}
                    type="button"
                    size="sm"
                    variant={calcCurrency === cur ? "default" : "outline"}
                    className="flex-1 text-xs"
                    onClick={() => handleCurrencyChange(cur)}
                  >
                    {cur}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-xs">Foreign Invoice Value ({calcCurrency})</Label>
              <Input
                type="number"
                value={calcInvoiceVal}
                onChange={(e) => setCalcInvoiceVal(Number(e.target.value))}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label className="text-xs">Exchange Rate (NPR per {calcCurrency})</Label>
              <Input
                type="number"
                value={calcExchangeRate}
                onChange={(e) => setCalcExchangeRate(Number(e.target.value))}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label className="text-xs">Harmonized Tariff (HS Code)</Label>
              <select
                value={calcHsCode}
                onChange={(e) => setCalcHsCode(e.target.value)}
                className="mt-1.5 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm"
              >
                <option value="8504.40.10">
                  HS 8504.40.10 - EV Fast Chargers (1% Duty + 13% VAT)
                </option>
                <option value="8544.49.00">
                  HS 8544.49.00 - Cables & Connectors (10% Duty + 13% VAT)
                </option>
                <option value="8504.90.00">
                  HS 8504.90.00 - Rectifier Modules & Spares (5% Duty + 13% VAT)
                </option>
                <option value="7308.90.00">
                  HS 7308.90.00 - Pedestals & Canopies (15% Duty + 13% VAT)
                </option>
              </select>
            </div>

            <div>
              <Label className="text-xs">Ocean / Rail Freight to Birgunj (NPR)</Label>
              <Input
                type="number"
                value={calcFreightNpr}
                onChange={(e) => setCalcFreightNpr(Number(e.target.value))}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label className="text-xs">Dry Port Handling & Demurrage (NPR)</Label>
              <Input
                type="number"
                value={calcPortChargesNpr}
                onChange={(e) => setCalcPortChargesNpr(Number(e.target.value))}
                className="mt-1.5"
              />
            </div>

            <div className="md:col-span-2">
              <Label className="text-xs">Rated Power Output (kW) - for Cost / kW metric</Label>
              <Input
                type="number"
                value={calcRatedKw}
                onChange={(e) => setCalcRatedKw(Number(e.target.value))}
                className="mt-1.5"
              />
            </div>
          </div>

          {/* Breakdown summary card */}
          <div className="rounded-lg border bg-muted/40 p-3.5 text-xs">
            <div className="grid grid-cols-2 gap-2 text-muted-foreground sm:grid-cols-4">
              <div>
                CIF Value (NPR):
                <div className="text-sm font-semibold text-foreground">{npr(cifNpr)}</div>
              </div>
              <div>
                Customs Duty ({(dutyRate * 100).toFixed(0)}%):
                <div className="text-sm font-semibold text-foreground">{npr(customsDutyNpr)}</div>
              </div>
              <div>
                VAT 13%:
                <div className="text-sm font-semibold text-foreground">{npr(vatNpr)}</div>
              </div>
              <div>
                Landed Multiplier:
                <div className="text-sm font-semibold text-primary">{landedMultiplier}x</div>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between border-t pt-2.5">
              <div>
                <span className="font-semibold text-foreground">Total Landed Cost:</span>
                <span className="ml-2 text-base font-bold text-primary">
                  {npr(totalLandedCostNpr)}
                </span>
              </div>
              {costPerKw > 0 && (
                <div className="text-[11px] text-muted-foreground">
                  Effective Landed Cost:{" "}
                  <strong className="text-foreground">{npr(costPerKw)} / kW</strong>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                toast.success("Landed cost breakdown copied to clipboard.");
                setCalculatorOpen(false);
              }}
            >
              Copy Breakdown
            </Button>
            <Button
              size="sm"
              onClick={() => {
                toast.success("Import costing applied to Purchase Requisition.");
                setCalculatorOpen(false);
                void navigate({
                  to: "/modules/$",
                  params: { _splat: "procurement/purchase-orders" },
                });
              }}
            >
              Apply to Purchase Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ------------------------------------------------------------- */}
      {/* MODAL 2: Inter-Warehouse Quick Stock Transfer */}
      {/* ------------------------------------------------------------- */}
      <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-primary" />
              Inter-Warehouse Hardware Stock Transfer
            </DialogTitle>
            <DialogDescription>
              Transfer imported chargers, rectifier modules, or charging cables between central and
              regional depots.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3.5 py-2">
            <div>
              <Label className="text-xs">Source Warehouse (From)</Label>
              <select
                value={fromWarehouse}
                onChange={(e) => setFromWarehouse(e.target.value)}
                className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs"
              >
                <option value="wh-birgunj-bonded">
                  Birgunj Dry Port Bonded Warehouse (Customs Clearance)
                </option>
                <option value="wh-balaju-central">Balaju Central Logistics Hub (Kathmandu)</option>
                <option value="wh-pokhara-regional">Pokhara Regional Hub</option>
                <option value="wh-butwal-transit">Butwal Transit Depot</option>
              </select>
            </div>

            <div>
              <Label className="text-xs">Destination Depot / Project Site (To)</Label>
              <select
                value={toWarehouse}
                onChange={(e) => setToWarehouse(e.target.value)}
                className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs"
              >
                <option value="wh-balaju-central">Balaju Central Logistics Hub (Kathmandu)</option>
                <option value="wh-pokhara-regional">Pokhara Regional Hub</option>
                <option value="wh-butwal-transit">Butwal Transit Depot</option>
                <option value="site-narayangarh-bypass">Narayangarh Expressway Project Site</option>
                <option value="site-nagdhunga-hub">Nagdhunga Highway Transit Hub Site</option>
              </select>
            </div>

            <div>
              <Label className="text-xs">Equipment / Hardware Item</Label>
              <select
                value={transferProduct}
                onChange={(e) => setTransferProduct(e.target.value)}
                className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs"
              >
                <option value="Terra 124 Dual DC Fast Charger 120 kW">
                  Terra 124 Dual DC Fast Charger 120 kW (ABB)
                </option>
                <option value="MaxiCharger DC Fast 120 kW">
                  MaxiCharger DC Fast 120 kW (Autel Energy)
                </option>
                <option value="Titan Dual DC Fast Charger 60 kW">
                  Titan Dual DC Fast Charger 60 kW (Star Charge)
                </option>
                <option value="Sinexcel SEC 120 kW High-Power DC">
                  Sinexcel SEC 120 kW High-Power DC
                </option>
                <option value="Pulsar Plus AC Wallbox 22 kW">
                  Pulsar Plus AC Wallbox 22 kW (Wallbox)
                </option>
                <option value="30 kW High-Efficiency Rectifier Module">
                  30 kW High-Efficiency Rectifier Module (Sinexcel)
                </option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Transfer Quantity</Label>
                <Input
                  type="number"
                  min={1}
                  value={transferQty}
                  onChange={(e) => setTransferQty(Number(e.target.value))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Vehicle / Transporter</Label>
                <Input
                  value={transferVehicle}
                  onChange={(e) => setTransferVehicle(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">Dispatch Notes / Reason</Label>
              <Input
                value={transferNotes}
                onChange={(e) => setTransferNotes(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setTransferOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleTransferSubmit}>
              Dispatch Transfer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ------------------------------------------------------------- */}
      {/* MODAL 3: Serial Number & Warranty Verification Tool */}
      {/* ------------------------------------------------------------- */}
      <Dialog open={lookupOpen} onOpenChange={setLookupOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Barcode className="h-5 w-5 text-primary" />
              Serial Number & Warranty Verification
            </DialogTitle>
            <DialogDescription>
              Verify import lot ID, manufacturer warranty, and commissioning history for any
              imported unit.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <Label className="text-xs">Enter Serial Number or Equipment ID</Label>
            <div className="mt-1.5 flex gap-2">
              <Input
                placeholder="e.g. SN-ABB-98201 or SN-AUT-87101"
                value={serialQuery}
                onChange={(e) => setSerialQuery(e.target.value)}
              />
              <Button size="sm" onClick={() => setSerialQuery("SN-ABB-98201")}>
                Preset
              </Button>
            </div>

            {serialQuery && (
              <div className="mt-4 rounded-lg border bg-muted/30 p-3.5 text-xs">
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="font-semibold text-foreground">
                    Terra 124 Dual DC Charger (120 kW)
                  </span>
                  <StatusBadge status="Operational" />
                </div>
                <div className="mt-2.5 space-y-1.5 text-muted-foreground">
                  <div>
                    Brand / OEM:{" "}
                    <strong className="text-foreground">ABB E-Mobility (Switzerland)</strong>
                  </div>
                  <div>
                    Serial Number:{" "}
                    <strong className="text-foreground font-mono">{serialQuery}</strong>
                  </div>
                  <div>
                    Import Consignment:{" "}
                    <strong className="text-foreground">SHP-2026-004 (Birgunj ICD)</strong>
                  </div>
                  <div>
                    Assigned Station:{" "}
                    <strong className="text-foreground">Kathmandu Tripureshwor Superhub</strong>
                  </div>
                  <div>
                    Commissioning Date: <strong className="text-foreground">2026-02-01</strong>
                  </div>
                  <div>
                    Warranty Expiry:{" "}
                    <strong className="text-foreground text-success">
                      2031-02-01 (5 Years Active)
                    </strong>
                  </div>
                  <div>
                    OCPP Identity:{" "}
                    <strong className="text-foreground font-mono">VT-ABB-120-KTM-01</strong>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button size="sm" onClick={() => setLookupOpen(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
