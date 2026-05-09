import { useMemo } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Projection, Scenario, UserProfile } from "@/engine/types";
import { gbp } from "@/lib/utils";
import { baseTaxYearPack } from "@/lib/taxYearContext";
import { PROJECTION_ASSET_LAYERS } from "@/lib/projection-assets";
import { chartTooltipContentStyle, chartTooltipWrapperStyle } from "@/lib/chart-theme";
import { useUiStore } from "@/store/useUiStore";
import {
  buildWealthJourneySeriesData,
  WEALTH_JOURNEY_LAYER_COLOURS,
} from "@/features/reports/chartData/wealthJourneySeries";

interface Props {
  profile: UserProfile;
  projection: Projection;
  scenarios?: Scenario[];
  height?: number;
  resolveScenarioProfile?: (scenario: Scenario) => UserProfile;
}

export function WealthJourney({
  profile,
  projection,
  scenarios = [],
  height = 360,
  resolveScenarioProfile,
}: Props) {
  const mode = useUiStore((s) => s.inflationToggle);
  const analysisTaxYearLabel = useUiStore((s) => s.analysisTaxYearLabel);
  const basePack = useMemo(
    () => baseTaxYearPack(analysisTaxYearLabel),
    [analysisTaxYearLabel],
  );

  const { rows: data, fireY } = useMemo(
    () =>
      buildWealthJourneySeriesData({
        profile,
        projection,
        scenarios,
        mode,
        baseTaxYearPack: basePack,
        resolveScenarioProfile,
      }),
    [projection, mode, scenarios, profile, basePack, resolveScenarioProfile],
  );

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 28, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey="age"
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
          stroke="hsl(var(--border))"
        />
        <YAxis
          tickFormatter={(v) => gbp(Number(v))}
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
          stroke="hsl(var(--border))"
          width={70}
        />
        <Tooltip
          wrapperStyle={chartTooltipWrapperStyle}
          contentStyle={chartTooltipContentStyle}
          formatter={(value: number, name: string) => [gbp(value), name]}
          labelFormatter={(label) => `Age ${label}`}
        />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        {PROJECTION_ASSET_LAYERS.map((l) => (
          <Area
            key={l.key}
            type="monotone"
            dataKey={l.key}
            stackId="wealth"
            stroke={WEALTH_JOURNEY_LAYER_COLOURS[l.key]}
            fill={WEALTH_JOURNEY_LAYER_COLOURS[l.key]}
            fillOpacity={0.7}
            name={l.label}
            isAnimationActive={false}
          />
        ))}
        <ReferenceLine
          x={profile.retirementTargetAge}
          stroke="hsl(var(--foreground))"
          strokeDasharray="4 4"
          strokeOpacity={0.85}
          label={{
            value: "Retirement",
            fill: "#f8fafc",
            stroke: "#0f172a",
            strokeWidth: 0.6,
            fontSize: 11,
            fontWeight: 600,
            position: "insideTop",
          }}
        />
        <ReferenceLine
          x={projection.meta.nmpa}
          stroke="hsl(var(--foreground))"
          strokeDasharray="2 4"
          strokeOpacity={0.45}
          label={{ value: "NMPA", fill: "hsl(var(--foreground))", fontSize: 10, position: "top" }}
        />
        <ReferenceLine
          x={projection.meta.spa}
          stroke="hsl(var(--foreground))"
          strokeDasharray="2 4"
          strokeOpacity={0.45}
          label={{ value: "SPA", fill: "hsl(var(--foreground))", fontSize: 10, position: "top" }}
        />
        <ReferenceLine
          y={fireY}
          stroke="hsl(var(--success))"
          strokeDasharray="4 4"
          label={{
            value: `FIRE ${gbp(fireY)}`,
            fill: "hsl(var(--foreground))",
            fontSize: 10,
            position: "right",
          }}
        />
        {scenarios.map((s, idx) => (
          <Line
            key={s.id}
            type="monotone"
            dataKey={`scenario_${idx}`}
            stroke={s.colour}
            strokeWidth={2}
            dot={false}
            name={s.name}
            isAnimationActive={false}
          />
        ))}
        <Line
          type="monotone"
          dataKey="totalNetWorth"
          stroke="transparent"
          dot={false}
          activeDot={false}
          name="Total"
          isAnimationActive={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
