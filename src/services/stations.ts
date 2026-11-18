import { getStore } from "@/mock/store";
import { deriveStationStatus } from "@/lib/station-status";
import type { Station, StationFilters } from "@/models/stations";
import type { PageResult } from "@/models/common";
import { delay, rest, useMock } from "./config";
export function filterStations(stations: Station[], filters: StationFilters = {}) {
  return stations.filter(
    (s) =>
      (!filters.search ||
        `${s.name ?? ""} ${s.stationCode ?? ""}`
          .toLowerCase()
          .includes(filters.search.toLowerCase())) &&
      (!filters.province || s.province === filters.province) &&
      (!filters.district || s.district === filters.district) &&
      (!filters.statuses || filters.statuses.includes(s.status)) &&
      (filters.includePipeline !== false || s.status !== "Pipeline") &&
      (!filters.stationType || s.stationType === filters.stationType) &&
      (!filters.customerId || s.customerId === filters.customerId) &&
      (!filters.chargerType || (s.chargers ?? []).some((c) => c.type === filters.chargerType)) &&
      (!filters.connectorStandard ||
        (s.chargers ?? []).some((c) => c.connectorStandard === filters.connectorStandard)),
  );
}
export async function getStations(filters: StationFilters = {}): Promise<PageResult<Station>> {
  if (!useMock)
    return rest(`/stations?${new URLSearchParams({ filters: JSON.stringify(filters) })}`);
  await delay();
  let items = filterStations(getStore().stations, filters);
  if (filters.sortBy) {
    const key = filters.sortBy;
    items = [...items].sort(
      (a, b) => a[key].localeCompare(b[key]) * (filters.sortDirection === "desc" ? -1 : 1),
    );
  }
  const page = filters.page ?? 1,
    pageSize = filters.pageSize ?? 100;
  return {
    items: items.slice((page - 1) * pageSize, page * pageSize),
    total: items.length,
    page,
    pageSize,
  };
}
export async function getStationById(id: string): Promise<Station> {
  if (!useMock) return rest(`/stations/${id}`);
  await delay();
  const station = getStore().stations.find((s) => s.id === id);
  if (!station) throw new Error("Station not found.");
  return station;
}
export async function saveStation(input: Station): Promise<Station> {
  const station = {
    ...input,
    status: deriveStationStatus(input.lifecycle, input.chargers ?? []),
    lastStatusUpdate: new Date().toISOString(),
  };
  if (!useMock)
    return rest(`/stations/${station.id}`, { method: "PUT", body: JSON.stringify(station) });
  await delay();
  const store = getStore();
  const index = store.stations.findIndex((s) => s.id === input.id);
  if (index < 0) store.stations.push(station);
  else store.stations[index] = station;
  return station;
}
export async function deleteStation(id: string) {
  if (!useMock) return rest<void>(`/stations/${id}`, { method: "DELETE" });
  await delay();
  const store = getStore();
  store.stations = store.stations.filter((s) => s.id !== id);
}
