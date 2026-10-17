import type { LongTermCarePrefs, UserProfile } from "@/engine/types";
import { DEFAULT_LTC_FROM_AGE, DEFAULT_LTC_YEARS } from "@/engine/constants/uk";

export const DEFAULT_LONG_TERM_CARE: LongTermCarePrefs = {
  enabled: false,
  fromAge: DEFAULT_LTC_FROM_AGE,
  annualCostReal: 45_000,
  years: DEFAULT_LTC_YEARS,
};

export function longTermCarePrefs(profile: UserProfile): LongTermCarePrefs | null {
  return profile.longTermCare ?? null;
}

/** Real £/year care cost for this age (0 if disabled or outside window). */
export function longTermCareCostAtAge(profile: UserProfile, age: number): number {
  const prefs = longTermCarePrefs(profile);
  if (!prefs?.enabled || prefs.annualCostReal <= 0) return 0;
  if (age < prefs.fromAge) return 0;
  if (age >= prefs.fromAge + Math.max(1, prefs.years)) return 0;
  return prefs.annualCostReal;
}
