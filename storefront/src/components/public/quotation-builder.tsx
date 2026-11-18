"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, FileText, Plus, Printer, Trash2, Zap } from "lucide-react";
import type { PublicCharger } from "@/lib/cms";
import { useToast } from "@/components/ui/toast";

interface QuoteLine {
  slug: string;
  quantity: number;
}

const SITE_TYPES = [
  "Home / Private Residence",
  "Commercial Plaza / Office",
  "Hotel / Resort Hospitality",
  "EV Fleet / Transport Depot",
  "Highway Fast-Charging Hub",
];

export function QuotationBuilder({
  chargers,
  defaultSlug = "",
}: {
  chargers: PublicCharger[];
  defaultSlug?: string;
}) {
  const { notify } = useToast();
  const initialSlug =
    chargers.find((c) => c.slug === defaultSlug)?.slug || chargers[0]?.slug || "";

  const [lines, setLines] = useState<QuoteLine[]>(
    initialSlug ? [{ slug: initialSlug, quantity: 1 }] : [],
  );
  const [siteType, setSiteType] = useState(SITE_TYPES[1]);
  const [installRequired, setInstallRequired] = useState(true);
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("Kathmandu");
  const [notes, setNotes] = useState("");
  const [website, setWebsite] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [createdQuote, setCreatedQuote] = useState<{
    quotationCode: string;
    enquiryCode: string;
    totalNpr: number;
  } | null>(null);

  const detailedLines = useMemo(() => {
    return lines
      .map((line) => {
        const charger = chargers.find((c) => c.slug === line.slug);
        if (!charger) return null;
        const unitPrice = charger.priceNpr || (charger.type === "AC" ? 185000 : 1850000);
        return {
          ...line,
          charger,
          unitPrice,
          lineTotal: unitPrice * line.quantity,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  }, [lines, chargers]);

  const hardwareSubtotal = detailedLines.reduce((sum, item) => sum + item.lineTotal, 0);
  const installFee = installRequired
    ? hardwareSubtotal < 1000000
      ? 85000
      : 285000
    : 0;
  const subtotal = hardwareSubtotal + installFee;
  const vat = Math.round(subtotal * 0.13);
  const grandTotal = subtotal + vat;

  const addLine = () => {
    const unused = chargers.find((c) => !lines.some((l) => l.slug === c.slug)) || chargers[0];
    if (!unused) return;
    setLines((prev) => [...prev, { slug: unused.slug, quantity: 1 }]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (detailedLines.length === 0) {
      setError("Please select at least one EV charger model.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestType: "quotation",
          name,
          company,
          email,
          phone,
          location,
          siteType,
          installationRequired: installRequired,
          chargerId: detailedLines[0]?.charger.id || null,
          chargerSlug: detailedLines[0]?.charger.slug || null,
          quantity: detailedLines[0]?.quantity || 1,
          items: detailedLines.map((l) => ({
            chargerSlug: l.charger.slug,
            name: l.charger.name,
            quantity: l.quantity,
          })),
          message:
            notes.trim() ||
            `Official quotation request for ${detailedLines.map((l) => `${l.quantity}x ${l.charger.name}`).join(", ")} at ${location} (${siteType}).`,
          website,
        }),
      });
      const data = (await res.json()) as {
        code?: string;
        quotationCode?: string;
        estimatedTotalNpr?: number;
        message?: string;
        error?: string;
      };
      if (!res.ok) {
        setError(data.error || "Unable to generate quotation.");
        notify(data.error || "Submission failed.", "error");
        return;
      }
      setCreatedQuote({
        quotationCode: data.quotationCode || data.code || "QT-WEB",
        enquiryCode: data.code || "",
        totalNpr: data.estimatedTotalNpr || grandTotal,
      });
      notify(data.message || "Official quotation generated!");
    } catch {
      setError("Network error while generating quotation.");
    } finally {
      setSubmitting(false);
    }
  };

  if (createdQuote) {
    return (
      <div className="rounded-2xl border border-line bg-card p-8 text-center">
        <CheckCircle2 className="mx-auto h-11 w-11 text-emerald-600" />
        <h2 className="mt-3 text-xl font-semibold text-ink">Official Quotation Generated</h2>
        <p className="mt-1 text-sm font-semibold text-accent">
          Quotation Reference: {createdQuote.quotationCode}
        </p>
        <p className="mt-2 text-sm text-muted">
          Estimated Grand Total (incl. 13% VAT):{" "}
          <strong className="text-ink">NPR {createdQuote.totalNpr.toLocaleString()}</strong>
        </p>
        <p className="mx-auto mt-2 max-w-lg text-xs text-muted">
          Your formal quotation has been registered directly in our ERP sales desk and emailed to{" "}
          <strong>{email}</strong>. Sign in with that email anytime to review, accept, or request
          revisions under My Quotations.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link href="/my-quotations" className="btn-accent rounded-xl px-5 py-2.5 text-xs font-medium">
            View My Quotations
          </Link>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-line px-4 py-2.5 text-xs font-medium text-ink hover:bg-surface"
          >
            <Printer className="h-3.5 w-3.5" />
            Print Estimate
          </button>
          <button
            type="button"
            onClick={() => setCreatedQuote(null)}
            className="rounded-xl border border-line px-4 py-2.5 text-xs font-medium text-muted hover:text-ink"
          >
            Build Another Quotation
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-12">
      {/* Left: Charger selection + customer details */}
      <div className="space-y-6 lg:col-span-7">
        <div className="rounded-2xl border border-line bg-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-ink flex items-center gap-2">
              <Zap className="h-4 w-4 text-accent" />
              1. Select EV Charger Hardware
            </h2>
            <button
              type="button"
              onClick={addLine}
              className="inline-flex items-center gap-1 rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-ink hover:bg-surface"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Charger
            </button>
          </div>

          <div className="space-y-3">
            {lines.map((line, idx) => (
              <div
                key={`${line.slug}-${idx}`}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-surface p-3"
              >
                <select
                  value={line.slug}
                  onChange={(e) =>
                    setLines((prev) =>
                      prev.map((l, i) => (i === idx ? { ...l, slug: e.target.value } : l)),
                    )
                  }
                  className="min-w-0 flex-1 rounded-lg border border-line bg-card px-3 py-2 text-xs text-ink"
                >
                  {chargers.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.name} ({c.type} · {c.powerKw} kW)
                      {c.showPrice && c.priceNpr ? ` — NPR ${c.priceNpr.toLocaleString()}` : ""}
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted">Qty</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={line.quantity}
                    onChange={(e) =>
                      setLines((prev) =>
                        prev.map((l, i) =>
                          i === idx ? { ...l, quantity: Math.max(1, Number(e.target.value)) } : l,
                        ),
                      )
                    }
                    className="w-16 rounded-lg border border-line bg-card px-2.5 py-2 text-xs text-ink"
                  />
                  {lines.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setLines((prev) => prev.filter((_, i) => i !== idx))}
                      className="rounded-lg p-2 text-muted hover:text-red-600"
                      aria-label="Remove line"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="grid gap-4 pt-2 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">
                Installation Site Type
              </label>
              <select
                value={siteType}
                onChange={(e) => setSiteType(e.target.value)}
                className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-xs text-ink"
              >
                {SITE_TYPES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <label className="flex cursor-pointer items-center gap-2.5 self-end rounded-lg border border-line bg-surface px-3.5 py-2.5 text-xs text-ink">
              <input
                type="checkbox"
                checked={installRequired}
                onChange={(e) => setInstallRequired(e.target.checked)}
                className="h-4 w-4 accent-[var(--accent)]"
              />
              Include Turnkey NEA Installation & Earthing
            </label>
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-card p-6 space-y-4">
          <h2 className="text-base font-semibold text-ink flex items-center gap-2">
            <FileText className="h-4 w-4 text-accent" />
            2. Organization & Contact Details
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Full Name *</label>
              <input
                required
                minLength={2}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className="w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm text-ink"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">
                Company / Hotel / Hub Name
              </label>
              <input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Optional organization name"
                className="w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm text-ink"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Email Address *</label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com.np"
                className="w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm text-ink"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Phone Number *</label>
              <input
                required
                minLength={7}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+977-98XXXXXXXX"
                className="w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm text-ink"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted">
              Installation City / Highway Location *
            </label>
            <input
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Kathmandu, Pokhara, Mugling, Chitwan"
              className="w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm text-ink"
            />
          </div>

          <div className="hidden" aria-hidden="true">
            <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted">
              Site Notes / Transformer Capacity / Delivery Timeline
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Share available 3-phase kVA capacity, desired delivery month, or custom branding requests..."
              className="w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm text-ink"
            />
          </div>
        </div>
      </div>

      {/* Right: Live Indicative Quotation Summary */}
      <div className="lg:col-span-5">
        <div className="sticky top-24 rounded-2xl border border-line bg-card p-6 space-y-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-accent">
              Live Quotation Estimate
            </p>
            <h3 className="mt-1 text-lg font-semibold text-ink">Indicative Commercial Summary</h3>
            <p className="mt-0.5 text-xs text-muted">
              Valid for 30 days · Official ERP quotation generated upon submission
            </p>
          </div>

          <div className="divide-y divide-line border-y border-line text-xs">
            {detailedLines.map((item, idx) => (
              <div key={`${item.slug}-${idx}`} className="flex items-start justify-between gap-3 py-3">
                <div>
                  <p className="font-semibold text-ink">{item.charger.name}</p>
                  <p className="text-muted">
                    {item.quantity} × NPR {item.unitPrice.toLocaleString()} ({item.charger.powerKw} kW)
                  </p>
                </div>
                <span className="font-semibold text-ink whitespace-nowrap">
                  NPR {item.lineTotal.toLocaleString()}
                </span>
              </div>
            ))}
            {installRequired && (
              <div className="flex items-start justify-between gap-3 py-3">
                <div>
                  <p className="font-medium text-ink">Turnkey NEA Installation & Earthing</p>
                  <p className="text-muted">{siteType}</p>
                </div>
                <span className="font-semibold text-ink whitespace-nowrap">
                  NPR {installFee.toLocaleString()}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-muted">
              <span>Subtotal</span>
              <span>NPR {subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-muted">
              <span>Nepal VAT (13%)</span>
              <span>NPR {vat.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-t border-line pt-2.5 text-base font-semibold text-ink">
              <span>Estimated Grand Total</span>
              <span className="text-accent">NPR {grandTotal.toLocaleString()}</span>
            </div>
          </div>

          {error && <p className="text-xs font-medium text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="btn-accent w-full rounded-xl px-5 py-3 text-sm font-medium transition disabled:opacity-50"
          >
            {submitting ? "Generating Official Quotation..." : "Generate Official Quotation"}
          </button>

          <p className="text-center text-[11px] text-muted">
            Already received a quote from our team?{" "}
            <Link href="/my-quotations" className="font-medium text-accent hover:underline">
              View My Quotations
            </Link>
          </p>
        </div>
      </div>
    </form>
  );
}
