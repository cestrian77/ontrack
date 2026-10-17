import type { Projection } from "@/engine/types";

export interface SuccessEvaluationOptions {
  planningHorizonAge: number;
  /** When true, only essential spending must be met (flexible spending mode). */
  essentialOnly?: boolean;
  /** Household target override (real £); when set, compared to combined income on merged projection. */
  householdSpendingTarget?: number;
}

export interface PathSuccessResult {
  success: boolean;
  firstFailureAge: number | null;
  minFundedRatio: number;
}

function fundedRatioForYear(
  y: import("@/engine/types").ProjectionYear,
  target: number,
  essentialOnly: boolean,
): number {
  if (target <= 0) return 1;
  const passive =
    y.statePensionIncome + y.dbIncome + Math.max(0, y.btlCashflowNet) + (y.eventIncome ?? 0);
  const drawdown = y.drawdownIncome;
  const income = passive + drawdown;
  const need = essentialOnly
    ? (y.essentialSpendingNeed ?? target)
    : (y.grossSpendingNeed ?? target);
  const expense = y.eventExpense ?? 0;
  const netNeed = Math.max(0, need + expense);
  if (!y.retired && netNeed <= 0) return 1;
  if (netNeed <= 0) return 1;
  return income / netNeed;
}

export function evaluatePathSuccess(
  projection: Projection,
  options: SuccessEvaluationOptions,
): PathSuccessResult {
  const { planningHorizonAge, essentialOnly = false, householdSpendingTarget } = options;
  let minFundedRatio = 1;
  let firstFailureAge: number | null = null;

  for (const y of projection.years) {
    if (y.age > planningHorizonAge) break;
    if (!y.retired) continue;

    const target = householdSpendingTarget != null
      ? householdSpendingTarget
      : essentialOnly
        ? (y.essentialSpendingNeed ?? y.grossSpendingNeed ?? 0)
        : (y.grossSpendingNeed ?? 0);

    const ratio = fundedRatioForYear(y, target, essentialOnly);
    minFundedRatio = Math.min(minFundedRatio, ratio);

    const unmet = y.unmetSpending ?? 0;
    const failed = unmet > 1 || ratio < 0.999;
    if (failed && firstFailureAge === null) {
      firstFailureAge = y.age;
    }
  }

  const last = projection.years.filter((y) => y.age <= planningHorizonAge).at(-1);
  const depleted =
    last != null &&
    last.retired &&
    last.investableNetWorth <= 0 &&
    (last.unmetSpending ?? 0) > 0;

  const success = firstFailureAge === null && !depleted;
  return { success, firstFailureAge, minFundedRatio };
}
