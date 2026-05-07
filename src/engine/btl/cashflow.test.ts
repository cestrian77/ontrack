import { describe, expect, it } from "vitest";
import type { BTLProperty } from "@/engine/types";
import { btlAnnualCashflow } from "./cashflow";

const baseBTL: BTLProperty = {
  id: "p1",
  value: 250_000,
  mortgageBalance: 150_000,
  mortgageRate: 0.04,
  mortgageTermYears: 25,
  mortgageType: "interest_only",
  monthlyGrossRent: 1_250,
  voidRate: 0,
  annualMaintenance: 5_000,
  lettingAgentFeePct: 0,
  annualInsurance: 0,
  appreciationRate: 0.03,
  ownership: "sole",
};

describe("Section 24 worked example (PRD §8.2)", () => {
  it("£15k rent / £5k op / £6k interest @ 40% → ~£1,200 net cashflow (sole owner, IO)", () => {
    // Need rent to be exactly £15k, ops £5k, interest £6k.
    const p: BTLProperty = {
      ...baseBTL,
      monthlyGrossRent: 1_250, // £15,000/yr
      voidRate: 0,
      annualMaintenance: 5_000,
      lettingAgentFeePct: 0,
      annualInsurance: 0,
      mortgageBalance: 150_000,
      mortgageRate: 0.04, // £6,000 interest on IO
      mortgageType: "interest_only",
    };
    const r = btlAnnualCashflow(p, 60_000, "england_wales"); // higher-rate
    expect(r.grossRent).toBe(15_000);
    expect(r.operatingExpenses).toBe(5_000);
    expect(r.mortgageInterest).toBe(6_000);
    // taxable = 15,000 − 5,000 = 10,000; tax @ 40% = 4,000; credit = 6,000 × 20% = 1,200; net tax = 2,800
    expect(r.taxOnRental).toBeCloseTo(2_800, 1);
    // net cashflow = 15,000 − 5,000 − 6,000 − 2,800 = 1,200
    expect(r.netCashflow).toBeCloseTo(1_200, 1);
  });
});

describe("Joint ownership halves figures", () => {
  it("splits 50/50", () => {
    const sole = btlAnnualCashflow(baseBTL, 60_000, "england_wales");
    const joint = btlAnnualCashflow(
      { ...baseBTL, ownership: "joint" },
      60_000,
      "england_wales",
    );
    expect(joint.grossRent).toBeCloseTo(sole.grossRent / 2, 1);
  });
});
