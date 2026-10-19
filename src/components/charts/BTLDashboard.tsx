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
import { buildBtlPropertyReportBlocks } from "@/lib/taxDashboardReport";
import { buildTaxYearOutlook } from "@/lib/taxYearOutlook";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { gbp, nominalise } from "@/lib/utils";
import { chartTooltipContentStyle, chartTooltipWrapperStyle } from "@/lib/chart-theme";
import { useUiStore } from "@/store/useUiStore";

interface Props {
  profile: UserProfile;
  projection: Projection;
  taxYearPack: TaxYearPack;
}

export function BTLDashboard({ profile, projection, taxYearPack }: Props) {
  const mode = useUiStore((s) => s.inflationToggle);

  if (profile.btlProperties.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No BTL properties yet. Add some during onboarding or in Settings.
      </div>
    );
  }
  const btlBlocks = buildBtlPropertyReportBlocks(profile, taxYearPack);
  const outlook = buildTaxYearOutlook(profile, taxYearPack, projection);
  const taxStepYear = projection.years.find(
    (y, i) => i > 0 && y.taxYearLabel !== projection.years[i - 1]?.taxYearLabel,
  );

  const trajectory = projection.years.map((y, i) => ({
    age: y.age,
    equity: mode === "nominal" ? nominalise(y.btlEquity, profile.cpi, i) : y.btlEquity,
    cashflow:
      mode === "nominal"
        ? nominalise(y.btlCashflowNet, profile.cpi, i)
        : y.btlCashflowNet,
  }));

  return (
    <div className="space-y-6">
      {outlook && (
        <p className="text-xs text-muted-foreground rounded-md border border-border/60 bg-muted/30 px-3 py-2">
          {outlook.headline}: portfolio net cashflow about{" "}
          <span className="font-medium text-foreground">
            {outlook.btlAnnualDelta != null && outlook.btlAnnualDelta < 0
              ? `${gbp(-outlook.btlAnnualDelta)} lower`
              : "unchanged"}
          </span>{" "}
          vs {taxYearPack.label} at today&apos;s rents.
          {projection.meta.steppedTaxYears && taxStepYear
            ? ` Projections apply ${taxStepYear.taxYearLabel} from ${taxStepYear.year}.`
            : null}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {btlBlocks.map((block) => (
          <Card key={block.propertyId}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">{block.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {block.rows.map((r) => (
                <Row
                  key={r.label}
                  label={r.label}
                  value={r.value}
                  positive={
                    r.emphasis === "positive"
                      ? true
                      : r.emphasis === "negative"
                        ? false
                        : undefined
                  }
                  muted={r.emphasis === "muted"}
                />
              ))}
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

function Row({
  label,
  value,
  positive,
  muted,
}: {
  label: string;
  value: string;
  positive?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span
        className={`tabular-nums font-medium ${
          positive === undefined
            ? muted
              ? "text-foreground/80"
              : ""
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

