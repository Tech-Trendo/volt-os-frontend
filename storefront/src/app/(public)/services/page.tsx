import React from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Ship, Wrench } from "lucide-react";
import { getPublicPage, strField } from "@/lib/cms";
import { resolveMediaUrl } from "@/lib/erp-client";
import { EditableText } from "@/components/editor/editable";

export default async function ServicesPage() {
  const pageData = await getPublicPage("services");
  const services = pageData.services ?? [];

  const renderIcon = (name: string) => {
    if (name === "Ship") return <Ship className="h-5 w-5 text-accent" />;
    if (name === "ShieldCheck") return <ShieldCheck className="h-5 w-5 text-accent" />;
    return <Wrench className="h-5 w-5 text-accent" />;
  };

  return (
    <div className="w-full px-4 py-14 sm:px-6 lg:px-10 xl:px-14">
      <div className="max-w-2xl space-y-3">
        <EditableText as="p" className="text-xs font-semibold uppercase tracking-wider text-accent" value={strField(pageData.sections, "services.header", "eyebrow")} label="Services Eyebrow" cmsPath="/pages" />
        <EditableText as="h1" className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl" value={strField(pageData.sections, "services.header", "title")} label="Services Heading" cmsPath="/pages" />
        <EditableText as="p" className="text-base text-muted" value={strField(pageData.sections, "services.header", "subtitle")} label="Services Subtitle" cmsPath="/pages" />
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {services.map((srv) => (
          <div key={srv.id} className="flex flex-col overflow-hidden rounded-2xl border border-line bg-card">
            {srv.image_url && (
              <div className="aspect-[16/10] w-full overflow-hidden bg-surface">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={resolveMediaUrl(srv.image_url)}
                  alt={srv.title}
                  className="h-full w-full object-cover"
                />
              </div>
            )}
            <div className="flex flex-1 flex-col p-7">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-surface">
                {renderIcon(srv.icon)}
              </div>
              <h2 className="mt-5 text-lg font-semibold text-ink">{srv.title}</h2>
              <p className="mt-2 text-sm font-medium text-ink/80">{srv.summary}</p>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">{srv.description}</p>
              <Link href="/contact" className="mt-6 inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline">
                Inquire about this service
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
