import { describe, expect, it } from "vitest";
import { makeDefaultProfile } from "@/engine/constants/defaults";
import { runProjection } from "./runProjection";

describe("runProjection career path", () => {
  it("records higher employment gross in later working years", () => {
    const p = makeDefaultProfile();
    p.retirementTargetAge = 70;
    p.grossSalary = 40_000;
    p.salaryGrowth = 0.05;
    const proj = runProjection(p, { asOfDate: "2026-04-01" });
    const y0 = proj.years[0]?.employmentGross ?? 0;
    const y5 = proj.years[5]?.employmentGross ?? 0;
    expect(y5).toBeGreaterThan(y0);
    expect(y0).toBe(40_000);
  });
});
