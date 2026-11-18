import { makeRecords } from "./store";
export const getAdministrationFixtures = (module: string) =>
  makeRecords("administration/" + module);
