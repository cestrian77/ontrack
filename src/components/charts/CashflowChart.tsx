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
  const mode = useUiStore((s) => s.inflationToggle);

  const data = useMemo(
    () => buildCashflowSeriesData({ profile, projection, taxYearPack, mode }),
    [projection, profile, taxYearPack, mode],
  );

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
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
          formatter={(value, name) => {
            if (value == null || value === "") return ["—", String(name)];
            const n = typeof value === "number" ? value : Number(value);
            return [Number.isFinite(n) ? gbp(n) : "—", String(name)];
          }}
          labelFormatter={(label) => `Age ${label}`}
        />
        <Legend wrapperStyle={{ fontSize: 11 }} />
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
  );
}
