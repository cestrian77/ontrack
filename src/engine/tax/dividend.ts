import { DIVIDEND_ALLOWANCE } from "@/engine/constants/uk";
import { marginalIncomeRate } from "./incomeTax";
import type { Region } from "@/engine/types";

/** Approximation: tax above dividend allowance at marginal rate. */
export function dividendTax(
  dividends: number,
  otherIncome: number,
  region: Region,
): number {
  const taxable = Math.max(0, dividends - DIVIDEND_ALLOWANCE);
  if (taxable <= 0) return 0;
  return taxable * marginalIncomeRate(otherIncome + dividends, region);
}
