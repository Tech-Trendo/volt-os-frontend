import { listRecords, getRecord, saveRecord, deleteRecord } from "./records";
export const projectsService = {
  list: listRecords,
  detail: getRecord,
  save: saveRecord,
  delete: deleteRecord,
};
