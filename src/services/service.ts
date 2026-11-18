import { listRecords, getRecord, saveRecord, deleteRecord } from "./records";
export const serviceService = {
  list: listRecords,
  detail: getRecord,
  save: saveRecord,
  delete: deleteRecord,
};
