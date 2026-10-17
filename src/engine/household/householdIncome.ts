import type { HouseholdPrefs, UserProfile } from "@/engine/types";

export function resolveHouseholdRetirementIncome(
  primary: UserProfile,
  partner: UserProfile,
  prefs?: HouseholdPrefs | null,
): number {
  if (prefs?.householdRetirementIncome != null && prefs.householdRetirementIncome > 0) {
    return prefs.householdRetirementIncome;
  }
  return primary.targetRetirementIncome + partner.targetRetirementIncome;
}
