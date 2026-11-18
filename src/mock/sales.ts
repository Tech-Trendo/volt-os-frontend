import { makeRecords } from "./store";
export const getSalesFixtures = (module: string) => makeRecords("sales/" + module);
