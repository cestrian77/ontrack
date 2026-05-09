import type { TaxYearPack } from "@/engine/constants/taxYears";
import { currentTaxYearPack } from "@/engine/constants/taxYears";

/**
 * Simplified CGT for shares/funds (PRD §5.6).
 * Taxable gain = max(0, gain − annual exempt amount).
 * Portion within remaining basic-rate band: 18%; rest: 24%.
 */
export function cgtOnGain(
  gain: number,
  otherTaxableIncome: number,
  pack: TaxYearPack = currentTaxYearPack(),
): number {
  const taxable = Math.max(0, gain - pack.cgtAnnualExempt);
  if (taxable <= 0) return 0;
  const basicRoom = Math.max(0, pack.basicRateThresholdEW - otherTaxableIncome);
  const inBasic = Math.min(taxable, basicRoom);
  const inHigher = taxable - inBasic;
  return inBasic * pack.cgtBasicRate + inHigher * pack.cgtHigherRate;
}
