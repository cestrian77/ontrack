import { describe, expect, it } from "vitest";
import { makeDefaultProfile } from "@/engine/constants/defaults";
import { runProjection } from "@/engine/project/runProjection";
import { economicScenarioFromProfile } from "./fromProfile";
import { TAX_YEAR_2025_26 } from "@/engine/constants/taxYears/2025-26";

describe("economicScenarioFromProfile", () => {
  it("matches legacy runProjection outputs", () => {
    const profile = makeDefaultProfile();
    const pack = TAX_YEAR_2025_26;
    const asOf = "2026-04-06";
    const legacy = runProjection(profile, {
      taxYearPack: pack,
      asOfDate: asOf,
      freezeTaxYearPack: true,
    });
    const startYear = 2026;
    const scenario = economicScenarioFromProfile(profile, startYear, legacy.years.length);
    const withEcon = runProjection(profile, {
      taxYearPack: pack,
      asOfDate: asOf,
      economicScenario: scenario,
    });

    for (let i = 0; i < legacy.years.length; i++) {
      const a = legacy.years[i];
      const b = withEcon.years[i];
      expect(b.totalNetWorth).toBeCloseTo(a.totalNetWorth, 6);
      expect(b.drawdownIncome).toBeCloseTo(a.drawdownIncome, 6);
      expect(b.investableNetWorth).toBeCloseTo(a.investableNetWorth, 6);
    }
  });
});
