import type { LifeEvent, UserProfile } from "@/engine/types";
import type { HouseholdBudget } from "./types";
import { compileHouseholdBudget, type CompileBudgetContext } from "./compile";
import { isBudgetGeneratedEvent } from "./types";

export interface ApplyBudgetResult {
  primaryPatch: Partial<UserProfile>;
  householdRetirementIncome: number | null;
  dependentCount: number;
  eventsMerged: number;
}

/**
 * Merge compiled budget events into profile timeline and set retirement spending fields.
 */
export function applyHouseholdBudgetToPlan(
  budget: HouseholdBudget,
  ctx: CompileBudgetContext,
): ApplyBudgetResult {
  const compiled = compileHouseholdBudget(budget, ctx);
  const { essentialAnnual, discretionaryAnnual, totalAnnual } = compiled.rollupNow;

  const existing = ctx.primary.timelineEvents ?? [];
  const kept = existing.filter((e) => !isBudgetGeneratedEvent(e));
  const generated = budget.syncProjectionEvents ? compiled.generatedEvents : [];
  const timelineEvents: LifeEvent[] = [...kept, ...generated];

  const primaryPatch: Partial<UserProfile> = {
    targetRetirementIncome: totalAnnual > 0 ? totalAnnual : ctx.primary.targetRetirementIncome,
    flexibleSpending:
      essentialAnnual > 0 || discretionaryAnnual > 0
        ? { essentialAnnual, discretionaryAnnual }
        : undefined,
    timelineEvents,
  };

  return {
    primaryPatch,
    householdRetirementIncome:
      totalAnnual > 0 && ctx.partner ? totalAnnual : null,
    dependentCount: budget.children.length,
    eventsMerged: generated.length,
  };
}
