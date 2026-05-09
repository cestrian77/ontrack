import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TaxYearPack } from "@/engine/constants/taxYears";
import type { Projection, UserProfile } from "@/engine/types";
import { btlAnnualCashflow, btlYields } from "@/engine/btl/cashflow";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { gbp } from "@/lib/utils";
import { chartTooltipContentStyle, chartTooltipWrapperStyle } from "@/lib/chart-theme";

interface Props {
  profile: UserProfile;
  projection: Projection;
  taxYearPack: TaxYearPack;
}

export function BTLDashboard({ profile, projection, taxYearPack }: Props) {
  if (profile.btlProperties.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No BTL properties yet. Add some during onboarding or in Settings.
      </div>
    );
  }
  const cards = profile.btlProperties.map((p) => {
    const cf = btlAnnualCashflow(p, profile.grossSalary, profile.region, {
      taxYearPack,
    });
    const y = btlYields(p, cf);
    return { p, cf, y };
  });

  const trajectory = projection.years.map((y) => ({
    age: y.age,
    equity: y.btlEquity,
    cashflow: y.btlCashflowNet,
  }));

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(({ p, cf, y }, idx) => (
          <Card key={p.id}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">
                {p.label?.trim() || `BTL ${idx + 1}`}: {gbp(p.value)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Row label="Gross yield" value={`${y.grossYield.toFixed(2)}%`} />
              <Row label="Net yield" value={`${y.netYield.toFixed(2)}%`} />
              <Row label="Cash-on-cash" value={`${y.cashOnCash.toFixed(2)}%`} />
              <Row
                label="Monthly cashflow (post-tax)"
                value={gbp(cf.netCashflow / 12)}
                positive={cf.netCashflow >= 0}
              />
              <Row label="Current equity" value={gbp(p.value - p.mortgageBalance)} />
              <Row label="S24 credit" value={gbp(cf.s24Credit)} />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Portfolio equity trajectory</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trajectory}>
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
                formatter={(v: number) => gbp(v)}
                labelFormatter={(label) => `Age ${label}`}
              />
              <Line
                type="monotone"
                dataKey="equity"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Annual net cashflow</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={trajectory}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="age" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} stroke="hsl(var(--border))" />
              <YAxis tickFormatter={(v) => gbp(Number(v))} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} stroke="hsl(var(--border))" width={70} />
              <Tooltip
                wrapperStyle={chartTooltipWrapperStyle}
                contentStyle={chartTooltipContentStyle}
                formatter={(v: number) => gbp(v)}
                labelFormatter={(label) => `Age ${label}`}
              />
              <Bar dataKey="cashflow" fill="#3b82f6" radius={[4, 4, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span
        className={`tabular-nums font-medium ${
          positive === undefined
            ? ""
            : positive
              ? "text-success"
              : "text-destructive"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

