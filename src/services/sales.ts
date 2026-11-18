import { listRecords, getRecord, saveRecord, deleteRecord } from "./records";
export const salesService = {
  list: listRecords,
  detail: getRecord,
  save: saveRecord,
  delete: deleteRecord,
};
