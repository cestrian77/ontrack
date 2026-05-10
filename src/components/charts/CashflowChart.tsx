import { useMemo } from "react";
import {
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
import type { TaxYearPack } from "@/engine/constants/taxYears";
import type { Projection, UserProfile } from "@/engine/types";
import { gbp } from "@/lib/utils";
import { chartTooltipContentStyle, chartTooltipWrapperStyle } from "@/lib/chart-theme";
import { useIsNarrowScreen } from "@/lib/hooks";
import { useUiStore } from "@/store/useUiStore";
import { buildCashflowSeriesData } from "@/features/reports/chartData/cashflowSeries";

interface Props {
  profile: UserProfile;
  projection: Projection;
  taxYearPack: TaxYearPack;
  height?: number;
}

/**
 * Annual cash inflow: employment take-home + other income + BTL net while working;
 * in retirement, state + DB + drawdown + BTL net. Respects Real/Nominal toggle.
 */
export function CashflowChart({ profile, projection, taxYearPack, height = 280 }: Props) {
  const narrow = useIsNarrowScreen();
  const effHeight = narrow ? Math.max(height, 260) : height;
  const mode = useUiStore((s) => s.inflationToggle);

  const data = useMemo(
    () => buildCashflowSeriesData({ profile, projection, taxYearPack, mode }),
    [projection, profile, taxYearPack, mode],
  );

  return (
    <>
      {narrow ? (
        <p className="text-xs text-muted-foreground mb-2 md:hidden">Tap the chart for details.</p>
      ) : null}
      <ResponsiveContainer width="100%" height={effHeight}>
      <ComposedChart data={data} margin={{ top: 8, right: narrow ? 8 : 16, left: 0, bottom: narrow ? 8 : 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey="age"
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: narrow ? 10 : 11 }}
          stroke="hsl(var(--border))"
          interval="preserveStartEnd"
          minTickGap={narrow ? 24 : 8}
        />
        <YAxis
          tickFormatter={(v) => gbp(Number(v))}
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: narrow ? 10 : 11 }}
          stroke="hsl(var(--border))"
          width={narrow ? 56 : 70}
        />
        <Tooltip
          trigger={narrow ? "click" : "hover"}
          wrapperStyle={chartTooltipWrapperStyle}
          contentStyle={chartTooltipContentStyle}
          formatter={(value, name) => {
            if (value == null || value === "") return ["—", String(name)];
            const n = typeof value === "number" ? value : Number(value);
            return [Number.isFinite(n) ? gbp(n) : "—", String(name)];
          }}
          labelFormatter={(label) => `Age ${label}`}
        />
        <Legend wrapperStyle={{ fontSize: narrow ? 10 : 11 }} />
        <Line
          type="monotone"
          dataKey="cashflow"
          name="Total inflow"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
        <Line
          type="monotone"
          dataKey="target"
          name="Income target (retirement)"
          stroke="hsl(var(--muted-foreground))"
          strokeWidth={1.5}
          strokeDasharray="4 4"
          dot={false}
          connectNulls
          isAnimationActive={false}
        />
        <ReferenceLine
          x={profile.retirementTargetAge}
          stroke="hsl(var(--foreground))"
          strokeDasharray="4 4"
          strokeOpacity={0.55}
          label={{
            value: "Retirement",
            fill: "hsl(var(--foreground))",
            fontSize: 11,
            position: "insideTop",
          }}
        />
      </ComposedChart>
    </ResponsiveContainer>
    </>
  );
}
