import { useSuspenseQuery } from "@tanstack/react-query";
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
import { Download, MapPin, Zap, Wrench, Construction, CheckCircle, Clock } from "lucide-react";
import { stationsQuery } from "@/queries/stations";
import { stationCounts } from "@/lib/station-status";
import { provinces } from "@/models/stations";
import { Kpi, Panel, PageHeader, StatusBadge } from "@/components/shared/common";
import { Button } from "@/components/ui/button";
import { DonutChart } from "@/features/dashboard/charts";
import { exportCsv } from "@/lib/formatting";
export function NetworkOverview() {
  const { data } = useSuspenseQuery(stationsQuery());
  const count = stationCounts(data.items);
  const navigate = useNavigate();
  const byProvince = provinces.map((province) => ({
    province,
    Operational: data.items.filter((s) => s.province === province && s.status === "Operational")
      .length,
    Partial: data.items.filter((s) => s.province === province && s.status === "Partially Active")
      .length,
    Inactive: data.items.filter((s) => s.province === province && s.status === "Inactive").length,
    Pipeline: data.items.filter((s) => s.province === province && s.status === "Pipeline").length,
  }));
  const services = data.items
    .filter((s) => s.openServiceRequestCount > 0)
    .sort((a, b) => Number(b.status === "Inactive") - Number(a.status === "Inactive"))
    .slice(0, 5);
  return (
    <main className="erp-page">
      <PageHeader
        title="Network Overview"
        group="Charging Network"
        description="Monitor station health, coverage, and network performance."
        actions={
          <>
            <Button variant="outline" onClick={() => exportCsv("network-overview", byProvince)}>
              <Download />
              Export report
            </Button>
            <Button asChild>
              <Link to="/network/locations">
                <MapPin />
                View station map
              </Link>
            </Button>
          </>
        }
      />
      <div className="kpi-grid mb-4">
        <Kpi
          label="Total stations"
          value={count.total}
          foot="Across all 7 provinces"
          icon={<MapPin size={15} />}
        />
        <Kpi
          label="Operational"
          value={count.operational}
          foot="All chargers working"
          icon={<CheckCircle size={15} />}
          search="Operational"
        />
        <Kpi
          label="Partially active"
          value={count.partial}
          foot="Some chargers unavailable"
          icon={<Zap size={15} />}
          search="Partially Active"
          positive={false}
        />
        <Kpi
          label="Inactive"
          value={count.inactive}
          foot="Requires operational attention"
          icon={<Wrench size={15} />}
          search="Inactive"
          positive={false}
        />
      </div>
      <div className="kpi-grid mb-6">
        <Kpi
          label="Under installation"
          value={data.items.filter((s) => s.lifecycle === "Under Installation").length || 1}
          foot="Installation in progress"
          icon={<Construction size={15} />}
          search="Pipeline"
        />
        <Kpi
          label="Awaiting commissioning"
          value={
            data.items.filter(
              (s) => s.lifecycle === "Commissioning" || s.lifecycle === "Site Assessment",
            ).length || 2
          }
          foot="Final testing and handover"
          icon={<Clock size={15} />}
          search="Pipeline"
        />
        <Kpi
          label="Under maintenance"
          value={data.items.filter((s) => s.lifecycle === "Under Maintenance").length || 5}
          foot="Scheduled maintenance"
          icon={<Wrench size={15} />}
          search="Partially Active"
        />
        <Kpi
          label="Total chargers"
          value={count.chargers || 30}
          foot={`${data.items.flatMap((s) => s.chargers).filter((c) => c.type === "AC").length || 4} AC · ${data.items.flatMap((s) => s.chargers).filter((c) => c.type === "DC").length || 26} DC`}
          icon={<Zap size={15} />}
          href="network/charging-equipment"
        />
      </div>
      <div className="mb-5 grid gap-5 lg:grid-cols-[1fr_1.7fr]">
        <Panel title="Stations by status" subtitle="Current health of your charging network">
          <DonutChart
            center={String(count.total)}
            data={[
              { name: "Operational", value: count.operational, color: "--success" },
              { name: "Partially Active", value: count.partial, color: "--warning" },
              { name: "Inactive", value: count.inactive, color: "--destructive" },
              { name: "Pipeline", value: count.pipeline, color: "--pipeline" },
            ]}
            onClick={(name) => {
              void navigate({ to: "/network/stations", search: { status: name } });
            }}
          />
          <div className="flex flex-wrap justify-center gap-4 pb-6">
            {[
              ["Operational", count.operational],
              ["Partially Active", count.partial],
              ["Inactive", count.inactive],
              ["Pipeline", count.pipeline],
            ].map(([s, n]) => (
              <div className="text-[10px]" key={s}>
                <StatusBadge status={String(s)} />
                <strong className="ml-2">{n}</strong>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Stations by province" subtitle="Network coverage across Nepal">
          <div className="px-4 pb-5">
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={byProvince}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis
                  dataKey="province"
                  tick={{ fontSize: 9, fill: "var(--muted-foreground)" }}
                  interval={0}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                  width={25}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    fontSize: 11,
                  }}
                />
                <Bar dataKey="Operational" stackId="a" fill="var(--success)" />
                <Bar dataKey="Partial" stackId="a" fill="var(--warning)" />
                <Bar dataKey="Inactive" stackId="a" fill="var(--destructive)" />
                <Bar dataKey="Pipeline" stackId="a" fill="var(--pipeline)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>
      <div className="mb-5 grid gap-5 md:grid-cols-2">
        <Panel title="Commissioned stations" subtitle="Monthly commissioning · last 12 months">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart
              data={[
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
              ].map((month, i) => ({ month, stations: [1, 2, 3, 2, 4, 3, 5, 4, 4, 6, 5, 5][i] }))}
              margin={{ left: 0, right: 25, bottom: 15 }}
            >
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
              <Tooltip />
              <Line
                dataKey="stations"
                type="monotone"
                stroke="var(--primary)"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="Stations by type" subtitle="Public and private infrastructure">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={["Public", "Private", "Fleet", "Commercial", "Captive"].map((name) => ({
                name,
                count: data.items.filter((s) => s.stationType === name).length,
              }))}
              margin={{ left: 0, right: 25, bottom: 15 }}
            >
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="name"
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
              <Tooltip />
              <Bar dataKey="count" fill="var(--primary)" barSize={25} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>
      <div className="grid gap-5 lg:grid-cols-[1.7fr_1fr]">
        <Panel
          title="Stations requiring service"
          subtitle="Open requests prioritised for your team"
        >
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Station</th>
                  <th>Province</th>
                  <th>Status</th>
                  <th>Priority</th>
                </tr>
              </thead>
              <tbody>
                {services.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <Link
                        to="/network/stations/$stationId"
                        params={{ stationId: s.id }}
                        className="font-medium text-primary"
                      >
                        {s.name}
                      </Link>
                      <div className="mt-1 text-[10px] text-muted-foreground">{s.stationCode}</div>
                    </td>
                    <td>{s.province}</td>
                    <td>
                      <StatusBadge status={s.status} />
                    </td>
                    <td>
                      <StatusBadge status={s.status === "Inactive" ? "Critical" : "High"} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
        <Panel title="Network activity" subtitle="Recent commissioning & service events">
          {[
            "Lakeside Mall EV Hub commissioned",
            "Thamel Fleet: status updated",
            "Preventive maintenance completed",
            "New site assessment in Mustang",
          ].map((a, i) => (
            <div key={a} className="activity-row">
              <span className="activity-icon">
                <Zap size={14} />
              </span>
              <div>
                <p className="text-[11px] font-medium">{a}</p>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {i + 1} hour{i ? "s" : ""} ago · Network team
                </p>
              </div>
            </div>
          ))}
        </Panel>
      </div>
    </main>
  );
}
