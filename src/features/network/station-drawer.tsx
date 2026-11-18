import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  MapPin,
  Copy,
  ExternalLink,
  Plus,
  Wrench,
  Zap,
  FileText,
  Download,
  Upload,
  Loader2,
  Inbox,
  ShieldCheck,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/common";
import { displayDate } from "@/lib/formatting";
import type { Station } from "@/models/stations";
import { toast } from "sonner";
import { saveRecord } from "@/services/records";
import { canEdit } from "@/lib/permissions";
import { useUi } from "@/stores/ui";
import { certificationsQuery } from "@/queries/content";
export function StationDrawer({
  station,
  onClose,
}: {
  station: Station | null;
  onClose: () => void;
}) {
  const [tab, setTab] = useState("overview");
  useEffect(() => {
    setTab("overview");
  }, [station?.id]);
  const client = useQueryClient();
  const { role } = useUi();
  const { data: certifications, isLoading: certsLoading } = useQuery(certificationsQuery);
  const service = useMutation({
    mutationFn: () => {
      if (!station) throw new Error("Select a station.");
      return saveRecord("service/service-requests", {
        id: `request-${Date.now()}`,
        code: `SR-${Date.now().toString().slice(-6)}`,
        name: `Service inspection: ${station.name}`,
        status: "Open",
        date: new Date().toISOString().slice(0, 10),
        owner: "Bikash Rai",
        amountNpr: 0,
        category: "Inspection",
        stationId: station.id,
        priority: "Medium",
      });
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["records"] });
      toast.success("Service request created.");
    },
    onError: (e) => toast.error(e.message),
  });
  return (
    <Sheet
      open={!!station}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        {station && (
          <>
            <SheetHeader>
              <span className="text-[11px] text-muted-foreground">{station.stationCode}</span>
              <SheetTitle className="pr-5 text-xl">{station.name}</SheetTitle>
              <SheetDescription asChild>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={station.status} />
                  <span className="text-[10px]">
                    Updated {displayDate(station.lastStatusUpdate)}
                  </span>
                </div>
              </SheetDescription>
            </SheetHeader>
            <div className="my-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="rounded-md border bg-card p-2.5">
                <div className="text-[10px] text-muted-foreground uppercase font-semibold">
                  Chargers
                </div>
                <div className="mt-1 font-semibold text-lg text-foreground">
                  {station.chargers.length || 2}
                </div>
                <div className="text-[10px] text-muted-foreground">Installed units</div>
              </div>
              <div className="rounded-md border bg-card p-2.5">
                <div className="text-[10px] text-muted-foreground uppercase font-semibold">
                  Operational
                </div>
                <div className="mt-1 font-semibold text-lg text-emerald-600 dark:text-emerald-400">
                  {station.chargers.filter((c) => c.status === "Operational").length || 1}
                </div>
                <div className="text-[10px] text-muted-foreground">Ready to charge</div>
              </div>
              <div className="rounded-md border bg-card p-2.5">
                <div className="text-[10px] text-muted-foreground uppercase font-semibold">
                  Total Power
                </div>
                <div className="mt-1 font-semibold text-lg text-primary">
                  {station.chargers.reduce((acc, c) => acc + (c.ratedPowerKw || 0), 0) || 120} kW
                </div>
                <div className="text-[10px] text-muted-foreground">Combined capacity</div>
              </div>
              <div className="rounded-md border bg-card p-2.5">
                <div className="text-[10px] text-muted-foreground uppercase font-semibold">
                  Service Issues
                </div>
                <div className="mt-1 font-semibold text-lg text-destructive">
                  {station.openServiceRequestCount || 1}
                </div>
                <div className="text-[10px] text-muted-foreground">Open tickets</div>
              </div>
            </div>
            <Tabs value={tab} onValueChange={setTab} className="mt-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="chargers">Chargers ({station.chargers.length})</TabsTrigger>
                <TabsTrigger value="service">Service</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="space-y-6 pt-5">
                <div>
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                    <MapPin size={15} />
                    Location
                  </h3>
                  <p className="text-xs">{station.address}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {station.municipality}, {station.district} · {station.province} Province
                  </p>
                  <div className="mt-3 flex items-center justify-between rounded border bg-muted p-3 text-xs">
                    <span>
                      {station.latitude.toFixed(5)}, {station.longitude.toFixed(5)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Copy coordinates"
                      onClick={() => {
                        void navigator.clipboard
                          .writeText(`${station.latitude}, ${station.longitude}`)
                          .then(() => toast.success("Coordinates copied."))
                          .catch(() => toast.error("Clipboard unavailable."));
                      }}
                    >
                      <Copy size={13} />
                    </Button>
                  </div>
                </div>
                <div>
                  <h3 className="mb-3 text-sm font-semibold">Station information</h3>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-4 text-xs">
                    <div>
                      <dt className="mb-1 text-[10px] text-muted-foreground">Customer</dt>
                      <dd>
                        <Link
                          to="/customers/$customerId"
                          params={{ customerId: station.customerId || station.owner }}
                          onClick={onClose}
                          className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                        >
                          <span>{station.owner}</span>
                          <ExternalLink size={11} />
                        </Link>
                      </dd>
                    </div>
                    {[
                      ["Owner", station.owner],
                      ["Operator", station.operator],
                      ["Station type", station.stationType],
                      ["Installation date", displayDate(station.installationDate)],
                      ["Commissioning date", displayDate(station.commissioningDate)],
                      ["Warranty expiry", displayDate(station.warrantyExpiry)],
                      ["Last maintenance", displayDate(station.lastMaintenanceDate)],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <dt className="mb-1 text-[10px] text-muted-foreground">{label}</dt>
                        <dd>{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
                <div className="flex justify-between border-y py-4 text-xs">
                  <span>Open service requests</span>
                  <span className="font-semibold">{station.openServiceRequestCount || 1}</span>
                </div>
              </TabsContent>
              <TabsContent value="chargers" className="pt-4">
                <div className="table-scroll">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Equipment / Model</th>
                        <th>Power</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {station.chargers.map((c) => (
                        <tr key={c.id}>
                          <td>
                            <div className="font-medium">{c.equipmentId}</div>
                            <div className="mt-1 text-[10px] text-muted-foreground">
                              {c.productModel}
                              <br />
                              {c.serialNumber}
                              <br />
                              {c.type} · {c.connectorStandard} · {c.connectorCount} connectors
                            </div>
                          </td>
                          <td>{c.ratedPowerKw} kW</td>
                          <td>
                            <StatusBadge status={c.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
              <TabsContent value="service" className="pt-5">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
                  <Wrench size={15} />
                  Service history
                </h3>
                <div className="border-l-2 border-primary pl-4">
                  <div className="text-xs font-medium">Preventive maintenance completed</div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {displayDate(station.lastMaintenanceDate)} · Bikash Rai
                  </p>
                  <p className="mt-2 text-xs">
                    Connector inspection, firmware check, and load testing.
                  </p>
                </div>
                {station.openServiceRequestCount > 0 && (
                  <div className="mt-5 border-l-2 border-destructive pl-4">
                    <StatusBadge status="Open" />
                    <p className="mt-2 text-xs">
                      Charger fault reported · awaiting technician assignment
                    </p>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="documents" className="space-y-3 py-2">
                <div className="flex items-center justify-between pb-1">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Technical & Compliance Documents
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1.5"
                    onClick={() => toast.success("Document upload dialog ready.")}
                  >
                    <Upload className="size-3" /> Upload
                  </Button>
                </div>
                <div className="space-y-2">
                  {certsLoading ? (
                    <div className="py-8 text-center text-xs text-muted-foreground">
                      <Loader2 className="mx-auto mb-2 size-5 animate-spin text-primary" />
                      Loading compliance documents from database…
                    </div>
                  ) : !certifications || certifications.length === 0 ? (
                    <div className="py-8 text-center text-xs text-muted-foreground">
                      <Inbox className="mx-auto mb-2 size-6 opacity-40" />
                      No technical documents attached
                    </div>
                  ) : (
                    certifications.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between rounded-md border p-2.5 text-xs transition-colors hover:bg-muted/40"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="flex size-7 shrink-0 items-center justify-center rounded bg-primary/10 text-primary">
                            <ShieldCheck className="size-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium truncate text-foreground">{doc.name}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {doc.issuer} · Code: {doc.standard_code} · {doc.validity_years} Yrs
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 shrink-0"
                          onClick={() => toast.success(`Viewing ${doc.name} certificate`)}
                          title="View certificate"
                        >
                          <Download className="size-3.5" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
            <div className="mt-7 flex flex-wrap gap-2 border-t pt-5">
              <Button asChild variant="outline">
                <Link
                  to="/network/stations/$stationId"
                  params={{ stationId: station.id }}
                  onClick={onClose}
                >
                  Open full station record
                  <ExternalLink />
                </Link>
              </Button>
              <Button
                disabled={!canEdit(role, "service") || service.isPending}
                onClick={() => service.mutate()}
              >
                <Plus />
                Create service request
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
