import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useProjection } from "@/lib/hooks";
import { FireRing } from "@/components/charts/FireRing";
import { FireTimeline } from "@/components/charts/FireTimeline";
import { Waterfall } from "@/components/charts/Waterfall";
import { MetricHint } from "@/components/ui/metric-hint";
import { FIRE_AGE_TOOLTIP, FIRE_PROGRESS_TOOLTIP } from "@/lib/fireMetricsExplain";
import { gbp, pct } from "@/lib/utils";

export default function Fire() {
  const { projection, fire, analysisProfile } = useProjection();

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              FIRE progress
              <MetricHint text={FIRE_PROGRESS_TOOLTIP} />
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Investable wealth vs FIRE number (excludes property equity).
            </p>
          </CardHeader>
          <CardContent>
            <FireRing fire={fire} />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Path to FIRE</CardTitle>
          </CardHeader>
          <CardContent>
            <FireTimeline profile={analysisProfile} fire={fire} />
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <Stat
                label="FIRE age"
                value={fire.fireAge ? `${fire.fireAge}` : "Beyond horizon"}
                hint={FIRE_AGE_TOOLTIP}
                badge={
                  fire.fireAge &&
                  fire.fireAge <= analysisProfile.retirementTargetAge
                    ? "On track"
                    : "Watch"
                }
                badgeVariant={
                  fire.fireAge &&
                  fire.fireAge <= analysisProfile.retirementTargetAge
                    ? "success"
                    : "warning"
                }
              />
              <Stat
                label="Years to FIRE"
                value={fire.yearsToFire !== null ? `${fire.yearsToFire}` : "—"}
              />
              <Stat label="Savings rate" value={pct(fire.savingsRate, 1)} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <FireCard
          label="Full FIRE"
          value={fire.fireNumber}
          note={`${pct(analysisProfile.safeWithdrawalRate, 2)} SWR`}
        />
        <FireCard
          label="Lean FIRE"
          value={fire.leanFireNumber}
          note={`${pct(analysisProfile.leanFirePct, 0)} of target`}
        />
        <FireCard
          label="Fat FIRE"
          value={fire.fatFireNumber}
          note={`${pct(analysisProfile.fatFirePct, 0)} of target`}
        />
        <FireCard
          label="Coast FIRE"
          value={fire.coastFireNumber}
          note={fire.coastReached ? "Reached" : "Not yet"}
          highlight={fire.coastReached}
        />
        <FireCard
          label="Barista FIRE"
          value={fire.baristaFireNumber}
          note={`${gbp(analysisProfile.baristaPartTimeIncome)}/yr part-time`}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contribution impact at retirement</CardTitle>
          <p className="text-xs text-muted-foreground">
            How each contribution stream and growth driver builds your investable wealth at age{" "}
            {analysisProfile.retirementTargetAge}.
          </p>
        </CardHeader>
        <CardContent>
          <Waterfall profile={analysisProfile} projection={projection} />
        </CardContent>
      </Card>
    </div>
  );
}

function FireCard({
  label,
  value,
  note,
  highlight,
}: {
  label: string;
  value: number;
  note?: string;
  highlight?: boolean;
}) {
  return (
    <Card className={highlight ? "ring-1 ring-success/40" : undefined}>
      <CardContent className="pt-4 pb-4">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        <div className="text-xl font-semibold tabular-nums mt-1">{gbp(value)}</div>
        {note && <div className="text-xs text-muted-foreground mt-1">{note}</div>}
      </CardContent>
    </Card>
  );
}

function Stat({
  label,
  value,
  hint,
  badge,
  badgeVariant,
}: {
  label: string;
  value: string;
  hint?: string;
  badge?: string;
  badgeVariant?: "success" | "warning" | "default";
}) {
  return (
    <div className="rounded-md border p-3">
      <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground">
        <span>{label}</span>
        {hint ? <MetricHint text={hint} /> : null}
      </div>
      <div className="flex items-center justify-between gap-2 mt-1">
        <div className="text-lg font-semibold tabular-nums">{value}</div>
        {badge && (
          <Badge variant={badgeVariant ?? "default"}>{badge}</Badge>
        )}
      </div>
    </div>
  );
}
