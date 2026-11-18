"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useToast } from "@/components/ui/toast";

export default function ResetPasswordPage() {
  const { notify } = useToast();
  const [step, setStep] = useState<"request" | "confirm">("request");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState("");

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setInfo("");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as {
        message?: string;
        devResetToken?: string;
        error?: string;
      };
      if (!res.ok) {
        notify(data.error || "Could not start reset.", "error");
        return;
      }
      setInfo(data.message || "Reset instructions sent.");
      if (data.devResetToken) {
        setToken(data.devResetToken);
        setStep("confirm");
      }
      notify("Reset request submitted.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = (await res.json()) as { message?: string; error?: string };
      if (!res.ok) {
        notify(data.error || "Reset failed.", "error");
        return;
      }
      notify(data.message || "Password updated!");
      setInfo("Password updated successfully. You may now sign in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="rounded-2xl border border-line bg-card p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-ink">Reset Password</h1>
        <p className="mt-1 text-sm text-muted">
          {step === "request"
            ? "Enter your account email to receive a password reset token."
            : "Enter your reset token and choose a new password."}
        </p>

        {step === "request" ? (
          <form onSubmit={handleRequest} className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">Email</label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm text-ink"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-accent w-full rounded-xl py-2.5 text-sm font-medium disabled:opacity-50"
            >
              {loading ? "Sending..." : "Request Reset Token"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleConfirm} className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">Reset Token</label>
              <input
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 font-mono text-xs text-ink"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">New Password</label>
              <input
                required
                minLength={8}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm text-ink"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-accent w-full rounded-xl py-2.5 text-sm font-medium disabled:opacity-50"
            >
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>
        )}

        {info && <p className="mt-4 text-xs font-medium text-emerald-600">{info}</p>}

        <div className="mt-6 flex items-center justify-between border-t border-line pt-4 text-xs text-muted">
          <button
            type="button"
            onClick={() => setStep(step === "request" ? "confirm" : "request")}
            className="hover:text-ink"
          >
            {step === "request" ? "Have a token?" : "Request new token"}
          </button>
          <Link href="/login" className="hover:text-ink">
            Back to Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
