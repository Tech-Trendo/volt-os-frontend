import { createFileRoute } from "@tanstack/react-router";
import { Dashboard } from "@/features/dashboard/dashboard";
import { dashboardQuery } from "@/queries/dashboard";
import { stationsQuery } from "@/queries/stations";
import { pageHead } from "@/lib/metadata";
import { ListState } from "@/components/shared/common";
export const Route = createFileRoute("/")({
  head: () =>
    pageHead(
      "EV Charging Importers Dashboard",
      "Volt OS EV charging equipment imports, supply orders, station projects, and charger inventory at a glance.",
    ),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(dashboardQuery),
      context.queryClient.ensureQueryData(stationsQuery()),
    ]);
  },
  component: Dashboard,
  pendingComponent: () => <ListState loading />,
});
