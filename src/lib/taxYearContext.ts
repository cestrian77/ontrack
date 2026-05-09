import type { TaxYearPack } from "@/engine/constants/taxYears";
import { currentTaxYearPack, taxYearPackByLabel } from "@/engine/constants/taxYears";

export function baseTaxYearPack(analysisTaxYearLabel: string | null): TaxYearPack {
  if (analysisTaxYearLabel) return taxYearPackByLabel(analysisTaxYearLabel);
  return currentTaxYearPack();
}

export function scenarioTaxYearPack(
  basePack: TaxYearPack,
  scenarioTaxYearLabel?: string,
): TaxYearPack {
  if (scenarioTaxYearLabel) return taxYearPackByLabel(scenarioTaxYearLabel);
  return basePack;
}
