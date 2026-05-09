import type { TaxYearPack } from "@/engine/constants/taxYears";
import { currentTaxYearPack } from "@/engine/constants/taxYears";
import { applyBands } from "./incomeTax";

export function nationalInsurance(
  income: number,
  pack: TaxYearPack = currentTaxYearPack(),
): number {
  if (income <= 0) return 0;
  return applyBands(income, pack.niBands);
}
