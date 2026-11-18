import type { BusinessRecord } from "./common";
export interface ServiceRequest extends BusinessRecord {
  stationId: string;
  priority: string;
  technicianId: string;
  dueDate: string;
}
export interface WorkOrder extends ServiceRequest {
  serviceRequestId: string;
  scheduledDate: string;
}
