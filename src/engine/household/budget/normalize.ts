import type { HouseholdBudget } from "./types";
import { emptyHouseholdBudget } from "./compile";

export function normalizeHouseholdBudget(raw?: HouseholdBudget | null): HouseholdBudget {
  const base = emptyHouseholdBudget();
  if (!raw) return base;
  return {
    lines: Array.isArray(raw.lines) ? raw.lines : [],
    children: Array.isArray(raw.children) ? raw.children : [],
    syncProjectionEvents: raw.syncProjectionEvents ?? true,
    lastAppliedAt: raw.lastAppliedAt,
  };
}
