import React from "react";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { getPublicChargers, getPublicPage, getSiteBootstrap, strField } from "@/lib/cms";
import { EditableText } from "@/components/editor/editable";
import { ContactForm } from "@/components/public/contact-form";

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ charger?: string; slug?: string }>;
}) {
  const { charger, slug } = await searchParams;
  const [page, site, catalog] = await Promise.all([
    getPublicPage("contact"),
    getSiteBootstrap(),
    getPublicChargers(),
  ]);

  const sections = page.sections;
  const settings = site.settings as Record<string, string | undefined>;
  const chargers = catalog.items;

  const matched =
    chargers.find((c) => c.id === charger || c.slug === charger || c.slug === slug)?.id || "";

  return (
    <div className="w-full px-4 py-14 sm:px-6 lg:px-10 xl:px-14">
      <div className="max-w-2xl space-y-3">
        <EditableText
          as="p"
          className="text-xs font-semibold uppercase tracking-wider text-accent"
          value={strField(sections, "contact.header", "eyebrow", "Contact & Quote Request")}
          label="Contact Eyebrow"
          cmsPath="/pages"
        />
        <EditableText
          as="h1"
          className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl"
          value={strField(sections, "contact.header", "title", "Request a Charger Quote")}
          label="Contact Heading"
          cmsPath="/pages"
        />
        <EditableText
          as="p"
          className="text-base text-muted"
          value={strField(
            sections,
            "contact.header",
            "subtitle",
            "Tell us about your home, fleet, hotel, or highway charging site and our engineers will send a custom quote.",
          )}
          label="Contact Subtitle"
          cmsPath="/pages"
        />
      </div>

      <div className="mt-12 grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <ContactForm
            chargers={chargers.map((c) => ({
              id: c.id,
              slug: c.slug,
              name: `${c.name} (${c.powerKw} kW)`,
            }))}
            defaultChargerId={matched}
          />
        </div>

        <div className="space-y-6 lg:col-span-5">
          <div className="space-y-4 rounded-2xl border border-line bg-card p-6 text-sm">
            <h2 className="text-base font-semibold text-ink">Direct Contact</h2>
            <div className="flex items-start gap-3 text-muted">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <EditableText
                as="span"
                value={settings.address || "Kathmandu, Nepal"}
                label="Address"
                cmsPath="/settings"
              />
            </div>
            <div className="flex items-center gap-3 text-muted">
              <Phone className="h-4 w-4 shrink-0 text-accent" />
              <div>
                <EditableText
                  as="div"
                  value={settings.phone_primary || settings.contact_phone || "+977-1-5900000"}
                  label="Primary Phone"
                  cmsPath="/settings"
                />
                {settings.phone_secondary && (
                  <EditableText
                    as="div"
                    className="text-xs"
                    value={settings.phone_secondary}
                    label="Secondary Phone"
                    cmsPath="/settings"
                  />
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 text-muted">
              <Mail className="h-4 w-4 shrink-0 text-accent" />
              <EditableText
                as="span"
                value={settings.contact_email || settings.email || "sales@voltnepal.com.np"}
                label="Contact Email"
                cmsPath="/settings"
              />
            </div>
            <div className="flex items-center gap-3 text-muted">
              <Clock className="h-4 w-4 shrink-0 text-accent" />
              <EditableText
                as="span"
                value={settings.business_hours || "Sun–Fri, 9:00 AM – 6:00 PM NPT"}
                label="Business Hours"
                cmsPath="/settings"
              />
            </div>
          </div>

          {settings.map_embed_url && (
            <div className="overflow-hidden rounded-2xl border border-line bg-card">
              <iframe
                title="Office location map"
                src={settings.map_embed_url}
                className="h-64 w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
