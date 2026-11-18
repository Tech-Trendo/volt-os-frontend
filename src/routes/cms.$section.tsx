import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/metadata";
import { CmsWorkspace, type CmsSectionTab } from "@/features/cms/cms-workspace";

const VALID_TABS: CmsSectionTab[] = [
  "dashboard",
  "pages",
  "chargers",
  "brands",
  "categories",
  "testimonials",
  "faqs",
  "navigation",
  "settings",
  "media",
  "versions",
];

export const Route = createFileRoute("/cms/$section")({
  head: ({ params }) =>
    pageHead(
      `CMS · ${params.section || "Dashboard"}`,
      "Super Admin storefront content management screen.",
    ),
  component: CmsSubRoute,
});

function CmsSubRoute() {
  const { section } = Route.useParams();
  const normalized = (section || "dashboard").replace(/\/$/, "") as CmsSectionTab;
  const tab = VALID_TABS.includes(normalized) ? normalized : "dashboard";
  return <CmsWorkspace section={tab} />;
}
