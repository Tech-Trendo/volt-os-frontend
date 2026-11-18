import { queryOptions } from "@tanstack/react-query";
import { getStations, getStationById } from "@/services/stations";
import type { StationFilters } from "@/models/stations";
export const stationsQuery = (filters: StationFilters = {}) =>
  queryOptions({ queryKey: ["stations", filters], queryFn: () => getStations(filters) });
export const stationQuery = (id: string) =>
  queryOptions({ queryKey: ["station", id], queryFn: () => getStationById(id) });
