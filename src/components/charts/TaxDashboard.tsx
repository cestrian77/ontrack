import type { TaxYearPack } from "@/engine/constants/taxYears";
import type { Projection, UserProfile } from "@/engine/types";
import { gbp } from "@/lib/utils";
import { buildTaxDashboardReport } from "@/lib/taxDashboardReport";
import { buildTaxYearOutlook } from "@/lib/taxYearOutlook";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  profile: UserProfile;
  taxYearPack: TaxYearPack;
  projection?: Projection;
}

export function TaxDashboard({ profile, taxYearPack, projection }: Props) {
  const model = buildTaxDashboardReport(profile, taxYearPack);
  const outlook = buildTaxYearOutlook(profile, taxYearPack, projection);

  return (
    <div className="space-y-4">
      {outlook && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Upcoming tax year ({outlook.nextPackLabel})</CardTitle>
            <p className="text-xs text-muted-foreground">{outlook.headline}</p>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {outlook.rows.map((r) => (
              <Row
                key={r.label}
                label={r.label}
                value={r.value}
                muted={r.emphasis === "muted"}
                negative={r.emphasis === "negative"}
              />
            ))}
            <p className="text-xs text-muted-foreground pt-1">
              Projections step tax rules by calendar year unless you pin a ruleset in Settings.
              Personal allowance ordering for property is not modelled yet.
            </p>
          </CardContent>
        </Card>
      )}
    <div className="grid gap-4 lg:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Allowance usage ({model.packLabel})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {model.allowances.map((a) => (
            <AllowanceBar key={a.label} label={a.label} used={a.used} cap={a.cap} />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Income breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {model.incomeRows.map((r) => (
            <Row
              key={r.label}
              label={r.label}
              value={r.value}
              muted={r.emphasis === "muted"}
              bold={r.emphasis === "bold"}
            />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Pension tax relief</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {model.pensionRows.map((r) => (
            <Row
              key={r.label}
              label={r.label}
              value={r.value}
              bold={r.emphasis === "bold"}
              positive={r.emphasis === "positive"}
            />
          ))}
          <p className="text-xs text-muted-foreground pt-2">{model.pensionReliefNote}</p>
        </CardContent>
      </Card>
    </div>
    </div>
  );
}

function AllowanceBar({ label, used, cap }: { label: string; used: number; cap: number }) {
  const ratio = cap > 0 ? Math.min(1, used / cap) : 0;
  const colour = ratio > 0.95 ? "bg-destructive" : ratio > 0.8 ? "bg-warning" : "bg-primary";
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="tabular-nums">
          {gbp(used)} / {gbp(cap)}
        </span>
      </div>
      <div className="h-2 rounded-full bg-secondary overflow-hidden">
        <div className={`h-full ${colour}`} style={{ width: `${ratio * 100}%` }} />
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  muted,
  bold,
  positive,
  negative,
}: {
  label: string;
  value: string;
  muted?: boolean;
  bold?: boolean;
  positive?: boolean;
  negative?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={[
          "tabular-nums",
          bold ? "font-semibold" : "",
          positive ? "text-success" : "",
          negative ? "text-destructive" : "",
          muted && !bold ? "text-foreground/80" : "",
        ].join(" ")}
      >
        {value}
      </span>
    </div>
  );
}
