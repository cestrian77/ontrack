import type {
  MonthlyBoostParams,
  Projection,
  ProjectionYear,
  UserProfile,
} from "@/engine/types";
import type { TaxYearPack } from "@/engine/constants/taxYears";
import { currentTaxYearPack } from "@/engine/constants/taxYears";
import { dbAnnualIncomeAtAge } from "@/engine/pension/db";
import {
  sippGrossAnnual,
  workplaceContribAnnual,
} from "@/engine/pension/contributions";
import { compoundAnnual, lisaAnnualGrowth } from "@/engine/wrappers/isa";
import { giaAnnualGrowth } from "@/engine/wrappers/gia";
import { balanceAfterMonths } from "@/engine/property/mortgage";
import { btlAnnualCashflow } from "@/engine/btl/cashflow";

const HORIZON_AGE = 100;

export interface RunProjectionOptions {
  taxYearPack?: TaxYearPack;
}

function rampedMonthlyExtra(adj: MonthlyBoostParams | undefined, yearIndex: number): number {
  if (!adj) return 0;
  if (adj.mode === "flat") return adj.monthlyExtra;
  const y = Math.max(1, adj.rampYears);
  return adj.monthlyExtra * Math.min(1, yearIndex / y);
}

/** Years of age between two ISO dates (today − dob). */
export function ageFromDob(dob: string, asOf = new Date()): number {
  const birth = new Date(dob);
  let age = asOf.getFullYear() - birth.getFullYear();
  const m = asOf.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && asOf.getDate() < birth.getDate())) age--;
  return age;
}

/**
 * Annual-step deterministic projection from current age to 100 (PRD §5).
 * All values held in real (today's £) terms; inflation handled at display time.
 */
export function runProjection(
  profile: UserProfile,
  options?: RunProjectionOptions,
): Projection {
  const taxYearPack = options?.taxYearPack ?? currentTaxYearPack();
  const currentAge = ageFromDob(profile.dateOfBirth);
  const startYear = new Date().getFullYear();
  const retirementAge = profile.retirementTargetAge;
  const nmpa = profile.pensionAccessAge;
  const spa = profile.statePensionClaimAge;
  const horizon = Math.max(HORIZON_AGE - currentAge, 1);

  // Initial balances (all in real today's £).
  let pension = profile.pensionPot;
  let ssIsa = profile.ssIsaValue;
  let cashIsa = profile.cashIsaValue;
  let lisa = profile.hasLisa ? profile.lisaValue : 0;
  let gia = profile.hasGia ? profile.giaValue : 0;
  let cash = profile.cashSavings;

  let primaryValue = profile.primaryValue;
  let primaryBalance = profile.primaryMortgage;

  // BTL portfolios — track balance per property
  const btlBalances = profile.btlProperties.map((p) => p.mortgageBalance);
  const btlValues = profile.btlProperties.map((p) => p.value);

  // Real growth rates (subtract CPI)
  const rPension = realRate(profile.pensionGrowth, profile.cpi);
  const rIsa = realRate(profile.isaGrowth, profile.cpi);
  const rGia = realRate(profile.giaGrowth, profile.cpi);
  const rCash = realRate(profile.cashRate, profile.cpi);
  // Property appreciation is applied as stated (real annual growth in today's £) so headline % matches the journey chart in real mode.
  const rPrimary = profile.primaryAppreciation;

  const years: ProjectionYear[] = [];

  for (let i = 0; i <= horizon; i++) {
    const age = currentAge + i;
    const year = startYear + i;
    const retired = age >= retirementAge;

    // Contributions only while accumulating. State pension from SPA. DB from NRA.
    const wp = workplaceContribAnnual(
      profile.grossSalary,
      profile.employeeContribPct,
      profile.employerContribPct,
    );
    const adj = profile.scenarioContributionAdj;
    const sippExtra = rampedMonthlyExtra(adj?.sippExtraMonthly, i);
    const isaExtra = rampedMonthlyExtra(adj?.ssIsaExtraMonthly, i);
    const overpayExtra = rampedMonthlyExtra(adj?.primaryOverpayExtraMonthly, i);

    const sippAnnual = sippGrossAnnual(profile.sippMonthly + sippExtra);

    const annualPensionContrib = retired ? 0 : wp.total + sippAnnual;
    const annualSsIsaContrib = retired ? 0 : (profile.ssIsaMonthly + isaExtra) * 12;
    const annualLisaContribMonthly =
      retired || !profile.hasLisa ? 0 : profile.lisaMonthly;
    const giaMonthlyEff = profile.hasGia ? profile.giaMonthly : 0;
    const annualGiaContrib = retired ? 0 : giaMonthlyEff * 12;

    // Apply growth + contributions (annual step, end-of-year contribution).
    if (i > 0) {
      pension = pension * (1 + rPension) + annualPensionContrib;
      ssIsa = ssIsa * (1 + rIsa) + annualSsIsaContrib;
      cashIsa = compoundAnnual(cashIsa, rCash);
      lisa = lisaAnnualGrowth(lisa, annualLisaContribMonthly, rIsa, age);
      gia = giaAnnualGrowth(gia, giaMonthlyEff, rGia);
      cash = compoundAnnual(cash, rCash);

      // Primary property
      primaryValue = primaryValue * (1 + rPrimary);
      const monthsElapsed = i * 12;
      primaryBalance = balanceAfterMonths(
        profile.primaryMortgage,
        profile.primaryMortgageRate,
        Math.max(profile.primaryMortgageTermYears, 1),
        Math.min(monthsElapsed, profile.primaryMortgageTermYears * 12),
      );
      if (profile.primaryMortgageType === "interest_only") {
        const totalOverpayMo = profile.primaryOverpayment + overpayExtra;
        primaryBalance = Math.max(0, profile.primaryMortgage - totalOverpayMo * 12 * i);
      }

      // BTL
      profile.btlProperties.forEach((p, idx) => {
        btlValues[idx] *= 1 + p.appreciationRate;
        const months = Math.min(i * 12, Math.max(p.mortgageTermYears, 1) * 12);
        if (p.mortgageType === "interest_only") {
          btlBalances[idx] = p.mortgageBalance;
        } else {
          btlBalances[idx] = balanceAfterMonths(
            p.mortgageBalance,
            p.mortgageRate,
            Math.max(p.mortgageTermYears, 1),
            months,
          );
        }
      });

      // Inheritance event
      if (
        profile.expectedInheritance > 0 &&
        profile.inheritanceYear &&
        year === profile.inheritanceYear
      ) {
        cash += profile.expectedInheritance;
      }
    }

    // Nominal rent escalation vs CPI → real rent path; costs that scale with CPI stay flat in real £.
    const rentScale = Math.pow(
      (1 + profile.rentalGrowth) / (1 + profile.cpi),
      i,
    );

    let btlCashflowNet = 0;
    profile.btlProperties.forEach((p, idx) => {
      const termRem = Math.max(
        1,
        p.mortgageTermYears - Math.min(i, p.mortgageTermYears),
      );
      const cf = btlAnnualCashflow(p, profile.grossSalary, profile.region, {
        rentScale,
        mortgageBalance: btlBalances[idx],
        mortgageTermYearsRemaining: termRem,
        taxYearPack,
      });
      btlCashflowNet += cf.netCashflow;
    });
    if (!retired) cash += btlCashflowNet * 0.0; // accrued in cashflow but not auto-saved
    // (we keep BTL cashflow as a separate output rather than auto-rolling into cash)

    const rSpLock = realRate(profile.spTripleLockGrowth, profile.cpi);
    const yearsClaimingSp = Math.max(0, age - spa);
    const statePensionIncome =
      age >= spa
        ? profile.statePensionWeekly * 52 * Math.pow(1 + rSpLock, yearsClaimingSp)
        : 0;
    const dbIncome = dbAnnualIncomeAtAge(profile, age);

    // Drawdown: in retirement, withdraw from ISA first, then pension, to meet target net income.
    let drawdownIncome = 0;
    if (retired) {
      const target = profile.targetRetirementIncome;
      const passive = statePensionIncome + dbIncome + Math.max(0, btlCashflowNet);
      const need = Math.max(0, target - passive);
      // Pull from ISA first (tax-free)
      const fromIsa = Math.min(ssIsa, need);
      ssIsa -= fromIsa;
      let remaining = need - fromIsa;
      // Then pension (treated as taxable but simplified)
      if (age >= nmpa && remaining > 0) {
        const fromPension = Math.min(pension, remaining);
        pension -= fromPension;
        remaining -= fromPension;
      }
      // Then GIA / cash
      if (remaining > 0) {
        const fromGia = Math.min(gia, remaining);
        gia -= fromGia;
        remaining -= fromGia;
      }
      if (remaining > 0) {
        const fromCash = Math.min(cash, remaining);
        cash -= fromCash;
        remaining -= fromCash;
      }
      drawdownIncome = need - remaining;
    }

    const primaryEquity = Math.max(0, primaryValue - primaryBalance);
    const btlEquityArr = profile.btlProperties.map(
      (_, idx) => Math.max(0, btlValues[idx] - btlBalances[idx]),
    );
    const btlEquity = btlEquityArr.reduce((a, b) => a + b, 0);
    const btlValueSum = btlValues.reduce((a, b) => a + b, 0);
    const btlBalanceSum = btlBalances.reduce((a, b) => a + b, 0);

    const investableNetWorth = pension + ssIsa + cashIsa + lisa + gia + cash;
    const totalNetWorth = investableNetWorth + primaryEquity + btlEquity;

    years.push({
      year,
      age,
      pensionValue: pension,
      isaValue: ssIsa,
      cashIsaValue: cashIsa,
      lisaValue: lisa,
      giaValue: gia,
      cashValue: cash,
      primaryEquity,
      primaryValue,
      primaryMortgageBalance: primaryBalance,
      btlEquity,
      btlValue: btlValueSum,
      btlMortgageBalance: btlBalanceSum,
      totalNetWorth,
      investableNetWorth,
      annualContributions: {
        pension: annualPensionContrib,
        isa: annualSsIsaContrib,
        lisa: annualLisaContribMonthly * 12,
        gia: annualGiaContrib,
      },
      btlCashflowNet,
      taxPaid: 0,
      statePensionIncome,
      dbIncome,
      drawdownIncome,
      retired,
    });
  }

  return {
    years,
    meta: {
      currentAge,
      retirementAge,
      nmpa,
      spa,
      horizon: horizon + 1,
    },
  };
}

function realRate(nominal: number, cpi: number): number {
  return (1 + nominal) / (1 + cpi) - 1;
}
