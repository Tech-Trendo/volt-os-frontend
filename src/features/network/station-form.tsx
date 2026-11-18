import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  provinces,
  type Station,
  type StationLifecycle,
  type StationType,
  type Charger,
} from "@/models/stations";
import { saveStation } from "@/services/stations";
import { deriveStationStatus, pipelineStages } from "@/lib/station-status";
import { toast } from "sonner";
const schema = z.object({
  name: z.string().min(3, "Enter a station name with at least 3 characters."),
  stationCode: z.string().regex(/^NP-[A-Z]{3}-\d{3}$/, "Use a code such as NP-KTM-049."),
  address: z.string().min(3, "Address is required."),
  district: z.string().min(2, "District is required."),
  municipality: z.string().min(2, "Municipality is required."),
  latitude: z.number().min(26.3).max(30.5),
  longitude: z.number().min(80).max(88.3),
});
export function StationForm({
  station,
  onClose,
}: {
  station: Station | "new" | null;
  onClose: () => void;
}) {
  const client = useQueryClient();
  const [draft, setDraft] = useState<Station>(() =>
    typeof station === "object" && station
      ? structuredClone(station)
      : {
          id: `station-${Date.now()}`,
          stationCode: "NP-KTM-049",
          name: "",
          address: "",
          province: "Bagmati",
          district: "Kathmandu",
          municipality: "Kathmandu",
          latitude: 27.7172,
          longitude: 85.324,
          stationType: "Public",
          customerId: "sales-customers-and-accounts-1",
          owner: "Himalayan Mobility Pvt. Ltd.",
          operator: "Volt OS Infrastructure Operations",
          lifecycle: "Planned",
          status: "Pipeline",
          installationDate: null,
          commissioningDate: null,
          warrantyExpiry: null,
          lastStatusUpdate: "2026-11-15T00:00:00Z",
          lastMaintenanceDate: null,
          openServiceRequestCount: 0,
          chargers: [],
        },
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const mutation = useMutation({
    mutationFn: saveStation,
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["stations"] });
      void client.invalidateQueries({ queryKey: ["station"] });
      void client.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success(station === "new" ? "Station created." : "Station updated.");
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });
  const update = <K extends keyof Station>(key: K, value: Station[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));
  const field = (
    key: "name" | "stationCode" | "address" | "district" | "municipality" | "owner" | "operator",
    label: string,
  ) => (
    <div key={key}>
      <Label htmlFor={key} className="text-xs">
        {label}
      </Label>
      <Input
        id={key}
        className="mt-1.5"
        value={draft[key]}
        onChange={(e) => update(key, e.target.value)}
      />
      {errors[key] && <p className="mt-1 text-xs text-destructive">{errors[key]}</p>}
    </div>
  );
  const save = () => {
    const result = schema.safeParse(draft);
    if (!result.success) {
      setErrors(Object.fromEntries(result.error.issues.map((i) => [i.path.join("."), i.message])));
      return;
    }
    if (!pipelineStages.includes(draft.lifecycle) && !draft.commissioningDate) {
      setErrors({ commissioningDate: "Commissioned stations need a commissioning date." });
      return;
    }
    mutation.mutate({
      ...draft,
      commissioningDate: pipelineStages.includes(draft.lifecycle) ? null : draft.commissioningDate,
      status: deriveStationStatus(draft.lifecycle, draft.chargers),
    });
  };
  return (
    <Dialog
      open={!!station}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {station === "new" ? "Add charging station" : "Edit charging station"}
          </DialogTitle>
          <DialogDescription>Volt OS Enterprise ERP · Station record</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
          className="space-y-5"
        >
          <div>
            <h3 className="mb-3 text-sm font-semibold">Station details</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {field("name", "Station name")}
              {field("stationCode", "Station code")}
              {field("owner", "Owner / Customer")}
              {field("operator", "Operator")}
              <div>
                <Label>Station type</Label>
                <select
                  aria-label="Station type"
                  className="erp-select mt-1.5 w-full"
                  value={draft.stationType}
                  onChange={(e) => update("stationType", e.target.value as StationType)}
                >
                  {["Public", "Private", "Fleet", "Commercial", "Captive"].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Lifecycle</Label>
                <select
                  aria-label="Lifecycle"
                  className="erp-select mt-1.5 w-full"
                  value={draft.lifecycle}
                  onChange={(e) => update("lifecycle", e.target.value as StationLifecycle)}
                >
                  {[
                    ...pipelineStages,
                    "Commissioned",
                    "Temporarily Offline",
                    "Under Maintenance",
                    "Decommissioned",
                  ].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="border-t pt-4">
            <h3 className="mb-3 text-sm font-semibold">Location</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {field("address", "Address")}
              <div>
                <Label>Province</Label>
                <select
                  aria-label="Station province"
                  className="erp-select mt-1.5 w-full"
                  value={draft.province}
                  onChange={(e) => update("province", e.target.value as Station["province"])}
                >
                  {provinces.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
              {field("district", "District")}
              {field("municipality", "Municipality")}
              {(["latitude", "longitude"] as const).map((key) => (
                <div key={key}>
                  <Label htmlFor={key}>{key === "latitude" ? "Latitude" : "Longitude"}</Label>
                  <Input
                    id={key}
                    type="number"
                    step="0.00001"
                    className="mt-1.5"
                    value={draft[key]}
                    onChange={(e) => update(key, Number(e.target.value))}
                  />
                  {errors[key] && <p className="mt-1 text-xs text-destructive">{errors[key]}</p>}
                </div>
              ))}
            </div>
          </div>
          <div className="border-t pt-4">
            <h3 className="mb-3 text-sm font-semibold">Dates & equipment</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              {(["installationDate", "commissioningDate", "warrantyExpiry"] as const).map((key) => (
                <div key={key}>
                  <Label htmlFor={key} className="text-xs">
                    {key === "installationDate"
                      ? "Installation date"
                      : key === "commissioningDate"
                        ? "Commissioning date"
                        : "Warranty expiry"}
                  </Label>
                  <Input
                    id={key}
                    type="date"
                    className="mt-1.5"
                    value={draft[key] ?? ""}
                    disabled={
                      key === "commissioningDate" && pipelineStages.includes(draft.lifecycle)
                    }
                    onChange={(e) => update(key, e.target.value || null)}
                  />
                  {errors[key] && <p className="mt-1 text-xs text-destructive">{errors[key]}</p>}
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-3">
              {draft.chargers.map((c, i) => (
                <div key={c.id} className="flex flex-wrap items-center gap-2">
                  <span className="w-28 text-xs">{c.equipmentId}</span>
                  <select
                    aria-label={`Charger ${i + 1} status`}
                    className="erp-select flex-1"
                    value={c.status}
                    onChange={(e) =>
                      update(
                        "chargers",
                        draft.chargers.map((x) =>
                          x.id === c.id ? { ...x, status: e.target.value as Charger["status"] } : x,
                        ),
                      )
                    }
                  >
                    {["Operational", "Faulted", "Offline", "Under Maintenance"].map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                  <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    aria-label={`Remove ${c.equipmentId}`}
                    onClick={() =>
                      update(
                        "chargers",
                        draft.chargers.filter((x) => x.id !== c.id),
                      )
                    }
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => {
                const n = draft.chargers.length + 1;
                update("chargers", [
                  ...draft.chargers,
                  {
                    id: `charger-${Date.now()}`,
                    stationId: draft.id,
                    equipmentId: `EQ-NEW-${n}`,
                    serialNumber: `VN-NEW-${n}`,
                    productId: "inventory-products-and-equipment-1",
                    productModel: "Terra DC 60",
                    brand: "ABB",
                    type: "DC",
                    ratedPowerKw: 60,
                    connectorStandard: "CCS2",
                    connectorCount: 2,
                    status: "Operational",
                    installationDate: draft.installationDate,
                    warrantyExpiry: draft.warrantyExpiry,
                  },
                ]);
              }}
            >
              <Plus />
              Add charger
            </Button>
          </div>
          <div className="flex justify-end gap-2 border-t pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving…" : "Save station"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
