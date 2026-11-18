import { lazy, Suspense, useState, useMemo } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { Filter, Search, RotateCcw, MapPin, ChevronRight, Download, X } from "lucide-react";
import { stationsQuery } from "@/queries/stations";
import { PageHeader, SelectField, StatusBadge, ListState } from "@/components/shared/common";
import { slugStatus } from "@/lib/formatting";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { StationDrawer } from "./station-drawer";
import { MobileStationList } from "./mobile-station-list";
import { useIsMobile } from "@/hooks/use-mobile";
import { filterStations } from "@/services/stations";
import { stationCounts } from "@/lib/station-status";
import { provinces, type Station, type StationStatus } from "@/models/stations";
import { listRecords } from "@/services/records";
import { exportCsv } from "@/lib/formatting";
const NepalMap = lazy(() => import("./nepal-map"));
export function MapPage() {
  const isMobile = useIsMobile();
  const { data } = useSuspenseQuery(stationsQuery());
  const [statuses, setStatuses] = useState<StationStatus[]>([
    "Operational",
    "Partially Active",
    "Inactive",
  ]);
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [stationType, setType] = useState("");
  const [chargerType, setChargerType] = useState("");
  const [connector, setConnector] = useState("");
  const [customerId, setCustomer] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Station | null>(null);
  const [focus, setFocus] = useState<Station | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [reset, setReset] = useState(0);

  const { data: customerRecords } = useQuery({
    queryKey: ["map-customers-list"],
    queryFn: () => listRecords("sales/customers-and-accounts", { pageSize: 50 }),
  });
  const customerList = useMemo(() => {
    if (customerRecords?.items && customerRecords.items.length > 0) {
      return customerRecords.items.map((c) => ({ id: c.id, name: c.name }));
    }
    return [...new Set(data.items.map((s) => s.owner).filter(Boolean))].map((name, i) => ({
      id: `owner-${i}`,
      name,
    }));
  }, [customerRecords, data.items]);

  const counts = stationCounts(data.items);
  const stations = useMemo(
    () =>
      filterStations(data.items, {
        statuses,
        province,
        district,
        stationType,
        chargerType,
        connectorStandard: connector,
        customerId,
        search,
      }),
    [
      data.items,
      statuses,
      province,
      district,
      stationType,
      chargerType,
      connector,
      customerId,
      search,
    ],
  );
  const toggle = (status: StationStatus) =>
    setStatuses((s) => (s.includes(status) ? s.filter((x) => x !== status) : [...s, status]));
  const choose = (s: Station) => {
    setSelected(s);
    setFocus(s);
  };
  return (
    <main className="erp-page">
      <PageHeader
        title="Station Locations"
        description="A live view of your charging infrastructure across Nepal."
        group="Charging Network"
        actions={
          <>
            <Button
              variant="outline"
              onClick={() =>
                exportCsv(
                  "charging-stations",
                  stations.map((s) => ({
                    code: s.stationCode,
                    name: s.name,
                    province: s.province,
                    status: s.status,
                    latitude: s.latitude,
                    longitude: s.longitude,
                  })),
                )
              }
            >
              <Download />
              Export
            </Button>
            <Button asChild>
              <a
                href="#station-search"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById("station-search")?.focus();
                }}
              >
                <MapPin />
                Find a station
              </a>
            </Button>
          </>
        }
      />
      <div className="mb-5 grid grid-cols-2 gap-2 rounded-md border bg-card p-2 sm:grid-cols-5">
        {(
          [
            ["All stations", counts.total, null],
            ["Operational", counts.operational, "Operational"],
            ["Partially active", counts.partial, "Partially Active"],
            ["Inactive", counts.inactive, "Inactive"],
            ["Pipeline", counts.pipeline, "Pipeline"],
          ] as [string, number, StationStatus | null][]
        ).map(([label, n, status]) => (
          <Button
            key={label}
            variant="ghost"
            className={`h-14 justify-start gap-3 px-3 ${status && !statuses.includes(status) ? "opacity-45" : ""}`}
            onClick={() =>
              status
                ? toggle(status)
                : setStatuses(["Operational", "Partially Active", "Inactive", "Pipeline"])
            }
          >
            {status ? (
              <span className={`stat-dot ${slugStatus(status)}`} />
            ) : (
              <MapPin className="text-primary" />
            )}
            <span className="text-left">
              <span className="block text-[10px] text-muted-foreground">{label}</span>
              <span className="text-xl font-semibold">{n}</span>
            </span>
          </Button>
        ))}
      </div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative w-full min-w-0 sm:w-auto sm:flex-1 sm:max-w-72">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input
            id="station-search"
            className="h-9 pl-9 text-xs"
            placeholder="Search station name or code…"
            aria-label="Search stations"
            value={search}
            onChange={(e) => {
              const value = e.target.value;
              setSearch(value);
              setFocus(null);
              if (value.length >= 3) {
                const match = data.items.find((s) =>
                  `${s.name} ${s.stationCode}`.toLowerCase().includes(value.toLowerCase()),
                );
                if (match) {
                  setStatuses((s) => (s.includes(match.status) ? s : [...s, match.status]));
                  setSelected(match);
                  setFocus(match);
                }
              }
            }}
          />
        </div>
        <SelectField
          label="Province"
          value={province}
          onChange={(v) => {
            setProvince(v);
            setDistrict("");
            setFocus(null);
          }}
          options={[...provinces]}
          all="All provinces"
        />
        <Button variant="outline" size="sm" onClick={() => setFiltersOpen(!filtersOpen)}>
          <Filter />
          Filters{filtersOpen && <X size={12} />}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setProvince("");
            setDistrict("");
            setType("");
            setChargerType("");
            setConnector("");
            setCustomer("");
            setSearch("");
            setFocus(null);
            setStatuses(["Operational", "Partially Active", "Inactive"]);
            setReset((r) => r + 1);
          }}
        >
          <RotateCcw />
          Reset view
        </Button>
        <div className="ml-auto flex items-center gap-2 text-[11px] text-muted-foreground">
          <Switch
            id="pipeline"
            checked={statuses.includes("Pipeline")}
            onCheckedChange={() => toggle("Pipeline")}
          />
          <label htmlFor="pipeline">Show pipeline</label>
        </div>
      </div>
      {filtersOpen && (
        <div className="mb-3 flex flex-wrap gap-2 border-y py-3">
          <SelectField
            label="District"
            value={district}
            onChange={setDistrict}
            options={[
              ...new Set(
                data.items
                  .filter((s) => !province || s.province === province)
                  .map((s) => s.district),
              ),
            ]}
            all="All districts"
          />
          <SelectField
            label="Station type"
            value={stationType}
            onChange={setType}
            options={["Public", "Private", "Fleet", "Commercial", "Captive"]}
            all="All station types"
          />
          <SelectField
            label="Charger type"
            value={chargerType}
            onChange={setChargerType}
            options={["AC", "DC"]}
            all="AC & DC"
          />
          <SelectField
            label="Connector"
            value={connector}
            onChange={setConnector}
            options={["Type 2", "CCS2", "CHAdeMO", "GB/T"]}
            all="All connectors"
          />
          <select
            aria-label="Customer"
            className="erp-select"
            value={customerId}
            onChange={(e) => setCustomer(e.target.value)}
          >
            <option value="">All customer accounts</option>
            {customerList.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="map-layout">
        <div className="map-surface">
          <ClientOnly fallback={<ListState loading />}>
            <Suspense fallback={<ListState loading />}>
              <NepalMap
                stations={stations}
                onSelect={choose}
                province={province}
                focus={focus}
                reset={reset}
              />
            </Suspense>
          </ClientOnly>
          <div className="map-legend">
            {(["Operational", "Partially Active", "Inactive", "Pipeline"] as StationStatus[]).map(
              (status) => (
                <Button
                  key={status}
                  variant="ghost"
                  size="sm"
                  className={`text-[10px] ${!statuses.includes(status) ? "opacity-40" : ""}`}
                  onClick={() => toggle(status)}
                  aria-label={`Toggle ${status}`}
                  aria-pressed={statuses.includes(status)}
                >
                  <span className={`stat-dot ${slugStatus(status)}`} />
                  {status}
                </Button>
              ),
            )}
          </div>
        </div>
        <aside className="map-station-list hidden md:block" aria-label="Station results">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-card px-4 py-4">
            <h2 className="text-sm font-semibold">
              Stations{" "}
              <span className="ml-1 text-xs text-muted-foreground">({stations.length})</span>
            </h2>
            <span className="text-[10px] text-muted-foreground">{province || "Across Nepal"}</span>
          </div>
          {stations.length === 0 ? (
            <ListState />
          ) : (
            stations.map((s) => (
              <Button
                key={s.id}
                variant="ghost"
                className="station-list-item !h-auto !justify-start !rounded-none !whitespace-normal"
                onClick={() => choose(s)}
              >
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-medium">{s.name}</div>
                  <div className="mt-1 text-[10px] text-muted-foreground">
                    {s.stationCode} · {s.municipality}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <StatusBadge status={s.status} />
                    <span className="text-[9px] text-muted-foreground">
                      {s.chargers.length} chargers
                    </span>
                  </div>
                </div>
                <ChevronRight size={13} className="shrink-0 text-muted-foreground" />
              </Button>
            ))
          )}
        </aside>
        {isMobile && <MobileStationList stations={stations} onSelect={choose} />}
      </div>
      <StationDrawer station={selected} onClose={() => setSelected(null)} />
    </main>
  );
}
