import type { BusinessRecord } from "./common";
export interface Project extends BusinessRecord {
  customerId: string;
  stationId: string;
  startDate: string;
  deadline: string;
  budgetNpr: number;
  actualCostNpr: number;
  progress: number;
  technicianId: string;
}
