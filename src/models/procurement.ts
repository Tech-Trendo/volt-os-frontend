import type { BusinessRecord } from "./common";
import type { LineItem } from "./sales";
export interface Supplier extends BusinessRecord {
  country: string;
  currency: string;
}
export interface PurchaseOrder extends BusinessRecord {
  supplierId: string;
  currency: string;
  exchangeRate: number;
  lineItems: LineItem[];
}
export interface ImportShipment extends BusinessRecord {
  purchaseOrderId: string;
  carrier: string;
  originPort: string;
  destinationPort: string;
  etd: string;
  eta: string;
}
export interface GoodsReceipt extends BusinessRecord {
  shipmentId: string;
  purchaseOrderId: string;
  warehouseId: string;
  receivedQuantity: number;
  shortQuantity: number;
  damagedQuantity: number;
}
