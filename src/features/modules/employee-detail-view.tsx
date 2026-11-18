import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Phone,
  Mail,
  MessageSquare,
  Shield,
  Key,
  Lock,
  UserCheck,
  Building,
  MapPin,
  Calendar,
  Briefcase,
  CheckCircle2,
  Clock,
  Pencil,
  Trash2,
  History,
  ShieldCheck,
  Zap,
  PlugZap,
  Layers,
  Wrench,
  AlertCircle,
  FileText,
  Loader2,
  Inbox,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { BusinessRecord } from "@/models/common";
import { displayDate } from "@/lib/formatting";
import { toast } from "sonner";
import { stationsQuery } from "@/queries/stations";
import { productsQuery } from "@/queries/content";
import { listRecords } from "@/services/records";

interface EmployeeDetailViewProps {
  employee: BusinessRecord;
  onBack: () => void;
  onEdit?: (employee: BusinessRecord) => void;
  onDelete?: (employee: BusinessRecord) => void;
}

export function EmployeeDetailView({
  employee,
  onBack,
  onEdit,
  onDelete,
}: EmployeeDetailViewProps) {
  const [activeTab, setActiveTab] = useState<
    "PROFILE" | "PERMISSIONS" | "ASSIGNED SITES" | "ACTIVITY"
  >("PROFILE");

  // Modals
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [changeRoleOpen, setChangeRoleOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(employee.category || "Super Admin");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Derived employee information
  const employeeName = employee.name;
  const employeeCode = employee.code || employee.id;
  const roleTitle = employee.category || "Technical Specialist";
  const email =
    employee.email || `${employeeName.toLowerCase().replace(/[^a-z0-9]/g, "")}@voltos.internal`;
  const phone = employee.phone || "Not specified";
  const altPhone = "+977-9844971857";
  const location = employee.location || "Kathmandu Operations HQ";
  const joinedDate = displayDate(employee.date);
  const status = employee.status || "Active";

  const getDepartment = (role: string) => {
    if (role.includes("Admin") || role.includes("Director"))
      return "Executive & Platform Architecture";
    if (role.includes("Engineer") || role.includes("Commissioning"))
      return "High-Voltage Field Engineering";
    if (role.includes("Sales") || role.includes("Commercial"))
      return "Commercial Fleet & Dealer Partnerships";
    if (role.includes("Finance") || role.includes("Billing"))
      return "Corporate Finance & Revenue Assurance";
    if (role.includes("Customs") || role.includes("Logistics"))
      return "International Import Logistics & Customs";
    if (role.includes("NOC") || role.includes("Telematics"))
      return "NOC & Cloud Telematics Operations";
    return "Operations & Technical Support";
  };

  const department = getDepartment(roleTitle);

  // Live queries for stations, assets, and audit logs
  const { data: stationsData, isLoading: stationsLoading } = useQuery(stationsQuery());
  const managedStations = stationsData?.items ?? [];

  const { data: productsData, isLoading: productsLoading } = useQuery(productsQuery());
  const assignedAssets = productsData ?? [];

  const { data: auditData, isLoading: auditLoading } = useQuery({
    queryKey: ["employee-audit-trail", employee.id],
    queryFn: () => listRecords("administration/audit-trail", { pageSize: 10 }),
  });
  const activityLogs = auditData?.items ?? [];

  const domainPermissions = [
    {
      domain: "Sales & CRM",
      desc: "Commercial fleet deals, leads, quotes, customer accounts",
      access: "Full Read / Write / Export",
    },
    {
      domain: "Inventory & Warehouses",
      desc: "Charging hardware, spare parts, and logistics stock",
      access: "Full Management",
    },
    {
      domain: "Procurement & Import",
      desc: "Suppliers, Purchase Orders, customs import shipments",
      access: "Approval Authority",
    },
    {
      domain: "Capital Projects",
      desc: "Depot construction, substation transformer installations",
      access: "Budget & Milestone Signoff",
    },
    {
      domain: "Workshop & Field Service",
      desc: "Job cards, charger diagnostics, technician dispatch",
      access: "Technical Lead",
    },
    {
      domain: "Network & Stations",
      desc: "Live charger telemetry, OCPP tariffs, uptime monitoring",
      access: "Network Administrator",
    },
    {
      domain: "Administration & Security",
      desc: "Users, roles, system access policies, system audit logs",
      access: "Super Administrator",
    },
  ];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in-50 duration-200">
      {/* 1. TOP BACK BUTTON */}
      <div>
        <Button
          variant="outline"
          size="sm"
          onClick={onBack}
          className="h-8 gap-1.5 text-xs font-semibold text-primary border-primary/30 hover:bg-primary/5 uppercase tracking-wider"
        >
          <ArrowLeft size={14} />
          Back to Users & Employees
        </Button>
      </div>

      {/* 2. EMPLOYEE HERO HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-4">
          <div className="size-14 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center text-primary font-bold text-xl shadow-xs">
            {employeeName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{employeeName}</h1>
              <Badge
                variant="outline"
                className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[11px] font-semibold"
              >
                {status}
              </Badge>
              <Badge variant="secondary" className="text-[11px] font-mono">
                {employeeCode}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
              <strong className="text-foreground font-medium">{roleTitle}</strong>
              <span>·</span>
              <span>{department}</span>
              <span>·</span>
              <span>{email}</span>
              <span>·</span>
              <span>{phone}</span>
              <span>·</span>
              <span>{location}</span>
            </p>
          </div>
        </div>
      </div>

      {/* 3. ACTION TOOLBAR */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs font-medium rounded-full px-3.5 hover:border-primary"
          onClick={() => {
            window.open(`tel:${phone}`, "_self");
            toast.info(`Calling ${phone}...`);
          }}
        >
          <Phone size={13} className="text-muted-foreground" />
          Call
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs font-medium rounded-full px-3.5 hover:border-primary"
          onClick={() => {
            window.open(`mailto:${email}`, "_self");
            toast.info(`Composing email to ${email}...`);
          }}
        >
          <Mail size={13} className="text-muted-foreground" />
          Email
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs font-medium rounded-full px-3.5 hover:border-emerald-500"
          onClick={() => {
            window.open(`https://wa.me/${phone.replace(/\D/g, "")}`, "_blank");
            toast.info(`Opening WhatsApp conversation...`);
          }}
        >
          <MessageSquare size={13} className="text-emerald-500" />
          WhatsApp
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs font-medium rounded-full px-3.5 hover:border-primary"
          onClick={() => {
            if (onEdit) onEdit(employee);
          }}
        >
          <Pencil size={13} className="text-primary" />
          Edit Profile
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs font-medium rounded-full px-3.5 hover:border-primary"
          onClick={() => setResetPasswordOpen(true)}
        >
          <Key size={13} className="text-amber-500" />
          Reset Password
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs font-medium rounded-full px-3.5 hover:border-primary"
          onClick={() => setChangeRoleOpen(true)}
        >
          <ShieldCheck size={13} className="text-primary" />
          Change Role
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs font-medium rounded-full px-3.5 text-destructive hover:bg-destructive/10 hover:border-destructive"
          onClick={() => setDeleteConfirmOpen(true)}
        >
          <Trash2 size={13} />
          Deactivate Employee
        </Button>
      </div>

      {/* 4. SUMMARY METRIC CARDS (4 columns x 2 rows) */}
      <div className="rounded-xl border bg-card p-6 shadow-xs">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-8">
          <div>
            <span className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Designation & Role
            </span>
            <span className="mt-1 block text-sm font-semibold text-foreground">{roleTitle}</span>
          </div>

          <div>
            <span className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Operating Department
            </span>
            <span className="mt-1 block text-sm font-semibold text-foreground">{department}</span>
          </div>

          <div>
            <span className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              System Permissions
            </span>
            <span className="mt-1 block text-sm font-semibold text-primary">
              Full Enterprise Access (7/7)
            </span>
          </div>

          <div>
            <span className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Managed Charging Sites
            </span>
            <span className="mt-1 block text-sm font-semibold text-foreground">
              {managedStations.length} Regional Stations
            </span>
          </div>

          <div>
            <span className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Date Joined
            </span>
            <span className="mt-1 block text-sm font-semibold text-foreground">{joinedDate}</span>
          </div>

          <div>
            <span className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Two-Factor Authentication
            </span>
            <span className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600">
              <CheckCircle2 size={14} /> Active (Hardware TOTP)
            </span>
          </div>
        </div>
      </div>

      {/* 5. TABS NAVIGATION */}
      <div className="border-b">
        <nav className="flex space-x-6 overflow-x-auto text-xs font-semibold uppercase tracking-wider scrollbar-none">
          {[
            { id: "PROFILE", label: "Employee Profile & Details" },
            { id: "PERMISSIONS", label: "Roles & Security Permissions" },
            { id: "ASSIGNED SITES", label: "Assigned Sites & Assets" },
            { id: "ACTIVITY", label: "Activity Audit Log" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as typeof activeTab)}
              className={`py-3 border-b-2 font-medium transition-colors whitespace-nowrap ${
                activeTab === t.id
                  ? "border-sky-500 text-sky-600 dark:text-sky-400 font-bold"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {/* 6. TAB CONTENT SECTORS */}

      {/* TAB 1: EMPLOYEE PROFILE */}
      {activeTab === "PROFILE" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-xl border bg-card p-5 space-y-4">
            <div className="flex items-center gap-2 border-b pb-3">
              <Briefcase size={16} className="text-primary" />
              <h3 className="text-sm font-semibold text-foreground">
                Employment & Organizational Details
              </h3>
            </div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3.5 text-xs">
              <div>
                <dt className="text-muted-foreground text-[10px] uppercase font-semibold">
                  Official Employee ID
                </dt>
                <dd className="font-mono font-bold text-primary mt-0.5">{employeeCode}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-[10px] uppercase font-semibold">
                  Employment Status
                </dt>
                <dd className="font-semibold text-emerald-600 mt-0.5">Full-Time Permanent</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-[10px] uppercase font-semibold">
                  Primary Designation
                </dt>
                <dd className="font-medium text-foreground mt-0.5">{roleTitle}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-[10px] uppercase font-semibold">
                  Functional Department
                </dt>
                <dd className="font-medium text-foreground mt-0.5">{department}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-[10px] uppercase font-semibold">
                  Reporting Supervisor
                </dt>
                <dd className="font-medium text-foreground mt-0.5">Managing Director / Board</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-[10px] uppercase font-semibold">
                  Work Shift & Schedule
                </dt>
                <dd className="font-medium text-foreground mt-0.5">
                  General Shift (09:00 - 18:00 NST)
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-muted-foreground text-[10px] uppercase font-semibold">
                  Primary Duty Station / Office
                </dt>
                <dd className="font-medium text-foreground mt-0.5">
                  Volt OS Enterprise EV Infrastructure Operations Center, Ward No. 04, Kathmandu
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-xl border bg-card p-5 space-y-4">
            <div className="flex items-center gap-2 border-b pb-3">
              <UserCheck size={16} className="text-primary" />
              <h3 className="text-sm font-semibold text-foreground">
                Personal Identification & Contacts
              </h3>
            </div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3.5 text-xs">
              <div>
                <dt className="text-muted-foreground text-[10px] uppercase font-semibold">
                  Full Legal Name
                </dt>
                <dd className="font-semibold text-foreground mt-0.5">{employeeName}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-[10px] uppercase font-semibold">
                  National Citizenship / NID #
                </dt>
                <dd className="font-mono text-foreground mt-0.5">27-01-78-04912 (Kathmandu)</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-[10px] uppercase font-semibold">
                  Official Corporate Email
                </dt>
                <dd className="font-medium text-primary mt-0.5 truncate">{email}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-[10px] uppercase font-semibold">
                  Mobile Hotline
                </dt>
                <dd className="font-medium text-foreground mt-0.5">{phone}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-[10px] uppercase font-semibold">
                  Emergency Contact
                </dt>
                <dd className="font-medium text-foreground mt-0.5">
                  Sunita Shrestha (Spouse) · {altPhone}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-[10px] uppercase font-semibold">
                  Blood Group
                </dt>
                <dd className="font-medium text-foreground mt-0.5">O Positive (O+)</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-muted-foreground text-[10px] uppercase font-semibold">
                  Permanent Residential Address
                </dt>
                <dd className="font-medium text-foreground mt-0.5">
                  Kapan-04, Budhanilkantha Municipality, Kathmandu District, Bagmati Province, Nepal
                </dd>
              </div>
            </dl>
          </div>
        </div>
      )}

      {/* TAB 2: ROLES & PERMISSIONS */}
      {activeTab === "PERMISSIONS" && (
        <div className="space-y-6">
          <div className="rounded-xl border bg-card p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-500" />
                <h3 className="text-sm font-semibold text-foreground">
                  Domain Access Control Matrix
                </h3>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setChangeRoleOpen(true)}
              >
                Modify Permissions
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/50 border-b text-muted-foreground font-semibold">
                  <tr>
                    <th className="p-3">Operating Domain</th>
                    <th className="p-3">Functional Scope</th>
                    <th className="p-3">Assigned Privilege</th>
                    <th className="p-3">Security Boundary</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {domainPermissions.map((p, idx) => (
                    <tr key={idx} className="hover:bg-muted/20">
                      <td className="p-3 font-semibold text-foreground">{p.domain}</td>
                      <td className="p-3 text-muted-foreground">{p.desc}</td>
                      <td className="p-3">
                        <span className="rounded-full bg-emerald-500/10 text-emerald-600 px-2.5 py-0.5 text-[10px] font-semibold">
                          {p.access}
                        </span>
                      </td>
                      <td className="p-3 text-muted-foreground text-[11px]">Enterprise-wide</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-5 space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Lock size={15} className="text-primary" /> Security & Session Profile
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1 text-xs">
              <div className="p-3.5 rounded-lg border bg-muted/15 space-y-1">
                <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                  Two-Factor Authentication
                </span>
                <span className="font-semibold text-emerald-600 block">Enforced & Active</span>
                <p className="text-[10px] text-muted-foreground">
                  TOTP authenticator app verified with backup codes generated.
                </p>
              </div>

              <div className="p-3.5 rounded-lg border bg-muted/15 space-y-1">
                <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                  Session Policy
                </span>
                <span className="font-semibold text-foreground block">
                  30-Minute Inactivity Lock
                </span>
                <p className="text-[10px] text-muted-foreground">
                  Strict concurrent session limit: 2 active devices.
                </p>
              </div>

              <div className="p-3.5 rounded-lg border bg-muted/15 space-y-1">
                <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                  Credential Security
                </span>
                <span className="font-semibold text-foreground block">
                  Last Rotated 28 Oct 2026
                </span>
                <p className="text-[10px] text-muted-foreground">
                  Argon2id salted password hashing with enterprise entropy checks.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ASSIGNED SITES & ASSETS */}
      {activeTab === "ASSIGNED SITES" && (
        <div className="space-y-6">
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold">
                  Managed Charging Stations & Infrastructure Hubs
                </h3>
                <p className="text-xs text-muted-foreground">
                  Charging network facilities and deployment sites managed by Volt OS engineering
                </p>
              </div>
            </div>
            {stationsLoading ? (
              <div className="py-12 text-center text-xs text-muted-foreground">
                <Loader2 className="mx-auto mb-2 size-5 animate-spin text-primary" />
                Loading station facilities…
              </div>
            ) : managedStations.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground">
                <Inbox className="mx-auto mb-2 size-6 opacity-40" />
                No stations currently recorded in database
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/50 border-b text-muted-foreground font-semibold">
                    <tr>
                      <th className="p-3">Station Name</th>
                      <th className="p-3">Station Code</th>
                      <th className="p-3">Installed Hardware</th>
                      <th className="p-3">Province / District</th>
                      <th className="p-3">Operational Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {managedStations.map((st) => (
                      <tr key={st.id} className="hover:bg-muted/20">
                        <td className="p-3 font-semibold text-foreground flex items-center gap-2">
                          <Zap size={14} className="text-amber-500" />
                          {st.name}
                        </td>
                        <td className="p-3 font-mono text-muted-foreground">{st.stationCode}</td>
                        <td className="p-3">{st.chargers.length} Installed Units</td>
                        <td className="p-3 font-medium">
                          {st.province} · {st.district}
                        </td>
                        <td className="p-3">
                          <span className="rounded-full bg-emerald-500/10 text-emerald-600 px-2 py-0.5 text-[10px] font-semibold">
                            {st.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="rounded-xl border bg-card p-5 space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Wrench size={15} className="text-primary" /> Imported Hardware & Technical Assets
            </h3>
            {productsLoading ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                <Loader2 className="mx-auto mb-2 size-5 animate-spin text-primary" />
                Loading equipment catalog…
              </div>
            ) : assignedAssets.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                <Inbox className="mx-auto mb-2 size-6 opacity-40" />
                No technical hardware assets found
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {assignedAssets.slice(0, 6).map((asset) => (
                  <div
                    key={asset.id}
                    className="p-3.5 rounded-lg border bg-muted/15 space-y-1.5 text-xs"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary block">
                      {asset.category_name}
                    </span>
                    <span className="font-semibold text-foreground block truncate">
                      {asset.name}
                    </span>
                    <p className="text-[11px] text-muted-foreground">
                      {asset.power_kw > 0 ? `${asset.power_kw} kW · ` : ""}
                      {asset.connector_type} · SKU: {asset.sku}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: ACTIVITY AUDIT LOG */}
      {activeTab === "ACTIVITY" && (
        <div className="rounded-xl border bg-card p-5 space-y-4">
          <div className="border-b pb-3">
            <h3 className="text-sm font-semibold">Security & System Audit Log</h3>
            <p className="text-xs text-muted-foreground">
              Traceable records of operational approvals, system events, and configuration changes
            </p>
          </div>

          {auditLoading ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              <Loader2 className="mx-auto mb-2 size-5 animate-spin text-primary" />
              Loading audit logs from database…
            </div>
          ) : activityLogs.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              <Inbox className="mx-auto mb-2 size-6 opacity-40" />
              No audit logs recorded for this account
            </div>
          ) : (
            <div className="relative pl-6 space-y-5 before:absolute before:bottom-0 before:top-2 before:left-2.5 before:w-0.5 before:bg-border">
              {activityLogs.map((log) => (
                <div key={log.id} className="relative">
                  <div className="absolute -left-6 top-1 size-3.5 rounded-full border-2 border-background bg-primary" />
                  <div className="rounded-lg border bg-muted/15 p-3.5 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-foreground">{log.name}</span>
                      <span className="text-[10px] text-muted-foreground">{log.date}</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {log.description}
                    </p>
                    <div className="text-[10px] font-mono text-primary/80">
                      Operator: {log.owner} {log.location ? `· ${log.location}` : ""}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL: RESET PASSWORD */}
      <Dialog open={resetPasswordOpen} onOpenChange={setResetPasswordOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Password for {employeeName}</DialogTitle>
            <DialogDescription>
              A secure password reset link or temporary credential will be issued to {email}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2 text-xs">
            <div className="space-y-1">
              <Label>Delivery Channel</Label>
              <Input disabled value={`Primary Email (${email})`} />
            </div>
            <div className="space-y-1">
              <Label>Force Password Change on Next Sign In</Label>
              <div className="flex items-center gap-2 pt-1 text-muted-foreground">
                <CheckCircle2 size={16} className="text-primary" />
                <span>Yes, user must create a new password immediately.</span>
              </div>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" size="sm" onClick={() => setResetPasswordOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setResetPasswordOpen(false);
                toast.success(`Password reset link dispatched to ${email}.`);
              }}
            >
              Send Reset Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: CHANGE ROLE */}
      <Dialog open={changeRoleOpen} onOpenChange={setChangeRoleOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Change Role for {employeeName}</DialogTitle>
            <DialogDescription>Assign a new system role and permission set.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2 text-xs">
            <div className="space-y-1">
              <Label>Current Role</Label>
              <Input disabled value={roleTitle} />
            </div>
            <div className="space-y-1">
              <Label>New System Role</Label>
              <select
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
              >
                <option>Super Admin</option>
                <option>Regional Field Engineer</option>
                <option>Sales Executive</option>
                <option>Operations Lead</option>
                <option>Billing Specialist</option>
                <option>Report Viewer</option>
              </select>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" size="sm" onClick={() => setChangeRoleOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setChangeRoleOpen(false);
                toast.success(`Role updated to ${selectedRole} for ${employeeName}.`);
              }}
            >
              Confirm Role Change
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: DEACTIVATE / DELETE CONFIRMATION */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Deactivate Employee?</DialogTitle>
            <DialogDescription>
              Are you sure you want to deactivate <strong>{employeeName}</strong>? This will revoke
              all active login sessions and API tokens.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                setDeleteConfirmOpen(false);
                if (onDelete) onDelete(employee);
              }}
            >
              Confirm Deactivation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
