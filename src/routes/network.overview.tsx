import { createFileRoute } from "@tanstack/react-router";
import { NetworkOverview } from "@/features/network/network-overview";
import { stationsQuery } from "@/queries/stations";
import { pageHead } from "@/lib/metadata";
export const Route = createFileRoute("/network/overview")({
  head: () =>
    pageHead(
      "Network Overview",
      "Volt OS station health, charging equipment, provincial coverage, and commissioning performance.",
    ),
  loader: ({ context }) => context.queryClient.ensureQueryData(stationsQuery()),
  component: NetworkOverview,
});
