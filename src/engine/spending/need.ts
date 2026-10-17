import type { FlexibleSpending, SpendingPhase, UserProfile } from "@/engine/types";

export function defaultSpendingPhases(profile: UserProfile): SpendingPhase[] {
  if (profile.spendingPhases && profile.spendingPhases.length > 0) {
    return profile.spendingPhases;
  }
  return [
    {
      id: "default",
      fromAge: profile.retirementTargetAge,
      toAge: 100,
      annualAmount: profile.targetRetirementIncome,
      label: "Retirement",
    },
  ];
}

export function flexibleSpendingForProfile(profile: UserProfile): FlexibleSpending | null {
  return profile.flexibleSpending ?? null;
}

/** Gross annual spending need in real £ for a given age (accumulation years → 0). */
export function grossSpendingNeedAtAge(profile: UserProfile, age: number): number {
  if (age < profile.retirementTargetAge) return 0;
  const flex = flexibleSpendingForProfile(profile);
  if (flex) return flex.essentialAnnual + flex.discretionaryAnnual;
  const phases = defaultSpendingPhases(profile);
  for (const phase of phases) {
    if (age >= phase.fromAge && age <= phase.toAge) {
      return phase.annualAmount;
    }
  }
  const last = phases[phases.length - 1];
  return last?.annualAmount ?? profile.targetRetirementIncome;
}

export function essentialSpendingAtAge(profile: UserProfile, age: number): number {
  const flex = flexibleSpendingForProfile(profile);
  if (flex && age >= profile.retirementTargetAge) {
    return flex.essentialAnnual;
  }
  return grossSpendingNeedAtAge(profile, age);
}

export function discretionarySpendingAtAge(profile: UserProfile, age: number): number {
  const flex = flexibleSpendingForProfile(profile);
  if (flex && age >= profile.retirementTargetAge) {
    return flex.discretionaryAnnual;
  }
  return 0;
}
