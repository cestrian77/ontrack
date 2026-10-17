import { describe, expect, it } from "vitest";
import { makeDefaultProfile } from "@/engine/constants/defaults";
import {
  careerBonusAtYearIndex,
  careerGrossSalaryAtYearIndex,
  careerTaxableEmploymentIncome,
} from "./careerPath";

describe("careerPath", () => {
  it("grows salary by salaryGrowth each year", () => {
    const p = makeDefaultProfile();
    p.grossSalary = 50_000;
    p.salaryGrowth = 0.03;
    expect(careerGrossSalaryAtYearIndex(p, 0)).toBe(50_000);
    expect(careerGrossSalaryAtYearIndex(p, 2)).toBeCloseTo(50_000 * 1.03 ** 2);
  });

  it("includes bonus on the career path", () => {
    const p = makeDefaultProfile();
    p.bonus = 5_000;
    p.salaryGrowth = 0.02;
    expect(careerBonusAtYearIndex(p, 1)).toBeCloseTo(5_000 * 1.02);
    expect(careerTaxableEmploymentIncome(p, 1)).toBeCloseTo(
      careerGrossSalaryAtYearIndex(p, 1) + careerBonusAtYearIndex(p, 1),
    );
  });
});
