import { listRecords, getRecord, saveRecord, deleteRecord } from "./records";
export const administrationService = {
  list: listRecords,
  detail: getRecord,
  save: saveRecord,
  delete: deleteRecord,
};
