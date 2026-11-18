import React from "react";
import { getStorefrontSession } from "@/lib/auth";
import { getPreviewToken, getSiteBootstrap } from "@/lib/cms";
import { getErpFrontendUrl, resolveMediaUrl } from "@/lib/erp-client";
import { EditModeProvider } from "@/components/editor/edit-mode-context";
import { SiteHeader } from "@/components/public/site-header";
import { SiteFooter } from "@/components/public/site-footer";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [session, previewToken, site] = await Promise.all([
    getStorefrontSession(),
    getPreviewToken(),
    getSiteBootstrap(),
  ]);

  const isSuperAdmin =
    session?.user?.role === "Super Administrator" || session?.user?.role === "SUPER_ADMIN";

  return (
    <EditModeProvider
      isSuperAdmin={isSuperAdmin}
      previewActive={Boolean(previewToken && site.preview)}
      erpFrontendUrl={getErpFrontendUrl()}
    >
      <div className="flex min-h-screen flex-col bg-surface text-ink">
        <SiteHeader
          siteTitle={String(site.settings.site_title || "")}
          logoUrl={resolveMediaUrl(String(site.settings.logo_url || ""))}
          navLinks={site.navigation.header}
        />
        <main className="flex-1">{children}</main>
        <SiteFooter settings={site.settings} footerLinks={site.navigation.footer} />
      </div>
    </EditModeProvider>
  );
}
