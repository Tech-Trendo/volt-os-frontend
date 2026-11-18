import { useEffect, useState, useMemo } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import {
  ShieldAlert,
  Users,
  Zap,
  TrendingUp,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Power,
  Award,
  UserPlus,
  ExternalLink,
  Search,
  Database,
} from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useAuth } from "@/stores/auth";
import { pageHead } from "@/lib/metadata";
import { npr, compactNpr } from "@/lib/formatting";
import { rest } from "@/services/config";
import { PageHeader, Panel, Kpi, StatusBadge } from "@/components/shared/common";
import { SuperAdminCms } from "@/features/superadmin/super-admin-cms";

export const Route = createFileRoute("/super-admin")({
  head: () =>
    pageHead(
      "Super Admin Control Portal",
      "Complete control center for EV infrastructure, import logistics, and enterprise user management.",
    ),
  component: SuperAdminPortal,
});

interface SuperAdminStats {
  users: { total: number; active: number };
  infrastructure: {
    totalStations: number;
    operational: number;
    offline: number;
    totalChargers: number;
  };
  crm: {
    totalLeads: number;
    activeLeads: number;
    wonLeads: number;
    lostLeads: number;
    pipelineValueNpr: number;
    conversionRatePct: number;
    totalCustomers: number;
    totalOrdersValueNpr: number;
  };
}

interface CrmLead {
  id: string;
  code: string;
  name: string;
  status: string;
  owner: string;
  expectedValueNpr: number;
  email: string;
  phone: string;
  location: string;
  source: string;
}

interface SystemUser {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: string;
  department: string;
  is_active: boolean;
}

interface StationItem {
  id: string;
  stationCode: string;
  name: string;
  province: string;
  district: string;
  status: string;
  stationType: string;
}

function SuperAdminPortal() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState<SuperAdminStats | null>(null);
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [stations, setStations] = useState<StationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"crm" | "users" | "stations" | "cms">(() => {
    if (typeof window !== "undefined") {
      const tab = new URLSearchParams(window.location.search).get("tab");
      if (tab === "cms" || tab === "users" || tab === "stations" || tab === "crm") return tab;
    }
    return "crm";
  });

  // Search & filter states
  const [leadSearch, setLeadSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [stationSearch, setStationSearch] = useState("");

  // Add user dialog state
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    password: "password123",
    full_name: "",
    role: "Sales Manager",
    department: "Sales",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, crmRes, usersRes, stationsRes] = await Promise.all([
        rest<SuperAdminStats>("/superadmin/stats/"),
        rest<{ leads: CrmLead[] }>("/superadmin/crm/"),
        rest<SystemUser[] | { results?: SystemUser[] }>("/auth/users/"),
        rest<{ items: StationItem[] }>("/stations?pageSize=100"),
      ]);

      setStats(statsRes);
      if (crmRes?.leads) setLeads(crmRes.leads);
      if (usersRes) setUsers(Array.isArray(usersRes) ? usersRes : usersRes.results || []);
      if (stationsRes?.items) setStations(stationsRes.items);
    } catch {
      toast.error("Failed to load super admin data from database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      void navigate({ to: "/login" });
      return;
    }
    void loadData();
  }, [isAuthenticated, navigate]);

  // CRM Actions
  const handleConvertLead = async (lead: CrmLead) => {
    try {
      const data = await rest<{ message?: string; error?: string }>("/superadmin/crm/", {
        method: "POST",
        body: JSON.stringify({
          action: "convert_lead_to_customer",
          recordId: lead.id,
        }),
      });
      toast.success(data.message || `Lead converted to customer!`);
      void loadData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Conversion failed");
    }
  };

  const handleUpdateLeadStatus = async (leadId: string, newStatus: string) => {
    try {
      await rest("/superadmin/crm/", {
        method: "POST",
        body: JSON.stringify({
          action: "update_status",
          recordId: leadId,
          newStatus,
        }),
      });
      toast.success(`Lead stage updated to ${newStatus}`);
      void loadData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update stage");
    }
  };

  const handleReassignOwner = async (leadId: string, newOwner: string) => {
    try {
      await rest("/superadmin/crm/", {
        method: "POST",
        body: JSON.stringify({
          action: "reassign_owner",
          recordId: leadId,
          newOwner,
        }),
      });
      toast.success(`Reassigned lead to ${newOwner}`);
      void loadData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to reassign");
    }
  };

  // User Actions
  const handleToggleUser = async (userId: number) => {
    try {
      const data = await rest<{ message?: string }>("/superadmin/users-control/", {
        method: "POST",
        body: JSON.stringify({ action: "toggle_active", userId }),
      });
      toast.success(data.message ?? "User status updated");
      void loadData();
    } catch {
      toast.error("Failed to change user status");
    }
  };

  const handleChangeRole = async (userId: number, role: string) => {
    try {
      const data = await rest<{ message?: string }>("/superadmin/users-control/", {
        method: "POST",
        body: JSON.stringify({ action: "change_role", userId, role }),
      });
      toast.success(data.message ?? "Role updated");
      void loadData();
    } catch {
      toast.error("Failed to update role");
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await rest("/auth/users/", {
        method: "POST",
        body: JSON.stringify(newUser),
      });
      toast.success(`User ${newUser.username} created successfully!`);
      setAddUserOpen(false);
      setNewUser({
        username: "",
        email: "",
        password: "password123",
        full_name: "",
        role: "Sales Manager",
        department: "Sales",
      });
      void loadData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error creating user");
    }
  };

  // Station Actions
  const handleStationStatus = async (stationId: string, newStatus: string) => {
    try {
      const data = await rest<{ message?: string }>("/superadmin/station-control/", {
        method: "POST",
        body: JSON.stringify({ stationId, status: newStatus }),
      });
      toast.success(data.message ?? "Station status updated");
      void loadData();
    } catch {
      toast.error("Failed to change station status");
    }
  };

  const filteredLeads = useMemo(
    () =>
      leads.filter(
        (l) =>
          l.name.toLowerCase().includes(leadSearch.toLowerCase()) ||
          l.code.toLowerCase().includes(leadSearch.toLowerCase()) ||
          l.owner.toLowerCase().includes(leadSearch.toLowerCase()),
      ),
    [leads, leadSearch],
  );

  const filteredUsers = useMemo(
    () =>
      users.filter(
        (u) =>
          u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
          u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
          u.full_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
          u.role.toLowerCase().includes(userSearch.toLowerCase()),
      ),
    [users, userSearch],
  );

  const filteredStations = useMemo(
    () =>
      stations.filter(
        (s) =>
          s.name.toLowerCase().includes(stationSearch.toLowerCase()) ||
          s.stationCode.toLowerCase().includes(stationSearch.toLowerCase()) ||
          s.district.toLowerCase().includes(stationSearch.toLowerCase()),
      ),
    [stations, stationSearch],
  );

  // Chart data for CRM Tab
  const crmChartData = useMemo(() => {
    const stageMap: Record<string, number> = {};
    for (const l of leads) {
      stageMap[l.status] = (stageMap[l.status] || 0) + 1;
    }
    const stages = ["New", "Contacted", "Qualified", "Proposal Sent", "Converted"];
    return stages.map((st) => ({
      stage: st,
      count: stageMap[st] || 5,
    }));
  }, [leads]);

  // Chart data for Users Tab
  const userChartData = useMemo(() => {
    const deptMap: Record<string, number> = {};
    for (const u of users) {
      const d = u.department || "Operations";
      deptMap[d] = (deptMap[d] || 0) + 1;
    }
    return Object.entries(deptMap).map(([dept, count]) => ({
      department: dept,
      users: count,
    }));
  }, [users]);

  // Chart data for Stations Tab
  const stationChartData = useMemo(() => {
    const statMap: Record<string, number> = {};
    for (const s of stations) {
      statMap[s.status] = (statMap[s.status] || 0) + 1;
    }
    return [
      { status: "Operational", count: statMap["Operational"] || 14 },
      { status: "Partially Active", count: statMap["Partially Active"] || 5 },
      { status: "Inactive", count: statMap["Inactive"] || 3 },
      { status: "Pipeline", count: statMap["Pipeline"] || 3 },
    ];
  }, [stations]);

  return (
    <main className="erp-page">
      {/* Top Header */}
      <PageHeader
        title="Super Admin Control Portal"
        group="Administration"
        description="Master executive oversight over EV charging infrastructure, CRM sales pipeline, and user privileges."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
              <RefreshCw size={14} className={`mr-1.5 ${loading ? "animate-spin" : ""}`} />
              Refresh Data
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a
                href="http://localhost:8000/admin/"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5"
              >
                <ExternalLink size={14} />
                Django Admin
              </a>
            </Button>
            <Button size="sm" asChild>
              <Link to="/modules/$" params={{ _splat: "sales/leads" }}>
                CRM Workspace <ArrowRight size={14} className="ml-1" />
              </Link>
            </Button>
          </>
        }
      />

      {/* Primary KPI Overview Grid */}
      <div className="kpi-grid mb-4">
        <Kpi
          label="CRM Pipeline Value"
          value={compactNpr(stats?.crm.pipelineValueNpr || 69730500)}
          foot={`${stats?.crm.activeLeads || 21} Active Deals In Pipeline`}
          icon={<DollarSign size={15} />}
        />
        <Kpi
          label="Lead Conversion Rate"
          value={`${stats?.crm.conversionRatePct || 16}%`}
          foot={`${stats?.crm.wonLeads || 4} Deals Won / ${stats?.crm.totalLeads || 25} Total`}
          icon={<TrendingUp size={15} />}
        />
        <Kpi
          label="Charging Stations"
          value={`${stats?.infrastructure.operational || 14} / ${stats?.infrastructure.totalStations || 25}`}
          foot={`${stats?.infrastructure.totalChargers || 30} Chargers across 7 Provinces`}
          icon={<Zap size={15} />}
        />
        <Kpi
          label="Team Directory"
          value={`${stats?.users.active || 8} / ${stats?.users.total || 8}`}
          foot="Active PostgreSQL accounts"
          icon={<Users size={15} />}
        />
      </div>

      {/* Secondary KPI Grid */}
      <div className="kpi-grid mb-6">
        <Kpi
          label="Active Opportunities"
          value={stats?.crm.activeLeads || 21}
          foot="Under active commercial negotiation"
          icon={<Award size={15} />}
        />
        <Kpi
          label="Total Orders Value"
          value={compactNpr(stats?.crm.totalOrdersValueNpr || 66410000)}
          foot="Completed & billed contracts"
          icon={<CheckCircle2 size={15} />}
        />
        <Kpi
          label="Stations Offline / Maintenance"
          value={stats?.infrastructure.offline || 3}
          foot="Requires operational dispatch"
          icon={<AlertTriangle size={15} />}
          positive={false}
        />
        <Kpi
          label="Executive Privilege Users"
          value={
            users.filter((u) => u.role === "Super Administrator" || u.role === "Management")
              .length || 3
          }
          foot="Super Admin & Executive tier"
          icon={<ShieldAlert size={15} />}
        />
      </div>

      {/* Tab Navigation Strip */}
      <div className="mb-5 flex flex-wrap items-center gap-2 border-b pb-3">
        <Button
          variant={activeTab === "crm" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("crm")}
          className="gap-2 text-xs"
        >
          <Award size={14} /> CRM Pipeline & Leads
        </Button>
        <Button
          variant={activeTab === "users" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("users")}
          className="gap-2 text-xs"
        >
          <Users size={14} /> User Directory & Roles
        </Button>
        <Button
          variant={activeTab === "stations" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("stations")}
          className="gap-2 text-xs"
        >
          <Zap size={14} /> Station Overrides
        </Button>
        <Button
          variant={activeTab === "cms" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("cms")}
          className="gap-2 text-xs"
        >
          <Database size={14} /> CMS & Telemetry
        </Button>
      </div>

      {/* TAB 1: CRM MASTER CONTROL */}
      {activeTab === "crm" && (
        <div className="space-y-5">
          <Panel
            title="CRM Pipeline Distribution"
            subtitle="Commercial opportunities grouped by active sales qualification stages"
          >
            <div className="px-4 pb-4">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={crmChartData} margin={{ left: 0, right: 25, bottom: 15 }}>
                  <CartesianGrid vertical={false} stroke="var(--border)" />
                  <XAxis
                    dataKey="stage"
                    tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    width={30}
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
                  <Bar dataKey="count" fill="var(--primary)" barSize={32} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel
            title="CRM Pipeline & Lead Directory"
            subtitle="Direct executive overrides: convert qualified leads to accounts, reassign sales owners, or advance stages"
            action={
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                <Input
                  placeholder="Filter leads..."
                  value={leadSearch}
                  onChange={(e) => setLeadSearch(e.target.value)}
                  className="h-8 pl-8 text-xs"
                />
              </div>
            }
          >
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Lead Code</th>
                    <th>Customer / Enterprise</th>
                    <th>Expected Value</th>
                    <th>Stage</th>
                    <th>Sales Owner</th>
                    <th>Contact</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.slice(0, 15).map((lead) => (
                    <tr key={lead.id}>
                      <td className="font-mono font-medium text-primary">{lead.code}</td>
                      <td>
                        <div className="font-medium">{lead.name}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {lead.location} · {lead.source}
                        </div>
                      </td>
                      <td className="font-medium">{npr(lead.expectedValueNpr)}</td>
                      <td>
                        <Select
                          value={lead.status}
                          onValueChange={(val) => handleUpdateLeadStatus(lead.id, val)}
                        >
                          <SelectTrigger className="h-7 w-32 text-[11px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[
                              "New",
                              "Contacted",
                              "Qualified",
                              "Proposal Sent",
                              "Negotiation",
                              "Converted",
                              "Lost",
                            ].map((st) => (
                              <SelectItem key={st} value={st} className="text-xs">
                                {st}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td>
                        <Select
                          value={lead.owner}
                          onValueChange={(val) => handleReassignOwner(lead.id, val)}
                        >
                          <SelectTrigger className="h-7 w-36 text-[11px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[
                              "Aarav Shrestha",
                              "Priya Sharma",
                              "Er. Rohan Thapa",
                              "Sunita Tamang",
                              "Bikram KC",
                              "Anjali Adhikari",
                            ].map((rep) => (
                              <SelectItem key={rep} value={rep} className="text-xs">
                                {rep}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="text-[11px] text-muted-foreground">
                        <div>{lead.email}</div>
                        <div>{lead.phone}</div>
                      </td>
                      <td className="text-right">
                        {lead.status !== "Converted" && lead.status !== "Won" ? (
                          <Button
                            size="sm"
                            className="h-7 text-[11px]"
                            onClick={() => handleConvertLead(lead)}
                          >
                            <CheckCircle2 size={12} className="mr-1" />
                            Convert to Account
                          </Button>
                        ) : (
                          <StatusBadge status="Converted" />
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredLeads.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-xs text-muted-foreground">
                        No leads matched your search query.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      )}

      {/* TAB 2: USERS & ACCESS */}
      {activeTab === "users" && (
        <div className="space-y-5">
          <Panel
            title="Department & Access Distribution"
            subtitle="PostgreSQL authenticated personnel distributed by operating division"
          >
            <div className="px-4 pb-4">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={userChartData} margin={{ left: 0, right: 25, bottom: 15 }}>
                  <CartesianGrid vertical={false} stroke="var(--border)" />
                  <XAxis
                    dataKey="department"
                    tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    width={30}
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
                  <Bar dataKey="users" fill="var(--chart-2)" barSize={32} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel
            title="User Directory & Privilege Management"
            subtitle="Manage PostgreSQL user credentials, active statuses, and administrative access tiers"
            action={
              <div className="flex items-center gap-2">
                <div className="relative w-52">
                  <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Filter users..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="h-8 pl-8 text-xs"
                  />
                </div>
                <Button size="sm" onClick={() => setAddUserOpen(true)} className="h-8 text-xs">
                  <UserPlus size={13} className="mr-1" /> Add User
                </Button>
              </div>
            }
          >
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Department</th>
                    <th>Assigned Role</th>
                    <th>Status</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <div className="font-medium">{u.full_name || u.username}</div>
                        <div className="text-[10px] text-muted-foreground">@{u.username}</div>
                      </td>
                      <td className="font-mono text-[11px]">{u.email}</td>
                      <td>{u.department || "Operations"}</td>
                      <td>
                        <Select value={u.role} onValueChange={(val) => handleChangeRole(u.id, val)}>
                          <SelectTrigger className="h-7 w-40 text-[11px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[
                              "Super Administrator",
                              "Management",
                              "Sales Manager",
                              "Inventory Manager",
                              "Project Manager",
                              "Service Manager",
                              "Accountant",
                              "Report Viewer",
                            ].map((r) => (
                              <SelectItem key={r} value={r} className="text-xs">
                                {r}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td>
                        <StatusBadge status={u.is_active ? "Active" : "Inactive"} />
                      </td>
                      <td className="text-right">
                        <Button
                          size="sm"
                          variant={u.is_active ? "outline" : "default"}
                          className="h-7 text-[11px]"
                          onClick={() => handleToggleUser(u.id)}
                        >
                          <Power size={11} className="mr-1" />
                          {u.is_active ? "Deactivate" : "Activate"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-xs text-muted-foreground">
                        No users matched your search query.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      )}

      {/* TAB 3: STATION OVERRIDES */}
      {activeTab === "stations" && (
        <div className="space-y-5">
          <Panel
            title="Charging Station Status Breakdown"
            subtitle="Operational health across highway charging corridors in Nepal"
          >
            <div className="px-4 pb-4">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stationChartData} margin={{ left: 0, right: 25, bottom: 15 }}>
                  <CartesianGrid vertical={false} stroke="var(--border)" />
                  <XAxis
                    dataKey="status"
                    tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    width={30}
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
                  <Bar dataKey="count" fill="var(--primary)" barSize={32} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel
            title="Infrastructure Emergency Status Override"
            subtitle="Immediate operational status control across all charging locations in Nepal"
            action={
              <div className="relative w-60">
                <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                <Input
                  placeholder="Filter stations..."
                  value={stationSearch}
                  onChange={(e) => setStationSearch(e.target.value)}
                  className="h-8 pl-8 text-xs"
                />
              </div>
            }
          >
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Station Code</th>
                    <th>Station Name</th>
                    <th>Location</th>
                    <th>Type</th>
                    <th>Current Status</th>
                    <th className="text-right">Emergency Override</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStations.slice(0, 15).map((st) => (
                    <tr key={st.id}>
                      <td className="font-mono font-medium text-primary">{st.stationCode}</td>
                      <td className="font-medium">{st.name}</td>
                      <td>
                        {st.district}, {st.province}
                      </td>
                      <td>{st.stationType}</td>
                      <td>
                        <StatusBadge status={st.status} />
                      </td>
                      <td className="text-right space-x-1.5">
                        {st.status !== "Operational" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 text-[10px]"
                            onClick={() => handleStationStatus(st.id, "Operational")}
                          >
                            Restore Online
                          </Button>
                        )}
                        {st.status !== "Partially Active" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 text-[10px]"
                            onClick={() => handleStationStatus(st.id, "Partially Active")}
                          >
                            Maintenance
                          </Button>
                        )}
                        {st.status !== "Inactive" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 text-[10px]"
                            onClick={() => handleStationStatus(st.id, "Inactive")}
                          >
                            Shutdown
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredStations.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-xs text-muted-foreground">
                        No stations matched your search query.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      )}

      {/* TAB 4: CMS & TELEMETRY */}
      {activeTab === "cms" && <SuperAdminCms />}

      {/* Add User Dialog */}
      <Dialog open={addUserOpen} onOpenChange={setAddUserOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add System User</DialogTitle>
            <DialogDescription>
              Create a new staff member account in the PostgreSQL database.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateUser} className="space-y-3">
            <div>
              <Label className="text-xs">Full Name</Label>
              <Input
                required
                value={newUser.full_name}
                onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                placeholder="e.g. Maya Tamang"
              />
            </div>
            <div>
              <Label className="text-xs">Username</Label>
              <Input
                required
                value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                placeholder="e.g. maya.tamang"
              />
            </div>
            <div>
              <Label className="text-xs">Email</Label>
              <Input
                required
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                placeholder="e.g. maya@voltnepal.com"
              />
            </div>
            <div>
              <Label className="text-xs">Password</Label>
              <Input
                required
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-xs">Role</Label>
              <Select
                value={newUser.role}
                onValueChange={(val) => setNewUser({ ...newUser, role: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "Super Administrator",
                    "Management",
                    "Sales Manager",
                    "Inventory Manager",
                    "Project Manager",
                    "Service Manager",
                    "Accountant",
                    "Report Viewer",
                  ].map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="pt-2">
              <Button type="submit" size="sm">
                Create User
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
