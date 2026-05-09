import type { TaxYearPack } from "@/engine/constants/taxYears";
import type { Projection, UserProfile } from "@/engine/types";
import {
  annualNetEmploymentIncome,
  annualOtherIncome,
} from "@/engine/cashflow/employmentIncome";
import type { InflationChartMode } from "@/features/reports/chartData/wealthJourneySeries";

export interface CashflowChartRow {
  age: number;
  cashflow: number;
  target: number | null;
}

export function buildCashflowSeriesData({
  profile,
  projection,
  taxYearPack,
  mode,
}: {
  profile: UserProfile;
  projection: Projection;
  taxYearPack: TaxYearPack;
  mode: InflationChartMode;
}): CashflowChartRow[] {
  const cpi = profile.cpi;
  const netEmployed =
    annualNetEmploymentIncome(profile, taxYearPack) + annualOtherIncome(profile);

  return projection.years.map((y, i) => {
    const factor = mode === "nominal" ? Math.pow(1 + cpi, i) : 1;
    const passive =
      y.statePensionIncome + y.dbIncome + y.drawdownIncome + y.btlCashflowNet;
    const gross = y.retired ? passive : netEmployed + y.btlCashflowNet;
    const target =
      y.retired && profile.targetRetirementIncome > 0
        ? profile.targetRetirementIncome * factor
        : null;
    return {
      age: y.age,
      cashflow: gross * factor,
      target,
    };
  });
}
