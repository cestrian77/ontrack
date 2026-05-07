import { NI_BANDS } from "@/engine/constants/uk";
import { applyBands } from "./incomeTax";

export function nationalInsurance(income: number): number {
  if (income <= 0) return 0;
  return applyBands(income, NI_BANDS);
}
