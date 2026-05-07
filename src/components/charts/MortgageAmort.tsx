import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { UserProfile } from "@/engine/types";
import { amortise } from "@/engine/property/mortgage";
import { gbp } from "@/lib/utils";
import { chartTooltipContentStyle, chartTooltipWrapperStyle } from "@/lib/chart-theme";

interface Props {
  profile: UserProfile;
  overpayment?: number;
}

export function MortgageAmort({ profile, overpayment }: Props) {
  const data = useMemo(() => {
    const base = amortise({
      principal: profile.primaryMortgage,
      annualRate: profile.primaryMortgageRate,
      termYears: profile.primaryMortgageTermYears,
      type: profile.primaryMortgageType,
    });
    const op = amortise({
      principal: profile.primaryMortgage,
      annualRate: profile.primaryMortgageRate,
      termYears: profile.primaryMortgageTermYears,
      type: profile.primaryMortgageType,
      monthlyOverpayment: overpayment ?? profile.primaryOverpayment,
    });
    const maxLen = Math.max(base.length, op.length);
    const out = [] as Array<{ month: number; year: number; base: number; overpay: number }>;
    for (let i = 0; i < maxLen; i++) {
      out.push({
        month: i,
        year: Math.round(i / 12),
        base: base[i]?.balance ?? 0,
        overpay: op[i]?.balance ?? 0,
      });
    }
    return out;
  }, [profile, overpayment]);

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey="year"
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
          stroke="hsl(var(--border))"
          label={{ value: "Years", fill: "hsl(var(--muted-foreground))", fontSize: 11, position: "insideBottom", offset: -2 }}
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
          formatter={(v: number) => gbp(v)}
          labelFormatter={(label) => `Year ${label}`}
        />
        <Line
          type="monotone"
          dataKey="base"
          stroke="#64748b"
          strokeWidth={2}
          dot={false}
          name="Base balance"
          isAnimationActive={false}
        />
        <Line
          type="monotone"
          dataKey="overpay"
          stroke="#0f766e"
          strokeWidth={2}
          dot={false}
          name="With overpayment"
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
