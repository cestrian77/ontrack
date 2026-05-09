import type { TaxYearPack } from "@/engine/constants/taxYears";
import { currentTaxYearPack } from "@/engine/constants/taxYears";
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
export function annualAllowance(
  adjustedIncome: number,
  mpaaTriggered = false,
  pack: TaxYearPack = currentTaxYearPack(),
): number {
  if (mpaaTriggered) return pack.taperedAaFloor;
  if (adjustedIncome <= pack.adjustedIncomeTaperThreshold) {
    return pack.pensionAnnualAllowance;
  }
  const reduction = (adjustedIncome - pack.adjustedIncomeTaperThreshold) / 2;
  return Math.max(pack.taperedAaFloor, pack.pensionAnnualAllowance - reduction);
}

/**
 * Net cost of contributing `gross` via salary sacrifice vs personal SIPP (relief at source).
 * Provides the comparative figure shown in the Tax Efficiency dashboard (PRD §9.2).
 */
export function pensionNetCost(
  gross: number,
  grossSalary: number,
  region: Region,
  pack: TaxYearPack = currentTaxYearPack(),
): {
  sacrifice: number;
  sippNet: number;
  marginalRate: number;
} {
  const marginal = marginalIncomeRate(grossSalary, region, pack);
  const taxBefore = incomeTax(grossSalary, region, pack);
  const niBefore = nationalInsurance(grossSalary, pack);
  const taxAfter = incomeTax(grossSalary - gross, region, pack);
  const niAfter = nationalInsurance(grossSalary - gross, pack);
  const sacrifice = gross - (taxBefore - taxAfter) - (niBefore - niAfter);
  const reliefAdditional = Math.max(0, marginal - 0.2);
  const sippNet = gross * 0.8 - gross * reliefAdditional;
  return { sacrifice, sippNet, marginalRate: marginal };
}
