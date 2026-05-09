import type { TaxYearPack } from "@/engine/constants/taxYears";
import { currentTaxYearPack } from "@/engine/constants/taxYears";
import { marginalIncomeRate } from "./incomeTax";
import type { Region } from "@/engine/types";

/** Approximation: tax above dividend allowance at marginal rate. */
export function dividendTax(
  dividends: number,
  otherIncome: number,
  region: Region,
  pack: TaxYearPack = currentTaxYearPack(),
): number {
  const taxable = Math.max(0, dividends - pack.dividendAllowance);
  if (taxable <= 0) return 0;
  return taxable * marginalIncomeRate(otherIncome + dividends, region, pack);
}
