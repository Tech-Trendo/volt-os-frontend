import React from "react";
import { getPublicChargers, getPublicPage, strField } from "@/lib/cms";
import { EditableText } from "@/components/editor/editable";
import { CatalogClient } from "@/components/public/catalog-client";

export default async function ChargersCatalogPage() {
  const [pageData, catalog] = await Promise.all([
    getPublicPage("chargers"),
    getPublicChargers(),
  ]);

  return (
    <div className="w-full px-4 py-12 sm:px-6 lg:px-10 xl:px-14">
      <div className="mb-8 max-w-2xl">
        <EditableText
          as="h1"
          className="text-3xl font-semibold tracking-tight text-ink"
          value={strField(pageData.sections, "chargers.header", "title", "EV Charger Catalog")}
          label="Catalog Title"
          cmsPath="/pages"
        />
        <EditableText
          as="p"
          className="mt-2 text-sm text-muted"
          value={strField(pageData.sections, "chargers.header", "subtitle")}
          label="Catalog Subtitle"
          cmsPath="/pages"
        />
      </div>

      <CatalogClient
        chargers={catalog.items}
        brands={catalog.facets.brands.map((b) => ({ id: String(b.id), name: b.name, slug: b.slug }))}
        categories={catalog.facets.categories.map((c) => ({ id: String(c.id), name: c.name, slug: c.slug }))}
        savedIds={[]}
      />
    </div>
  );
}
