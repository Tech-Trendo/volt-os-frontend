import { makeRecords } from "./store";
export const getServiceFixtures = (module: string) => makeRecords("service/" + module);
