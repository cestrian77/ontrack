import type { BTLProperty, Region } from "@/engine/types";
import type { TaxYearPack } from "@/engine/constants/taxYears";
import { currentTaxYearPack } from "@/engine/constants/taxYears";
import { marginalPropertyIncomeRate } from "@/engine/tax/propertyTax";
import { monthlyPayment } from "@/engine/property/mortgage";

export interface BTLCashflowOptions {
  /** Multiplier on contractual rent (e.g. cumulative rent growth). Default 1. */
  rentScale?: number;
  /** Current mortgage balance for interest/payment. Defaults to `p.mortgageBalance`. */
  mortgageBalance?: number;
  /** Remaining amortisation term in years (repayment). Defaults to `p.mortgageTermYears`. */
  mortgageTermYearsRemaining?: number;
  /**
   * Multiplier on maintenance + insurance (real-terms cost escalation vs profile year 0).
   * Use 1 for flat real costs; use `(1+cpi)^i` if modelling nominal cost inflation in a real ledger.
   */
  operatingCostScale?: number;
  taxYearPack?: TaxYearPack;
}

export interface BTLCashflow {
  grossRent: number;
  effectiveRent: number;
  voidAdjustment: number;
  agentFees: number;
  maintenance: number;
  insurance: number;
  operatingExpenses: number;
  mortgageInterest: number;
  mortgagePayment: number;
  taxableIncome: number;
  s24Credit: number;
  taxOnRental: number;
  netCashflow: number;
}

/**
 * Annual BTL cashflow per property (PRD §8.1, §8.2 — Section 24 implementation).
 * `otherIncome` = user's other taxable income for marginal-rate determination.
 */
export function btlAnnualCashflow(
  p: BTLProperty,
  otherIncome: number,
  region: Region,
  opts?: BTLCashflowOptions,
): BTLCashflow {
  const pack = opts?.taxYearPack ?? currentTaxYearPack();
  const rentScale = opts?.rentScale ?? 1;
  const costScale = opts?.operatingCostScale ?? 1;
  const mb = opts?.mortgageBalance ?? p.mortgageBalance;
  const termRem = Math.max(
    1,
    opts?.mortgageTermYearsRemaining ?? p.mortgageTermYears,
  );

  const ownershipFactor = p.ownership === "joint" ? 0.5 : 1;
  const grossRent = p.monthlyGrossRent * 12 * rentScale;
  const voidAdjustment = grossRent * p.voidRate;
  const effectiveRent = grossRent - voidAdjustment;
  const agentFees = effectiveRent * p.lettingAgentFeePct;
  const maintenance = p.annualMaintenance * costScale;
  const insurance = p.annualInsurance * costScale;
  const operatingExpenses = agentFees + maintenance + insurance;

  const mortgageInterest =
    p.mortgageType === "interest_only"
      ? mb * p.mortgageRate
      : interestPortionOverYear(mb, p.mortgageRate, termRem);
  const mortgagePayment =
    p.mortgageType === "interest_only"
      ? mortgageInterest
      : monthlyPayment(mb, p.mortgageRate, termRem) * 12;

  const taxableIncome = (effectiveRent - operatingExpenses) * ownershipFactor;
  const marginal = marginalPropertyIncomeRate(
    otherIncome + Math.max(0, taxableIncome),
    region,
    pack,
  );
  const taxBeforeCredit = Math.max(0, taxableIncome) * marginal;
  const s24Credit =
    mortgageInterest * ownershipFactor * pack.btlSection24CreditRate;
  const taxOnRental = Math.max(0, taxBeforeCredit - s24Credit);

  const netCashflow =
    (effectiveRent - operatingExpenses - mortgagePayment) * ownershipFactor - taxOnRental;

  return {
    grossRent: grossRent * ownershipFactor,
    effectiveRent: effectiveRent * ownershipFactor,
    voidAdjustment: voidAdjustment * ownershipFactor,
    agentFees: agentFees * ownershipFactor,
    maintenance: maintenance * ownershipFactor,
    insurance: insurance * ownershipFactor,
    operatingExpenses: operatingExpenses * ownershipFactor,
    mortgageInterest: mortgageInterest * ownershipFactor,
    mortgagePayment: mortgagePayment * ownershipFactor,
    taxableIncome,
    s24Credit,
    taxOnRental,
    netCashflow,
  };
}

/** Sum of interest portions over the first 12 months of a repayment schedule. */
function interestPortionOverYear(
  balance: number,
  annualRate: number,
  termYears: number,
): number {
  const r = annualRate / 12;
  const m = monthlyPayment(balance, annualRate, termYears);
  let bal = balance;
  let interestSum = 0;
  for (let i = 0; i < 12 && bal > 0; i++) {
    const interest = bal * r;
    interestSum += interest;
    const principal = m - interest;
    bal = Math.max(0, bal - principal);
  }
  return interestSum;
}

export interface BTLYields {
  grossYield: number;
  netYield: number;
  cashOnCash: number;
  equityGrowth: number;
}

/** PRD §8.3 yield metrics. cashInvested defaults to current equity. */
export function btlYields(
  p: BTLProperty,
  cashflow: BTLCashflow,
  cashInvested?: number,
): BTLYields {
  const equity = Math.max(1, p.value - p.mortgageBalance);
  const invested = cashInvested && cashInvested > 0 ? cashInvested : equity;
  return {
    grossYield: (cashflow.grossRent / Math.max(1, p.value)) * 100,
    netYield:
      ((cashflow.effectiveRent - cashflow.operatingExpenses) /
        Math.max(1, p.value)) *
      100,
    cashOnCash: (cashflow.netCashflow / invested) * 100,
    equityGrowth: p.value * p.appreciationRate,
  };
}
