import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  ChartNoAxesCombined,
  ChevronDown,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Contact,
  FolderKanban,
  HelpCircle,
  LayoutDashboard,
  MapPin,
  Menu,
  Package,
  Search,
  Settings,
  Ship,
  Users,
  Wallet,
  Wrench,
  Zap,
  LogOut,
  Check,
  CheckCheck,
  ShieldCheck,
  Loader2,
  Inbox,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { moduleGroups, allModules } from "@/mock/reference";
import { useUi } from "@/stores/ui";
import { useAuth } from "@/stores/auth";
import { getPublicStorefrontUrl, isEmbeddedSpa, stripErpBase } from "@/lib/erp-base";
import { canView } from "@/lib/permissions";
import { toast } from "sonner";
import { BrandLogo } from "@/components/shared/brand-logo";
import { siteSettingsQuery } from "@/queries/content";
import { listRecords } from "@/services/records";
const icons = {
  LayoutDashboard,
  Users,
  MapPin,
  Package,
  Ship,
  FolderKanban,
  Wrench,
  Contact,
  Wallet,
  ChartNoAxesCombined,
  Settings,
};
export function AppShell({ children }: { children: ReactNode }) {
  const { collapsed, mobileOpen, language, role, toggleSidebar, setMobileOpen, setLanguage } =
    useUi();
  const { user, logout } = useAuth();
  const isSuperAdmin = user?.role === "Super Administrator" || user?.is_superuser;
  const userInitials = user?.full_name
    ? user.full_name
        .split(" ")
        .filter(Boolean)
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : user?.username?.slice(0, 2).toUpperCase() || "VN";
  const rawPath = useRouterState({ select: (s) => s.location.pathname });
  const path = stripErpBase(rawPath);
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState<string[]>(["network"]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const [help, setHelp] = useState(false);

  // Dynamic Site Settings and Notifications from backend API
  const { data: siteSettings } = useQuery(siteSettingsQuery);
  const { data: notificationsData, isLoading: notificationsLoading } = useQuery({
    queryKey: ["overview-notifications"],
    queryFn: () => listRecords("overview/notifications", { pageSize: 5 }),
    staleTime: 30000,
  });
  const notifications = notificationsData?.items ?? [];

  // Track read notification IDs in state with localStorage persistence
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem("voltos_read_notifications");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const markNotificationAsRead = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setReadNotificationIds((prev) => {
      if (prev.includes(id)) return prev;
      const updated = [...prev, id];
      try {
        localStorage.setItem("voltos_read_notifications", JSON.stringify(updated));
      } catch (error) {
        void error;
      }
      return updated;
    });
  };

  const markAllAsRead = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const allIds = notifications.map((n) => n.id);
    setReadNotificationIds((prev) => {
      const updated = Array.from(new Set([...prev, ...allIds]));
      try {
        localStorage.setItem("voltos_read_notifications", JSON.stringify(updated));
      } catch (error) {
        void error;
      }
      return updated;
    });
    toast.success("All notifications marked as read.");
  };

  const unreadCount = notifications.filter(
    (n) => !readNotificationIds.includes(n.id) && n.status !== "Read",
  ).length;
  useEffect(() => {
    let g = false;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "Escape") setMobileOpen(false);
      if (e.key === "/") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "g") {
        g = true;
        setTimeout(() => {
          g = false;
        }, 1000);
      } else if (e.key === "d" && g) {
        void navigate({ to: "/" });
        g = false;
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [navigate, setMobileOpen]);
  useEffect(() => {
    setMobileOpen(false);
    const domain = path.startsWith("/network") ? "network" : path.split("/")[2];
    if (domain) setExpanded((s) => (s.includes(domain) ? s : [...s, domain]));
  }, [path, setMobileOpen]);
  return (
    <div className="erp-shell">
      {mobileOpen && <div className="mobile-sidebar-scrim" onClick={() => setMobileOpen(false)} />}
      <aside
        className={`erp-sidebar ${collapsed ? "collapsed" : ""} ${mobileOpen ? "expanded" : ""}`}
        aria-label="Main navigation"
      >
        <Link to="/" className="flex h-20 shrink-0 items-center gap-2.5 border-b px-4">
          <BrandLogo size="md" showText={!collapsed} subtext="EV Infrastructure ERP" />
        </Link>
        <div className="flex-1 overflow-y-auto pb-4">
          <div className="nav-group-label sidebar-label">WORKSPACE</div>
          <Link
            to="/"
            className={`nav-link ${path === "/" ? "active" : ""}`}
            title="Business Dashboard"
          >
            <LayoutDashboard size={16} />
            {!collapsed && (
              <span className="sidebar-label">
                {language === "ne" ? "व्यापार ड्यासबोर्ड" : "Business Dashboard"}
              </span>
            )}
          </Link>
          {isSuperAdmin && (
            <Link
              to="/super-admin"
              className={`nav-link text-primary hover:text-primary ${path === "/super-admin" ? "active" : ""}`}
              title="Super Admin Portal"
            >
              <ShieldCheck size={16} />
              {!collapsed && (
                <span className="sidebar-label font-medium">
                  {language === "ne" ? "सुपर एडमिन" : "Super Admin"}
                </span>
              )}
            </Link>
          )}
          {moduleGroups.map((group) => {
            if (!canView(role, group.domain)) return null;
            const Icon = icons[group.icon as keyof typeof icons];
            const open = expanded.includes(group.domain);
            const active =
              path.includes(`/${group.domain}/`) ||
              (group.domain === "network" && path.startsWith("/network"));
            return (
              <div key={group.domain}>
                {group.domain === "sales" && (
                  <div className="nav-group-label sidebar-label">BUSINESS OPERATIONS</div>
                )}
                {group.domain === "reports" && (
                  <div className="nav-group-label sidebar-label">MANAGEMENT</div>
                )}
                <Button
                  variant="ghost"
                  className={`nav-link !justify-start !w-[calc(100%-20px)] !h-auto ${active ? "active" : ""}`}
                  title={group.title}
                  onClick={() => {
                    if (collapsed) toggleSidebar();
                    setExpanded((s) =>
                      open ? s.filter((d) => d !== group.domain) : [...s, group.domain],
                    );
                  }}
                >
                  <Icon size={16} />
                  {!collapsed && (
                    <>
                      <span className="sidebar-label flex-1 text-left">
                        {language === "ne" ? group.ne : group.title}
                      </span>
                      <ChevronDown size={12} className={open ? "rotate-180" : ""} />
                    </>
                  )}
                </Button>
                {open && !collapsed && (
                  <div className="nav-sub">
                    {group.domain === "network" && (
                      <>
                        <Link
                          to="/network/overview"
                          className={`nav-link ${path === "/network/overview" ? "active" : ""}`}
                        >
                          Network Overview
                        </Link>
                        <Link
                          to="/network/stations"
                          search={{ status: undefined }}
                          className={`nav-link ${path.startsWith("/network/stations") ? "active" : ""}`}
                        >
                          Charging Stations
                        </Link>
                        <Link
                          to="/network/locations"
                          className={`nav-link ${path === "/network/locations" ? "active" : ""}`}
                        >
                          Station Locations
                          <span className="ml-auto rounded bg-primary/10 px-1 text-[8px] text-primary">
                            MAP
                          </span>
                        </Link>
                      </>
                    )}
                    {group.modules.map((m) => (
                      <Link
                        key={m.slug}
                        to="/modules/$"
                        params={{ _splat: m.slug }}
                        search={{ status: undefined }}
                        className={`nav-link ${path.endsWith(m.slug) ? "active" : ""}`}
                      >
                        {m.title}
                        {m.slug === "inventory/stock-overview" && (
                          <span className="ml-auto rounded bg-primary/10 px-1 text-[8px] text-primary">
                            OVERVIEW
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          {isSuperAdmin && (
            <div>
              <div className="nav-group-label sidebar-label">PUBLIC STOREFRONT</div>
              <Button
                variant="ghost"
                className={`nav-link !justify-start !w-[calc(100%-20px)] !h-auto ${path.startsWith("/cms") ? "active" : ""}`}
                title="CMS"
                onClick={() => {
                  if (collapsed) toggleSidebar();
                  setExpanded((s) =>
                    s.includes("cms") ? s.filter((d) => d !== "cms") : [...s, "cms"],
                  );
                }}
              >
                <Globe size={16} />
                {!collapsed && (
                  <>
                    <span className="sidebar-label flex-1 text-left">
                      {language === "ne" ? "सीएमएस (CMS)" : "CMS"}
                    </span>
                    <span className="mr-1 rounded bg-primary/10 px-1 text-[8px] font-semibold text-primary">
                      ADMIN
                    </span>
                    <ChevronDown
                      size={12}
                      className={expanded.includes("cms") ? "rotate-180" : ""}
                    />
                  </>
                )}
              </Button>
              {expanded.includes("cms") && !collapsed && (
                <div className="nav-sub">
                  <Link
                    to="/cms"
                    className={`nav-link ${path === "/cms" || path === "/cms/" ? "active" : ""}`}
                  >
                    Dashboard
                  </Link>
                  {(
                    [
                      ["pages", "Pages & Content"],
                      ["chargers", "Chargers"],
                      ["brands", "Brands"],
                      ["categories", "Categories"],
                      ["testimonials", "Testimonials"],
                      ["faqs", "FAQs"],
                      ["navigation", "Navigation"],
                      ["settings", "Site Settings"],
                      ["media", "Media Library"],
                      ["versions", "Preview & Publish"],
                    ] as const
                  ).map(([slugKey, label]) => (
                    <Link
                      key={slugKey}
                      to="/cms/$section"
                      params={{ section: slugKey }}
                      className={`nav-link ${path === `/cms/${slugKey}` ? "active" : ""}`}
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="border-t p-3">
          <Button
            variant="ghost"
            size={collapsed ? "icon" : "sm"}
            className="w-full justify-start text-muted-foreground"
            onClick={toggleSidebar}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronsRight /> : <ChevronsLeft />}
            {!collapsed && <span className="sidebar-label">Collapse sidebar</span>}
          </Button>
        </div>
      </aside>
      <div className={`erp-main ${collapsed ? "collapsed" : ""}`}>
        <header className="erp-topbar">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="lg:hidden"
            aria-label="Toggle navigation"
          >
            <Menu />
          </Button>
          <div className="hidden items-center gap-2 text-xs text-muted-foreground lg:flex">
            {siteSettings?.site_title || "Volt OS"} <ChevronRight size={13} />
            <span className="text-foreground">
              {siteSettings?.tagline || "EV Charging Equipment Importer ERP"}
            </span>
          </div>
          <Button
            variant="ghost"
            className="ml-auto hidden w-64 justify-start border border-border bg-background text-xs text-muted-foreground md:flex"
            onClick={() => setSearchOpen(true)}
          >
            <Search size={14} />
            Search anything…<kbd className="ml-auto rounded border px-1.5 text-[10px]">/</kbd>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto md:hidden"
            aria-label="Global search"
            onClick={() => setSearchOpen(true)}
          >
            <Search />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-[11px] text-muted-foreground"
            onClick={() => setLanguage(language === "en" ? "ne" : "en")}
          >
            {language === "en" ? "EN" : "ने"}
            <ChevronDown size={11} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setHelp(true)}
            aria-label="Help"
            className="hidden sm:inline-flex"
          >
            <HelpCircle />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
                <Bell />
                {unreadCount > 0 && <span className="notification-counter">{unreadCount}</span>}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="flex items-center justify-between py-2">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-xs">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-medium text-primary">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-1.5 text-[10px] text-primary hover:text-primary hover:bg-primary/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      markAllAsRead(e);
                    }}
                  >
                    <CheckCheck size={12} className="mr-1" />
                    Mark all read
                  </Button>
                )}
              </DropdownMenuLabel>
              {notificationsLoading ? (
                <div className="flex items-center justify-center py-6 text-xs text-muted-foreground">
                  <Loader2 className="mr-2 size-4 animate-spin text-primary" /> Loading
                  notifications…
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground">
                  <Inbox className="mx-auto mb-1 size-5 opacity-40" />
                  No new notifications
                </div>
              ) : (
                notifications.slice(0, 5).map((n) => {
                  const isRead = readNotificationIds.includes(n.id) || n.status === "Read";
                  return (
                    <DropdownMenuItem
                      key={n.id}
                      className={`group relative flex flex-col items-start gap-1 py-2.5 text-xs cursor-pointer ${
                        isRead ? "opacity-60" : "bg-muted/15"
                      }`}
                      onClick={() => {
                        markNotificationAsRead(n.id);
                        toast.info(n.name);
                        void navigate({
                          to: "/modules/$",
                          params: { _splat: "overview/notifications" },
                          search: { recordId: n.id },
                        });
                      }}
                    >
                      <div className="flex w-full items-start justify-between gap-2">
                        <div className="flex items-start gap-1.5 flex-1">
                          {!isRead && (
                            <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
                          )}
                          <span
                            className={`leading-snug line-clamp-2 ${
                              isRead ? "font-normal" : "font-semibold text-foreground"
                            }`}
                          >
                            {n.name}
                          </span>
                        </div>
                        {!isRead && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-5 shrink-0 opacity-0 group-hover:opacity-100 hover:bg-primary/10 text-muted-foreground hover:text-primary"
                            title="Mark as read"
                            onClick={(e) => {
                              e.stopPropagation();
                              markNotificationAsRead(n.id, e);
                            }}
                          >
                            <Check size={11} />
                          </Button>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground pl-3">
                        <span>{n.category || "System"}</span>
                        {n.date && <span>· {n.date}</span>}
                      </div>
                    </DropdownMenuItem>
                  );
                })
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link
                  to="/modules/$"
                  params={{ _splat: "overview/notifications" }}
                  search={{ status: undefined }}
                >
                  View all notifications
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <span className="mx-1 h-7 border-l" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-10 px-2 gap-2">
                <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {userInitials}
                </span>
                <span className="hidden text-left sm:block">
                  <span className="block text-[11px] font-medium leading-none">
                    {user?.full_name || user?.username || "Volt User"}
                  </span>
                  <span className="block text-[9px] text-muted-foreground mt-0.5">
                    {user?.role || role}
                  </span>
                </span>
                <ChevronDown size={12} className="text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <div className="px-3 py-2 border-b bg-muted/30">
                <p className="text-xs font-semibold text-foreground">
                  {user?.full_name || user?.username || "Authenticated User"}
                </p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {user?.email || "Connected to backend"}
                </p>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-medium text-primary">
                    {user?.role || role}
                  </span>
                  {user?.is_superuser && (
                    <span className="inline-flex items-center rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-medium text-amber-600 dark:text-amber-400">
                      Superuser
                    </span>
                  )}
                </div>
              </div>

              {isSuperAdmin && (
                <>
                  <DropdownMenuItem asChild className="cursor-pointer text-xs">
                    <Link
                      to="/super-admin"
                      className="flex items-center gap-2 text-primary font-medium py-2"
                    >
                      <ShieldCheck size={14} />
                      Super Admin Portal
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}

              <DropdownMenuItem
                asChild
                className="cursor-pointer text-xs flex items-center gap-2 py-2"
              >
                <a href={getPublicStorefrontUrl()}>
                  <Globe size={14} />
                  View Public Storefront
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />

              <DropdownMenuItem
                className="text-destructive focus:text-destructive cursor-pointer text-xs flex items-center gap-2 py-2"
                onClick={() => {
                  logout();
                  toast.success("Signed out successfully.");
                  if (isEmbeddedSpa) {
                    window.location.href = "/auth/login";
                  } else {
                    void navigate({ to: "/login" });
                  }
                }}
              >
                <LogOut size={14} />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        {children}
        <footer className="mx-7 flex flex-wrap items-center justify-between gap-3 border-t py-4 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-2">
            <BrandLogo size="xs" />
            <span>
              {siteSettings?.footer_text ||
                `© ${new Date().getFullYear()} ${siteSettings?.company_name || "Volt OS"}. All rights reserved. EV Charging Equipment Importers & Hardware Supply ERP.`}
            </span>
          </div>
          <span className="flex items-center gap-1.5">
            <span className="stat-dot operational" />
            Network Systems Active<span className="mx-2">·</span>Nepal Standard Time (NPT)
          </span>
        </footer>
      </div>
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Workspace search</DialogTitle>
            <DialogDescription>
              {siteSettings?.site_title || "Volt OS"} ·{" "}
              {siteSettings?.tagline || "EV Charging Importers ERP"}
            </DialogDescription>
          </DialogHeader>
          <Input
            ref={searchRef}
            autoFocus
            aria-label="Search workspace"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search pages, stations, records…"
          />
          <div className="max-h-80 overflow-y-auto">
            {search.toLowerCase().includes("station") && (
              <Button variant="ghost" asChild className="w-full justify-start">
                <Link to="/network/locations" onClick={() => setSearchOpen(false)}>
                  Station Locations
                </Link>
              </Button>
            )}
            {allModules
              .filter(
                (m) =>
                  canView(role, m.domain) && m.title.toLowerCase().includes(search.toLowerCase()),
              )
              .slice(0, 12)
              .map((m) => (
                <Button key={m.slug} variant="ghost" asChild className="w-full justify-start">
                  <Link
                    to="/modules/$"
                    params={{ _splat: m.slug }}
                    search={{ status: undefined }}
                    onClick={() => setSearchOpen(false)}
                  >
                    {m.title}
                    <span className="ml-auto text-xs text-muted-foreground">{m.domain}</span>
                  </Link>
                </Button>
              ))}
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={help} onOpenChange={setHelp}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{siteSettings?.company_name || "Volt OS"} Enterprise Support</DialogTitle>
            <DialogDescription>Operations & Technical Helpdesk</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs text-muted-foreground">
            <p>
              Dedicated support line for EV equipment importers, bonded warehouse managers, and
              network operations center (NOC).
            </p>
            <div className="rounded-lg border bg-muted/20 p-3 space-y-1.5 text-foreground">
              <div className="font-semibold text-primary">
                {siteSettings?.company_name || "Volt OS"} Operations Desk
              </div>
              <div>Telephone: {siteSettings?.phone || "+977-1-4589201"}</div>
              {siteSettings?.alt_phone && <div>Emergency Hotline: {siteSettings.alt_phone}</div>}
              <div>Support Email: {siteSettings?.email || "imports@voltos.internal"}</div>
              <div>Logistics Hub: {siteSettings?.address || "Tripureshwor, Kathmandu, Nepal"}</div>
              <div>Service Window: {siteSettings?.support_hours || "24/7 Field Dispatch"}</div>
            </div>
          </div>
          <Button
            onClick={() => {
              setHelp(false);
              void navigate({
                to: "/modules/$",
                params: { _splat: "overview/my-tasks" },
                search: { status: undefined },
              });
            }}
          >
            Open my tasks
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
