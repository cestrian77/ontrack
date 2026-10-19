import { describe, expect, it } from "vitest";
import { makeDefaultProfile } from "@/engine/constants/defaults";
import type { BTLProperty } from "@/engine/types";
import { runProjection } from "./runProjection";

const sampleBtl: BTLProperty = {
  id: "btl1",
  label: "Test",
  value: 300_000,
  mortgageBalance: 150_000,
  mortgageRate: 0.045,
  mortgageTermYears: 25,
  mortgageType: "interest_only",
  monthlyGrossRent: 1_200,
  voidRate: 0.05,
  annualMaintenance: 2_000,
  lettingAgentFeePct: 0.1,
  annualInsurance: 400,
  appreciationRate: 0.03,
  ownership: "sole",
};

describe("runProjection BTL cashflow", () => {
  it("grows in real terms when nominal rental growth exceeds CPI", () => {
    const p = makeDefaultProfile();
    p.cpi = 0.025;
    p.rentalGrowth = 0.03;
    p.btlProperties = [sampleBtl];
    const proj = runProjection(p);
    const early = proj.years[0]!.btlCashflowNet;
    const late = proj.years[40]!.btlCashflowNet;
    expect(late).toBeGreaterThan(early);
  });

  it("is unchanged year-to-year (IO) when rental growth matches CPI", () => {
    const p = makeDefaultProfile();
    p.salaryGrowth = 0;
    p.cpi = 0.025;
    p.rentalGrowth = 0.025;
    p.btlProperties = [sampleBtl];
    const proj = runProjection(p);
    const a = proj.years[2]!.btlCashflowNet;
    const b = proj.years[12]!.btlCashflowNet;
    expect(b).toBeCloseTo(a, 5);
  });

  it("steps to 2027/28 property tax when calendar year crosses April 2027", () => {
    const p = makeDefaultProfile();
    p.btlProperties = [sampleBtl];
    p.salaryGrowth = 0;
    p.cpi = 0.025;
    p.rentalGrowth = 0.025;
    const proj = runProjection(p, { asOfDate: "2026-05-10" });
    const y2026 = proj.years.find((y) => y.year === 2026);
    const y2027 = proj.years.find((y) => y.year === 2027);
    expect(y2026?.taxYearLabel).toBe("2026/27");
    expect(y2027?.taxYearLabel).toBe("2027/28");
    expect(y2027!.btlCashflowNet).toBeLessThan(y2026!.btlCashflowNet);
  });
});
