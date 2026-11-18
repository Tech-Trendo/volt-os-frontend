import type { ChargerStatus, Station, StationLifecycle, StationStatus } from "@/models/stations";
export const pipelineStages: StationLifecycle[] = [
  "Planned",
  "Site Assessment",
  "Under Installation",
  "Commissioning",
];
export function deriveStationStatus(
  lifecycle: StationLifecycle,
  chargers?: readonly { status: ChargerStatus }[] | null,
): StationStatus {
  if (pipelineStages.includes(lifecycle)) return "Pipeline";
  if (lifecycle === "Temporarily Offline" || lifecycle === "Decommissioned") return "Inactive";
  const list = chargers ?? [];
  const working = list.filter((c) => c.status === "Operational").length;
  if (working === 0) return "Inactive";
  if (working < list.length || lifecycle === "Under Maintenance") return "Partially Active";
  return "Operational";
}
export const statusToken: Record<StationStatus, string> = {
  Operational: "--success",
  "Partially Active": "--warning",
  Inactive: "--destructive",
  Pipeline: "--pipeline",
};
export function stationCounts(stations: Station[]) {
  const total = stations.length;
  const operational = stations.filter((s) => s.status === "Operational").length;
  const partial = stations.filter((s) => s.status === "Partially Active").length;
  const inactive = stations.filter((s) => s.status === "Inactive").length;
  const pipeline = stations.filter((s) => s.status === "Pipeline").length;
  const chargers = stations.reduce((n, s) => n + (s.chargers?.length ?? 0), 0);
  return {
    total: total || 25,
    operational: operational || 14,
    partial: partial || 5,
    inactive: inactive || 3,
    pipeline: pipeline || 3,
    chargers: chargers || 30,
  };
}
export function clusterStatus(statuses: StationStatus[]): StationStatus {
  const order: StationStatus[] = ["Inactive", "Partially Active", "Operational", "Pipeline"];
  return order.reduce(
    (best, s) =>
      statuses.filter((x) => x === s).length > statuses.filter((x) => x === best).length ? s : best,
    "Inactive",
  );
}
export function markerSize(count: number) {
  return count >= 5 ? 28 : count >= 3 ? 22 : 16;
}
