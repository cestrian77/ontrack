import { describe, expect, it } from "vitest";
import { nationalInsurance } from "./ni";

describe("nationalInsurance (PRD §5.3.3)", () => {
  it("zero below LEL", () => {
    expect(nationalInsurance(12_570)).toBe(0);
  });
  it("8% main rate band", () => {
    // £30,000 → (30,000 − 12,570) × 8% = 1,394.40
    expect(nationalInsurance(30_000)).toBeCloseTo(1_394.4, 2);
  });
  it("2% above UEL", () => {
    // £80,000 → (50,270 − 12,570) × 8% + (80,000 − 50,270) × 2% = 3,016 + 594.6 = 3,610.6
    expect(nationalInsurance(80_000)).toBeCloseTo(3_610.6, 2);
  });
});
