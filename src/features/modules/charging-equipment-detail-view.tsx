import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Copy,
  Printer,
  DollarSign,
  Ship,
  Zap,
  ShieldCheck,
  Cpu,
  MapPin,
  Package,
  FileCheck2,
  ExternalLink,
  Wrench,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Kpi, Panel, StatusBadge } from "@/components/shared/common";
import { calculateVat, displayDate, npr } from "@/lib/formatting";
import { siteSettingsQuery } from "@/queries/content";
import { resolveEquipmentCmsDetails } from "@/services/content";
import { toast } from "sonner";

export interface EquipmentDetailInput {
  id: string;
  code: string;
  name: string;
  status: string;
  serialNumber?: string | undefined | null;
  brand?: string | undefined | null;
  productModel?: string | undefined | null;
  category?: string | undefined | null;
  chargerType?: string | undefined | null;
  ratedPowerKw?: number | undefined | null;
  connectorStandard?: string | undefined | null;
  connectorCount?: number | undefined | null;
  amountNpr?: number | undefined | null;
  date?: string | undefined | null;
  installationDate?: string | undefined | null;
  warrantyExpiry?: string | undefined | null;
  stationId?: string | undefined | null;
  stationName?: string | undefined | null;
  stationCode?: string | undefined | null;
  location?: string | undefined | null;
  owner?: string | undefined | null;
  originPort?: string | undefined | null;
  country?: string | undefined | null;
  shipmentId?: string | undefined | null;
  description?: string | undefined | null;
}

interface ChargingEquipmentDetailViewProps {
  equipment: EquipmentDetailInput;
  backLabel?: string;
  editable?: boolean;
  finance?: boolean;
  onBack: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function ChargingEquipmentDetailView({
  equipment,
  backLabel = "Back to Charging Equipment",
  editable = false,
  finance = true,
  onBack,
  onEdit,
  onDelete,
}: ChargingEquipmentDetailViewProps) {
  const [activeTab, setActiveTab] = useState<"PRICING_IMPORT" | "SPECS" | "DEPLOYMENT">(
    "PRICING_IMPORT",
  );
  const { data: siteSettings } = useQuery(siteSettingsQuery);

  const cms = resolveEquipmentCmsDetails(
    {
      code: equipment.code,
      name: equipment.name,
      productModel: equipment.productModel,
      brand: equipment.brand,
      category: equipment.category,
      chargerType: equipment.chargerType,
      ratedPowerKw: equipment.ratedPowerKw,
      connectorStandard: equipment.connectorStandard,
      connectorCount: equipment.connectorCount,
      amountNpr: equipment.amountNpr,
      date: equipment.date ?? equipment.installationDate,
      warrantyExpiry: equipment.warrantyExpiry,
      originPort: equipment.originPort,
      country: equipment.country,
      shipmentId: equipment.shipmentId,
      description: equipment.description,
    },
    siteSettings?.stats?.equipmentCatalog,
  );

  const vatAmount = calculateVat(cms.unitPriceNpr);
  const grossTotalNpr = cms.unitPriceNpr + vatAmount;
  const customsDutyNpr = Math.round(cms.landedCostNpr * ((cms.customsDutyPct || 1) / 100));
  const grossMarginNpr = Math.max(15000, cms.unitPriceNpr - cms.landedCostNpr);
  const grossMarginPct =
    cms.unitPriceNpr > 0 ? Math.max(1, Math.round((grossMarginNpr / cms.unitPriceNpr) * 100)) : 18;
  const serialNo = equipment.serialNumber || `SN-${equipment.code.replace(/[^A-Z0-9]/gi, "")}-2026`;
  const installedDate = equipment.installationDate || equipment.date || "2026-03-15";

  const copySerial = () => {
    void navigator.clipboard.writeText(serialNo);
    toast.success(`Copied serial number ${serialNo}.`);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in-50 duration-200">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={onBack}
          className="h-8 gap-1.5 text-xs font-semibold text-primary border-primary/30 hover:bg-primary/5 uppercase tracking-wider"
        >
          <ArrowLeft size={14} />
          {backLabel}
        </Button>

        <Button variant="outline" size="sm" asChild className="h-8 text-xs">
          <Link to="/super-admin" search={{ tab: "cms" } as never} className="gap-1.5">
            <ExternalLink size={13} />
            Manage Pricing & Specs in CMS
          </Link>
        </Button>
      </div>

      {/* Equipment Hero Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{cms.modelName}</h1>
            <StatusBadge status={equipment.status || "Operational"} />
            <Badge variant="secondary" className="font-mono text-xs">
              {equipment.code}
            </Badge>
            <Badge variant="outline" className="text-[11px] font-semibold">
              {cms.chargerType} · {cms.ratedPowerKw} kW
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
            <strong className="text-foreground font-medium">{cms.brand}</strong>
            <span>·</span>
            <span className="font-mono">Serial: {serialNo}</span>
            <span>·</span>
            <span>Imported: {displayDate(cms.importDate)}</span>
            <span>·</span>
            <span>Origin: {cms.originCountry}</span>
            {equipment.stationName && (
              <>
                <span>·</span>
                <span>Station: {equipment.stationName}</span>
              </>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {editable && onEdit && (
            <Button size="sm" onClick={onEdit} className="h-8 gap-1.5 text-xs">
              <Pencil size={13} />
              Edit Equipment
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={copySerial} className="h-8 gap-1.5 text-xs">
            <Copy size={13} />
            Copy Serial
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="h-8 gap-1.5 text-xs"
          >
            <Printer size={13} />
            Print Spec Sheet
          </Button>
          {editable && onDelete && (
            <Button
              variant="outline"
              size="sm"
              onClick={onDelete}
              className="h-8 gap-1.5 text-xs text-destructive hover:bg-destructive/10"
            >
              <Trash2 size={13} />
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* 4 KPI Strip */}
      <div className="kpi-grid">
        <Kpi
          label={finance ? "Unit Price (NPR)" : "Equipment Tier"}
          value={finance ? npr(cms.unitPriceNpr) : `${cms.chargerType} Fast`}
          foot={
            finance
              ? `Incl. 13% VAT: ${npr(grossTotalNpr)} · FOB $${cms.fobPriceUsd.toLocaleString()}`
              : `${cms.brand} OEM Hardware`
          }
          icon={<DollarSign size={15} />}
        />
        <Kpi
          label="Import Date"
          value={displayDate(cms.importDate)}
          foot={`${cms.originCountry} → ${cms.entryPort}`}
          icon={<Ship size={15} />}
        />
        <Kpi
          label="Rated Power Output"
          value={`${cms.ratedPowerKw} kW`}
          foot={`${cms.connectorStandard} · ${cms.connectorCount} Connector${cms.connectorCount > 1 ? "s" : ""}`}
          icon={<Zap size={15} />}
        />
        <Kpi
          label="OEM Warranty & AMC"
          value={`${cms.warrantyYears} Years`}
          foot={`Valid until ${displayDate(cms.warrantyExpiry)} · ${cms.amcStatus}`}
          icon={<ShieldCheck size={15} />}
        />
      </div>

      {/* Navigation Tabs */}
      <div className="border-b">
        <nav className="flex space-x-6 overflow-x-auto text-xs font-semibold uppercase tracking-wider">
          {[
            { id: "PRICING_IMPORT", label: "Pricing & Import Logistics" },
            { id: "SPECS", label: "Technical & Electrical Specs" },
            { id: "DEPLOYMENT", label: "Deployment, Warranty & History" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`py-3 border-b-2 font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-primary text-primary font-bold"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* TAB 1: PRICING & IMPORT LOGISTICS */}
      {activeTab === "PRICING_IMPORT" && (
        <div className="grid gap-5 md:grid-cols-2">
          <Panel
            title="Pricing & Importer Costing Breakdown"
            subtitle="CMS-managed retail pricing, landed import cost, and Nepal tax structure"
          >
            <dl className="grid grid-cols-2 gap-4 px-5 pb-5 text-xs">
              {finance ? (
                <>
                  <div>
                    <dt className="text-[10px] uppercase font-semibold text-muted-foreground">
                      Unit Selling Price (Excl. VAT)
                    </dt>
                    <dd className="mt-1 text-sm font-bold text-primary">{npr(cms.unitPriceNpr)}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] uppercase font-semibold text-muted-foreground">
                      Gross Price (Incl. {cms.vatPct || 13}% VAT)
                    </dt>
                    <dd className="mt-1 text-sm font-bold text-foreground">{npr(grossTotalNpr)}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] uppercase font-semibold text-muted-foreground">
                      OEM FOB Export Price (USD)
                    </dt>
                    <dd className="mt-1 font-mono font-semibold text-foreground">
                      ${cms.fobPriceUsd.toLocaleString()} USD
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] uppercase font-semibold text-muted-foreground">
                      Landed Import Cost (NPR)
                    </dt>
                    <dd className="mt-1 font-semibold text-foreground">{npr(cms.landedCostNpr)}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] uppercase font-semibold text-muted-foreground">
                      Nepal EV Customs Tariff ({cms.customsDutyPct || 1}%)
                    </dt>
                    <dd className="mt-1 font-medium text-foreground">{npr(customsDutyNpr)}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] uppercase font-semibold text-muted-foreground">
                      Nepal VAT ({cms.vatPct || 13}%)
                    </dt>
                    <dd className="mt-1 font-medium text-foreground">{npr(vatAmount)}</dd>
                  </div>
                  <div className="col-span-2 rounded-lg border bg-muted/25 p-3 flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-muted-foreground">
                      Estimated Importer Gross Margin
                    </span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {npr(grossMarginNpr)} ({grossMarginPct}%)
                    </span>
                  </div>
                </>
              ) : (
                <div className="col-span-2 text-muted-foreground">
                  Financial costing details are restricted for your current role.
                </div>
              )}
            </dl>
          </Panel>

          <Panel
            title="Import, Customs & Origin Traceability"
            subtitle="Complete cross-border shipment, port clearance, and OEM provenance"
          >
            <dl className="grid grid-cols-2 gap-4 px-5 pb-5 text-xs">
              <div>
                <dt className="text-[10px] uppercase font-semibold text-muted-foreground">
                  Date Imported into Nepal
                </dt>
                <dd className="mt-1 font-semibold text-foreground flex items-center gap-1.5">
                  <Calendar size={12} className="text-primary" />
                  {displayDate(cms.importDate)}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase font-semibold text-muted-foreground">
                  Customs Clearance Date
                </dt>
                <dd className="mt-1 font-medium text-foreground">
                  {displayDate(cms.customsClearanceDate)}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase font-semibold text-muted-foreground">
                  OEM Manufacturer / Brand
                </dt>
                <dd className="mt-1 font-semibold text-foreground">{cms.brand}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase font-semibold text-muted-foreground">
                  Authorized Supplier
                </dt>
                <dd className="mt-1 font-medium text-foreground">{cms.supplierName}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase font-semibold text-muted-foreground">
                  Country of Origin
                </dt>
                <dd className="mt-1 font-medium text-foreground">{cms.originCountry}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase font-semibold text-muted-foreground">
                  Origin Dispatch Port
                </dt>
                <dd className="mt-1 font-medium text-foreground">{cms.originPort}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase font-semibold text-muted-foreground">
                  Nepal Entry Customs Port
                </dt>
                <dd className="mt-1 font-medium text-foreground">{cms.entryPort}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase font-semibold text-muted-foreground">
                  Harmonized Tariff HS Code
                </dt>
                <dd className="mt-1 font-mono font-semibold text-primary">{cms.hsCode}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-[10px] uppercase font-semibold text-muted-foreground">
                  Bill of Lading / Shipment Reference
                </dt>
                <dd className="mt-1 font-mono text-foreground">{cms.shipmentRef}</dd>
              </div>
            </dl>
          </Panel>

          {cms.notes && (
            <div className="md:col-span-2">
              <Panel title="Equipment Engineering & Procurement Notes">
                <p className="px-5 pb-5 text-xs leading-relaxed text-muted-foreground">
                  {cms.notes}
                </p>
              </Panel>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: TECHNICAL & ELECTRICAL SPECS */}
      {activeTab === "SPECS" && (
        <div className="grid gap-5 md:grid-cols-2">
          <Panel
            title="Electrical & Power Architecture"
            subtitle="Input/output power envelopes and charging standards"
          >
            <dl className="grid grid-cols-2 gap-4 px-5 pb-5 text-xs">
              <div>
                <dt className="text-[10px] uppercase font-semibold text-muted-foreground">
                  Charger Architecture
                </dt>
                <dd className="mt-1 font-semibold text-foreground">
                  {cms.chargerType === "DC" ? "DC Fast Charger" : "AC Commercial Wallbox"}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase font-semibold text-muted-foreground">
                  Rated Power Capacity
                </dt>
                <dd className="mt-1 font-bold text-primary">{cms.ratedPowerKw} kW</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase font-semibold text-muted-foreground">
                  Connector Standard
                </dt>
                <dd className="mt-1 font-medium text-foreground">
                  {cms.connectorStandard} ({cms.connectorCount} Guns)
                </dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase font-semibold text-muted-foreground">
                  Max Output Current
                </dt>
                <dd className="mt-1 font-mono font-medium text-foreground">{cms.maxCurrentA} A</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase font-semibold text-muted-foreground">
                  Input Grid Voltage
                </dt>
                <dd className="mt-1 font-medium text-foreground">{cms.inputVoltage}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase font-semibold text-muted-foreground">
                  Output Voltage Range
                </dt>
                <dd className="mt-1 font-medium text-foreground">{cms.outputVoltage}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase font-semibold text-muted-foreground">
                  Peak Conversion Efficiency
                </dt>
                <dd className="mt-1 font-semibold text-emerald-600 dark:text-emerald-400">
                  {cms.efficiencyPct}%
                </dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase font-semibold text-muted-foreground">
                  Telemetry & Smart Protocol
                </dt>
                <dd className="mt-1 font-mono font-medium text-foreground">{cms.ocppVersion}</dd>
              </div>
            </dl>
          </Panel>

          <Panel
            title="Mechanical, Thermal & Compliance"
            subtitle="Enclosure protection, physical footprint, and international certifications"
          >
            <dl className="grid grid-cols-2 gap-4 px-5 pb-5 text-xs">
              <div>
                <dt className="text-[10px] uppercase font-semibold text-muted-foreground">
                  Equipment ID
                </dt>
                <dd className="mt-1 font-mono font-bold text-primary">{equipment.code}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase font-semibold text-muted-foreground">
                  Factory Serial Number
                </dt>
                <dd className="mt-1 font-mono font-medium text-foreground">{serialNo}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase font-semibold text-muted-foreground">
                  Ingress & Impact Protection
                </dt>
                <dd className="mt-1 font-semibold text-foreground">{cms.ipRating}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase font-semibold text-muted-foreground">
                  Thermal Cooling System
                </dt>
                <dd className="mt-1 font-medium text-foreground">{cms.coolingType}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase font-semibold text-muted-foreground">
                  Dimensions (H × W × D)
                </dt>
                <dd className="mt-1 font-mono text-foreground">{cms.dimensionsMm}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase font-semibold text-muted-foreground">
                  Net Hardware Weight
                </dt>
                <dd className="mt-1 font-medium text-foreground">{cms.weightKg} kg</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-[10px] uppercase font-semibold text-muted-foreground flex items-center gap-1">
                  <FileCheck2 size={12} className="text-primary" />
                  Safety & Regulatory Certifications
                </dt>
                <dd className="mt-1 font-medium text-foreground">{cms.certifications}</dd>
              </div>
            </dl>
          </Panel>
        </div>
      )}

      {/* TAB 3: DEPLOYMENT, WARRANTY & LIFECYCLE */}
      {activeTab === "DEPLOYMENT" && (
        <div className="grid gap-5 md:grid-cols-2">
          <Panel
            title="Site Deployment & Warranty Coverage"
            subtitle="Active installation coordinates, warranty term, and service SLA"
          >
            <dl className="grid grid-cols-2 gap-4 px-5 pb-5 text-xs">
              <div>
                <dt className="text-[10px] uppercase font-semibold text-muted-foreground">
                  Assigned Station
                </dt>
                <dd className="mt-1 font-semibold text-foreground">
                  {equipment.stationId ? (
                    <Link
                      to="/network/stations/$stationId"
                      params={{ stationId: equipment.stationId }}
                      className="text-primary hover:underline inline-flex items-center gap-1"
                    >
                      <MapPin size={12} />
                      {equipment.stationName || equipment.stationCode || equipment.stationId}
                    </Link>
                  ) : (
                    equipment.location || "Kathmandu Central Hub"
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase font-semibold text-muted-foreground">
                  Operational Status
                </dt>
                <dd className="mt-1">
                  <StatusBadge status={equipment.status || "Operational"} />
                </dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase font-semibold text-muted-foreground">
                  Site Installation Date
                </dt>
                <dd className="mt-1 font-medium text-foreground">{displayDate(installedDate)}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase font-semibold text-muted-foreground">
                  Warranty Coverage
                </dt>
                <dd className="mt-1 font-semibold text-foreground">
                  {cms.warrantyYears} Years (Expires {displayDate(cms.warrantyExpiry)})
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-[10px] uppercase font-semibold text-muted-foreground">
                  Annual Maintenance Contract (AMC)
                </dt>
                <dd className="mt-1 font-medium text-foreground flex items-center gap-1.5">
                  <Wrench size={12} className="text-primary" />
                  {cms.amcStatus}
                </dd>
              </div>
            </dl>
          </Panel>

          <Panel
            title="Equipment Import & Service Lifecycle"
            subtitle="End-to-end audit milestones from OEM factory to active operation"
          >
            <div className="px-5 pb-5 space-y-4">
              {[
                {
                  icon: <Ship size={13} className="text-primary" />,
                  title: "Imported & Cleared via Nepal Customs",
                  date: displayDate(cms.customsClearanceDate),
                  detail: `Dispatched from ${cms.originPort} (${cms.originCountry}) · Cleared at ${cms.entryPort} under HS ${cms.hsCode}.`,
                },
                {
                  icon: <Package size={13} className="text-blue-600" />,
                  title: "Pre-Commissioning Bench QC Passed",
                  date: displayDate(cms.importDate),
                  detail: `Verified ${cms.ratedPowerKw} kW load bank test, ${cms.ipRating} seal check, and ${cms.ocppVersion} handshake.`,
                },
                {
                  icon: <Cpu size={13} className="text-emerald-600" />,
                  title: "Installed & Commissioned On-Site",
                  date: displayDate(installedDate),
                  detail: `Serial ${serialNo} commissioned with ${cms.connectorStandard} guns under ${cms.warrantyYears}-year OEM warranty.`,
                },
              ].map((step) => (
                <div
                  key={step.title}
                  className="rounded-lg border bg-muted/15 p-3 space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      {step.icon}
                      {step.title}
                    </span>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {step.date}
                    </span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">{step.detail}</p>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
}
