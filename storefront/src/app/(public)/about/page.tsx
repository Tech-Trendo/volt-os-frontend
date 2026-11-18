import React from "react";
import { getPublicPage, strField } from "@/lib/cms";
import { resolveMediaUrl } from "@/lib/erp-client";
import { EditableImage, EditableText } from "@/components/editor/editable";

export default async function AboutPage() {
  const pageData = await getPublicPage("about");
  const sections = pageData.sections;
  const team = pageData.team ?? [];

  return (
    <div className="w-full space-y-20 px-4 py-14 sm:px-6 lg:px-10 xl:px-14">
      <section className="grid items-center gap-12 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-7">
          <EditableText as="p" className="text-xs font-semibold uppercase tracking-wider text-accent" value={strField(sections, "about.story", "eyebrow", "About Us")} label="About Eyebrow" cmsPath="/pages" />
          <EditableText as="h1" className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl" value={strField(sections, "about.story", "title")} label="About Heading" cmsPath="/pages" />
          <EditableText as="p" className="text-base leading-relaxed text-muted" value={strField(sections, "about.story", "body")} label="About Story" cmsPath="/pages" />
        </div>
        <div className="lg:col-span-5">
          <div className="overflow-hidden rounded-3xl border border-line bg-card shadow-sm">
            <EditableImage
              src={resolveMediaUrl(strField(sections, "about.story", "image", "/uploads/chargers/about-charging-hub.jpg"))}
              alt={strField(sections, "about.story", "title", "About Us")}
              className="aspect-[4/3] w-full object-cover"
              label="About Image"
              cmsPath="/pages"
            />
          </div>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-line bg-card p-8">
          <EditableText as="h2" className="text-xl font-semibold text-ink" value={strField(sections, "about.mission", "missionTitle")} label="Mission Title" cmsPath="/pages" />
          <EditableText as="p" className="mt-3 text-sm leading-relaxed text-muted" value={strField(sections, "about.mission", "missionText")} label="Mission Text" cmsPath="/pages" />
        </div>
        <div className="rounded-2xl border border-line bg-card p-8">
          <EditableText as="h2" className="text-xl font-semibold text-ink" value={strField(sections, "about.mission", "visionTitle")} label="Vision Title" cmsPath="/pages" />
          <EditableText as="p" className="mt-3 text-sm leading-relaxed text-muted" value={strField(sections, "about.mission", "visionText")} label="Vision Text" cmsPath="/pages" />
        </div>
      </section>

      {team.length > 0 && (
        <section>
          <h2 className="text-2xl font-semibold text-ink">Leadership & Engineering Team</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {team.slice(0, 6).map((m) => (
              <div key={m.id} className="rounded-2xl border border-line bg-card p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-surface text-sm font-semibold text-ink">
                  {m.name.charAt(0)}
                </div>
                <h3 className="mt-4 text-base font-semibold text-ink">{m.name}</h3>
                <p className="text-xs font-medium text-accent">{m.role}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted">{m.bio}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
