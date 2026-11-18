import type { BusinessRecord } from "./common";
export interface LineItem {
  productId: string;
  description: string;
  quantity: number;
  unitPriceNpr: number;
}
export interface Customer extends BusinessRecord {
  email: string;
  phone: string;
  location: string;
}
export interface Lead extends BusinessRecord {
  source: string;
  expectedValueNpr: number;
  nextFollowUp: string;
}
export interface Enquiry extends BusinessRecord {
  customerId: string;
  lineItems: LineItem[];
}
export interface Quotation extends Enquiry {
  revisionNumber: number;
  validityDate: string;
  subtotalNpr: number;
  vatNpr: number;
  totalNpr: number;
}
export interface SalesOrder extends BusinessRecord {
  customerId: string;
  lineItems: LineItem[];
  deliveryDate: string;
}
