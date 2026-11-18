import { makeRecords } from "./store";
export const getProcurementFixtures = (module: string) => makeRecords("procurement/" + module);
