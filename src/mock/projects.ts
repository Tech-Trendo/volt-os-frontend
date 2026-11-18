import { makeRecords } from "./store";
export const getProjectsFixtures = (module: string) => makeRecords("projects/" + module);
