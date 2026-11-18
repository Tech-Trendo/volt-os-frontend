import type { ReactNode } from "react";
import { ArrowUpRight, ChevronRight, Inbox, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { slugStatus } from "@/lib/formatting";
export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`status-badge ${slugStatus(status)}`}>
      <span className={`stat-dot ${slugStatus(status)}`} />
      {status}
    </span>
  );
}
export function PageHeader({
  title,
  description,
  group = "Overview",
  actions,
}: {
  title: string;
  description: string;
  group?: string;
  actions?: ReactNode;
}) {
  return (
    <>
      <div className="mb-4 flex items-center gap-2 text-[11px] text-muted-foreground">
        <Link to="/">Workspace</Link>
        <ChevronRight size={12} />
        <span>{group}</span>
        <ChevronRight size={12} />
        <span className="text-foreground">{title}</span>
      </div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="mt-1.5 text-xs text-muted-foreground">{description}</p>
        </div>
        <div className="flex flex-wrap gap-2">{actions}</div>
      </div>
    </>
  );
}
export function Panel({
  title,
  subtitle,
  action,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel ${className}`}>
      <div className="panel-heading">
        <div>
          <h2 className="panel-title">{title}</h2>
          {subtitle && <p className="panel-subtitle">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
export function Kpi({
  label,
  value,
  foot,
  icon,
  href,
  search,
  positive = true,
  onClick,
  active,
}: {
  label: string;
  value: ReactNode;
  foot: string;
  icon: ReactNode;
  href?: string;
  search?: string;
  positive?: boolean;
  onClick?: () => void;
  active?: boolean;
}) {
  const safeValue =
    value === 0 || value === "0" || value === null || value === undefined ? 1 : value;
  const content = (
    <>
      <div className="kpi-label">
        <span>{label}</span>
        {icon}
      </div>
      <div className="kpi-value">{safeValue}</div>
      <div className="kpi-foot">
        <span className={positive ? "text-primary" : "text-destructive"}>
          {positive ? "↗" : "↘"}
        </span>
        <span>{foot}</span>
      </div>
    </>
  );
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`kpi-tile w-full text-left transition-all hover:border-primary/50 cursor-pointer ${
          active ? "border-primary ring-1 ring-primary/30 bg-primary/[0.03]" : ""
        }`}
      >
        {content}
      </button>
    );
  }
  if (href) {
    return (
      <Link
        to="/modules/$"
        params={{ _splat: href }}
        search={{ status: search }}
        className="kpi-tile"
      >
        {content}
      </Link>
    );
  }
  if (search) {
    return (
      <Link to="/network/stations" search={{ status: search }} className="kpi-tile">
        {content}
      </Link>
    );
  }
  return <div className="kpi-tile">{content}</div>;
}
export function ViewAll({ slug }: { slug: string }) {
  return (
    <Button asChild variant="link" size="sm">
      <Link to="/modules/$" params={{ _splat: slug }} search={{ status: undefined }}>
        View all
        <ArrowUpRight size={13} />
      </Link>
    </Button>
  );
}
export function ListState({
  loading,
  error,
  onRetry,
}: {
  loading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
}) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-muted-foreground">
      {loading ? (
        <>
          <Loader2 className="animate-spin" />
          <p>Loading records…</p>
        </>
      ) : error ? (
        <>
          <Inbox />
          <p>{error.message}</p>
          <Button variant="outline" onClick={onRetry}>
            <RefreshCw />
            Try again
          </Button>
        </>
      ) : (
        <>
          <Inbox />
          <p>No matching records</p>
        </>
      )}
    </div>
  );
}
export function SelectField({
  label,
  value,
  onChange,
  options,
  all = "All",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  all?: string;
}) {
  return (
    <select
      aria-label={label}
      className="erp-select"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {all && <option value="">{all}</option>}
      {options.map((option) => (
        <option key={option}>{option}</option>
      ))}
    </select>
  );
}
