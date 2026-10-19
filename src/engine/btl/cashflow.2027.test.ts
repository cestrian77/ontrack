import { describe, expect, it } from "vitest";
import type { BTLProperty } from "@/engine/types";
import { taxYearPackByLabel } from "@/engine/constants/taxYears";
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

describe("2027/28 property income rates", () => {
  it("charges higher tax and S24 credit than 2026/27 at same rents", () => {
    const pack2627 = taxYearPackByLabel("2026/27");
    const pack2728 = taxYearPackByLabel("2027/28");
    const before = btlAnnualCashflow(baseBTL, 60_000, "england_wales", {
      taxYearPack: pack2627,
    });
    const after = btlAnnualCashflow(baseBTL, 60_000, "england_wales", {
      taxYearPack: pack2728,
    });
    expect(after.taxOnRental).toBeGreaterThan(before.taxOnRental);
    expect(after.s24Credit).toBeCloseTo(before.s24Credit * 1.1, 0);
    expect(after.netCashflow).toBeLessThan(before.netCashflow);
  });
});
