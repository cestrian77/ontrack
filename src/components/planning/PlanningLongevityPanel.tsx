import { useMemo } from "react";
import {
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Bar,
} from "recharts";
import type { Projection, UserProfile } from "@/engine/types";
import {
  buildPlanningChartRows,
  summarizePlanning,
} from "@/engine/planning/summary";
import { gbp, pct } from "@/lib/utils";
import { chartTooltipContentStyle, chartTooltipWrapperStyle } from "@/lib/chart-theme";
import { useIsNarrowScreen } from "@/lib/hooks";
import { Link } from "react-router-dom";

interface Props {
  projection: Projection;
  primary: UserProfile;
  partner?: UserProfile | null;
  partnerProjection?: Projection | null;
}

export function PlanningLongevityPanel({
  projection,
  primary,
  partner,
  partnerProjection,
}: Props) {
  const narrow = useIsNarrowScreen();
  const summary = useMemo(
    () =>
      summarizePlanning(projection, {
        primary,
        partner,
        partnerProjection,
      }),
    [projection, primary, partner, partnerProjection],
  );

  const chartRows = useMemo(() => buildPlanningChartRows(projection), [projection]);
  const showChart =
    summary.hasCare ||
    summary.hasGuardrails ||
    chartRows.some((r) => r.careCost > 0 || r.guardrailMultiplier != null);

  if (!summary.hasCare && !summary.hasGuardrails && !summary.hasEstate) {
    return (
      <p className="text-sm text-muted-foreground">
        Enable care costs, spending guardrails, or estate IHT modelling in{" "}
        <Link className="text-primary underline" to="/settings">Settings</Link> to see them here.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {summary.hasCare && (
          <Metric
            label="Peak care cost (household)"
            value={gbp(summary.peakAnnualCare)}
            sub={`${summary.totalCareYears} years in plan`}
          />
        )}
        {summary.hasGuardrails && summary.latestGuardrailMultiplier != null && (
          <Metric
            label="Guardrail multiplier (latest)"
            value={pct(summary.latestGuardrailMultiplier * 100, 0)}
            sub="Of planned spending"
          />
        )}
        {summary.estateByPerson.map((e) => (
          <Metric
            key={e.label}
            label={`IHT estimate — ${e.label}`}
            value={gbp(e.ihtDue)}
            sub={`At age ${e.age} (illustrative)`}
          />
        ))}
        {summary.estateByPerson.length > 1 && (
          <Metric
            label="Household IHT (sum)"
            value={gbp(summary.householdEstateIht)}
            sub="Not joint-estate optimised"
          />
        )}
      </div>

      {showChart && (
        <ResponsiveContainer width="100%" height={narrow ? 260 : 300}>
          <ComposedChart data={chartRows} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="age"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              stroke="hsl(var(--border))"
            />
            <YAxis
              yAxisId="care"
              tickFormatter={(v) => gbp(Number(v))}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              stroke="hsl(var(--border))"
            />
            <YAxis
              yAxisId="mult"
              orientation="right"
              domain={[0.5, 1.5]}
              tickFormatter={(v) => `${Math.round(Number(v) * 100)}%`}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              stroke="hsl(var(--border))"
            />
            <Tooltip
              wrapperStyle={chartTooltipWrapperStyle}
              contentStyle={chartTooltipContentStyle}
              formatter={(value: number, name: string) => {
                if (name === "Guardrail") {
                  return [pct(value * 100, 0), name];
                }
                return [gbp(value), name];
              }}
            />
            <Legend />
            {summary.hasCare && (
              <Bar
                yAxisId="care"
                dataKey="careCost"
                name="Care cost"
                fill="hsl(var(--chart-4))"
                radius={[2, 2, 0, 0]}
              />
            )}
            {summary.hasGuardrails && (
              <Line
                yAxisId="mult"
                type="monotone"
                dataKey="guardrailMultiplier"
                name="Guardrail"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
                connectNulls
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      )}

      <p className="text-xs text-muted-foreground">
        Illustrative only — not tax or care advice. Partner care/IHT uses each person&apos;s Settings;
        household chart sums care and averages guardrail multipliers when both are active.
      </p>
    </div>
  );
}

function Metric({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-md border border-border bg-muted/20 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold tabular-nums mt-0.5">{value}</div>
      {sub ? <div className="text-xs text-muted-foreground mt-1">{sub}</div> : null}
    </div>
  );
}
