import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  useNavigate,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AppShell } from "@/components/layout/app-shell";
import { Toaster } from "@/components/ui/sonner";
import { useAuth } from "@/stores/auth";
import { BrandLogo } from "@/components/shared/brand-logo";
import logoUrl from "@/assets/logo.png";
import { isEmbeddedSpa, stripErpBase } from "@/lib/erp-base";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-16 text-center">
      <div className="mx-auto flex max-w-md flex-col items-center">
        <BrandLogo size="lg" className="mb-6" />
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
          Error 404
        </span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Page Not Found
        </h1>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          The requested resource, record, or URL could not be located on Volt OS. It may have been
          relocated, archived, or you may not have sufficient access permissions.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Return to Dashboard
          </Link>
          <Link
            to="/network/locations"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Station Network
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-16 text-center">
      <div className="mx-auto flex max-w-md flex-col items-center">
        <BrandLogo size="lg" className="mb-6" />
        <span className="rounded-full bg-destructive/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-destructive">
          System Notice 500
        </span>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Application Error Encountered
        </h1>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          Volt OS encountered an unexpected application exception while rendering this view. Your
          session and operational records remain secure.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Reload View
          </button>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    // Replace these placeholders with the app's name and description when first building the app.
    // Each content route, / included, must still set its own head(). Never add og:image or
    // twitter:image here: every page without its own would inherit the root's preview image.
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Volt OS | EV Charging Equipment Importers & Infrastructure ERP" },
      {
        name: "description",
        content:
          "Volt OS enterprise ERP for importing, supplying, and commissioning AC & DC EV chargers, charging cables, wall boxes, and station hardware across Nepal.",
      },
      { name: "author", content: "Volt OS" },
      {
        property: "og:title",
        content: "Volt OS | EV Charging Equipment Importers & Infrastructure ERP",
      },
      {
        property: "og:description",
        content:
          "Nepal's leading EV charging equipment importer ERP: product catalog, OEM suppliers, Birgunj customs clearance, dealer orders, and installation support.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico", sizes: "any" },
      { rel: "icon", type: "image/png", href: logoUrl },
      { rel: "apple-touch-icon", href: logoUrl },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,600&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  if (isEmbeddedSpa) {
    return <>{children}</>;
  }
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const { isAuthenticated, initialize } = useAuth();
  const routerState = useRouterState({
    select: (s) => ({
      pathname: s.location.pathname,
      search: s.location.search as Record<string, unknown>,
    }),
  });
  const path = stripErpBase(routerState.pathname);
  const rawRedirect = routerState.search["redirect"];
  const redirectParam = typeof rawRedirect === "string" ? rawRedirect : undefined;
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
    void initialize();
  }, [initialize]);

  useEffect(() => {
    const purgeLovable = () => {
      const nodes = document.querySelectorAll(
        "#lovable-badge, .lovable-badge, a[href*='lovable.dev'], [id*='lovable'], [class*='lovable-badge'], #lovable-root",
      );
      nodes.forEach((n) => n.remove());
    };
    purgeLovable();
    const interval = setInterval(purgeLovable, 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!isAuthenticated && path !== "/login") {
      if (isEmbeddedSpa) {
        const currentFull = window.location.pathname + window.location.search;
        const target =
          currentFull && currentFull !== "/erp" && currentFull !== "/erp/"
            ? `/auth/login?redirect=${encodeURIComponent(currentFull)}`
            : "/auth/login";
        window.location.replace(target);
        return;
      }
      void navigate({
        to: "/login",
        ...(path !== "/" ? { search: { redirect: path } } : {}),
      });
    } else if (isAuthenticated && path === "/login") {
      const dest =
        redirectParam && redirectParam.startsWith("/") && redirectParam !== "/login"
          ? redirectParam
          : "/";
      void navigate({ to: dest as never });
    }
  }, [isAuthenticated, path, redirectParam, navigate, ready]);

  // Standalone route without ERP sidebar (login page only)
  if (path === "/login") {
    return (
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen bg-background">
          <Outlet />
        </div>
        <Toaster />
      </QueryClientProvider>
    );
  }

  // When unauthenticated on client and not on login: show redirecting state and NEVER expose content
  if (ready && !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="size-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm font-semibold text-foreground">Sign In Required</p>
          <p className="text-xs text-muted-foreground">Redirecting to login…</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <AppShell>
        <Outlet />
      </AppShell>
      <Toaster />
    </QueryClientProvider>
  );
}
