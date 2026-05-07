import type { UserProfile } from "@/engine/types";

/**
 * Defined Benefit pension as fixed inflation-linked stream from NRA (PRD §5.4.4).
 * Real-terms model: income held constant in real £ from NRA onwards.
 */
export function dbAnnualIncomeAtAge(profile: UserProfile, age: number): number {
  if (!profile.hasDB) return 0;
  if (age < profile.dbNRA) return 0;
  return profile.dbAnnualIncome;
}

/** PRD §5.4.4: simplified actuarial multiplier (annual income × 20). */
export function dbCapitalValue(profile: UserProfile): number {
  if (!profile.hasDB) return 0;
  return profile.dbAnnualIncome * 20;
}
