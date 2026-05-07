import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Projection, UserProfile } from "@/engine/types";
import { gbp } from "@/lib/utils";
import { chartTooltipContentStyle, chartTooltipWrapperStyle } from "@/lib/chart-theme";
import { PERSONAL_ALLOWANCE, BASIC_RATE_THRESHOLD_EW } from "@/engine/constants/uk";

interface Props {
  profile: UserProfile;
  projection: Projection;
}

const COLOURS = ["#1e3a8a", "#0f766e", "#3b82f6", "#d4a017", "#10b981", "#a855f7"];

export function IncomeStack({ profile, projection }: Props) {
  const atRet = projection.years.find((y) => y.age === profile.retirementTargetAge);
  if (!atRet) return null;
  const data = [
    { source: "State Pension", value: atRet.statePensionIncome },
    { source: "DB Pension", value: atRet.dbIncome },
    { source: "DC Drawdown", value: Math.max(0, atRet.drawdownIncome - (atRet.dbIncome + atRet.statePensionIncome) > 0 ? 0 : 0) + Math.max(0, atRet.drawdownIncome) },
    { source: "ISA withdrawals", value: 0 },
    { source: "BTL net", value: Math.max(0, atRet.btlCashflowNet) },
    { source: "GIA", value: 0 },
  ];

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart layout="vertical" data={data} margin={{ left: 24, right: 16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          type="number"
          tickFormatter={(v) => gbp(Number(v))}
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
          stroke="hsl(var(--border))"
        />
        <YAxis
          type="category"
          dataKey="source"
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
          stroke="hsl(var(--border))"
          width={120}
        />
        <Tooltip
          wrapperStyle={chartTooltipWrapperStyle}
          contentStyle={chartTooltipContentStyle}
          formatter={(v: number) => gbp(v)}
        />
        <ReferenceLine
          x={profile.targetRetirementIncome}
          stroke="hsl(var(--accent))"
          strokeDasharray="4 4"
          label={{ value: "Target", fill: "hsl(var(--accent))", fontSize: 11, position: "top" }}
        />
        <ReferenceLine
          x={PERSONAL_ALLOWANCE}
          stroke="hsl(var(--muted-foreground))"
          strokeDasharray="2 4"
        />
        <ReferenceLine
          x={BASIC_RATE_THRESHOLD_EW}
          stroke="hsl(var(--muted-foreground))"
          strokeDasharray="2 4"
        />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} isAnimationActive={false}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLOURS[i % COLOURS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
