"use client";

import React, { useState } from "react";
import { CheckCircle2, Send } from "lucide-react";
import { useToast } from "@/components/ui/toast";

export interface ContactChargerOption {
  id: string;
  slug?: string;
  name: string;
}

export function ContactForm({
  chargers,
  defaultChargerId = "",
}: {
  chargers: ContactChargerOption[];
  defaultChargerId?: string;
}) {
  const { notify } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [chargerId, setChargerId] = useState(defaultChargerId);
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // Honeypot field
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedCode, setSubmittedCode] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const selected = chargers.find((c) => c.id === chargerId || c.slug === chargerId);

    try {
      const res = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          message,
          chargerId: selected?.id || chargerId || null,
          chargerSlug: selected?.slug || null,
          website,
        }),
      });
      const data = (await res.json()) as {
        message?: string;
        code?: string;
        error?: string;
      };
      if (!res.ok) {
        setError(data.error || "Please check the form fields.");
        notify(data.error || "Submission failed.", "error");
        return;
      }

      setSubmitted(true);
      setSubmittedCode(data.code || null);
      notify(data.message || "Enquiry submitted!");
      setName("");
      setEmail("");
      setPhone("");
      setMessage("");
    } catch {
      setError("Network error while sending enquiry.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="rounded-2xl border border-line bg-card p-8 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
        <h3 className="mt-3 text-lg font-semibold text-ink">Enquiry Received</h3>
        {submittedCode && (
          <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-accent">
            Reference: {submittedCode}
          </p>
        )}
        <p className="mt-1 text-sm text-muted">
          Thank you for reaching out. Our engineering and import team will contact you shortly.
        </p>
        <button
          type="button"
          onClick={() => {
            setSubmitted(false);
            setSubmittedCode(null);
          }}
          className="mt-5 rounded-lg border border-line px-4 py-2 text-xs font-medium text-ink hover:bg-surface"
        >
          Send another enquiry
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-line bg-card p-6 sm:p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted">Full Name *</label>
          <input
            required
            minLength={2}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your full name"
            className="w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted">Phone Number *</label>
          <input
            required
            minLength={7}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+977-98XXXXXXXX"
            className="w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted">Email Address *</label>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            className="w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted">
            Charger of Interest (Optional)
          </label>
          <select
            value={chargerId}
            onChange={(e) => setChargerId(e.target.value)}
            className="w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm text-ink"
          >
            <option value="">General Consultation</option>
            {chargers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Honeypot anti-spam trap */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="website-field">Website</label>
        <input
          id="website-field"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted">
          Project Details / Message *
        </label>
        <textarea
          required
          minLength={10}
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell us your installation location, available power phase, and estimated quantity..."
          className="w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      {error && <p className="text-xs font-medium text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="btn-accent inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition disabled:opacity-50"
      >
        <Send className="h-4 w-4" />
        {submitting ? "Sending..." : "Submit Enquiry"}
      </button>
    </form>
  );
}
