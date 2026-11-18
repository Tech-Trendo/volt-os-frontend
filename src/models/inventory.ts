import type { BusinessRecord } from "./common";
export interface Product extends BusinessRecord {
  sku: string;
  brand: string;
  productModel: string;
  unit: string;
  quantity: number;
  reserved: number;
  reorderLevel: number;
  salePriceNpr: number;
}
export interface Warehouse extends BusinessRecord {
  location: string;
  managerId: string;
}
export interface StockBalance {
  productId: string;
  warehouseId: string;
  onHand: number;
  reserved: number;
  available: number;
}
export interface SerialRecord extends BusinessRecord {
  serialNumber: string;
  productId: string;
  warehouseId: string;
}
