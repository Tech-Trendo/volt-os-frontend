import logoUrl from "@/assets/logo.png";

interface BrandLogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  showText?: boolean;
  subtext?: string;
}

export function BrandLogo({
  size = "md",
  className = "",
  showText = false,
  subtext = "EV Infrastructure ERP",
}: BrandLogoProps) {
  const sizeClasses = {
    xs: "size-5",
    sm: "size-7",
    md: "size-9",
    lg: "size-12",
    xl: "size-16",
  };

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <div
        className={`${sizeClasses[size]} shrink-0 rounded-full bg-white p-0.5 shadow-xs border border-black/10 dark:border-white/20 flex items-center justify-center overflow-hidden transition-all`}
      >
        <img src={logoUrl} alt="Volt OS" className="size-full object-contain" loading="eager" />
      </div>
      {showText && (
        <div className="leading-tight text-left">
          <div className="text-base font-bold tracking-tight text-foreground">
            Volt <span className="text-primary">OS</span>
          </div>
          {subtext && (
            <div className="mt-0.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
              {subtext}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
