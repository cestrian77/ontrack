import { describe, expect, it } from "vitest";
import {
  makeDefaultProfile,
  makePartnerProfileDefaults,
} from "@/engine/constants/defaults";
import { runProjection } from "@/engine/project/runProjection";
import { currentTaxYearPack } from "@/engine/constants/taxYears";
import { combineProjections } from "./combineProjections";

describe("combineProjections", () => {
  it("sums investable rows and counts primary home once when excluding partner primary", () => {
    const primary = makeDefaultProfile();
    const partner = makePartnerProfileDefaults();
    const pack = currentTaxYearPack();
    const a = runProjection(primary, { taxYearPack: pack });
    const b = runProjection(partner, { taxYearPack: pack });
    const merged = combineProjections(a, b, { primary, partner });
    expect(merged.meta.isHousehold).toBe(true);
    const y0 = merged.years[0];
    expect(y0.pensionValue).toBeCloseTo(
      a.years[0].pensionValue + b.years[0].pensionValue,
      4,
    );
    expect(y0.primaryEquity).toBeCloseTo(a.years[0].primaryEquity, 4);
    expect(y0.primaryValue).toBeCloseTo(a.years[0].primaryValue, 4);
  });

  it("uses min horizon length", () => {
    const primary = makeDefaultProfile();
    primary.dateOfBirth = "1950-01-01";
    const partner = makePartnerProfileDefaults();
    partner.dateOfBirth = "1990-01-01";
    const pack = currentTaxYearPack();
    const a = runProjection(primary, { taxYearPack: pack });
    const b = runProjection(partner, { taxYearPack: pack });
    const merged = combineProjections(a, b, { primary, partner });
    expect(merged.years.length).toBe(Math.min(a.years.length, b.years.length));
  });
});
