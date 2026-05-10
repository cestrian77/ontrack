import type { UserProfile } from "@/engine/types";
import { mergeFireCalculationPrefs } from "@/engine/fire/firePrefs";

/** Display / insight input for household views: summed targets, primary's ages and global assumptions. */
export function buildHouseholdSyntheticProfile(
  primary: UserProfile,
  partner: UserProfile,
): UserProfile {
  return {
    ...primary,
    partnered: true,
    statePensionClaimAge: Math.max(
      primary.statePensionClaimAge,
      partner.statePensionClaimAge,
    ),
    fireCalculationPrefs: mergeFireCalculationPrefs(primary.fireCalculationPrefs),
    targetRetirementIncome:
      primary.targetRetirementIncome + partner.targetRetirementIncome,
    retirementTargetAge: Math.max(
      primary.retirementTargetAge,
      partner.retirementTargetAge,
    ),
    grossSalary: primary.grossSalary + partner.grossSalary,
    bonus: primary.bonus + partner.bonus,
    baristaPartTimeIncome:
      primary.baristaPartTimeIncome + partner.baristaPartTimeIncome,
    hasLisa: primary.hasLisa || partner.hasLisa,
    hasGia: primary.hasGia || partner.hasGia,
    ssIsaMonthly: primary.ssIsaMonthly + partner.ssIsaMonthly,
    lisaMonthly: primary.lisaMonthly + partner.lisaMonthly,
    giaMonthly: primary.giaMonthly + partner.giaMonthly,
    sippMonthly: primary.sippMonthly + partner.sippMonthly,
    otherIncomeMonthly: primary.otherIncomeMonthly + partner.otherIncomeMonthly,
    monthlySurplus: primary.monthlySurplus + partner.monthlySurplus,
    employeeContribPct:
      primary.grossSalary + partner.grossSalary > 0
        ? (primary.grossSalary * primary.employeeContribPct +
            partner.grossSalary * partner.employeeContribPct) /
          (primary.grossSalary + partner.grossSalary)
        : primary.employeeContribPct,
  };
}
