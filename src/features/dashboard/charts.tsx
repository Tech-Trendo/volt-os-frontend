import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
const sales = [
  { month: "Jun", sales: 85, revenue: 62 },
  { month: "Jul", sales: 115, revenue: 94 },
  { month: "Aug", sales: 105, revenue: 78 },
  { month: "Sep", sales: 142, revenue: 118 },
  { month: "Oct", sales: 130, revenue: 101 },
  { month: "Nov", sales: 184.5, revenue: 156 },
];
export function SalesChart({
  multiplier = 1,
  onClick,
}: {
  multiplier?: number;
  onClick?: () => void;
}) {
  return (
    <ResponsiveContainer width="100%" height={232}>
      <AreaChart
        data={sales.map((s) => ({
          ...s,
          sales: s.sales * multiplier,
          revenue: s.revenue * multiplier,
        }))}
        margin={{ left: 0, right: 20, top: 10, bottom: 0 }}
        onClick={() => onClick?.()}
      >
        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
        <XAxis
          dataKey="month"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
          dy={8}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
          tickFormatter={(n) => `${n}L`}
          width={43}
        />
        <Tooltip
          contentStyle={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            fontSize: 11,
          }}
          formatter={(v) => `NPR ${Number(v).toFixed(1)} L`}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          name="Revenue"
          stroke="var(--chart-2)"
          strokeWidth={2}
          fill="var(--chart-2)"
          fillOpacity={0.035}
        />
        <Area
          type="monotone"
          dataKey="sales"
          name="Sales"
          stroke="var(--primary)"
          strokeWidth={2.2}
          fill="var(--primary)"
          fillOpacity={0.07}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
export function WarehouseChart({
  onClick,
  financial = true,
}: {
  onClick?: () => void;
  financial?: boolean;
}) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart
        data={[
          { name: "Kathmandu", value: 148 },
          { name: "Pokhara", value: 76 },
          { name: "Biratnagar", value: 64 },
          { name: "Birgunj", value: 38 },
        ]}
        layout="vertical"
        margin={{ left: 0, right: 30, top: 0, bottom: 0 }}
        onClick={() => onClick?.()}
      >
        <CartesianGrid horizontal={false} stroke="var(--border)" strokeDasharray="3 3" />
        <XAxis
          type="number"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 9, fill: "var(--muted-foreground)" }}
          tickFormatter={(n) => (financial ? `${n}L` : `${n}`)}
        />
        <YAxis
          type="category"
          dataKey="name"
          axisLine={false}
          tickLine={false}
          width={78}
          tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
        />
        <Tooltip
          contentStyle={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            fontSize: 11,
          }}
          formatter={(v) => (financial ? `NPR ${v} L` : `${v} units`)}
        />
        <Bar dataKey="value" barSize={16} fill="var(--primary)" radius={[0, 3, 3, 0]}>
          {[1, 2, 3, 4].map((n, i) => (
            <Cell key={n} fill={i === 0 ? "var(--primary)" : "var(--chart-2)"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
export function DonutChart({
  data,
  center,
  onClick,
}: {
  data: { name: string; value: number; color: string }[];
  center: string;
  onClick?: (name: string) => void;
}) {
  return (
    <div className="relative h-44">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={55}
            outerRadius={72}
            paddingAngle={3}
            stroke="var(--card)"
            onClick={(entry) => onClick?.(String(entry.name))}
          >
            {data.map((d) => (
              <Cell key={d.name} fill={`var(${d.color})`} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              fontSize: 11,
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <strong className="text-2xl font-semibold">{center}</strong>
        <span className="text-[10px] text-muted-foreground">Total</span>
      </div>
    </div>
  );
}

export function ChargerTierChart({ onClick }: { onClick?: () => void }) {
  const data = [
    { tier: "22kW AC", count: 42, color: "#10b981" },
    { tier: "60kW DC", count: 28, color: "#06b6d4" },
    { tier: "120kW DC", count: 24, color: "#2563eb" },
    { tier: "180kW DC", count: 12, color: "#7c3aed" },
  ];

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart
        data={data}
        margin={{ left: 0, right: 20, top: 10, bottom: 0 }}
        onClick={() => onClick?.()}
      >
        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
        <XAxis
          dataKey="tier"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 9, fill: "var(--muted-foreground)" }}
          width={30}
        />
        <Tooltip
          contentStyle={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            fontSize: 11,
          }}
          formatter={(v) => [`${v} Units`, "Imported & Deployed"]}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={22}>
          {data.map((d) => (
            <Cell key={d.tier} fill={d.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function PipelineFunnelChart({ onClick }: { onClick?: (stage: string) => void }) {
  const stages = [
    { stage: "Enquiries", count: 40, pct: 100, color: "bg-blue-600" },
    { stage: "Technical Feasibility", count: 35, pct: 87.5, color: "bg-cyan-600" },
    { stage: "Quotations Issued", count: 25, pct: 62.5, color: "bg-purple-600" },
    { stage: "Confirmed Orders", count: 7, pct: 17.5, color: "bg-emerald-600" },
  ];

  return (
    <div className="space-y-3 px-5 py-3" onClick={() => onClick?.("sales/sales-orders")}>
      {stages.map((s) => (
        <div key={s.stage} className="space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-medium text-muted-foreground">{s.stage}</span>
            <span className="font-bold text-foreground">
              {s.count}{" "}
              <span className="text-[10px] font-normal text-muted-foreground">({s.pct}%)</span>
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full transition-all ${s.color}`}
              style={{ width: `${s.pct}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
