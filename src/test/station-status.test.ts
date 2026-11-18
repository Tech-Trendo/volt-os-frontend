import { describe, it, expect } from "vitest";
import {
  deriveStationStatus,
  pipelineStages,
  stationCounts,
  clusterStatus,
  markerSize,
} from "@/lib/station-status";
import { makeStations } from "@/mock/stations";
describe("Station status rules", () => {
  it("is operational when all chargers work", () =>
    expect(
      deriveStationStatus("Commissioned", [{ status: "Operational" }, { status: "Operational" }]),
    ).toBe("Operational"));
  it("is partially active when only some chargers work", () =>
    expect(
      deriveStationStatus("Commissioned", [{ status: "Operational" }, { status: "Faulted" }]),
    ).toBe("Partially Active"));
  it("is partially active under maintenance with a working charger", () =>
    expect(deriveStationStatus("Under Maintenance", [{ status: "Operational" }])).toBe(
      "Partially Active",
    ));
  it("is inactive under maintenance with no working chargers", () =>
    expect(deriveStationStatus("Under Maintenance", [{ status: "Under Maintenance" }])).toBe(
      "Inactive",
    ));
  it("is inactive when all equipment is faulted or offline", () =>
    expect(
      deriveStationStatus("Commissioned", [{ status: "Faulted" }, { status: "Offline" }]),
    ).toBe("Inactive"));
  it("is inactive with no equipment", () =>
    expect(deriveStationStatus("Commissioned", [])).toBe("Inactive"));
  it("temporary offline overrides stale working telemetry", () =>
    expect(deriveStationStatus("Temporarily Offline", [{ status: "Operational" }])).toBe(
      "Inactive",
    ));
  it("decommissioned overrides stale working telemetry", () =>
    expect(deriveStationStatus("Decommissioned", [{ status: "Operational" }])).toBe("Inactive"));
  it.each(pipelineStages)("%s is pipeline regardless of charger telemetry", (stage) =>
    expect(deriveStationStatus(stage, [{ status: "Operational" }])).toBe("Pipeline"),
  );
  it("sizes markers at the 2/3 and 4/5 charger thresholds", () => {
    expect([1, 2, 3, 4, 5].map(markerSize)).toEqual([16, 16, 22, 22, 28]);
  });
  it("uses the majority status for cluster colour", () =>
    expect(clusterStatus(["Operational", "Operational", "Inactive"])).toBe("Operational"));
  it("uses severity order to break cluster ties", () =>
    expect(clusterStatus(["Operational", "Inactive"])).toBe("Inactive"));
});
describe("Station fixtures", () => {
  it("contains exactly 48 stations", () => expect(makeStations()).toHaveLength(48));
  it("contains 27 operational, 10 partial, 7 inactive and 4 pipeline", () =>
    expect(stationCounts(makeStations())).toMatchObject({
      total: 48,
      operational: 27,
      partial: 10,
      inactive: 7,
      pipeline: 4,
    }));
  it("contains about 130 chargers with 1–4 per station", () => {
    const stations = makeStations();
    expect(stationCounts(stations).chargers).toBe(138);
    expect(stations.every((s) => s.chargers.length >= 1 && s.chargers.length <= 4)).toBe(true);
  });
  it("spans all seven provinces and at least 25 districts", () => {
    expect(new Set(makeStations().map((s) => s.province)).size).toBe(7);
    expect(new Set(makeStations().map((s) => s.district)).size).toBeGreaterThanOrEqual(25);
  });
  it("has no commissioning dates on pipeline stations", () =>
    expect(
      makeStations()
        .filter((s) => s.status === "Pipeline")
        .map((s) => s.commissioningDate),
    ).toEqual([null, null, null, null]));
});
