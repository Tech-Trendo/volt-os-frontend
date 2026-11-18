import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/metadata";
import { CmsWorkspace } from "@/features/cms/cms-workspace";

export const Route = createFileRoute("/cms/")({
  head: () =>
    pageHead(
      "Storefront CMS Dashboard",
      "Super Admin content management system powering the public EV charger storefront.",
    ),
  component: () => <CmsWorkspace section="dashboard" />,
});
