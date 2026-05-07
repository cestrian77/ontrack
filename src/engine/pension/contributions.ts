import {
  ADJUSTED_INCOME_TAPER_THRESHOLD,
  PENSION_ANNUAL_ALLOWANCE,
  TAPERED_AA_FLOOR,
} from "@/engine/constants/uk";
import type { Region } from "@/engine/types";
import { incomeTax, marginalIncomeRate } from "@/engine/tax/incomeTax";
import { nationalInsurance } from "@/engine/tax/ni";

/** Convert a £/mo SIPP contribution (net, relief at source) to gross annual. */
export function sippGrossAnnual(monthlyNet: number): number {
  return (monthlyNet * 12) / 0.8;
}

/** Workplace contributions (pre-tax) — computed from gross salary. */
export function workplaceContribAnnual(
  grossSalary: number,
  employeePct: number,
  employerPct: number,
): { employee: number; employer: number; total: number } {
  const employee = grossSalary * employeePct;
  const employer = grossSalary * employerPct;
  return { employee, employer, total: employee + employer };
}

/**
 * Tapered Annual Allowance (PRD §5.4.2).
 * Adjusted income > £260k tapers AA by £1 per £2 above; floor £10k.
 */
export function annualAllowance(adjustedIncome: number, mpaaTriggered = false): number {
  if (mpaaTriggered) return TAPERED_AA_FLOOR;
  if (adjustedIncome <= ADJUSTED_INCOME_TAPER_THRESHOLD) {
    return PENSION_ANNUAL_ALLOWANCE;
  }
  const reduction = (adjustedIncome - ADJUSTED_INCOME_TAPER_THRESHOLD) / 2;
  return Math.max(TAPERED_AA_FLOOR, PENSION_ANNUAL_ALLOWANCE - reduction);
}

/**
 * Net cost of contributing `gross` via salary sacrifice vs personal SIPP (relief at source).
 * Provides the comparative figure shown in the Tax Efficiency dashboard (PRD §9.2).
 */
export function pensionNetCost(
  gross: number,
  grossSalary: number,
  region: Region,
): {
  sacrifice: number;
  sippNet: number;
  marginalRate: number;
} {
  const marginal = marginalIncomeRate(grossSalary, region);
  // Salary sacrifice: full tax + NI saving on the sacrificed amount.
  const taxBefore = incomeTax(grossSalary, region);
  const niBefore = nationalInsurance(grossSalary);
  const taxAfter = incomeTax(grossSalary - gross, region);
  const niAfter = nationalInsurance(grossSalary - gross);
  const sacrifice = gross - (taxBefore - taxAfter) - (niBefore - niAfter);
  // Relief at source: pay 80% of gross out of net pay; HR/AR claim back via SA.
  const reliefAdditional = Math.max(0, marginal - 0.2);
  const sippNet = gross * 0.8 - gross * reliefAdditional;
  return { sacrifice, sippNet, marginalRate: marginal };
}
