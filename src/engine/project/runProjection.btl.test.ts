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
    p.cpi = 0.025;
    p.rentalGrowth = 0.025;
    p.btlProperties = [sampleBtl];
    const proj = runProjection(p);
    const a = proj.years[0]!.btlCashflowNet;
    const b = proj.years[25]!.btlCashflowNet;
    expect(b).toBeCloseTo(a, 5);
  });
});
