import { makeRecords } from "./store";
export const getInventoryFixtures = (module: string) => makeRecords("inventory/" + module);
