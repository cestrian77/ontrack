import type { FireMetrics, Projection, UserProfile } from "@/engine/types";
import { ageFromDob } from "@/engine/project/runProjection";
import { incomeTax } from "@/engine/tax/incomeTax";
import { nationalInsurance } from "@/engine/tax/ni";

/** Compute all FIRE metrics for a profile + projection (PRD §6). */
export function computeFire(
  profile: UserProfile,
  projection: Projection,
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

  // First year where investable NW crosses FIRE number.
  let yearsToFire: number | null = null;
  let fireAge: number | null = null;
  for (const y of projection.years) {
    if (y.investableNetWorth >= fireNumber) {
      yearsToFire = y.age - age;
      fireAge = y.age;
      break;
    }
  }

  // Savings rate (PRD §6.2): (gross − tax − net spend) ÷ gross
  const tax = incomeTax(profile.grossSalary, profile.region);
  const ni = nationalInsurance(profile.grossSalary);
  const netTakeHome = Math.max(0, profile.grossSalary - tax - ni);
  const annualSaving =
    profile.ssIsaMonthly * 12 +
    profile.lisaMonthly * 12 +
    profile.giaMonthly * 12 +
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
