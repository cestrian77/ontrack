import type {
  MonthlyBoostParams,
  Projection,
  ProjectionYear,
  UserProfile,
} from "@/engine/types";
import type { TaxYearPack } from "@/engine/constants/taxYears";
import { currentTaxYearPack } from "@/engine/constants/taxYears";
import {
  economicScenarioFromProfile,
  economicYearFromProfile,
  resolveEconomicYear,
} from "@/engine/economics/fromProfile";
import type { EconomicScenario } from "@/engine/economics/types";
import { realRate } from "@/engine/economics/realRate";
import { resolveYearEvents, timelineEventsForProfile } from "@/engine/events/resolve";
import { getDrawdownStrategy } from "@/engine/drawdown";
import {
  careerTaxableEmploymentIncome,
} from "@/engine/cashflow/careerPath";
import { longTermCareCostAtAge } from "@/engine/care/longTermCare";
import { estimateUkIht } from "@/engine/estate/iht";
import {
  applySpendingGuardrails,
} from "@/engine/spending/guardrails";
import {
  discretionarySpendingAtAge,
  essentialSpendingAtAge,
  grossSpendingNeedAtAge,
} from "@/engine/spending/need";
import { applyBtlSale, applyPrimarySale } from "@/engine/property/disposal";
import { dbAnnualIncomeAtAge } from "@/engine/pension/db";
import {
  sippGrossAnnual,
  workplaceContribAnnual,
} from "@/engine/pension/contributions";
import { compoundAnnual, lisaAnnualGrowth } from "@/engine/wrappers/isa";
import { giaAnnualGrowth } from "@/engine/wrappers/gia";
import { balanceAfterMonths } from "@/engine/property/mortgage";
import { btlAnnualCashflow } from "@/engine/btl/cashflow";
import { DEFAULT_PLANNING_HORIZON_AGE } from "@/engine/montecarlo/defaults";

export interface RunProjectionOptions {
  taxYearPack?: TaxYearPack;
  /** ISO calendar date (yyyy-mm-dd). Fixes "today" for deterministic tests and cross-platform goldens. */
  asOfDate?: string;
  economicScenario?: EconomicScenario;
  /** Plan to this age (default 100). */
  planningHorizonAge?: number;
}

function resolveAsOf(options?: RunProjectionOptions): Date {
  if (options?.asOfDate) {
    return new Date(`${options.asOfDate}T12:00:00Z`);
  }
  return new Date();
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
 * Annual-step deterministic projection to planning horizon (default age 100).
 * All values held in real (today's £) terms; inflation handled at display time.
 */
export function runProjection(
  profile: UserProfile,
  options?: RunProjectionOptions,
): Projection {
  const taxYearPack = options?.taxYearPack ?? currentTaxYearPack();
  const asOf = resolveAsOf(options);
  const currentAge = ageFromDob(profile.dateOfBirth, asOf);
  const startYear = asOf.getUTCFullYear();
  const retirementAge = profile.retirementTargetAge;
  const nmpa = profile.pensionAccessAge;
  const spa = profile.statePensionClaimAge;
  const horizonAge = options?.planningHorizonAge ?? DEFAULT_PLANNING_HORIZON_AGE;
  const horizon = Math.max(horizonAge - currentAge, 1);

  const yearCount = horizon + 1;
  const economics =
    options?.economicScenario ??
    economicScenarioFromProfile(profile, startYear, yearCount);
  const timelineEvents = timelineEventsForProfile(profile);
  const drawdownStrategy = getDrawdownStrategy(profile.drawdownStrategyId ?? "legacy");

  let pension = profile.pensionPot;
  let ssIsa = profile.ssIsaValue;
  let cashIsa = profile.cashIsaValue;
  let lisa = profile.hasLisa ? profile.lisaValue : 0;
  let gia = profile.hasGia ? profile.giaValue : 0;
  let cash = profile.cashSavings;

  let primaryValue = profile.primaryValue;
  let primaryBalance = profile.primaryMortgage;

  const btlBalances = profile.btlProperties.map((p) => p.mortgageBalance);
  const btlValues = profile.btlProperties.map((p) => p.value);

  const rPrimary = profile.primaryAppreciation;

  const years: ProjectionYear[] = [];
  let guardrailRefWealth: number | null = null;

  for (let i = 0; i <= horizon; i++) {
    const age = currentAge + i;
    const year = startYear + i;
    const retired = age >= retirementAge;
    const econFallback = economicYearFromProfile(profile, year);
    const econ = resolveEconomicYear(economics, i, econFallback);

    const rPension = realRate(econ.pensionReturn, econ.inflation);
    const rIsa = realRate(econ.isaReturn, econ.inflation);
    const rGia = realRate(econ.giaReturn, econ.inflation);
    const rCash = realRate(econ.cashReturn, econ.inflation);
    const rCashIsa = realRate(econ.cashIsaReturn, econ.inflation);

    const employmentGross = retired ? 0 : careerTaxableEmploymentIncome(profile, i);
    const wp = workplaceContribAnnual(
      employmentGross,
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

    if (i > 0) {
      pension = pension * (1 + rPension) + annualPensionContrib;
      ssIsa = ssIsa * (1 + rIsa) + annualSsIsaContrib;
      cashIsa = compoundAnnual(cashIsa, rCashIsa);
      lisa = lisaAnnualGrowth(lisa, annualLisaContribMonthly, rIsa, age);
      gia = giaAnnualGrowth(gia, giaMonthlyEff, rGia);
      cash = compoundAnnual(cash, rCash);

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
    }

    const yearEvents = resolveYearEvents(timelineEvents, year);
    if (i > 0 || yearEvents.cashDelta !== 0) {
      cash += yearEvents.cashDelta;
    }

    for (const sale of yearEvents.propertySales) {
      if (sale.target === "primary") {
        const next = applyPrimarySale(
          { primaryValue, primaryBalance, cashDelta: 0 },
          sale,
        );
        primaryValue = next.primaryValue;
        primaryBalance = next.primaryBalance;
        cash += next.cashDelta;
      } else if (sale.btlIndex != null && sale.btlIndex < profile.btlProperties.length) {
        const idx = sale.btlIndex;
        const res = applyBtlSale(
          profile.btlProperties[idx],
          btlBalances[idx],
          btlValues[idx],
          sale,
        );
        btlValues[idx] = res.value;
        btlBalances[idx] = res.balance;
        cash += res.cashDelta;
      }
    }

    const rentScale = Math.pow(
      (1 + econ.rentalGrowth) / (1 + econ.inflation),
      i,
    );

    let btlCashflowNet = 0;
    profile.btlProperties.forEach((p, idx) => {
      const termRem = Math.max(
        1,
        p.mortgageTermYears - Math.min(i, p.mortgageTermYears),
      );
      const cf = btlAnnualCashflow(p, employmentGross, profile.region, {
        rentScale,
        mortgageBalance: btlBalances[idx],
        mortgageTermYearsRemaining: termRem,
        taxYearPack,
      });
      btlCashflowNet += cf.netCashflow;
    });

    const rSpLock = realRate(econ.spTripleLockGrowth, econ.inflation);
    const yearsClaimingSp = Math.max(0, age - spa);
    const statePensionIncome =
      age >= spa
        ? profile.statePensionWeekly * 52 * Math.pow(1 + rSpLock, yearsClaimingSp)
        : 0;
    const dbIncome = dbAnnualIncomeAtAge(profile, age);

    const careCost = longTermCareCostAtAge(profile, age);
    let grossNeed =
      grossSpendingNeedAtAge(profile, age) + yearEvents.expenseDelta + careCost;
    let essentialNeed = essentialSpendingAtAge(profile, age) + yearEvents.expenseDelta;
    if (careCost > 0 && retired) {
      essentialNeed += careCost;
      grossNeed =
        essentialNeed + discretionarySpendingAtAge(profile, age) + yearEvents.expenseDelta;
    }
    let discretionaryNeed = discretionarySpendingAtAge(profile, age);
    const eventIncome = yearEvents.incomeDelta;
    let guardrailMultiplier: number | undefined;

    let drawdownIncome = 0;
    let unmetSpending = 0;
    let taxPaid = 0;
    let withdrawals: ProjectionYear["withdrawals"];

    const investableBeforeDrawdown =
      pension + ssIsa + cashIsa + lisa + gia + cash;

    if (retired && profile.spendingGuardrails?.enabled) {
      if (guardrailRefWealth === null || guardrailRefWealth <= 0) {
        guardrailRefWealth = investableBeforeDrawdown;
      }
      const ratio =
        guardrailRefWealth > 0 ? investableBeforeDrawdown / guardrailRefWealth : 1;
      const adjusted = applySpendingGuardrails(
        {
          gross: grossNeed - yearEvents.expenseDelta - careCost,
          essential: essentialNeed - (careCost > 0 ? careCost : 0),
          discretionary: discretionaryNeed,
        },
        profile.spendingGuardrails,
        ratio,
      );
      guardrailMultiplier = adjusted.multiplier;
      grossNeed = adjusted.gross + yearEvents.expenseDelta + careCost;
      essentialNeed = adjusted.essential + (careCost > 0 ? careCost : 0);
      discretionaryNeed = adjusted.discretionary;
    }

    let projectedEstateIht: number | undefined;
    const estatePrefs = profile.estatePlanning;
    if (estatePrefs?.enabled && age === (estatePrefs.modelAtAge ?? horizonAge)) {
      const primaryEquityNow = Math.max(0, primaryValue - primaryBalance);
      const btlEquityNow = profile.btlProperties.reduce(
        (sum, _, idx) => sum + Math.max(0, btlValues[idx] - btlBalances[idx]),
        0,
      );
      const est = estimateUkIht(
        {
          netEstate: investableBeforeDrawdown + primaryEquityNow + btlEquityNow,
          primaryResidenceValue: primaryEquityNow,
        },
        estatePrefs,
      );
      projectedEstateIht = est.ihtDue;
    }

    if (retired) {
      const passive =
        statePensionIncome +
        dbIncome +
        btlCashflowNet +
        eventIncome;
      const need = Math.max(0, grossNeed - passive);
      const alloc = drawdownStrategy.allocate({
        age,
        nmpa,
        region: profile.region,
        taxYearPack,
        netNeed: need,
        otherTaxableIncome: statePensionIncome + dbIncome + Math.max(0, btlCashflowNet),
        balances: { pension, ssIsa, cashIsa, lisa, gia, cash },
        strategyId: profile.drawdownStrategyId ?? "legacy",
      });

      pension -= alloc.fromPensionGross;
      ssIsa -= alloc.fromSsIsa;
      cashIsa -= alloc.fromCashIsa;
      lisa -= alloc.fromLisa;
      gia -= alloc.fromGia;
      cash -= alloc.fromCash;

      drawdownIncome = alloc.netDrawdown;
      unmetSpending = alloc.unmet;
      taxPaid = alloc.taxOnDrawdown;
      withdrawals = {
        fromSsIsa: alloc.fromSsIsa,
        fromPensionNet: alloc.fromPensionNet,
        fromGia: alloc.fromGia,
        fromCash: alloc.fromCash,
        taxOnDrawdown: alloc.taxOnDrawdown,
      };
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
      taxPaid,
      statePensionIncome,
      dbIncome,
      drawdownIncome,
      retired,
      grossSpendingNeed: retired ? grossNeed : 0,
      essentialSpendingNeed: retired ? essentialNeed : 0,
      discretionarySpendingNeed: retired ? discretionaryNeed : 0,
      unmetSpending: retired ? unmetSpending : 0,
      eventIncome,
      eventExpense: yearEvents.expenseDelta,
      employmentGross: retired ? undefined : employmentGross,
      longTermCareCost: careCost > 0 ? careCost : undefined,
      guardrailSpendingMultiplier: guardrailMultiplier,
      projectedEstateIht,
      withdrawals,
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
      planningHorizonAge: horizonAge,
    },
  };
}
