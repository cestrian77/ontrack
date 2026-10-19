import { describe, expect, it } from "vitest";
import { taxYearPackByLabel } from "@/engine/constants/taxYears";
import { makeDefaultProfile } from "@/engine/constants/defaults";
import { runProjection } from "@/engine/project/runProjection";
import {
  effectiveNmpaForCalendarYear,
  statutoryNmpaForCalendarYear,
} from "./accessAge";

describe("statutory NMPA", () => {
  const pack = taxYearPackByLabel("2027/28");

  it("is 55 before 2028", () => {
    expect(statutoryNmpaForCalendarYear(2027, pack)).toBe(55);
  });

  it("is 57 from 2028", () => {
    expect(statutoryNmpaForCalendarYear(2028, pack)).toBe(57);
  });
});

describe("projection meta NMPA", () => {
  it("uses 57 when a 55 plan cannot access before statutory rise in 2028", () => {
    const p = makeDefaultProfile();
    p.pensionAccessAge = 55;
    p.retirementTargetAge = 54;
    p.dateOfBirth = "1973-01-01";
    const proj = runProjection(p, {
      asOfDate: "2027-05-01",
      taxYearPack: taxYearPackByLabel("2027/28"),
      freezeTaxYearPack: true,
    });
    expect(proj.meta.nmpa).toBe(57);
  });
});

describe("effectiveNmpaForCalendarYear", () => {
  const pack = taxYearPackByLabel("2026/27");
  const profile = makeDefaultProfile();

  it("respects user age when above statutory", () => {
    profile.pensionAccessAge = 57;
    expect(effectiveNmpaForCalendarYear(profile, 2026, pack)).toBe(57);
  });

  it("raises plan below statutory from 2028", () => {
    profile.pensionAccessAge = 55;
    expect(effectiveNmpaForCalendarYear(profile, 2028, pack)).toBe(57);
  });
});
