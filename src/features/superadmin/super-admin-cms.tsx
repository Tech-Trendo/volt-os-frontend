import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Save, Plus, Pencil, Trash2, Zap, Ship, Cpu, RotateCcw, CheckCircle2 } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Panel, StatusBadge } from "@/components/shared/common";
import { siteSettingsQuery } from "@/queries/content";
import {
  DEFAULT_EQUIPMENT_CATALOG,
  DEFAULT_POWER_DEMAND_24H,
  DEFAULT_STATION_ARCHITECTURE,
  DEFAULT_WEEKLY_ENERGY,
  updateSiteSettings,
  type EquipmentCmsProfile,
  type PowerDemandPoint,
  type StationArchitectureCms,
  type WeeklyEnergyPoint,
} from "@/services/content";
import { displayDate, npr } from "@/lib/formatting";
import { toast } from "sonner";

function emptyEquipmentDraft(): EquipmentCmsProfile {
  return {
    id: `eq-cms-${Date.now()}`,
    equipmentCode: `EQ-DC-${String(Date.now()).slice(-3)}`,
    modelName: "",
    brand: "ABB E-Mobility",
    chargerType: "DC",
    ratedPowerKw: 120,
    connectorStandard: "Dual CCS2",
    connectorCount: 2,
    unitPriceNpr: 3150000,
    fobPriceUsd: 18200,
    landedCostNpr: 2640000,
    customsDutyPct: 1,
    vatPct: 13,
    importDate: "2026-05-15",
    customsClearanceDate: "2026-05-20",
    originCountry: "China",
    originPort: "Shenzhen Yantian Port",
    entryPort: "Birgunj ICD Dry Port",
    hsCode: "8504.40.90",
    shipmentRef: `BL-SZX-BRJ-${Date.now().toString().slice(-4)}`,
    supplierName: "Wanbang Digital Energy",
    warrantyYears: 5,
    warrantyExpiry: "2031-05-15",
    amcStatus: "Active · 24/7 Priority SLA",
    inputVoltage: "380V - 415V AC, 3-Phase, 50Hz",
    outputVoltage: "150V - 1000V DC",
    maxCurrentA: 250,
    efficiencyPct: 95.5,
    ipRating: "IP55 / IK10",
    coolingType: "Intelligent Forced Air",
    ocppVersion: "OCPP 1.6J / 2.0.1",
    certifications: "CE, IEC 61851-1, IEC 61851-23, TÜV, NEA Approved",
    dimensionsMm: "1800 × 720 × 620 mm",
    weightKg: 310,
    notes: "",
  };
}

export function SuperAdminCms() {
  const queryClient = useQueryClient();
  const { data: settings } = useQuery(siteSettingsQuery);

  const [powerDemand, setPowerDemand] = useState<PowerDemandPoint[]>(DEFAULT_POWER_DEMAND_24H);
  const [weeklyEnergy, setWeeklyEnergy] = useState<WeeklyEnergyPoint[]>(DEFAULT_WEEKLY_ENERGY);
  const [arch, setArch] = useState<StationArchitectureCms>(DEFAULT_STATION_ARCHITECTURE);
  const [catalog, setCatalog] = useState<EquipmentCmsProfile[]>(DEFAULT_EQUIPMENT_CATALOG);
  const [savingSection, setSavingSection] = useState<string | null>(null);

  const [editingEq, setEditingEq] = useState<EquipmentCmsProfile | null>(null);
  const [isNewEq, setIsNewEq] = useState(false);

  useEffect(() => {
    if (!settings?.stats) return;
    if (Array.isArray(settings.stats.powerDemand24h) && settings.stats.powerDemand24h.length > 0) {
      setPowerDemand(settings.stats.powerDemand24h);
    }
    if (
      Array.isArray(settings.stats.weeklyEnergyDispensed) &&
      settings.stats.weeklyEnergyDispensed.length > 0
    ) {
      setWeeklyEnergy(settings.stats.weeklyEnergyDispensed);
    }
    if (settings.stats.stationArchitecture) {
      setArch({ ...DEFAULT_STATION_ARCHITECTURE, ...settings.stats.stationArchitecture });
    }
    if (
      Array.isArray(settings.stats.equipmentCatalog) &&
      settings.stats.equipmentCatalog.length > 0
    ) {
      setCatalog(settings.stats.equipmentCatalog);
    }
  }, [settings]);

  const persistCmsStats = async (
    sectionKey: string,
    statsPatch: Record<string, unknown>,
    successMessage: string,
  ) => {
    setSavingSection(sectionKey);
    try {
      const updated = await updateSiteSettings({
        stats: {
          ...(settings?.stats ?? {}),
          ...statsPatch,
        },
      });
      queryClient.setQueryData(siteSettingsQuery.queryKey, updated);
      await queryClient.invalidateQueries({ queryKey: ["content", "settings"] });
      toast.success(successMessage);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save CMS changes.");
    } finally {
      setSavingSection(null);
    }
  };

  const handleSaveTelemetry = () =>
    persistCmsStats(
      "telemetry",
      {
        powerDemand24h: powerDemand,
        weeklyEnergyDispensed: weeklyEnergy,
      },
      "24-Hour Power Demand & Weekly Energy Dispensed saved to CMS.",
    );

  const handleSaveArchitecture = () =>
    persistCmsStats(
      "architecture",
      { stationArchitecture: arch },
      "Station electrical architecture specs saved to CMS.",
    );

  const handleSaveEquipmentProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEq || !editingEq.modelName.trim()) {
      toast.error("Please enter an equipment model name.");
      return;
    }
    const nextCatalog = isNewEq
      ? [editingEq, ...catalog]
      : catalog.map((item) => (item.id === editingEq.id ? editingEq : item));
    setCatalog(nextCatalog);
    await persistCmsStats(
      "equipment",
      { equipmentCatalog: nextCatalog },
      `Equipment CMS profile "${editingEq.modelName}" saved.`,
    );
    setEditingEq(null);
    setIsNewEq(false);
  };

  const handleDeleteEquipment = async (id: string) => {
    if (catalog.length <= 1) {
      toast.error("Keep at least one equipment profile in the CMS catalog.");
      return;
    }
    const nextCatalog = catalog.filter((item) => item.id !== id);
    setCatalog(nextCatalog);
    await persistCmsStats(
      "equipment",
      { equipmentCatalog: nextCatalog },
      "Equipment profile removed from CMS catalog.",
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. TELEMETRY CMS: 24-HOUR POWER DEMAND & WEEKLY ENERGY DISPENSED */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel
          title="CMS: 24-Hour Charging Power Demand (kW)"
          subtitle="Centralized load profile feeding analytics & network telemetry views"
          action={
            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-[11px]"
                onClick={() => setPowerDemand(DEFAULT_POWER_DEMAND_24H)}
              >
                <RotateCcw size={12} className="mr-1" />
                Reset
              </Button>
              <Button
                size="sm"
                className="h-7 text-[11px]"
                disabled={savingSection === "telemetry"}
                onClick={handleSaveTelemetry}
              >
                <Save size={12} className="mr-1" />
                {savingSection === "telemetry" ? "Saving..." : "Save CMS"}
              </Button>
            </div>
          }
        >
          <div className="px-4 pb-3">
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={powerDemand} margin={{ left: 0, right: 16, top: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="cmsLoadGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.75} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                <YAxis
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}kW`}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    fontSize: 11,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="kw"
                  name="Demand (kW)"
                  stroke="#2563eb"
                  fill="url(#cmsLoadGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="table-scroll border-t">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Time Slot</th>
                  <th>Power Demand (kW)</th>
                  <th>Active Sessions</th>
                </tr>
              </thead>
              <tbody>
                {powerDemand.map((point, idx) => (
                  <tr key={point.hour}>
                    <td className="font-mono font-medium">{point.hour}</td>
                    <td>
                      <Input
                        type="number"
                        min={1}
                        className="h-7 w-28 text-xs"
                        value={point.kw}
                        onChange={(e) => {
                          const kw = Math.max(1, Number(e.target.value) || 1);
                          setPowerDemand((prev) =>
                            prev.map((row, i) => (i === idx ? { ...row, kw } : row)),
                          );
                        }}
                      />
                    </td>
                    <td>
                      <Input
                        type="number"
                        min={1}
                        className="h-7 w-24 text-xs"
                        value={point.sessions}
                        onChange={(e) => {
                          const sessions = Math.max(1, Number(e.target.value) || 1);
                          setPowerDemand((prev) =>
                            prev.map((row, i) => (i === idx ? { ...row, sessions } : row)),
                          );
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel
          title="CMS: Weekly Energy Dispensed (kWh)"
          subtitle="Daily energy throughput & charging session volumes managed in CMS"
          action={
            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-[11px]"
                onClick={() => setWeeklyEnergy(DEFAULT_WEEKLY_ENERGY)}
              >
                <RotateCcw size={12} className="mr-1" />
                Reset
              </Button>
              <Button
                size="sm"
                className="h-7 text-[11px]"
                disabled={savingSection === "telemetry"}
                onClick={handleSaveTelemetry}
              >
                <Save size={12} className="mr-1" />
                {savingSection === "telemetry" ? "Saving..." : "Save CMS"}
              </Button>
            </div>
          }
        >
          <div className="px-4 pb-3">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={weeklyEnergy} margin={{ left: 0, right: 16, top: 8, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                <YAxis
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
                <Legend wrapperStyle={{ fontSize: "10px" }} />
                <Bar dataKey="kwh" name="Energy (kWh)" fill="#059669" radius={[3, 3, 0, 0]} />
                <Bar dataKey="sessions" name="Sessions" fill="#d97706" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="table-scroll border-t">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Day</th>
                  <th>Energy Dispensed (kWh)</th>
                  <th>Vehicle Sessions</th>
                </tr>
              </thead>
              <tbody>
                {weeklyEnergy.map((point, idx) => (
                  <tr key={point.day}>
                    <td className="font-medium">{point.day}</td>
                    <td>
                      <Input
                        type="number"
                        min={1}
                        className="h-7 w-28 text-xs"
                        value={point.kwh}
                        onChange={(e) => {
                          const kwh = Math.max(1, Number(e.target.value) || 1);
                          setWeeklyEnergy((prev) =>
                            prev.map((row, i) => (i === idx ? { ...row, kwh } : row)),
                          );
                        }}
                      />
                    </td>
                    <td>
                      <Input
                        type="number"
                        min={1}
                        className="h-7 w-24 text-xs"
                        value={point.sessions}
                        onChange={(e) => {
                          const sessions = Math.max(1, Number(e.target.value) || 1);
                          setWeeklyEnergy((prev) =>
                            prev.map((row, i) => (i === idx ? { ...row, sessions } : row)),
                          );
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      {/* 2. CHARGING EQUIPMENT CATALOG CMS (PRICING, IMPORT DATE, CUSTOMS & SPECS) */}
      <Panel
        title="CMS: Charging Equipment Pricing, Import Logistics & Technical Specs"
        subtitle="Manage equipment prices, import dates, origin ports, HS codes, and electrical specs shown when clicking equipment items"
        action={
          <Button
            size="sm"
            className="h-8 text-xs"
            onClick={() => {
              setIsNewEq(true);
              setEditingEq(emptyEquipmentDraft());
            }}
          >
            <Plus size={13} className="mr-1" />
            Add Equipment Spec
          </Button>
        }
      >
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Equipment Model & OEM</th>
                <th>Power & Connectors</th>
                <th>Import Date & Origin</th>
                <th>Unit Price (NPR)</th>
                <th>FOB (USD)</th>
                <th>Warranty</th>
                <th className="text-right">Manage</th>
              </tr>
            </thead>
            <tbody>
              {catalog.map((eq) => (
                <tr key={eq.id}>
                  <td className="font-mono font-medium text-primary">{eq.equipmentCode}</td>
                  <td>
                    <div className="font-medium">{eq.modelName}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {eq.brand} · HS {eq.hsCode}
                    </div>
                  </td>
                  <td>
                    <div className="font-medium flex items-center gap-1">
                      <Zap size={11} className="text-primary" />
                      {eq.ratedPowerKw} kW ({eq.chargerType})
                    </div>
                    <div className="text-[10px] text-muted-foreground">{eq.connectorStandard}</div>
                  </td>
                  <td>
                    <div className="font-medium flex items-center gap-1">
                      <Ship size={11} className="text-muted-foreground" />
                      {displayDate(eq.importDate)}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {eq.originCountry} · {eq.entryPort}
                    </div>
                  </td>
                  <td className="font-medium whitespace-nowrap">{npr(eq.unitPriceNpr)}</td>
                  <td className="font-mono text-[11px] whitespace-nowrap">
                    ${eq.fobPriceUsd.toLocaleString()}
                  </td>
                  <td>
                    <StatusBadge status={`${eq.warrantyYears} Yr OEM`} />
                  </td>
                  <td className="text-right space-x-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7"
                      aria-label={`Edit ${eq.equipmentCode}`}
                      onClick={() => {
                        setIsNewEq(false);
                        setEditingEq(structuredClone(eq));
                      }}
                    >
                      <Pencil size={13} />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7 text-destructive hover:text-destructive"
                      aria-label={`Delete ${eq.equipmentCode}`}
                      onClick={() => handleDeleteEquipment(eq.id)}
                    >
                      <Trash2 size={13} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* 3. STATION ELECTRICAL ARCHITECTURE CMS */}
      <Panel
        title="CMS: Station Electrical & Subsystem Architecture"
        subtitle="Standard grid inflow, transformer, protection panel, and OCPP specifications displayed on Station detail pages"
        action={
          <Button
            size="sm"
            className="h-8 text-xs"
            disabled={savingSection === "architecture"}
            onClick={handleSaveArchitecture}
          >
            <CheckCircle2 size={13} className="mr-1" />
            {savingSection === "architecture" ? "Saving..." : "Save Architecture Specs"}
          </Button>
        }
      >
        <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Label className="text-xs flex items-center gap-1">
              <Zap size={12} /> Grid Inflow Label
            </Label>
            <Input
              className="mt-1.5 h-8 text-xs"
              value={arch.gridInflowTitle}
              onChange={(e) => setArch({ ...arch, gridInflowTitle: e.target.value })}
            />
          </div>
          <div>
            <Label className="text-xs">Grid Frequency / Phase</Label>
            <Input
              className="mt-1.5 h-8 text-xs"
              value={arch.gridInflowBadge}
              onChange={(e) => setArch({ ...arch, gridInflowBadge: e.target.value })}
            />
          </div>
          <div>
            <Label className="text-xs flex items-center gap-1">
              <Cpu size={12} /> Substation Transformer Spec
            </Label>
            <Input
              className="mt-1.5 h-8 text-xs"
              value={arch.transformerSpec}
              onChange={(e) => setArch({ ...arch, transformerSpec: e.target.value })}
            />
          </div>
          <div>
            <Label className="text-xs">AC Surge Protection Spec</Label>
            <Input
              className="mt-1.5 h-8 text-xs"
              value={arch.distributionSpec}
              onChange={(e) => setArch({ ...arch, distributionSpec: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-4">
            <Label className="text-xs">OCPP Telemetry Standard</Label>
            <Input
              className="mt-1.5 h-8 text-xs"
              value={arch.ocppProtocol}
              onChange={(e) => setArch({ ...arch, ocppProtocol: e.target.value })}
            />
          </div>
        </div>
      </Panel>

      {/* Equipment Add/Edit Dialog */}
      <Dialog
        open={!!editingEq}
        onOpenChange={(open) => {
          if (!open) {
            setEditingEq(null);
            setIsNewEq(false);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isNewEq
                ? "Add Charging Equipment CMS Profile"
                : "Edit Charging Equipment CMS Profile"}
            </DialogTitle>
            <DialogDescription>
              Configure unit pricing, import dates, customs details, and technical specifications.
            </DialogDescription>
          </DialogHeader>
          {editingEq && (
            <form onSubmit={handleSaveEquipmentProfile} className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label className="text-xs">Equipment Code</Label>
                  <Input
                    required
                    className="mt-1 h-8 text-xs"
                    value={editingEq.equipmentCode}
                    onChange={(e) => setEditingEq({ ...editingEq, equipmentCode: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-xs">Equipment Model Name</Label>
                  <Input
                    required
                    className="mt-1 h-8 text-xs"
                    value={editingEq.modelName}
                    onChange={(e) => setEditingEq({ ...editingEq, modelName: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-xs">OEM Brand</Label>
                  <Input
                    required
                    className="mt-1 h-8 text-xs"
                    value={editingEq.brand}
                    onChange={(e) => setEditingEq({ ...editingEq, brand: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-xs">Charger Type</Label>
                  <select
                    className="erp-select mt-1 w-full h-8 text-xs"
                    value={editingEq.chargerType}
                    onChange={(e) =>
                      setEditingEq({
                        ...editingEq,
                        chargerType: e.target.value === "AC" ? "AC" : "DC",
                      })
                    }
                  >
                    <option value="DC">DC Fast Charger</option>
                    <option value="AC">AC Wallbox / Charger</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs">Rated Power (kW)</Label>
                  <Input
                    type="number"
                    min={1}
                    className="mt-1 h-8 text-xs"
                    value={editingEq.ratedPowerKw}
                    onChange={(e) =>
                      setEditingEq({ ...editingEq, ratedPowerKw: Number(e.target.value) || 22 })
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs">Connector Standard</Label>
                  <Input
                    className="mt-1 h-8 text-xs"
                    value={editingEq.connectorStandard}
                    onChange={(e) =>
                      setEditingEq({ ...editingEq, connectorStandard: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="border-t pt-3">
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Pricing & Tax Breakdown
                </h4>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <Label className="text-xs">Unit Price (NPR)</Label>
                    <Input
                      type="number"
                      min={1}
                      className="mt-1 h-8 text-xs"
                      value={editingEq.unitPriceNpr}
                      onChange={(e) =>
                        setEditingEq({ ...editingEq, unitPriceNpr: Number(e.target.value) || 0 })
                      }
                    />
                  </div>
                  <div>
                    <Label className="text-xs">OEM FOB Price (USD)</Label>
                    <Input
                      type="number"
                      min={1}
                      className="mt-1 h-8 text-xs"
                      value={editingEq.fobPriceUsd}
                      onChange={(e) =>
                        setEditingEq({ ...editingEq, fobPriceUsd: Number(e.target.value) || 0 })
                      }
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Landed Cost (NPR)</Label>
                    <Input
                      type="number"
                      min={1}
                      className="mt-1 h-8 text-xs"
                      value={editingEq.landedCostNpr}
                      onChange={(e) =>
                        setEditingEq({ ...editingEq, landedCostNpr: Number(e.target.value) || 0 })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-3">
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Import, Customs & Origin Details
                </h4>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label className="text-xs">Import Date</Label>
                    <Input
                      type="date"
                      className="mt-1 h-8 text-xs"
                      value={editingEq.importDate}
                      onChange={(e) => setEditingEq({ ...editingEq, importDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Customs Clearance Date</Label>
                    <Input
                      type="date"
                      className="mt-1 h-8 text-xs"
                      value={editingEq.customsClearanceDate}
                      onChange={(e) =>
                        setEditingEq({ ...editingEq, customsClearanceDate: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Country of Origin</Label>
                    <Input
                      className="mt-1 h-8 text-xs"
                      value={editingEq.originCountry}
                      onChange={(e) =>
                        setEditingEq({ ...editingEq, originCountry: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Origin Dispatch Port</Label>
                    <Input
                      className="mt-1 h-8 text-xs"
                      value={editingEq.originPort}
                      onChange={(e) => setEditingEq({ ...editingEq, originPort: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Nepal Entry Port</Label>
                    <Input
                      className="mt-1 h-8 text-xs"
                      value={editingEq.entryPort}
                      onChange={(e) => setEditingEq({ ...editingEq, entryPort: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">HS Code & Shipment Ref</Label>
                    <Input
                      className="mt-1 h-8 text-xs"
                      value={editingEq.shipmentRef}
                      onChange={(e) => setEditingEq({ ...editingEq, shipmentRef: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Authorized Supplier</Label>
                    <Input
                      className="mt-1 h-8 text-xs"
                      value={editingEq.supplierName}
                      onChange={(e) => setEditingEq({ ...editingEq, supplierName: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Warranty Expiry</Label>
                    <Input
                      type="date"
                      className="mt-1 h-8 text-xs"
                      value={editingEq.warrantyExpiry}
                      onChange={(e) =>
                        setEditingEq({ ...editingEq, warrantyExpiry: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-3">
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Electrical & Mechanical Specs
                </h4>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label className="text-xs">Input Voltage</Label>
                    <Input
                      className="mt-1 h-8 text-xs"
                      value={editingEq.inputVoltage}
                      onChange={(e) => setEditingEq({ ...editingEq, inputVoltage: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Output Voltage</Label>
                    <Input
                      className="mt-1 h-8 text-xs"
                      value={editingEq.outputVoltage}
                      onChange={(e) =>
                        setEditingEq({ ...editingEq, outputVoltage: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label className="text-xs">IP / IK Rating</Label>
                    <Input
                      className="mt-1 h-8 text-xs"
                      value={editingEq.ipRating}
                      onChange={(e) => setEditingEq({ ...editingEq, ipRating: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">OCPP Protocol</Label>
                    <Input
                      className="mt-1 h-8 text-xs"
                      value={editingEq.ocppVersion}
                      onChange={(e) => setEditingEq({ ...editingEq, ocppVersion: e.target.value })}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-xs">Certifications</Label>
                    <Input
                      className="mt-1 h-8 text-xs"
                      value={editingEq.certifications}
                      onChange={(e) =>
                        setEditingEq({ ...editingEq, certifications: e.target.value })
                      }
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-xs">Engineering & Procurement Notes</Label>
                    <Textarea
                      className="mt-1 text-xs"
                      rows={2}
                      value={editingEq.notes}
                      onChange={(e) => setEditingEq({ ...editingEq, notes: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingEq(null);
                    setIsNewEq(false);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={savingSection === "equipment"}>
                  <Save size={13} className="mr-1" />
                  {savingSection === "equipment" ? "Saving..." : "Save Equipment to CMS"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
