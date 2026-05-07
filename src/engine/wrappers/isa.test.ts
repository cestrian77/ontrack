import { describe, expect, it } from "vitest";
import { capIsaMonthly, compoundMonthly, lisaAnnualGrowth } from "./isa";

describe("compoundMonthly", () => {
  it("zero rate is simple addition", () => {
    expect(compoundMonthly(1000, 0, 100, 12)).toBeCloseTo(2200, 2);
  });
  it("£0 PV, £100/mo @ 5% nominal for 12 months", () => {
    // FV ≈ 100 × ((1.0041667^12 − 1)/0.0041667) = ~£1,227.89
    expect(compoundMonthly(0, 0.05, 100, 12)).toBeCloseTo(1227.89, 1);
  });
});

describe("capIsaMonthly", () => {
  it("does not cap when within allowance", () => {
    const r = capIsaMonthly(500, 200, 200); // £8.4k S&S + £2.4k cash + £2.4k LISA = £13.2k
    expect(r.warning).toBeUndefined();
    expect(r.ss).toBe(500);
    expect(r.cash).toBe(200);
  });
  it("scales S&S+cash proportionally when over allowance", () => {
    const r = capIsaMonthly(2000, 1000, 333); // ~£40k requested
    expect(r.warning).toBeDefined();
    expect((r.ss + r.cash + r.lisa) * 12).toBeLessThanOrEqual(20_000 + 0.5);
  });
});

describe("lisaAnnualGrowth", () => {
  it("applies 25% bonus on £4k max", () => {
    // PV £0, contribute £333/mo (£3,996/yr), 5% growth, age 35
    // bonus = ~£999 → end balance ≈ 0×1.05 + 3996 + 999 = £4,995
    const r = lisaAnnualGrowth(0, 333, 0.05, 35);
    expect(r).toBeCloseTo(4_995, 0);
  });
  it("no contribution past age 50", () => {
    const r = lisaAnnualGrowth(10_000, 333, 0.05, 51);
    expect(r).toBeCloseTo(10_500, 0);
  });
});
