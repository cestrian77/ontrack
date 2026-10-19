import type { Region } from "@/engine/types";
import type { TaxBand, TaxYearPack } from "@/engine/constants/taxYears";
import { currentTaxYearPack } from "@/engine/constants/taxYears";
import { applyBands, personalAllowance } from "@/engine/tax/incomeTax";

function applyTaperedPA(income: number, bands: TaxBand[], pack: TaxYearPack): TaxBand[] {
  const pa = personalAllowance(income, pack);
  return bands.map((b, i) => (i === 0 ? { ...b, upperBound: pa } : b));
}

export function propertyIncomeBands(
  region: Region,
  pack: TaxYearPack = currentTaxYearPack(),
): TaxBand[] {
  return region === "scotland"
    ? pack.scotlandPropertyIncomeBands
    : pack.englandWalesPropertyIncomeBands;
}

/** Marginal rate on the next £1 of UK property (rental) income at a given total income level. */
export function marginalPropertyIncomeRate(
  income: number,
  region: Region,
  pack: TaxYearPack = currentTaxYearPack(),
): number {
  const bands = applyTaperedPA(income, propertyIncomeBands(region, pack), pack);
  for (const band of bands) {
    if (income < band.upperBound) return band.rate;
  }
  return bands[bands.length - 1].rate;
}

export function propertyIncomeTax(
  income: number,
  region: Region,
  pack: TaxYearPack = currentTaxYearPack(),
): number {
  if (income <= 0) return 0;
  const bands = applyTaperedPA(income, propertyIncomeBands(region, pack), pack);
  return applyBands(income, bands);
}
