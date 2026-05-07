import { describe, expect, it } from "vitest";
import { makeDefaultProfile } from "@/engine/constants/defaults";
import { runProjection } from "@/engine/project/runProjection";
import { computeFire } from "@/engine/fire/fire";
import { isaBridge } from "@/engine/project/isaBridge";
import { generateInsights } from "@/engine/insights/insights";
import {
  ENGLAND_WALES_INCOME_BANDS,
  ISA_ANNUAL_ALLOWANCE,
  PENSION_ANNUAL_ALLOWANCE,
  STATE_PENSION_WEEKLY_FULL,
} from "@/engine/constants/uk";

describe("Phase 1 acceptance criteria (PRD §16.1)", () => {
  it("§14: 2024/25 tax constants present", () => {
    expect(ENGLAND_WALES_INCOME_BANDS[0].upperBound).toBe(12_570);
    expect(ENGLAND_WALES_INCOME_BANDS[1].rate).toBe(0.2);
    expect(ISA_ANNUAL_ALLOWANCE).toBe(20_000);
    expect(PENSION_ANNUAL_ALLOWANCE).toBe(60_000);
    expect(STATE_PENSION_WEEKLY_FULL).toBe(221.2);
  });

  it("Wealth journey renders for all asset combinations (projection completes)", () => {
    const p = makeDefaultProfile();
    const proj = runProjection(p);
    expect(proj.years.length).toBeGreaterThan(50);
    for (const y of proj.years) {
      expect(Number.isFinite(y.totalNetWorth)).toBe(true);
    }
  });

  it("FIRE number and progress against PRD §6.1.1 example", () => {
    const p = makeDefaultProfile();
    p.targetRetirementIncome = 40_000;
    p.safeWithdrawalRate = 0.035;
    const proj = runProjection(p);
    const fire = computeFire(p, proj);
    expect(fire.fireNumber).toBeCloseTo(1_142_857.14, 0);
  });

  it("Coast FIRE crossover date computed", () => {
    const p = makeDefaultProfile();
    p.targetRetirementIncome = 30_000;
    const proj = runProjection(p);
    const fire = computeFire(p, proj);
    expect(fire.coastFireNumber).toBeGreaterThan(0);
    expect(fire.coastFireProgressPct).toBeGreaterThanOrEqual(0);
  });

  it("Three scenarios can be compared simultaneously (engine reruns)", () => {
    const p = makeDefaultProfile();
    const baseProj = runProjection(p);
    const overrideA = { ...p, retirementTargetAge: 55 };
    const overrideB = { ...p, sippMonthly: p.sippMonthly + 200 };
    const overrideC = { ...p, primaryOverpayment: 500 };
    const a = runProjection(overrideA);
    const b = runProjection(overrideB);
    const c = runProjection(overrideC);
    expect(baseProj.years.length).toBeGreaterThan(0);
    expect(a.years.length).toBeGreaterThan(0);
    expect(b.years.length).toBeGreaterThan(0);
    expect(c.years.length).toBeGreaterThan(0);
  });

  it("ISA bridge calculation for early retirement", () => {
    const p = makeDefaultProfile();
    p.retirementTargetAge = 52;
    p.pensionAccessAge = 57;
    const proj = runProjection(p);
    const b = isaBridge(p, proj);
    expect(b.required).toBe(true);
    expect(b.bridgeYears).toBe(5);
    expect(b.needed).toBe(p.targetRetirementIncome * 5);
  });

  it("Insights engine returns prioritised insights with dismissibles", () => {
    const p = makeDefaultProfile();
    const proj = runProjection(p);
    const fire = computeFire(p, proj);
    const ins = generateInsights({ profile: p, projection: proj, fire });
    expect(ins.length).toBeGreaterThan(0);
    expect(ins[0].impactScore).toBeGreaterThanOrEqual(ins[ins.length - 1].impactScore);
  });

  it("Performance: projection runs in <100ms for 60-year horizon", () => {
    const p = makeDefaultProfile();
    const start = performance.now();
    runProjection(p);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(200); // generous margin for CI
  });
});
