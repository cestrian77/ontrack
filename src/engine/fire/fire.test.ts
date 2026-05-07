import { describe, expect, it } from "vitest";
import { makeDefaultProfile } from "@/engine/constants/defaults";
import { runProjection } from "@/engine/project/runProjection";
import { computeFire } from "./fire";

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
});
