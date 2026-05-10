import { describe, expect, it } from "vitest";
import { makeDefaultProfile } from "@/engine/constants/defaults";
import { runProjection } from "@/engine/project/runProjection";
import {
  isNonDefaultFireCalculationPrefs,
  mergeFireCalculationPrefs,
} from "./firePrefs";
import { computeFire } from "./fire";

describe("firePrefs", () => {
  it("detects non-default FIRE calculation prefs", () => {
    expect(isNonDefaultFireCalculationPrefs({})).toBe(false);
    expect(isNonDefaultFireCalculationPrefs({ offsetStatePension: true })).toBe(
      true,
    );
    expect(
      isNonDefaultFireCalculationPrefs({ referenceAgeMode: "steady_state_after_spa" }),
    ).toBe(true);
  });
});

describe("computeFire (PRD §6.1.1 worked example)", () => {
  it("£40k target ÷ 3.5% SWR = £1,142,857 FIRE number", () => {
    const p = makeDefaultProfile();
    p.targetRetirementIncome = 40_000;
    p.safeWithdrawalRate = 0.035;
    const proj = runProjection(p);
    const fire = computeFire(p, proj);
    expect(fire.fireNumber).toBeCloseTo(1_142_857.14, 0);
  });

  it("Lean FIRE = 70% of target / SWR", () => {
    const p = makeDefaultProfile();
    p.targetRetirementIncome = 40_000;
    p.leanFirePct = 0.7;
    p.safeWithdrawalRate = 0.035;
    const proj = runProjection(p);
    const fire = computeFire(p, proj);
    expect(fire.leanFireNumber).toBeCloseTo((40_000 * 0.7) / 0.035, 0);
  });

  it("Coast FIRE = FIRE / (1+r)^n decreases with longer horizon", () => {
    const p = makeDefaultProfile();
    p.targetRetirementIncome = 40_000;
    const proj = runProjection(p);
    const fire = computeFire(p, proj);
    expect(fire.coastFireNumber).toBeLessThan(fire.fireNumber);
    expect(fire.coastFireNumber).toBeGreaterThan(0);
  });

  it("effective FIRE number drops when state pension offsets projection row", () => {
    const p = makeDefaultProfile();
    p.dateOfBirth = "1990-05-10";
    p.retirementTargetAge = 67;
    p.statePensionClaimAge = 67;
    p.targetRetirementIncome = 40_000;
    p.safeWithdrawalRate = 0.035;
    p.fireCalculationPrefs = mergeFireCalculationPrefs({
      ...p.fireCalculationPrefs,
      offsetStatePension: true,
    });
    const proj = runProjection(p, { asOfDate: "2026-05-10" });
    const fire = computeFire(p, proj);
    const ref = proj.years.find((y) => y.age >= 67);
    expect(ref?.statePensionIncome).toBeGreaterThan(0);
    expect(fire.passiveIncomeAtReference).toBeCloseTo(ref!.statePensionIncome, 0);
    expect(fire.effectiveFireNumber).toBeLessThan(fire.fireNumber);
    expect(fire.fireNumber).toBeCloseTo(1_142_857.14, 0);
  });

  it("excluding pension from FIRE pot lowers firePotNow and can delay FIRE age", () => {
    const p = makeDefaultProfile();
    p.dateOfBirth = "1990-05-10";
    const proj = runProjection(p, { asOfDate: "2026-05-10" });
    const base = computeFire(p, proj);
    p.fireCalculationPrefs = mergeFireCalculationPrefs({
      ...p.fireCalculationPrefs,
      includePensionInPot: false,
    });
    const filtered = computeFire(p, proj);
    expect(filtered.firePotNow).toBeLessThan(base.firePotNow);
    expect(filtered.coastFireApplicable).toBe(false);
    expect(filtered.coastReached).toBe(false);
  });
});
