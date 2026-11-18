import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { getStorefrontSession } from "@/lib/auth";
import { getErpApiBase } from "@/lib/erp-client";

export const dynamic = "force-dynamic";

interface ErpEnquiryRecord {
  id: string;
  code?: string;
  title?: string;
  status?: string;
  notes?: string;
  createdAt?: string;
  created_at?: string;
  fields?: Record<string, string | number | null>;
}

export default async function MyEnquiriesPage() {
  const session = await getStorefrontSession();
  if (!session?.accessToken) redirect("/login?callbackUrl=/my-enquiries");

  let enquiries: ErpEnquiryRecord[] = [];
  try {
    const res = await fetch(`${getErpApiBase()}/public/my-enquiries`, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
      cache: "no-store",
    });
    if (res.ok) {
      const data = (await res.json()) as { enquiries?: ErpEnquiryRecord[] };
      enquiries = data.enquiries ?? [];
    }
  } catch {
    enquiries = [];
  }

  return (
    <div className="w-full px-4 py-14 sm:px-6 lg:px-10 xl:px-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-ink">My Enquiries</h1>
          <p className="mt-2 text-sm text-muted">
            Track the live ERP status of your submitted charger quote requests and consultations.
          </p>
        </div>
        <Link href="/contact" className="btn-accent rounded-xl px-4 py-2 text-xs font-medium">
          New Enquiry
        </Link>
      </div>

      {enquiries.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-line bg-card px-6 py-16 text-center">
          <MessageSquare className="mx-auto h-8 w-8 text-muted" />
          <p className="mt-3 text-base font-semibold text-ink">No enquiries yet</p>
          <p className="mt-1 text-sm text-muted">
            Submit a quote request on any charger page or through the Contact page.
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {enquiries.map((e) => {
            const chargerSlug = typeof e.fields?.charger_slug === "string" ? e.fields.charger_slug : "";
            const chargerName = typeof e.fields?.charger_name === "string" ? e.fields.charger_name : "";
            const created = e.createdAt || e.created_at;

            return (
              <div key={e.id} className="rounded-2xl border border-line bg-card p-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="rounded-full border border-line bg-surface px-2.5 py-0.5 text-[11px] font-semibold text-ink">
                      {e.status || "New"}
                    </span>
                    {e.code && (
                      <span className="text-xs font-mono text-muted">{e.code}</span>
                    )}
                    {chargerSlug && chargerName ? (
                      <Link
                        href={`/chargers/${chargerSlug}`}
                        className="text-sm font-semibold text-accent hover:underline"
                      >
                        {chargerName}
                      </Link>
                    ) : (
                      <span className="text-sm font-semibold text-ink">
                        {e.title || "General Consultation"}
                      </span>
                    )}
                  </div>
                  {created && (
                    <span className="text-xs text-muted">
                      {new Date(created).toLocaleDateString()}
                    </span>
                  )}
                </div>
                {e.notes && (
                  <p className="mt-3 text-sm leading-relaxed text-muted">{e.notes}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
