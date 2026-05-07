import { describe, expect, it } from "vitest";
import {
  annualAllowance,
  pensionNetCost,
  sippGrossAnnual,
  workplaceContribAnnual,
} from "./contributions";

describe("sippGrossAnnual", () => {
  it("£100 net → £125 gross", () => {
    expect(sippGrossAnnual(100)).toBeCloseTo(1500, 2); // £100/mo × 12 / 0.8
  });
});

describe("workplaceContribAnnual", () => {
  it("computes employee/employer/total", () => {
    const r = workplaceContribAnnual(60_000, 0.05, 0.05);
    expect(r).toEqual({ employee: 3000, employer: 3000, total: 6000 });
  });
});

describe("annualAllowance taper (PRD §5.4.2)", () => {
  it("standard £60k below threshold", () => {
    expect(annualAllowance(200_000)).toBe(60_000);
  });
  it("tapers above £260k", () => {
    expect(annualAllowance(280_000)).toBe(50_000); // (280-260)/2 = 10k reduction
  });
  it("floors at £10k", () => {
    expect(annualAllowance(500_000)).toBe(10_000);
  });
  it("MPAA triggered drops to £10k", () => {
    expect(annualAllowance(50_000, true)).toBe(10_000);
  });
});

describe("pensionNetCost (PRD §5.4.1 worked examples)", () => {
  it("sacrifice cheaper than SIPP for higher-rate earner", () => {
    const r = pensionNetCost(1000, 80_000, "england_wales");
    expect(r.marginalRate).toBe(0.4);
    // Sacrifice gives 40% income tax + 2% NI saving = ~£420 saved
    // SIPP net cost: 800 - 200 (HR top-up) = £600
    expect(r.sacrifice).toBeLessThan(r.sippNet);
  });
});
