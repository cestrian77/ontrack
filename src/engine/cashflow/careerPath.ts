import type { UserProfile } from "@/engine/types";

/** Gross salary in real terms for projection year index (0 = today). */
export function careerGrossSalaryAtYearIndex(
  profile: UserProfile,
  yearIndex: number,
): number {
  if (yearIndex <= 0) return profile.grossSalary;
  const growth = profile.salaryGrowth ?? 0;
  return profile.grossSalary * Math.pow(1 + growth, yearIndex);
}

/** Annual bonus in real terms; grows with the salary path when set. */
export function careerBonusAtYearIndex(profile: UserProfile, yearIndex: number): number {
  if (profile.bonus <= 0) return 0;
  const growth = profile.salaryGrowth ?? 0;
  return profile.bonus * Math.pow(1 + growth, Math.max(0, yearIndex));
}

/** Taxable employment income used for pension contributions and BTL marginal rate. */
export function careerTaxableEmploymentIncome(
  profile: UserProfile,
  yearIndex: number,
): number {
  return careerGrossSalaryAtYearIndex(profile, yearIndex) + careerBonusAtYearIndex(profile, yearIndex);
}
