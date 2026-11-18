"use client";

import React from "react";
import Link from "next/link";
import { Mail, MapPin, Phone, Clock } from "lucide-react";
import { EditableText } from "@/components/editor/editable";

interface FooterLink {
  id: number | string;
  label: string;
  href: string;
  open_in_new_tab?: boolean;
}

export function SiteFooter({
  settings,
  footerLinks,
}: {
  settings: Record<string, unknown>;
  footerLinks: FooterLink[];
}) {
  const socials = (settings.social_links && typeof settings.social_links === "object"
    ? settings.social_links
    : {}) as Record<string, string>;

  return (
    <footer className="border-t border-line bg-card">
      <div className="w-full px-4 py-14 sm:px-6 lg:px-10 xl:px-14">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2 space-y-3">
            <EditableText
              as="h3"
              className="text-base font-semibold text-ink"
              value={String(settings.company_name || settings.site_title || "")}
              label="Company Name"
              cmsPath="/settings"
            />
            <EditableText
              as="p"
              className="max-w-md text-sm leading-relaxed text-muted"
              value={String(settings.tagline || "")}
              label="Company Tagline"
              cmsPath="/settings"
            />
            <div className="flex flex-wrap gap-4 pt-2 text-xs text-muted">
              {socials.facebook && (
                <a href={socials.facebook} target="_blank" rel="noopener noreferrer" className="hover:text-ink">
                  Facebook
                </a>
              )}
              {socials.linkedin && (
                <a href={socials.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-ink">
                  LinkedIn
                </a>
              )}
              {socials.instagram && (
                <a href={socials.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-ink">
                  Instagram
                </a>
              )}
            </div>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
              Navigation
            </h4>
            <ul className="space-y-2.5 text-sm">
              {footerLinks.map((link) => (
                <li key={link.id}>
                  <Link
                    href={link.href}
                    target={link.open_in_new_tab ? "_blank" : undefined}
                    className="text-muted transition hover:text-ink"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
              Contact
            </h4>
            <ul className="space-y-2.5 text-sm text-muted">
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                <EditableText as="span" value={String(settings.address || "")} label="Address" cmsPath="/settings" />
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0" />
                <EditableText as="span" value={String(settings.phone || "")} label="Phone" cmsPath="/settings" />
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0" />
                <EditableText as="span" value={String(settings.email || "")} label="Email" cmsPath="/settings" />
              </li>
              <li className="flex items-center gap-2">
                <Clock className="h-4 w-4 shrink-0" />
                <EditableText as="span" value={String(settings.support_hours || "")} label="Hours" cmsPath="/settings" />
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-line pt-6 text-xs text-muted">
          <EditableText as="p" value={String(settings.footer_text || "")} label="Footer Text" cmsPath="/settings" />
        </div>
      </div>
    </footer>
  );
}
