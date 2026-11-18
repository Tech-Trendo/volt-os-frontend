import React from "react";
import { getPublicChargers } from "@/lib/cms";
import { QuotationBuilder } from "@/components/public/quotation-builder";

export default async function QuotationsPage({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string; charger?: string }>;
}) {
  const { slug, charger } = await searchParams;
  const catalog = await getPublicChargers();

  return (
    <div className="w-full px-4 py-14 sm:px-6 lg:px-10 xl:px-14">
      <div className="mb-10 max-w-2xl space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent">
          Instant Commercial Quotation
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Build an Official EV Charger Quotation
        </h1>
        <p className="text-base text-muted">
          Select your preferred AC wallboxes or DC fast chargers, configure site installation, and
          receive an ERP-tracked quotation with transparent NPR & 13% VAT pricing.
        </p>
      </div>

      <QuotationBuilder chargers={catalog.items} defaultSlug={slug || charger || ""} />
    </div>
  );
}
