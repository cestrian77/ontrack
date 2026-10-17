import { describe, expect, it } from "vitest";
import { DEFAULT_ESTATE_PLANNING, estimateUkIht } from "./iht";

describe("estimateUkIht", () => {
  it("applies nil-rate and residence bands", () => {
    const est = estimateUkIht(
      { netEstate: 1_000_000, primaryResidenceValue: 400_000 },
      DEFAULT_ESTATE_PLANNING,
    );
    expect(est.nilRateBandUsed).toBe(325_000);
    expect(est.residenceNilRateBandUsed).toBe(175_000);
    expect(est.taxableEstate).toBe(500_000);
    expect(est.ihtDue).toBe(200_000);
  });

  it("doubles bands when spouse allowance transferred", () => {
    const est = estimateUkIht(
      { netEstate: 1_200_000, primaryResidenceValue: 500_000 },
      { ...DEFAULT_ESTATE_PLANNING, transferredNilRateToSpouse: true },
    );
    expect(est.nilRateBandUsed).toBe(650_000);
    expect(est.residenceNilRateBandUsed).toBe(350_000);
  });
});
