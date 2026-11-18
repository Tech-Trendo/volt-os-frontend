import { createFileRoute } from "@tanstack/react-router";
import { MapPage } from "@/features/network/map-page";
import { stationsQuery } from "@/queries/stations";
import { pageHead } from "@/lib/metadata";
import { ListState } from "@/components/shared/common";
export const Route = createFileRoute("/network/locations")({
  head: () =>
    pageHead(
      "Station Locations",
      "Explore Volt OS’s 48 charging stations across Nepal with province filters and equipment details.",
    ),
  loader: ({ context }) => {
    return context.queryClient.ensureQueryData(stationsQuery());
  },
  component: MapPage,
  pendingComponent: () => <ListState loading />,
});
