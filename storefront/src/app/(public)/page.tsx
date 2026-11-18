import React from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Mail, Phone, Star } from "lucide-react";
import { getPublicPage, getPublicTestimonials, getSiteBootstrap, strField } from "@/lib/cms";
import { resolveMediaUrl } from "@/lib/erp-client";
import { EditableImage, EditableText } from "@/components/editor/editable";
import { ChargerCard } from "@/components/public/charger-card";

export default async function HomePage() {
  const [site, pageData, testimonials] = await Promise.all([
    getSiteBootstrap(),
    getPublicPage("home"),
    getPublicTestimonials(),
  ]);

  const sections = pageData.sections;
  const whyItems = (
    Array.isArray(sections["home.why_choose"]?.content?.items)
      ? sections["home.why_choose"]?.content?.items
      : []
  ) as { title: string; description: string }[];

  return (
    <div>
      {/* 1. HERO */}
      <section className="w-full px-4 py-16 sm:px-6 sm:py-24 lg:px-10 xl:px-14">
        <div className="grid items-center gap-12 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-7">
            <EditableText
              as="p"
              className="inline-block rounded-full border border-line bg-card px-3.5 py-1 text-xs font-medium text-muted"
              value={strField(sections, "home.hero", "eyebrow", String(site.settings.hero_badge || ""))}
              label="Hero Eyebrow"
              cmsPath="/pages"
            />
            <EditableText
              as="h1"
              className="text-4xl font-semibold tracking-tight text-ink sm:text-5xl lg:leading-[1.12]"
              value={strField(sections, "home.hero", "headline", String(site.settings.hero_title || ""))}
              label="Hero Headline"
              cmsPath="/pages"
            />
            <EditableText
              as="p"
              className="max-w-2xl text-base leading-relaxed text-muted sm:text-lg"
              value={strField(sections, "home.hero", "subheadline", String(site.settings.hero_description || ""))}
              label="Hero Subheadline"
              cmsPath="/pages"
            />
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href={strField(sections, "home.hero", "primaryCtaHref", "/chargers")}
                className="btn-accent inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-medium transition"
              >
                <EditableText
                  as="span"
                  value={strField(sections, "home.hero", "primaryCtaLabel", "Browse Chargers")}
                  label="Hero Primary Button"
                  cmsPath="/pages"
                />
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={strField(sections, "home.hero", "secondaryCtaHref", "/contact")}
                className="rounded-xl border border-line bg-card px-6 py-3 text-sm font-medium text-ink transition hover:bg-surface"
              >
                <EditableText
                  as="span"
                  value={strField(sections, "home.hero", "secondaryCtaLabel", "Request a Quote")}
                  label="Hero Secondary Button"
                  cmsPath="/pages"
                />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="overflow-hidden rounded-3xl border border-line bg-card shadow-sm">
              <EditableImage
                src={resolveMediaUrl(strField(sections, "home.hero", "heroImage", "/uploads/chargers/hero-charging-hub.jpg"))}
                alt={strField(sections, "home.hero", "headline", "EV Chargers")}
                className="aspect-[4/3] w-full object-cover"
                label="Hero Image"
                cmsPath="/pages"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 2. FEATURED CHARGERS */}
      <section className="border-t border-line bg-card/50 py-16 sm:py-20">
        <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-14">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <EditableText
                as="h2"
                className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl"
                value={strField(sections, "home.featured", "title")}
                label="Featured Section Title"
                cmsPath="/pages"
              />
              <EditableText
                as="p"
                className="mt-2 max-w-2xl text-sm text-muted"
                value={strField(sections, "home.featured", "subtitle")}
                label="Featured Section Subtitle"
                cmsPath="/pages"
              />
            </div>
            <Link href="/chargers" className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline">
              <EditableText as="span" value={strField(sections, "home.featured", "ctaLabel", "View Full Catalog")} label="Catalog CTA" cmsPath="/pages" />
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {site.featuredChargers.map((c) => (
              <ChargerCard key={c.id} charger={c} />
            ))}
          </div>
        </div>
      </section>

      {/* 3. WHY CHOOSE US */}
      <section className="border-t border-line py-16 sm:py-20">
        <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-14">
          <div className="max-w-2xl">
            <EditableText as="h2" className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl" value={strField(sections, "home.why_choose", "title")} label="Why Choose Us Title" cmsPath="/pages" />
            <EditableText as="p" className="mt-2 text-sm text-muted" value={strField(sections, "home.why_choose", "subtitle")} label="Why Choose Us Subtitle" cmsPath="/pages" />
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {whyItems.map((item, idx) => (
              <div key={idx} className="rounded-2xl border border-line bg-card p-6">
                <CheckCircle2 className="h-5 w-5 text-accent" />
                <h3 className="mt-4 text-base font-semibold text-ink">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. BRAND LOGOS */}
      <section className="border-t border-line bg-card/50 py-14">
        <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-14">
          <div className="text-center">
            <EditableText as="h2" className="text-xl font-semibold text-ink" value={strField(sections, "home.brands", "title")} label="Brands Title" cmsPath="/brands" />
            <EditableText as="p" className="mt-1 text-sm text-muted" value={strField(sections, "home.brands", "subtitle")} label="Brands Subtitle" cmsPath="/brands" />
          </div>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {site.brands.slice(0, 8).map((brand) => (
              <div key={brand.id} className="flex flex-col items-center justify-center rounded-2xl border border-line bg-card p-5 text-center">
                {brand.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={brand.logo_url} alt={brand.name} className="h-10 w-auto object-contain" />
                ) : (
                  <span className="text-base font-semibold text-ink">{brand.name}</span>
                )}
                <p className="mt-2 line-clamp-2 text-xs text-muted">{brand.description || brand.country}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. TESTIMONIALS */}
      <section className="border-t border-line py-16 sm:py-20">
        <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-14">
          <div className="max-w-2xl">
            <EditableText as="h2" className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl" value={strField(sections, "home.testimonials", "title")} label="Testimonials Title" cmsPath="/testimonials" />
            <EditableText as="p" className="mt-2 text-sm text-muted" value={strField(sections, "home.testimonials", "subtitle")} label="Testimonials Subtitle" cmsPath="/testimonials" />
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {testimonials.slice(0, 6).map((t) => (
              <blockquote key={t.id} className="flex flex-col justify-between rounded-2xl border border-line bg-card p-6">
                <div>
                  <div className="flex gap-0.5 text-amber-500">
                    {Array.from({ length: Math.min(5, Math.max(1, t.rating || 5)) }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-current" />
                    ))}
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-ink">“{t.feedback}”</p>
                </div>
                <footer className="mt-5 border-t border-line pt-4 text-xs">
                  <p className="font-semibold text-ink">{t.client_name}</p>
                  <p className="text-muted">
                    {t.role}
                    {t.company ? `, ${t.company}` : ""}
                    {t.station_location ? ` · ${t.station_location}` : ""}
                  </p>
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* 6. CLOSING CTA */}
      <section className="border-t border-line py-16 sm:py-20">
        <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-14">
          <div className="flex flex-col justify-between gap-8 rounded-3xl border border-line bg-card p-8 sm:p-12 lg:flex-row lg:items-center">
            <div className="max-w-2xl space-y-3">
              <EditableText as="h2" className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl" value={strField(sections, "home.cta", "title")} label="Closing CTA Title" cmsPath="/pages" />
              <EditableText as="p" className="text-sm leading-relaxed text-muted" value={strField(sections, "home.cta", "subtitle")} label="Closing CTA Subtitle" cmsPath="/pages" />
              <div className="flex flex-wrap gap-5 pt-2 text-xs text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-accent" />
                  {String(site.settings.phone || "")}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-accent" />
                  {String(site.settings.email || "")}
                </span>
              </div>
            </div>

            <Link
              href={strField(sections, "home.cta", "buttonHref", "/contact")}
              className="btn-accent inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-medium transition"
            >
              <EditableText as="span" value={strField(sections, "home.cta", "buttonLabel", "Contact Our Team")} label="CTA Button" cmsPath="/pages" />
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
