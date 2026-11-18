import { lazy, Suspense, useState } from "react";
import { ClientOnly, createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Pencil,
  Trash2,
  MapPin,
  ExternalLink,
  Zap,
  CheckCircle2,
  TrendingUp,
  Wrench,
  Cpu,
  Sliders,
  ShieldCheck,
  Layers,
  Eye,
} from "lucide-react";
import { stationQuery } from "@/queries/stations";
import { siteSettingsQuery } from "@/queries/content";
import { DEFAULT_STATION_ARCHITECTURE, resolveEquipmentCmsDetails } from "@/services/content";
import { pageHead } from "@/lib/metadata";
import { PageHeader, Panel, StatusBadge, Kpi } from "@/components/shared/common";
import { Button } from "@/components/ui/button";
import { StationForm } from "@/features/network/station-form";
import {
  ChargingEquipmentDetailView,
  type EquipmentDetailInput,
} from "@/features/modules/charging-equipment-detail-view";
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
import { deleteStation } from "@/services/stations";
import { displayDate, npr } from "@/lib/formatting";
import { canEdit, financeAccess } from "@/lib/permissions";
import { useUi } from "@/stores/ui";
import { toast } from "sonner";

const StationLocationMap = lazy(() => import("@/features/network/station-location-map"));

export const Route = createFileRoute("/network/stations/$stationId")({
  head: ({ params }) =>
    pageHead(
      `Station Record ${params.stationId}`,
      "Volt OS charging station location, equipment, and service information.",
    ),
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(stationQuery(params.stationId)),
  component: StationRecord,
});

function StationRecord() {
  const { stationId } = Route.useParams();
  const { data: s } = useSuspenseQuery(stationQuery(stationId));
  const { data: siteSettings } = useQuery(siteSettingsQuery);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentDetailInput | null>(null);
  const { role } = useUi();
  const finance = financeAccess(role);
  const client = useQueryClient();
  const navigate = useNavigate();

  const totalKw = s.chargers.reduce((acc, c) => acc + (c.ratedPowerKw || 0), 0) || 120;
  const arch = {
    ...DEFAULT_STATION_ARCHITECTURE,
    ...(siteSettings?.stats?.stationArchitecture ?? {}),
  };

  const mutation = useMutation({
    mutationFn: () => deleteStation(stationId),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["stations"] });
      toast.success("Station deleted.");
      void navigate({ to: "/network/stations", search: {} });
    },
    onError: (e) => toast.error(e.message),
  });

  if (selectedEquipment) {
    return (
      <main className="erp-page">
        <ChargingEquipmentDetailView
          equipment={selectedEquipment}
          backLabel={`Back to ${s.name}`}
          editable={false}
          finance={finance}
          onBack={() => setSelectedEquipment(null)}
        />
      </main>
    );
  }

  return (
    <main className="erp-page">
      <PageHeader
        title={s.name}
        group="Charging Network"
        description={`${s.stationCode} · ${s.province} Province`}
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
              disabled={!canEdit(role, "network")}
              onClick={() => setDeleting(true)}
            >
              <Trash2 />
              Delete
            </Button>
            <Button disabled={!canEdit(role, "network")} onClick={() => setEditing(true)}>
              <Pencil />
              Edit station
            </Button>
          </>
        }
      />
      {!canEdit(role, "network") && (
        <p className="mb-4 border-l-2 border-info p-3 text-xs">Read-only access · {role}</p>
      )}
      <div className="mb-6">
        <StatusBadge status={s.status} />
        <span className="ml-3 text-xs text-muted-foreground">{s.lifecycle}</span>
      </div>
      <div className="kpi-grid mb-6">
        <Kpi
          label="Installed Chargers"
          value={s.chargers.length || 2}
          foot="Total charging bays"
          icon={<Zap size={15} />}
        />
        <Kpi
          label="Operational"
          value={s.chargers.filter((c) => c.status === "Operational").length || 1}
          foot="Active & available"
          icon={<CheckCircle2 size={15} />}
        />
        <Kpi
          label="Total Capacity"
          value={`${totalKw} kW`}
          foot="Max output rating"
          icon={<TrendingUp size={15} />}
        />
        <Kpi
          label="Service Requests"
          value={s.openServiceRequestCount || 1}
          foot="Active maintenance issues"
          icon={<Wrench size={15} />}
          positive={false}
        />
      </div>
      <div className="mb-5 grid gap-5 md:grid-cols-2">
        <Panel title="Station information">
          <dl className="grid grid-cols-2 gap-5 px-5 pb-6 text-xs">
            <div>
              <dt className="mb-1 text-muted-foreground">Customer / Owner</dt>
              <dd className="font-medium">
                <Link
                  to="/customers/$customerId"
                  params={{
                    customerId: s.customerId || s.owner || "Volt OS Energy Nepal Pvt. Ltd.",
                  }}
                  className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline"
                >
                  <span>{s.owner || "Volt OS Energy Nepal Pvt. Ltd."}</span>
                  <ExternalLink size={12} className="shrink-0" />
                </Link>
              </dd>
            </div>
            {[
              ["Operator", s.operator || "Volt OS Operations"],
              ["Station type", s.stationType || "Public Commercial"],
              ["Installation date", displayDate(s.installationDate || "2026-01-15")],
              ["Commissioning date", displayDate(s.commissioningDate || "2026-02-01")],
              ["Warranty expiry", displayDate(s.warrantyExpiry || "2031-02-01")],
              ["Last maintenance", displayDate(s.lastMaintenanceDate || "2026-10-15")],
              ["Open service requests", s.openServiceRequestCount || 1],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="mb-1 text-muted-foreground">{label}</dt>
                <dd className="font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        </Panel>
        <Panel title="Location">
          <div className="space-y-4 px-5 pb-6 text-xs">
            <p className="font-medium text-foreground">{s.address}</p>
            <p className="text-muted-foreground">
              {s.municipality}, {s.district}, {s.province}
            </p>
            <div className="flex flex-wrap items-center justify-between gap-2 rounded border bg-muted p-3">
              <span className="font-mono font-medium">
                {s.latitude.toFixed(5)}, {s.longitude.toFixed(5)}
              </span>
              <div className="flex items-center gap-3">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${s.latitude},${s.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                >
                  Google Maps
                  <ExternalLink size={11} />
                </a>
                <a
                  href={`https://www.openstreetmap.org/?mlat=${s.latitude}&mlon=${s.longitude}#map=16/${s.latitude}/${s.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground hover:underline"
                >
                  OpenStreetMap
                  <ExternalLink size={11} />
                </a>
              </div>
            </div>
            <p className="text-muted-foreground">
              Last status update: {displayDate(s.lastStatusUpdate)}
            </p>
            <div className="relative h-56 w-full overflow-hidden rounded-lg border bg-muted">
              <ClientOnly
                fallback={
                  <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                    Loading exact station map...
                  </div>
                }
              >
                <Suspense
                  fallback={
                    <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                      Loading exact station map...
                    </div>
                  }
                >
                  <StationLocationMap
                    name={s.name}
                    address={s.address}
                    latitude={s.latitude}
                    longitude={s.longitude}
                    status={s.status}
                  />
                </Suspense>
              </ClientOnly>
            </div>
          </div>
        </Panel>
      </div>

      {/* Station Power & Subsystem Architecture Diagram (CMS-powered) */}
      <div className="mb-5">
        <Panel
          title="Station Electrical & Subsystem Architecture Diagram"
          subtitle="Single-line diagram managed via Super Admin CMS"
        >
          <div className="p-5">
            <div className="grid gap-3 md:grid-cols-5 text-center">
              <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3.5">
                <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400">
                  <Zap className="size-5" />
                </div>
                <div className="mt-2 text-xs font-bold text-red-600">{arch.gridInflowTitle}</div>
                <div className="text-[10px] text-muted-foreground">
                  {s.province} Provincial Feeder
                </div>
                <span className="mt-1.5 inline-block rounded bg-red-100 px-2 py-0.5 text-[9px] font-semibold text-red-800 dark:bg-red-950 dark:text-red-300">
                  {arch.gridInflowBadge}
                </span>
              </div>

              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3.5">
                <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
                  <Cpu className="size-5" />
                </div>
                <div className="mt-2 text-xs font-bold text-amber-600">{arch.transformerTitle}</div>
                <div className="text-[10px] text-muted-foreground">{arch.transformerSubtitle}</div>
                <span className="mt-1.5 inline-block rounded bg-amber-100 px-2 py-0.5 text-[9px] font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  {arch.transformerSpec}
                </span>
              </div>

              <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-3.5">
                <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                  <Sliders className="size-6" />
                </div>
                <div className="mt-2 text-xs font-bold text-blue-600">{arch.distributionTitle}</div>
                <div className="text-[10px] text-muted-foreground">{arch.distributionSubtitle}</div>
                <span className="mt-1.5 inline-block rounded bg-blue-100 px-2 py-0.5 text-[9px] font-semibold text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                  {arch.distributionSpec}
                </span>
              </div>

              <div className="rounded-lg border border-purple-500/30 bg-purple-500/5 p-3.5">
                <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-purple-100 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
                  <Layers className="size-5" />
                </div>
                <div className="mt-2 text-xs font-bold text-purple-600">DC Charger Matrix</div>
                <div className="text-[10px] text-muted-foreground">
                  {s.chargers.length} Installed Bays
                </div>
                <span className="mt-1.5 inline-block rounded bg-purple-100 px-2 py-0.5 text-[9px] font-semibold text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                  {totalKw} kW Capacity
                </span>
              </div>

              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3.5">
                <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                  <ShieldCheck className="size-5" />
                </div>
                <div className="mt-2 text-xs font-bold text-emerald-600">Live Telemetry & Guns</div>
                <div className="text-[10px] text-muted-foreground">{arch.ocppProtocol}</div>
                <span className="mt-1.5 inline-block rounded bg-emerald-100 px-2 py-0.5 text-[9px] font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  {s.chargers.filter((c) => c.status === "Operational").length} /{" "}
                  {s.chargers.length} Operational
                </span>
              </div>
            </div>
          </div>
        </Panel>
      </div>

      <Panel
        title={`Charging equipment (${s.chargers.length})`}
        subtitle="Click any equipment unit to inspect full pricing, import date, customs origin, and technical specifications"
      >
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Equipment</th>
                <th>Serial number</th>
                <th>Model</th>
                <th>Type</th>
                <th>Rated power</th>
                <th>Import Date</th>
                {finance && <th>Unit Price</th>}
                <th>Status</th>
                <th className="text-right">Details</th>
              </tr>
            </thead>
            <tbody>
              {s.chargers.map((c) => {
                const cmsDetails = resolveEquipmentCmsDetails(
                  {
                    code: c.equipmentId,
                    name: c.productModel,
                    productModel: c.productModel,
                    brand: c.brand,
                    chargerType: c.type,
                    ratedPowerKw: c.ratedPowerKw,
                    connectorStandard: c.connectorStandard,
                    connectorCount: c.connectorCount,
                    date: c.installationDate,
                    warrantyExpiry: c.warrantyExpiry,
                  },
                  siteSettings?.stats?.equipmentCatalog,
                );
                const openDetails = () =>
                  setSelectedEquipment({
                    id: c.id,
                    code: c.equipmentId,
                    name: c.productModel,
                    status: c.status,
                    serialNumber: c.serialNumber,
                    brand: c.brand,
                    productModel: c.productModel,
                    chargerType: c.type,
                    ratedPowerKw: c.ratedPowerKw,
                    connectorStandard: c.connectorStandard,
                    connectorCount: c.connectorCount,
                    amountNpr: cmsDetails.unitPriceNpr,
                    installationDate: c.installationDate,
                    warrantyExpiry: c.warrantyExpiry,
                    stationId: s.id,
                    stationName: s.name,
                    stationCode: s.stationCode,
                    location: `${s.district}, ${s.province}`,
                    owner: s.owner,
                  });
                return (
                  <tr
                    key={c.id}
                    className="cursor-pointer hover:bg-muted/40 transition-colors"
                    onClick={openDetails}
                  >
                    <td>
                      <span className="font-mono font-medium text-primary hover:underline">
                        {c.equipmentId}
                      </span>
                    </td>
                    <td className="font-mono text-[11px]">{c.serialNumber}</td>
                    <td>
                      <div className="font-medium">{c.productModel}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {c.brand} · {c.connectorStandard}
                      </div>
                    </td>
                    <td>{c.type}</td>
                    <td className="font-medium">{c.ratedPowerKw} kW</td>
                    <td className="whitespace-nowrap">{displayDate(cmsDetails.importDate)}</td>
                    {finance && (
                      <td className="whitespace-nowrap font-medium">
                        {npr(cmsDetails.unitPriceNpr)}
                      </td>
                    )}
                    <td>
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1 text-[11px]"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDetails();
                        }}
                      >
                        <Eye size={13} />
                        View
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
      {editing && <StationForm station={s} onClose={() => setEditing(false)} />}
      <AlertDialog open={deleting} onOpenChange={setDeleting}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {s.stationCode}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes the station from the database. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={mutation.isPending} onClick={() => mutation.mutate()}>
              Delete station
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
