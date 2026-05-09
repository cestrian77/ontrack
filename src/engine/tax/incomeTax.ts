import type { Region } from "@/engine/types";
import type { TaxBand, TaxYearPack } from "@/engine/constants/taxYears";
import { currentTaxYearPack } from "@/engine/constants/taxYears";

/**
 * UK Personal Allowance taper (PRD §5.3.1):
 * For income > £100k, PA reduces by £1 per £2; fully withdrawn at £125,140.
 */
export function personalAllowance(
  income: number,
  pack: TaxYearPack = currentTaxYearPack(),
): number {
  if (income <= pack.paTaperStart) return pack.personalAllowance;
  if (income >= pack.paTaperEnd) return 0;
  const reduction = Math.floor((income - pack.paTaperStart) / 2);
  return Math.max(0, pack.personalAllowance - reduction);
}

/** Apply tapered PA to a fresh band stack (basic/higher/additional unchanged). */
function applyTaperedPA(income: number, bands: TaxBand[], pack: TaxYearPack): TaxBand[] {
  const pa = personalAllowance(income, pack);
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

export function incomeTax(
  income: number,
  region: Region,
  pack: TaxYearPack = currentTaxYearPack(),
): number {
  if (income <= 0) return 0;
  const baseBands =
    region === "scotland" ? pack.scotlandIncomeBands : pack.englandWalesIncomeBands;
  const bands = applyTaperedPA(income, baseBands, pack);
  return applyBands(income, bands);
}

/** Marginal income tax rate at a given total income, given region. */
export function marginalIncomeRate(
  income: number,
  region: Region,
  pack: TaxYearPack = currentTaxYearPack(),
): number {
  const baseBands =
    region === "scotland" ? pack.scotlandIncomeBands : pack.englandWalesIncomeBands;
  const bands = applyTaperedPA(income, baseBands, pack);
  let prev = 0;
  for (const band of bands) {
    if (income < band.upperBound) return band.rate;
    prev = band.upperBound;
  }
  void prev;
  return bands[bands.length - 1].rate;
}

export function netIncome(
  income: number,
  region: Region,
  pack: TaxYearPack = currentTaxYearPack(),
): number {
  return income - incomeTax(income, region, pack);
}
