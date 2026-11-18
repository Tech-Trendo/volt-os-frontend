import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, ShieldCheck, Zap } from "lucide-react";
import { getPublicChargerBySlug } from "@/lib/cms";
import { sanitizeRichText } from "@/lib/sanitize";
import { ChargerGallery } from "@/components/public/charger-gallery";
import { ChargerCard } from "@/components/public/charger-card";

export default async function ChargerDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getPublicChargerBySlug(slug);
  if (!data) notFound();

  const { charger, related } = data;
  const safeHtml = sanitizeRichText(charger.description);

  return (
    <div className="w-full px-4 py-12 sm:px-6 lg:px-10 xl:px-14">
      <Link
        href="/chargers"
        className="mb-8 inline-flex items-center gap-1.5 text-xs font-medium text-muted hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Catalog
      </Link>

      <div className="grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <ChargerGallery
            images={charger.images}
            name={charger.name}
            chargerId={charger.id}
            initialSaved={false}
          />
        </div>

        <div className="space-y-6 lg:col-span-6">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-line bg-card px-3 py-0.5 text-xs font-semibold text-ink">
                {charger.type} · {charger.powerKw} kW
              </span>
              <span className="text-xs font-medium text-muted">{charger.brand.name}</span>
              <span className="text-xs text-muted">· {charger.category.name}</span>
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink">{charger.name}</h1>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-card p-5">
            <div>
              <p className="text-xs text-muted">Price</p>
              {charger.showPrice && charger.priceNpr ? (
                <p className="mt-0.5 text-2xl font-semibold text-ink">
                  NPR {charger.priceNpr.toLocaleString()}
                </p>
              ) : (
                <p className="mt-0.5 text-lg font-semibold text-ink">Custom Project Pricing</p>
              )}
            </div>
            <div className="text-right text-xs">
              <span className="inline-flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                {charger.stockStatus}
              </span>
              <p className="mt-1 flex items-center justify-end gap-1 text-muted">
                <ShieldCheck className="h-3.5 w-3.5" />
                {charger.warrantyMonths} months OEM warranty
              </p>
            </div>
          </div>

          <div className="prose-cms text-sm text-muted" dangerouslySetInnerHTML={{ __html: safeHtml }} />

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/quotations?slug=${charger.slug}`}
              className="btn-accent inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-medium transition"
            >
              <Zap className="h-4 w-4" />
              Get Official Quotation
            </Link>
            <Link
              href={`/contact?charger=${charger.id}&slug=${charger.slug}`}
              className="rounded-xl border border-line bg-card px-5 py-3 text-sm font-medium text-ink transition hover:bg-surface"
            >
              Send Enquiry
            </Link>
          </div>

          <div className="overflow-hidden rounded-2xl border border-line bg-card">
            <div className="border-b border-line px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted">
              Key Technical Specifications
            </div>
            <dl className="divide-y divide-line text-sm">
              {[
                ["Charger Type", `${charger.type} Charger`],
                ["Power Output", `${charger.powerKw} kW`],
                ["Connectors", charger.connectors.join(", ")],
                ["Electrical Phase", charger.phase],
                ["Dimensions", charger.dimensions],
                ["Warranty Period", `${charger.warrantyMonths} Months`],
                ...Object.entries(charger.specs || {}),
              ].map(([k, v]) => (
                <div key={k} className="grid grid-cols-2 gap-4 px-5 py-3">
                  <dt className="text-muted">{k}</dt>
                  <dd className="font-medium text-ink">{String(v)}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-20 border-t border-line pt-12">
          <h2 className="text-xl font-semibold text-ink">Related Chargers</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <ChargerCard key={item.id} charger={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
