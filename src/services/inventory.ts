import { listRecords, getRecord, saveRecord, deleteRecord } from "./records";
export const inventoryService = {
  list: listRecords,
  detail: getRecord,
  save: saveRecord,
  delete: deleteRecord,
};
