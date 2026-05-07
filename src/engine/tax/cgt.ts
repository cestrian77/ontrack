import {
  BASIC_RATE_THRESHOLD_EW,
  CGT_ANNUAL_EXEMPT,
  CGT_BASIC_RATE,
  CGT_HIGHER_RATE,
} from "@/engine/constants/uk";

/**
 * Simplified CGT for shares/funds (PRD §5.6).
 * Taxable gain = max(0, gain − annual exempt amount).
 * Portion within remaining basic-rate band: 18%; rest: 24%.
 */
export function cgtOnGain(gain: number, otherTaxableIncome: number): number {
  const taxable = Math.max(0, gain - CGT_ANNUAL_EXEMPT);
  if (taxable <= 0) return 0;
  const basicRoom = Math.max(0, BASIC_RATE_THRESHOLD_EW - otherTaxableIncome);
  const inBasic = Math.min(taxable, basicRoom);
  const inHigher = taxable - inBasic;
  return inBasic * CGT_BASIC_RATE + inHigher * CGT_HIGHER_RATE;
}
