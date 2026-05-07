import type { Region } from "@/engine/types";
import {
  ENGLAND_WALES_INCOME_BANDS,
  PA_TAPER_END,
  PA_TAPER_START,
  PERSONAL_ALLOWANCE,
  SCOTLAND_INCOME_BANDS,
  type TaxBand,
} from "@/engine/constants/uk";

/**
 * UK Personal Allowance taper (PRD §5.3.1):
 * For income > £100k, PA reduces by £1 per £2; fully withdrawn at £125,140.
 */
export function personalAllowance(income: number): number {
  if (income <= PA_TAPER_START) return PERSONAL_ALLOWANCE;
  if (income >= PA_TAPER_END) return 0;
  const reduction = Math.floor((income - PA_TAPER_START) / 2);
  return Math.max(0, PERSONAL_ALLOWANCE - reduction);
}

/** Apply tapered PA to a fresh band stack (basic/higher/additional unchanged). */
function applyTaperedPA(income: number, bands: TaxBand[]): TaxBand[] {
  const pa = personalAllowance(income);
  // The first band is always the 0% PA band. Replace its upper bound with the tapered PA.
  return bands.map((b, i) => (i === 0 ? { ...b, upperBound: pa } : b));
}

/** Apply a band stack to taxable income. Returns total tax due. */
export function applyBands(taxable: number, bands: TaxBand[]): number {
  let prev = 0;
  let tax = 0;
  for (const band of bands) {
    if (taxable <= prev) break;
    const slice = Math.min(taxable, band.upperBound) - prev;
    if (slice > 0) tax += slice * band.rate;
    prev = band.upperBound;
  }
  return tax;
}

export function incomeTax(income: number, region: Region): number {
  if (income <= 0) return 0;
  const baseBands =
    region === "scotland" ? SCOTLAND_INCOME_BANDS : ENGLAND_WALES_INCOME_BANDS;
  const bands = applyTaperedPA(income, baseBands);
  return applyBands(income, bands);
}

/** Marginal income tax rate at a given total income, given region. */
export function marginalIncomeRate(income: number, region: Region): number {
  const baseBands =
    region === "scotland" ? SCOTLAND_INCOME_BANDS : ENGLAND_WALES_INCOME_BANDS;
  const bands = applyTaperedPA(income, baseBands);
  let prev = 0;
  for (const band of bands) {
    if (income < band.upperBound) return band.rate;
    prev = band.upperBound;
  }
  void prev;
  return bands[bands.length - 1].rate;
}

export function netIncome(income: number, region: Region): number {
  return income - incomeTax(income, region);
}
