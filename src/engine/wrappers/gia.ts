import { DEFAULT_GIA_CGT_DRAG } from "@/engine/constants/uk";

/**
 * Simplified GIA growth: applies a constant CGT-drag reduction to the growth rate.
 * (PRD §5.6 — Phase 1 simplification.)
 */
export function giaAnnualGrowth(
  pv: number,
  monthlyContribution: number,
  growthRate: number,
  cgtDrag: number = DEFAULT_GIA_CGT_DRAG,
): number {
  const effective = Math.max(0, growthRate - cgtDrag);
  return pv * (1 + effective) + monthlyContribution * 12;
}
