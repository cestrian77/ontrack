import {
  ISA_ANNUAL_ALLOWANCE,
  LISA_ANNUAL_ALLOWANCE,
  LISA_BONUS_RATE,
  LISA_MAX_AGE_CONTRIB,
} from "@/engine/constants/uk";

/**
 * Compound a balance over N months given an annual rate and constant monthly contribution.
 * FV = PV(1+rm)^n + C[(1+rm)^n − 1]/rm
 */
export function compoundMonthly(
  pv: number,
  annualRate: number,
  monthlyContribution: number,
  months: number,
): number {
  const rm = annualRate / 12;
  if (rm === 0) return pv + monthlyContribution * months;
  const factor = Math.pow(1 + rm, months);
  return pv * factor + monthlyContribution * ((factor - 1) / rm);
}

/** Annual compounding for cash ISA (PRD §5.5). */
export function compoundAnnual(pv: number, rate: number): number {
  return pv * (1 + rate);
}

/** Cap monthly ISA contribution to fit annual allowance (across S&S + cash + LISA). */
export function capIsaMonthly(
  ssMonthly: number,
  cashMonthly: number,
  lisaMonthly: number,
): {
  ss: number;
  cash: number;
  lisa: number;
  warning?: string;
} {
  const lisaCapped = Math.min(lisaMonthly, LISA_ANNUAL_ALLOWANCE / 12);
  const annualLisa = lisaCapped * 12;
  const remainingAnnual = ISA_ANNUAL_ALLOWANCE - annualLisa;
  const remainingMonthly = remainingAnnual / 12;
  const totalReq = ssMonthly + cashMonthly;
  if (totalReq <= remainingMonthly) {
    return { ss: ssMonthly, cash: cashMonthly, lisa: lisaCapped };
  }
  const factor = remainingMonthly / Math.max(totalReq, 1e-9);
  return {
    ss: ssMonthly * factor,
    cash: cashMonthly * factor,
    lisa: lisaCapped,
    warning: "Total ISA contributions capped to £20,000 annual allowance.",
  };
}

/** LISA: applies annual 25% bonus on contributions while age ≤ 50. */
export function lisaAnnualGrowth(
  pv: number,
  monthlyContribution: number,
  growthRate: number,
  age: number,
): number {
  const contribAllowed = age <= LISA_MAX_AGE_CONTRIB ? monthlyContribution : 0;
  const annualContrib = Math.min(
    contribAllowed * 12,
    LISA_ANNUAL_ALLOWANCE,
  );
  const bonus = annualContrib * LISA_BONUS_RATE;
  // Apply growth to PV, then add contribution + bonus mid-year (approx end-of-year add).
  return pv * (1 + growthRate) + annualContrib + bonus;
}
