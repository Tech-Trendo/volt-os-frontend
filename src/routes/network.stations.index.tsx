import { createFileRoute } from "@tanstack/react-router";
import { StationList } from "@/features/network/station-list";
import { stationsQuery } from "@/queries/stations";
import { pageHead } from "@/lib/metadata";
export const Route = createFileRoute("/network/stations/")({
  validateSearch: (search: Record<string, unknown>): { status?: string | undefined } =>
    typeof search["status"] === "string" ? { status: search["status"] } : {},
  head: () =>
    pageHead(
      "Charging Stations",
      "Manage Volt OS charging station records, chargers, maintenance status, and commissioning.",
    ),
  loader: ({ context }) => context.queryClient.ensureQueryData(stationsQuery()),
  component: Stations,
});
function Stations() {
  const { status } = Route.useSearch();
  return <StationList key={status} initialStatus={status} />;
}
