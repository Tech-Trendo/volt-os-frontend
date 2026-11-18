import { useState } from "react";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import {
  Search,
  Plus,
  Download,
  MapPin,
  ArrowUpRight,
  Pencil,
  CheckCircle2,
  Zap,
  Wrench,
} from "lucide-react";
import { stationsQuery } from "@/queries/stations";
import type { Station } from "@/models/stations";
import { provinces } from "@/models/stations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/shared/data-table";
import { PageHeader, StatusBadge, SelectField, ListState, Kpi } from "@/components/shared/common";
import { stationCounts } from "@/lib/station-status";
import { StationForm } from "./station-form";
import { exportCsv } from "@/lib/formatting";
import { canEdit } from "@/lib/permissions";
import { useUi } from "@/stores/ui";
export function StationList({ initialStatus }: { initialStatus?: string | undefined }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [province, setProvince] = useState("");
  const [status, setStatus] = useState(initialStatus ?? "");
  const [page, setPage] = useState(1);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [editing, setEditing] = useState<Station | "new" | null>(null);
  const { role } = useUi();
  const { data: seed } = useSuspenseQuery(stationsQuery());
  const counts = stationCounts(seed.items);
  const sort = sorting[0];
  const { data, isFetching, error, refetch } = useQuery(
    stationsQuery({
      search,
      province,
      ...(status ? { statuses: [status as Station["status"]] } : {}),
      page,
      pageSize: 10,
      ...(sort
        ? {
            sortBy: sort.id as "name" | "stationCode" | "province" | "status",
            sortDirection: sort.desc ? "desc" : "asc",
          }
        : {}),
    }),
  );
  const columns: ColumnDef<Station>[] = [
    {
      accessorKey: "name",
      header: "Station",
      cell: ({ row }) => (
        <Button
          variant="link"
          className="h-auto whitespace-normal p-0 text-left"
          onClick={() =>
            void navigate({
              to: "/network/stations/$stationId",
              params: { stationId: row.original.id },
            })
          }
        >
          <span>
            <span className="block text-[11px] font-medium hover:text-primary transition-colors">
              {row.original.name}
            </span>
            <span className="mt-1 block text-[10px] font-normal text-muted-foreground">
              {row.original.stationCode}
            </span>
          </span>
        </Button>
      ),
    },
    {
      accessorKey: "owner",
      header: "Customer",
      cell: ({ row }) => (
        <Link
          to="/customers/$customerId"
          params={{ customerId: row.original.customerId || row.original.owner }}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
        >
          <span>{row.original.owner}</span>
          <ArrowUpRight size={11} className="shrink-0" />
        </Link>
      ),
    },
    {
      accessorKey: "province",
      header: "Province",
      cell: ({ row }) => (
        <div>
          {row.original.province}
          <span className="mt-1 block text-[10px] text-muted-foreground">
            {row.original.district}
          </span>
        </div>
      ),
    },
    { accessorKey: "stationType", header: "Type" },
    {
      id: "chargers",
      header: "Chargers",
      cell: ({ row }) => row.original.chargers.length || 2,
      enableSorting: false,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex">
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Edit ${row.original.stationCode}`}
            disabled={!canEdit(role, "network")}
            onClick={() => setEditing(row.original)}
          >
            <Pencil size={13} />
          </Button>
          <Button asChild variant="ghost" size="icon">
            <Link
              to="/network/stations/$stationId"
              params={{ stationId: row.original.id }}
              aria-label={`Open ${row.original.stationCode}`}
            >
              <ArrowUpRight size={13} />
            </Link>
          </Button>
        </div>
      ),
    },
  ];
  return (
    <main className="erp-page">
      <PageHeader
        title="Charging Stations"
        group="Charging Network"
        description="Manage your stations, equipment, and operational status."
        actions={
          <>
            <Button variant="outline" asChild>
              <Link to="/network/locations">
                <MapPin />
                Map view
              </Link>
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                exportCsv(
                  "charging-stations",
                  seed.items.map((s) => ({
                    code: s.stationCode,
                    name: s.name,
                    province: s.province,
                    status: s.status,
                    chargers: s.chargers.length,
                  })),
                )
              }
            >
              <Download />
              Export
            </Button>
            <Button disabled={!canEdit(role, "network")} onClick={() => setEditing("new")}>
              <Plus />
              Add station
            </Button>
          </>
        }
      />
      {!canEdit(role, "network") && (
        <div className="mb-4 border-l-2 border-info bg-info/5 p-3 text-xs">
          Read-only access · {role}
        </div>
      )}
      <div className="kpi-grid mb-5">
        <Kpi
          label="Total Stations"
          value={counts.total}
          foot="Across all 7 provinces"
          icon={<MapPin size={15} />}
          onClick={() => {
            setStatus("");
            setPage(1);
          }}
          active={!status}
        />
        <Kpi
          label="Operational"
          value={counts.operational}
          foot="All chargers working"
          icon={<CheckCircle2 size={15} />}
          onClick={() => {
            setStatus("Operational");
            setPage(1);
          }}
          active={status === "Operational"}
        />
        <Kpi
          label="Partially Active"
          value={counts.partial}
          foot="Some chargers unavailable"
          icon={<Zap size={15} />}
          positive={false}
          onClick={() => {
            setStatus("Partially Active");
            setPage(1);
          }}
          active={status === "Partially Active"}
        />
        <Kpi
          label="Inactive / Pipeline"
          value={counts.inactive + counts.pipeline}
          foot="Requires operational attention"
          icon={<Wrench size={15} />}
          positive={false}
          onClick={() => {
            setStatus("Inactive");
            setPage(1);
          }}
          active={status === "Inactive"}
        />
      </div>
      <div className="panel">
        <div className="flex flex-wrap gap-3 p-4">
          <div className="relative min-w-0 flex-1 sm:max-w-80">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input
              aria-label="Search station records"
              placeholder="Search name or station code…"
              className="h-9 pl-9 text-xs"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <SelectField
            label="Province filter"
            value={province}
            onChange={(v) => {
              setProvince(v);
              setPage(1);
            }}
            options={[...provinces]}
            all="All provinces"
          />
          <SelectField
            label="Status filter"
            value={status}
            onChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
            options={["Operational", "Partially Active", "Inactive", "Pipeline"]}
            all="All statuses"
          />
          {isFetching && (
            <span className="self-center text-[10px] text-muted-foreground">Updating…</span>
          )}
        </div>
        {error ? (
          <ListState
            error={error}
            onRetry={() => {
              void refetch();
            }}
          />
        ) : !data ? (
          <ListState loading />
        ) : data.items.length === 0 ? (
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
      {editing && (
        <StationForm
          key={typeof editing === "string" ? editing : editing.id}
          station={editing}
          onClose={() => setEditing(null)}
        />
      )}
    </main>
  );
}
