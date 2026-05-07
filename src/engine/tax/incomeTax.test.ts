import { describe, expect, it } from "vitest";
import {
  incomeTax,
  marginalIncomeRate,
  personalAllowance,
} from "./incomeTax";
import { currentTaxYearPack } from "@/engine/constants/taxYears";
import type { TaxBand } from "@/engine/constants/taxYears";

describe("personalAllowance taper (PRD §5.3.1)", () => {
  it("full PA below £100k", () => {
    expect(personalAllowance(50_000)).toBe(12_570);
    expect(personalAllowance(100_000)).toBe(12_570);
  });
  it("tapers £1 per £2 above £100k", () => {
    expect(personalAllowance(110_000)).toBe(7_570);
    expect(personalAllowance(120_000)).toBe(2_570);
  });
  it("is zero at £125,140 and above", () => {
    expect(personalAllowance(125_140)).toBe(0);
    expect(personalAllowance(200_000)).toBe(0);
  });
});

describe("England & Wales income tax", () => {
  it("zero on income within PA", () => {
    expect(incomeTax(12_570, "england_wales")).toBe(0);
  });
  it("basic rate applied above PA", () => {
    // £30,000 income → tax on (30,000 - 12,570) = 17,430 @ 20% = 3,486
    expect(incomeTax(30_000, "england_wales")).toBeCloseTo(3_486, 2);
  });
  it("higher rate applied above £50,270", () => {
    // basic band: 50,270 - 12,570 = 37,700 @ 20% = 7,540
    // higher band: 60,000 - 50,270 = 9,730 @ 40% = 3,892
    // total: 11,432
    expect(incomeTax(60_000, "england_wales")).toBeCloseTo(11_432, 2);
  });
  it("PA taper between £100k and £125,140", () => {
    // £110,000: PA = 7,570
    // basic: (50,270 - 7,570) = 42,700 @ 20% = 8,540
    // higher: (110,000 - 50,270) = 59,730 @ 40% = 23,892
    // total: 32,432
    expect(incomeTax(110_000, "england_wales")).toBeCloseTo(32_432, 2);
  });
  it("additional rate at £150k", () => {
    // PA = 0
    // basic: 50,270 @ 20% = 10,054
    // higher: 125,140 - 50,270 = 74,870 @ 40% = 29,948
    // additional: 150,000 - 125,140 = 24,860 @ 45% = 11,187
    // total: 51,189
    expect(incomeTax(150_000, "england_wales")).toBeCloseTo(51_189, 2);
  });
});

describe("Scottish income tax (active tax year)", () => {
  // Scottish bands change yearly; re-derive expected from the active pack so
  // this test remains accurate when a new pack is added.
  it("£30k Scottish matches active pack bands", () => {
    const pack = currentTaxYearPack();
    const expected = applyBandsLocal(30_000, pack.scotlandIncomeBands);
    expect(incomeTax(30_000, "scotland")).toBeCloseTo(expected, 1);
  });
});

describe("marginalIncomeRate", () => {
  it("returns 40% in higher rate band", () => {
    expect(marginalIncomeRate(80_000, "england_wales")).toBe(0.4);
  });
  it("returns 0% within PA", () => {
    expect(marginalIncomeRate(10_000, "england_wales")).toBe(0);
  });
});

function applyBandsLocal(income: number, bands: TaxBand[]): number {
  let prev = 0;
  let tax = 0;
  for (const band of bands) {
    if (income <= prev) break;
    const slice = Math.min(income, band.upperBound) - prev;
    if (slice > 0) tax += slice * band.rate;
    prev = band.upperBound;
  }
  return tax;
}
