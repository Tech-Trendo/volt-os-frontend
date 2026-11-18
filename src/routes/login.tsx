import { useState, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Zap, Lock, Mail, ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/stores/auth";
import { toast } from "sonner";
import { pageHead } from "@/lib/metadata";
import { BrandLogo } from "@/components/shared/brand-logo";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => {
    const r = search["redirect"];
    if (typeof r === "string" && r.length > 0) {
      return { redirect: r };
    }
    return {};
  },
  head: () => pageHead("Login", "Sign in to Volt OS Enterprise ERP workspace."),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const redirect = search.redirect;
  const { login, isAuthenticated, isLoading } = useAuth();

  const [emailOrUser, setEmailOrUser] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      if (redirect && redirect.startsWith("/") && redirect !== "/login") {
        void navigate({ to: redirect as never });
      } else {
        void navigate({ to: "/" });
      }
    }
  }, [isAuthenticated, redirect, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!emailOrUser.trim()) {
      setError("Please enter your email or username.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    try {
      const user = await login(emailOrUser.trim(), password);
      toast.success(`Welcome back, ${user.full_name || user.username}!`, {
        description: `Signed in as ${user.role}`,
      });
      if (redirect && redirect.startsWith("/") && redirect !== "/login") {
        void navigate({ to: redirect as never });
      } else if (user.role === "Super Administrator") {
        void navigate({ to: "/super-admin" });
      } else {
        void navigate({ to: "/" });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Invalid login credentials.";
      setError(msg);
      toast.error("Authentication failed", { description: msg });
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-80px)] items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-3">
          <div className="inline-flex size-20 items-center justify-center p-2 rounded-2xl bg-white shadow-md border border-black/10 dark:border-white/20">
            <BrandLogo size="xl" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Volt <span className="text-primary">OS</span>
          </h1>
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">
            EV Charging Equipment Importers & Hardware Supply ERP
          </p>
        </div>

        <Card className="border shadow-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Sign in to your account</CardTitle>
            <CardDescription className="text-xs">
              Sign in to manage imported EV chargers, supply shipments, dealer orders, and station
              hardware.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2">
                  <ShieldCheck className="size-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs">
                  Email or Username
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="text"
                    required
                    autoComplete="username"
                    placeholder="user@voltos.internal or username"
                    className="pl-9"
                    value={emailOrUser}
                    onChange={(e) => setEmailOrUser(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="pl-9"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full mt-2" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
                {!isLoading && <ArrowRight className="ml-1 size-4" />}
              </Button>
            </CardContent>
          </form>
        </Card>

        <div className="text-center text-[11px] text-muted-foreground">
          Volt OS · Secure Enterprise ERP Access
        </div>
      </div>
    </div>
  );
}
