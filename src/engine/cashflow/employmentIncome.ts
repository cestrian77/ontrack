import type { TaxYearPack } from "@/engine/constants/taxYears";
import { currentTaxYearPack } from "@/engine/constants/taxYears";
import type { UserProfile } from "@/engine/types";
import { incomeTax } from "@/engine/tax/incomeTax";
import { nationalInsurance } from "@/engine/tax/ni";

/** Approximate annual take-home from salary (tax + NI only; excludes pension contrib from net). */
export function annualNetEmploymentIncome(
  profile: UserProfile,
  pack: TaxYearPack = currentTaxYearPack(),
): number {
  const tax = incomeTax(profile.grossSalary, profile.region, pack);
  const ni = nationalInsurance(profile.grossSalary, pack);
  return Math.max(0, profile.grossSalary - tax - ni);
}

/** Other taxable income entered as £/mo, treated as annual add-on to cashflow while employed. */
export function annualOtherIncome(profile: UserProfile): number {
  return profile.otherIncomeMonthly * 12;
}
