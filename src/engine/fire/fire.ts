import type { TaxYearPack } from "@/engine/constants/taxYears";
import { currentTaxYearPack } from "@/engine/constants/taxYears";
import type { FireMetrics, Projection, ProjectionYear, UserProfile } from "@/engine/types";
import { incomeTax } from "@/engine/tax/incomeTax";
import { nationalInsurance } from "@/engine/tax/ni";
import {
  firePotForYear,
  fireUsesIncomeOffsets,
  fireUsesPotFilters,
  mergeFireCalculationPrefs,
  passiveIncomeOnYear,
} from "./firePrefs";

function findReferenceYear(
  projection: Projection,
  profile: UserProfile,
): ProjectionYear | undefined {
  const prefs = mergeFireCalculationPrefs(profile.fireCalculationPrefs);
  const threshold =
    prefs.referenceAgeMode === "at_retirement"
      ? profile.retirementTargetAge
      : Math.max(profile.retirementTargetAge, profile.statePensionClaimAge);
  return projection.years.find((y) => y.age >= threshold);
}

function portfolioGap(
  targetIncome: number,
  passive: number,
): number {
  return Math.max(0, targetIncome - passive);
}

/** Compute all FIRE metrics for a profile + projection (PRD §6 + optional prefs). */
export function computeFire(
  profile: UserProfile,
  projection: Projection,
  pack: TaxYearPack = currentTaxYearPack(),
): FireMetrics {
  const prefs = mergeFireCalculationPrefs(profile.fireCalculationPrefs);
  const usesOffsets = fireUsesIncomeOffsets(prefs);
  const usesPotFilters = fireUsesPotFilters(prefs);

  const age = projection.meta.currentAge;
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

  const refYear = findReferenceYear(projection, profile);
  const passiveIncomeAtReference = refYear
    ? passiveIncomeOnYear(refYear, prefs)
    : 0;
  const referenceAgeForPassive = refYear?.age ?? null;

  const effectiveFireNumber =
    portfolioGap(target, passiveIncomeAtReference) / swr;
  const effectiveLeanFireNumber =
    portfolioGap(target * profile.leanFirePct, passiveIncomeAtReference) / swr;
  const effectiveFatFireNumber =
    portfolioGap(target * profile.fatFirePct, passiveIncomeAtReference) / swr;
  const effectiveBaristaFireNumber =
    portfolioGap(baristaTarget, passiveIncomeAtReference) / swr;

  const coastFireApplicable = prefs.includePensionInPot;
  const effectiveCoastFireNumber = coastFireApplicable
    ? effectiveFireNumber /
      Math.pow(1 + realPensionGrowth, yearsToRetirement)
    : coastFireNumber;

  const y0 = projection.years[0];
  const investableNow = y0?.investableNetWorth ?? 0;
  const firePotNow = y0 ? firePotForYear(y0, prefs) : 0;
  const atRetirementRow = projection.years.find(
    (y) => y.age >= profile.retirementTargetAge,
  );
  const firePotAtRetirement = atRetirementRow
    ? firePotForYear(atRetirementRow, prefs)
    : firePotNow;

  const fireProgressPct = Math.min(
    1000,
    (firePotNow / Math.max(1, effectiveFireNumber)) * 100,
  );
  const coastFireProgressPct = coastFireApplicable
    ? Math.min(
        1000,
        (firePotNow / Math.max(1, effectiveCoastFireNumber)) * 100,
      )
    : 0;
  const coastReached =
    coastFireApplicable && firePotNow >= effectiveCoastFireNumber;

  let yearsToFire: number | null = null;
  let fireAge: number | null = null;
  for (const y of projection.years) {
    if (firePotForYear(y, prefs) >= effectiveFireNumber) {
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
    effectiveFireNumber,
    effectiveLeanFireNumber,
    effectiveFatFireNumber,
    effectiveCoastFireNumber,
    effectiveBaristaFireNumber,
    firePotNow,
    firePotAtRetirement,
    passiveIncomeAtReference,
    referenceAgeForPassive,
    coastFireApplicable,
    fireCalculationUsesIncomeOffsets: usesOffsets,
    fireCalculationUsesPotFilters: usesPotFilters,
  };
}
