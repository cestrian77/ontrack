import type { SpendingGuardrails } from "@/engine/types";

export const DEFAULT_SPENDING_GUARDRAILS: SpendingGuardrails = {
  enabled: false,
  floorPctOfPlan: 0.8,
  ceilingPctOfPlan: 1.2,
};

export interface PlannedSpending {
  gross: number;
  essential: number;
  discretionary: number;
}

export interface GuardrailResult extends PlannedSpending {
  multiplier: number;
}

/**
 * Guyton–Klinger-style guardrails in real terms: scale planned spending by portfolio
 * performance vs the reference wealth at retirement entry, clamped to floor/ceiling.
 */
export function applySpendingGuardrails(
  planned: PlannedSpending,
  guardrails: SpendingGuardrails,
  portfolioRatio: number,
): GuardrailResult {
  if (!guardrails.enabled || planned.gross <= 0) {
    return { ...planned, multiplier: 1 };
  }
  const floor = guardrails.floorPctOfPlan;
  const ceiling = guardrails.ceilingPctOfPlan;
  const multiplier = Math.max(floor, Math.min(ceiling, portfolioRatio));

  if (planned.discretionary > 0) {
    const essential = Math.min(planned.essential, planned.gross);
    const disc = Math.max(0, planned.gross - essential);
    const adjustedDisc = disc * multiplier;
    const gross = essential + adjustedDisc;
    return {
      gross,
      essential,
      discretionary: adjustedDisc,
      multiplier,
    };
  }

  return {
    gross: planned.gross * multiplier,
    essential: planned.essential * multiplier,
    discretionary: planned.discretionary * multiplier,
    multiplier,
  };
}
