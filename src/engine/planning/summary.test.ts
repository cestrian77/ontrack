import { describe, expect, it } from "vitest";
import { makeDefaultProfile } from "@/engine/constants/defaults";
import { runProjection } from "@/engine/project/runProjection";
import { summarizePlanning } from "./summary";

describe("summarizePlanning", () => {
  it("sums care and finds IHT per person", () => {
    const primary = makeDefaultProfile();
    primary.longTermCare = {
      enabled: true,
      fromAge: 85,
      annualCostReal: 40_000,
      years: 3,
    };
    primary.estatePlanning = {
      enabled: true,
      modelAtAge: 90,
      nilRateBand: 325_000,
      residenceNilRateBand: 175_000,
      primaryHomeToDirectDescendants: true,
      transferredNilRateToSpouse: false,
      charitableLegacyPct: 0,
    };
    const proj = runProjection(primary, { asOfDate: "2026-04-01" });
    const summary = summarizePlanning(proj, { primary });
    expect(summary.hasCare).toBe(true);
    expect(summary.peakAnnualCare).toBe(40_000);
    expect(summary.estateByPerson.length).toBe(1);
    expect(summary.householdEstateIht).toBeGreaterThan(0);
  });
});
