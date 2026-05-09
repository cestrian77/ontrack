import type { TaxYearPack } from "@/engine/constants/taxYears";
import { currentTaxYearPack } from "@/engine/constants/taxYears";
import type { FireMetrics, Projection, UserProfile } from "@/engine/types";
import { ageFromDob } from "@/engine/project/runProjection";
import { incomeTax } from "@/engine/tax/incomeTax";
import { nationalInsurance } from "@/engine/tax/ni";

/** Compute all FIRE metrics for a profile + projection (PRD §6). */
export function computeFire(
  profile: UserProfile,
  projection: Projection,
  pack: TaxYearPack = currentTaxYearPack(),
): FireMetrics {
  const age = ageFromDob(profile.dateOfBirth);
  const swr = profile.safeWithdrawalRate;
  const target = profile.targetRetirementIncome;

  const fireNumber = target / swr;
  const leanFireNumber = (target * profile.leanFirePct) / swr;
  const fatFireNumber = (target * profile.fatFirePct) / swr;
  const baristaTarget = Math.max(0, target - profile.baristaPartTimeIncome);
  const baristaFireNumber = baristaTarget / swr;

  const yearsToRetirement = Math.max(1, profile.retirementTargetAge - age);
  const realPensionGrowth =
    (1 + profile.pensionGrowth) / (1 + profile.cpi) - 1;
  const coastFireNumber =
    fireNumber / Math.pow(1 + realPensionGrowth, yearsToRetirement);

  const investableNow = projection.years[0]?.investableNetWorth ?? 0;
  const fireProgressPct = Math.min(
    1000,
    (investableNow / Math.max(1, fireNumber)) * 100,
  );
  const coastFireProgressPct = Math.min(
    1000,
    (investableNow / Math.max(1, coastFireNumber)) * 100,
  );
  const coastReached = investableNow >= coastFireNumber;

  let yearsToFire: number | null = null;
  let fireAge: number | null = null;
  for (const y of projection.years) {
    if (y.investableNetWorth >= fireNumber) {
      yearsToFire = y.age - age;
      fireAge = y.age;
      break;
    }
  }

  const tax = incomeTax(profile.grossSalary, profile.region, pack);
  const ni = nationalInsurance(profile.grossSalary, pack);
  const netTakeHome = Math.max(0, profile.grossSalary - tax - ni);
  const annualSaving =
    profile.ssIsaMonthly * 12 +
    (profile.hasLisa ? profile.lisaMonthly * 12 : 0) +
    (profile.hasGia ? profile.giaMonthly * 12 : 0) +
    profile.sippMonthly * 12 +
    profile.grossSalary * profile.employeeContribPct;
  const savingsRate = profile.grossSalary > 0 ? annualSaving / profile.grossSalary : 0;
  void netTakeHome;

  return {
    fireNumber,
    leanFireNumber,
    fatFireNumber,
    coastFireNumber,
    baristaFireNumber,
    investableNow,
    fireProgressPct,
    coastFireProgressPct,
    yearsToFire,
    fireAge,
    coastReached,
    savingsRate,
  };
}
