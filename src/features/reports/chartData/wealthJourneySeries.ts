import type { TaxYearPack } from "@/engine/constants/taxYears";
import type { Projection, Scenario, UserProfile } from "@/engine/types";
import { applyScenario } from "@/engine/scenarios/templates";
import { runProjection } from "@/engine/project/runProjection";
import { computeFire } from "@/engine/fire/fire";
import { nominalise } from "@/lib/utils";
import { scenarioTaxYearPack } from "@/lib/taxYearContext";
import { PROJECTION_ASSET_LAYERS, type ProjectionAssetKey } from "@/lib/projection-assets";

export const WEALTH_JOURNEY_LAYER_COLOURS: Record<ProjectionAssetKey, string> = {
  pensionValue: "#0f766e",
  isaValue: "#d4a017",
  cashIsaValue: "#fbbf24",
  lisaValue: "#a855f7",
  giaValue: "#10b981",
  cashValue: "#64748b",
  primaryEquity: "#1e3a8a",
  btlEquity: "#3b82f6",
};

export type InflationChartMode = "real" | "nominal";

/** One row per projection year; keys match WealthJourney / Recharts `dataKey`s. */
export type WealthJourneyChartRow = Record<string, number>;

export function buildWealthJourneySeriesData({
  profile,
  projection,
  scenarios,
  mode,
  baseTaxYearPack,
}: {
  profile: UserProfile;
  projection: Projection;
  scenarios: Scenario[];
  mode: InflationChartMode;
  baseTaxYearPack: TaxYearPack;
}): { rows: WealthJourneyChartRow[]; fireY: number } {
  const cpi = profile.cpi;
  const scenarioProjections = scenarios.map((s) =>
    runProjection(applyScenario(profile, s), {
      taxYearPack: scenarioTaxYearPack(baseTaxYearPack, s.params?.taxYearLabel),
    }),
  );

  const rows = projection.years.map((y, i) => {
    const factor = mode === "nominal" ? Math.pow(1 + cpi, i) : 1;
    const row: WealthJourneyChartRow = { age: y.age };
    for (const layer of PROJECTION_ASSET_LAYERS) {
      row[layer.key] = (y[layer.key] as number) * factor;
    }
    row.totalNetWorth = y.totalNetWorth * factor;
    scenarioProjections.forEach((sp, idx) => {
      const point = sp.years[i];
      if (point) {
        row[`scenario_${idx}`] = point.totalNetWorth * factor;
      }
    });
    return row;
  });

  const fire = computeFire(profile, projection, baseTaxYearPack);
  const fireY =
    mode === "nominal"
      ? nominalise(
          fire.fireNumber,
          cpi,
          projection.meta.retirementAge - projection.meta.currentAge,
        )
      : fire.fireNumber;

  return { rows, fireY };
}
