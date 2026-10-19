import { describe, expect, it } from "vitest";
import { annualFromPeriod, periodFromAnnual } from "./moneyPeriod";

describe("moneyPeriod", () => {
  it("round-trips annual via month", () => {
    const annual = 60_000;
    const monthly = periodFromAnnual(annual, "month");
    expect(annualFromPeriod(monthly, "month")).toBe(annual);
  });

  it("converts week to annual", () => {
    expect(annualFromPeriod(1_000, "week")).toBe(52_000);
  });
});
