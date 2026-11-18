export const provinces = [
  "Koshi",
  "Madhesh",
  "Bagmati",
  "Gandaki",
  "Lumbini",
  "Karnali",
  "Sudurpashchim",
] as const;
export type Province = (typeof provinces)[number];
export type StationStatus = "Operational" | "Partially Active" | "Inactive" | "Pipeline";
export type StationLifecycle =
  | "Planned"
  | "Site Assessment"
  | "Under Installation"
  | "Commissioning"
  | "Commissioned"
  | "Temporarily Offline"
  | "Under Maintenance"
  | "Decommissioned";
export type ChargerStatus = "Operational" | "Faulted" | "Offline" | "Under Maintenance";
export type ConnectorStandard = "Type 2" | "CCS2" | "CHAdeMO" | "GB/T";
export type StationType = "Public" | "Private" | "Fleet" | "Commercial" | "Captive";
export interface Charger {
  id: string;
  stationId: string;
  equipmentId: string;
  serialNumber: string;
  productId: string;
  productModel: string;
  brand: string;
  type: "AC" | "DC";
  ratedPowerKw: number;
  connectorStandard: ConnectorStandard;
  connectorCount: number;
  status: ChargerStatus;
  installationDate: string | null;
  warrantyExpiry: string | null;
}
export interface Station {
  id: string;
  stationCode: string;
  name: string;
  address: string;
  province: Province;
  district: string;
  municipality: string;
  latitude: number;
  longitude: number;
  stationType: StationType;
  customerId: string;
  owner: string;
  operator: string;
  lifecycle: StationLifecycle;
  status: StationStatus;
  installationDate: string | null;
  commissioningDate: string | null;
  warrantyExpiry: string | null;
  lastStatusUpdate: string;
  lastMaintenanceDate: string | null;
  openServiceRequestCount: number;
  chargers: Charger[];
}
export interface StationFilters {
  search?: string;
  province?: string;
  district?: string;
  statuses?: StationStatus[];
  includePipeline?: boolean;
  stationType?: string;
  customerId?: string;
  chargerType?: string;
  connectorStandard?: string;
  page?: number;
  pageSize?: number;
  sortBy?: "name" | "stationCode" | "province" | "status";
  sortDirection?: "asc" | "desc";
}
