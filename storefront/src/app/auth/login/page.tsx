"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Lock, Mail, ShieldCheck, Zap } from "lucide-react";

interface ErpAuthUser {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: string;
  is_superuser: boolean;
  is_staff: boolean;
}

function ErpAuthLoginForm() {
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const resolveDestination = (role?: string) => {
    if (redirectParam && redirectParam.startsWith("/erp")) {
      return redirectParam;
    }
    if (role === "Super Administrator") {
      return "/erp/super-admin";
    }
    return "/erp";
  };

  useEffect(() => {
    try {
      const existingToken = localStorage.getItem("voltos_access_token");
      const rawUser = localStorage.getItem("voltos_user");
      if (existingToken && rawUser) {
        const parsed = JSON.parse(rawUser) as Partial<ErpAuthUser>;
        window.location.replace(resolveDestination(parsed.role));
      }
    } catch {
      // Ignore malformed localStorage
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!identifier.trim() || !password) {
      setError("Please enter your email/username and password.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/erp-auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username_or_email: identifier.trim(),
          password,
        }),
      });
      const data = (await res.json()) as {
        access?: string;
        refresh?: string;
        user?: ErpAuthUser;
        error?: string;
      };

      if (!res.ok || !data.access || !data.user) {
        setError(data.error || "Invalid ERP credentials.");
        setLoading(false);
        return;
      }

      const serializedUser = JSON.stringify(data.user);
      localStorage.setItem("voltos_access_token", data.access);
      localStorage.setItem("voltos_refresh_token", data.refresh || "");
      localStorage.setItem("voltos_user", serializedUser);
      localStorage.setItem("techtrendo_access_token", data.access);
      localStorage.setItem("techtrendo_refresh_token", data.refresh || "");
      localStorage.setItem("techtrendo_user", serializedUser);
      localStorage.setItem("voltnepal_access_token", data.access);
      localStorage.setItem("voltnepal_refresh_token", data.refresh || "");
      localStorage.setItem("voltnepal_user", serializedUser);

      window.location.href = resolveDestination(data.user.role);
    } catch {
      setError("Network error while connecting to Volt OS ERP backend.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-4 py-12 text-ink">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl btn-accent shadow-md">
            <Zap className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Volt OS ERP</h1>
          <p className="text-xs font-medium uppercase tracking-widest text-muted">
            Enterprise EV Infrastructure & Importer Workspace
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-line bg-card p-6 shadow-sm sm:p-8"
        >
          <div>
            <h2 className="text-lg font-semibold text-ink">ERP Staff & Admin Sign In</h2>
            <p className="mt-1 text-xs text-muted">
              Sign in with your Volt OS staff or Super Administrator credentials to access the ERP.
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-600 dark:text-red-400">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label htmlFor="erp-identifier" className="mb-1.5 block text-xs font-medium text-muted">
              Email or Username
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted" />
              <input
                id="erp-identifier"
                type="text"
                required
                autoComplete="username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="admin@voltos.techtrendo.com or username"
                className="w-full rounded-lg border border-line bg-surface py-2.5 pl-9 pr-3.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          <div>
            <label htmlFor="erp-password" className="mb-1.5 block text-xs font-medium text-muted">
              Password
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted" />
              <input
                id="erp-password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-line bg-surface py-2.5 pl-9 pr-3.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-accent inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition disabled:opacity-50"
          >
            <span>{loading ? "Signing in to ERP..." : "Sign In to Volt OS ERP"}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted transition hover:text-ink"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Return to Public Website
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ErpAuthLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-surface text-xs text-muted">
          Loading Volt OS ERP sign-in…
        </div>
      }
    >
      <ErpAuthLoginForm />
    </Suspense>
  );
}
