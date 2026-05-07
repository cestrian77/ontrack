import { describe, expect, it } from "vitest";
import {
  amortise,
  balanceAfterMonths,
  monthlyPayment,
  overpaymentSummary,
} from "./mortgage";

describe("monthlyPayment", () => {
  it("£200,000 @ 5% over 25y ≈ £1,169.18", () => {
    expect(monthlyPayment(200_000, 0.05, 25)).toBeCloseTo(1_169.18, 1);
  });
  it("zero rate is even split", () => {
    expect(monthlyPayment(120_000, 0, 10)).toBeCloseTo(1_000, 2);
  });
});

describe("balanceAfterMonths", () => {
  it("starts at principal", () => {
    expect(balanceAfterMonths(200_000, 0.05, 25, 0)).toBeCloseTo(200_000, 0);
  });
  it("ends at zero after full term", () => {
    expect(balanceAfterMonths(200_000, 0.05, 25, 25 * 12)).toBeLessThan(1);
  });
});

describe("overpaymentSummary", () => {
  it("£300/mo overpay on £200k @ 5% / 25y reduces term substantially", () => {
    const r = overpaymentSummary(
      {
        principal: 200_000,
        annualRate: 0.05,
        termYears: 25,
        type: "repayment",
      },
      300,
    );
    expect(r.monthsSaved).toBeGreaterThan(60); // > 5 years saved
    expect(r.interestSaved).toBeGreaterThan(20_000);
  });
});

describe("amortise interest-only", () => {
  it("balance unchanged without overpayment", () => {
    const r = amortise({
      principal: 100_000,
      annualRate: 0.05,
      termYears: 10,
      type: "interest_only",
    });
    expect(r[r.length - 1].balance).toBeCloseTo(100_000, 0);
  });
  it("balance reduces with overpayment", () => {
    const r = amortise({
      principal: 100_000,
      annualRate: 0.05,
      termYears: 10,
      type: "interest_only",
      monthlyOverpayment: 200,
    });
    expect(r[r.length - 1].balance).toBeLessThan(100_000);
  });
});
