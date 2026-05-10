import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useProjection } from "@/lib/hooks";
import { FireRing } from "@/components/charts/FireRing";
import { FireTimeline } from "@/components/charts/FireTimeline";
import { Waterfall } from "@/components/charts/Waterfall";
import { MetricHint } from "@/components/ui/metric-hint";
import { FIRE_AGE_TOOLTIP, FIRE_PROGRESS_TOOLTIP } from "@/lib/fireMetricsExplain";
import { gbp, pct } from "@/lib/utils";
import { useProfileStore } from "@/store/useProfileStore";
import { useUiStore } from "@/store/useUiStore";
import { FireCalculationSection } from "@/components/fire/FireCalculationSection";
import {
  isNonDefaultFireCalculationPrefs,
  mergeFireCalculationPrefs,
} from "@/engine/fire/firePrefs";

export default function Fire() {
  const { projection, fire, analysisProfile } = useProjection();
  const profile = useProfileStore((s) => s.profile);
  const partnerProfile = useProfileStore((s) => s.partnerProfile);
  const update = useProfileStore((s) => s.update);
  const updatePartner = useProfileStore((s) => s.updatePartner);
  const analysisViewMode = useUiStore((s) => s.analysisViewMode);
  const activePersonId = useUiStore((s) => s.activePersonId);

  const household =
    (analysisViewMode === "couple" || analysisViewMode === "family") &&
    partnerProfile !== null;

  const prefsForUi = mergeFireCalculationPrefs(
    household
      ? profile.fireCalculationPrefs
      : activePersonId === "partner" && partnerProfile
        ? partnerProfile.fireCalculationPrefs
        : profile.fireCalculationPrefs,
  );

  const savePrefs = (next: typeof prefsForUi) => {
    if (household) update({ fireCalculationPrefs: next });
    else if (activePersonId === "partner" && partnerProfile)
      updatePartner({ fireCalculationPrefs: next });
    else update({ fireCalculationPrefs: next });
  };

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
              FIRE pot vs effective number (property equity excluded). Classic: {gbp(fire.fireNumber)}.
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

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>FIRE calculation</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {household
                ? "Household view uses the primary account holder’s settings in the section below."
                : "Net off passive income and choose which balances count toward progress."}
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/settings">All Settings</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {/* defaultOpen is valid on <details>; some DOM typings omit it */}
          <details
            className="rounded-lg border border-border bg-muted/20"
            {...{ defaultOpen: isNonDefaultFireCalculationPrefs(prefsForUi) }}
          >
            <summary className="cursor-pointer select-none list-none px-4 py-3 text-sm font-medium text-foreground [&::-webkit-details-marker]:hidden flex items-center justify-between gap-2">
              <span>Income offsets, FIRE pot, reference age</span>
              <span className="text-xs font-normal text-muted-foreground shrink-0">
                {isNonDefaultFireCalculationPrefs(prefsForUi) ? "Custom" : "Defaults"}
              </span>
            </summary>
            <div className="px-4 pb-4 pt-0 border-t border-border">
              <FireCalculationSection
                prefs={prefsForUi}
                onPatch={savePrefs}
                passiveIncomeAtReference={fire.passiveIncomeAtReference}
                referenceAge={fire.referenceAgeForPassive}
                targetIncome={analysisProfile.targetRetirementIncome}
                compact
              />
            </div>
          </details>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <FireCard
          label="Full FIRE"
          value={fire.effectiveFireNumber}
          note={`${pct(analysisProfile.safeWithdrawalRate, 2)} SWR · effective`}
        />
        <FireCard
          label="Lean FIRE"
          value={fire.effectiveLeanFireNumber}
          note={`${pct(analysisProfile.leanFirePct, 0)} of target`}
        />
        <FireCard
          label="Fat FIRE"
          value={fire.effectiveFatFireNumber}
          note={`${pct(analysisProfile.fatFirePct, 0)} of target`}
        />
        <FireCard
          label="Coast FIRE"
          value={fire.effectiveCoastFireNumber}
          note={
            fire.coastFireApplicable
              ? fire.coastReached
                ? "Reached"
                : "Not yet"
              : "N/A (no pension in pot)"
          }
          highlight={fire.coastFireApplicable && fire.coastReached}
        />
        <FireCard
          label="Barista FIRE"
          value={fire.effectiveBaristaFireNumber}
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
