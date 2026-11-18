import type { BusinessRecord } from "./common";
export interface User extends BusinessRecord {
  email: string;
  role: string;
  department: string;
}
export interface AuditEntry extends BusinessRecord {
  action: string;
  entityType: string;
  entityId: string;
  timestamp: string;
}
