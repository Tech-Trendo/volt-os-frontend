import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FileText } from "lucide-react";
import { getStorefrontSession } from "@/lib/auth";
import { getErpApiBase } from "@/lib/erp-client";
import { QuotationResponseActions } from "@/components/public/quotation-response-actions";

export const dynamic = "force-dynamic";

interface ErpQuotationRecord {
  id: string;
  code?: string;
  name?: string;
  status?: string;
  date?: string;
  subtotalNpr?: number;
  vatNpr?: number;
  totalNpr?: number;
  amountNpr?: number;
  description?: string;
  validUntil?: string;
  terms?: string;
  lineItems?: { description: string; quantity: number; unitPriceNpr: number }[];
}

export default async function MyQuotationsPage() {
  const session = await getStorefrontSession();
  if (!session?.accessToken) redirect("/login?callbackUrl=/my-quotations");

  let quotations: ErpQuotationRecord[] = [];
  try {
    const res = await fetch(`${getErpApiBase()}/public/my-quotations`, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
      cache: "no-store",
    });
    if (res.ok) {
      const data = (await res.json()) as { quotations?: ErpQuotationRecord[] };
      quotations = data.quotations ?? [];
    }
  } catch {
    quotations = [];
  }

  return (
    <div className="w-full px-4 py-14 sm:px-6 lg:px-10 xl:px-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-ink">My Quotations</h1>
          <p className="mt-2 text-sm text-muted">
            Review, print, accept, or request revisions on official EV charger quotations issued by
            our ERP sales team.
          </p>
        </div>
        <Link href="/quotations" className="btn-accent rounded-xl px-4 py-2 text-xs font-medium">
          Build New Quotation
        </Link>
      </div>

      {quotations.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-line bg-card px-6 py-16 text-center">
          <FileText className="mx-auto h-8 w-8 text-muted" />
          <p className="mt-3 text-base font-semibold text-ink">No quotations issued yet</p>
          <p className="mt-1 text-sm text-muted">
            Use our online Quotation Builder to configure chargers and receive an official NPR quote.
          </p>
          <Link
            href="/quotations"
            className="btn-accent mt-5 inline-block rounded-xl px-5 py-2.5 text-sm font-medium"
          >
            Build a Quotation
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          {quotations.map((qt) => {
            const sub = qt.subtotalNpr || qt.amountNpr || 0;
            const vat = qt.vatNpr || Math.round(sub * 0.13);
            const total = qt.totalNpr || sub + vat;
            const items = qt.lineItems && qt.lineItems.length > 0 ? qt.lineItems : [];

            return (
              <div key={qt.id} className="rounded-2xl border border-line bg-card p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-line bg-surface px-2.5 py-0.5 text-[11px] font-semibold text-ink">
                        {qt.status || "Sent"}
                      </span>
                      {qt.code && <span className="font-mono text-xs text-accent font-semibold">{qt.code}</span>}
                    </div>
                    <h2 className="mt-2 text-base font-semibold text-ink">{qt.name}</h2>
                  </div>
                  <div className="text-right text-xs text-muted">
                    {qt.date && <div>Issued: {qt.date}</div>}
                    {qt.validUntil && <div>Valid until: {qt.validUntil}</div>}
                  </div>
                </div>

                {items.length > 0 && (
                  <div className="mt-4 overflow-hidden rounded-xl border border-line">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-line bg-surface text-muted">
                        <tr>
                          <th className="px-3.5 py-2.5">Item</th>
                          <th className="px-3.5 py-2.5 text-right">Qty</th>
                          <th className="px-3.5 py-2.5 text-right">Unit Price</th>
                          <th className="px-3.5 py-2.5 text-right">Line Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line">
                        {items.map((item, i) => (
                          <tr key={i}>
                            <td className="px-3.5 py-2.5 font-medium text-ink">{item.description}</td>
                            <td className="px-3.5 py-2.5 text-right text-muted">{item.quantity}</td>
                            <td className="px-3.5 py-2.5 text-right text-muted">
                              NPR {Number(item.unitPriceNpr).toLocaleString()}
                            </td>
                            <td className="px-3.5 py-2.5 text-right font-semibold text-ink">
                              NPR {(item.quantity * Number(item.unitPriceNpr)).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
                  <div className="max-w-xl text-xs text-muted">
                    {qt.terms && <p className="font-medium text-ink/80">{qt.terms}</p>}
                    {qt.description && <p className="mt-1">{qt.description}</p>}
                  </div>
                  <div className="min-w-[210px] space-y-1 rounded-xl border border-line bg-surface p-3 text-xs">
                    <div className="flex justify-between text-muted">
                      <span>Subtotal</span>
                      <span>NPR {sub.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-muted">
                      <span>VAT (13%)</span>
                      <span>NPR {vat.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-t border-line pt-1.5 text-sm font-semibold text-ink">
                      <span>Total</span>
                      <span className="text-accent">NPR {total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <QuotationResponseActions quotationId={qt.id} status={qt.status || "Sent"} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
