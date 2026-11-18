import { listRecords, getRecord, saveRecord, deleteRecord } from "./records";
export const procurementService = {
  list: listRecords,
  detail: getRecord,
  save: saveRecord,
  delete: deleteRecord,
};
