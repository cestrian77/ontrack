import { useMemo } from "react";
import { Trash2, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, NumberInput, OptionalNumberInput, PercentInput } from "@/components/forms/Field";
import { MoneyPeriodInput } from "@/components/forms/MoneyPeriodInput";
import { DEFAULT_MONTE_CARLO_SEED } from "@/engine/montecarlo/defaults";
import {
  STRESS_MONTE_CARLO_SEED_HINT,
  STRESS_SETTINGS_DEFAULTS_INTRO,
  STRESS_TRIALS_HINT,
} from "@/lib/stressExplain";
import { useProfileStore } from "@/store/useProfileStore";
import { makePartnerProfileDefaults } from "@/engine/constants/defaults";
import { useUiStore } from "@/store/useUiStore";
import { TAX_YEAR_PACKS } from "@/engine/constants/taxYears";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataPackControls } from "@/components/data/DataPackControls";
import { DATA_PACK_DISPLAY_NAME } from "@/lib/dataPack";
import { PlanningLongevityFields } from "@/components/settings/PlanningLongevityFields";
import { Link } from "react-router-dom";
import { runProjection } from "@/engine/project/runProjection";
import { computeFire } from "@/engine/fire/fire";
import { mergeFireCalculationPrefs } from "@/engine/fire/firePrefs";
import { baseTaxYearPack } from "@/lib/taxYearContext";
import { FireCalculationSection } from "@/components/fire/FireCalculationSection";

export default function Settings() {
  const profile = useProfileStore((s) => s.profile);
  const partnerProfile = useProfileStore((s) => s.partnerProfile);
  const dependentCount = useProfileStore((s) => s.dependentCount);
  const setPartnerProfile = useProfileStore((s) => s.setPartnerProfile);
  const setDependentCount = useProfileStore((s) => s.setDependentCount);
  const householdPrefs = useProfileStore((s) => s.householdPrefs);
  const updateHouseholdPrefs = useProfileStore((s) => s.updateHouseholdPrefs);
  const updatePartner = useProfileStore((s) => s.updatePartner);
  const analysisTaxYearLabel = useUiStore((s) => s.analysisTaxYearLabel);
  const setAnalysisTaxYearLabel = useUiStore((s) => s.setAnalysisTaxYearLabel);
  const setActivePersonId = useUiStore((s) => s.setActivePersonId);
  const setAnalysisViewMode = useUiStore((s) => s.setAnalysisViewMode);
  const update = useProfileStore((s) => s.update);
  const reset = useProfileStore((s) => s.reset);
  const basePack = useMemo(
    () => baseTaxYearPack(analysisTaxYearLabel),
    [analysisTaxYearLabel],
  );
  const projectionPreview = useMemo(
    () =>
      runProjection(profile, {
        taxYearPack: basePack,
        freezeTaxYearPack: analysisTaxYearLabel != null,
      }),
    [profile, basePack, analysisTaxYearLabel],
  );
  const firePreview = useMemo(
    () => computeFire(profile, projectionPreview, basePack),
    [profile, projectionPreview, basePack],
  );

  const partnerProjectionPreview = useMemo(
    () =>
      partnerProfile
        ? runProjection(partnerProfile, {
            taxYearPack: basePack,
            freezeTaxYearPack: analysisTaxYearLabel != null,
          })
        : null,
    [partnerProfile, basePack, analysisTaxYearLabel],
  );
  const partnerFirePreview = useMemo(
    () =>
      partnerProfile && partnerProjectionPreview
        ? computeFire(partnerProfile, partnerProjectionPreview, basePack)
        : null,
    [partnerProfile, partnerProjectionPreview, basePack],
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tax year for analysis</CardTitle>
          <p className="text-xs text-muted-foreground">
            Income tax, NI, allowances, BTL rates today, FIRE savings rate, and insights use this pack. Pick a specific year to freeze rules across the whole projection; leave on calendar match to step packs (e.g. 2027/28 property rates from April 2027).
          </p>
        </CardHeader>
        <CardContent className="max-w-md">
          <Field label="Ruleset">
            <Select
              value={analysisTaxYearLabel ?? "__calendar__"}
              onValueChange={(v) =>
                setAnalysisTaxYearLabel(v === "__calendar__" ? null : v)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__calendar__">Match calendar (today&apos;s tax year)</SelectItem>
                {TAX_YEAR_PACKS.map((tp) => (
                  <SelectItem key={tp.label} value={tp.label}>
                    {tp.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Household &amp; partner</CardTitle>
          <p className="text-xs text-muted-foreground">
            Add a second profile for couple or family analysis. Enter your shared primary home only on{" "}
            <span className="font-medium text-foreground">your</span> profile; the partner slot defaults
            to no primary property so household totals are not doubled.
          </p>
        </CardHeader>
        <CardContent className="space-y-4 max-w-lg">
          {partnerProfile ? (
            <>
              <p className="text-sm text-muted-foreground">
                Partner profile is saved. Use the header switch (Individual / Couple / Family) and
                &quot;Partner&quot; when editing Property or Tax for their numbers.
              </p>
              <Field
                label="Household retirement income"
                hint="Shared spending target for couple/family views and stress tests. Leave at £0 per year to use the sum of both targets."
              >
                <MoneyPeriodInput
                  annualValue={householdPrefs.householdRetirementIncome ?? 0}
                  onAnnualChange={(n) =>
                    updateHouseholdPrefs({
                      householdRetirementIncome: n > 0 ? n : null,
                    })
                  }
                  minAnnual={0}
                />
              </Field>
              <Field
                label="Dependents (for Family view label)"
                hint="Synced from Spending → Children when you apply budget to plan. Edit children on Spending."
              >
                <NumberInput
                  value={dependentCount}
                  onChange={(n) => setDependentCount(n)}
                  min={0}
                  max={20}
                />
              </Field>
              <Button
                variant="outline"
                onClick={() => {
                  if (confirm("Remove partner profile from this device?")) {
                    setPartnerProfile(null);
                    setActivePersonId("primary");
                    setAnalysisViewMode("individual");
                  }
                }}
              >
                Remove partner profile
              </Button>
            </>
          ) : (
            <Button
              type="button"
              onClick={() => setPartnerProfile(makePartnerProfileDefaults())}
            >
              Add partner profile
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Accounts for insights</CardTitle>
          <p className="text-xs text-muted-foreground">
            Uncheck accounts you do not use (for example, no LISA). The model ignores their balances
            and contributions; related insights stay off the Insights page and dashboard.
          </p>
        </CardHeader>
        <CardContent className="space-y-4 max-w-lg">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={profile.hasLisa}
              onChange={(e) => update({ hasLisa: e.target.checked })}
              className="h-4 w-4 accent-primary mt-0.5 shrink-0"
            />
            <span>
              <span className="font-medium text-sm text-foreground">I have a LISA</span>
              <span className="block text-xs text-muted-foreground mt-0.5">
                Lifetime ISA — bonus and allowance tips apply only if you use one.
              </span>
            </span>
          </label>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={profile.hasGia}
              onChange={(e) => update({ hasGia: e.target.checked })}
              className="h-4 w-4 accent-primary mt-0.5 shrink-0"
            />
            <span>
              <span className="font-medium text-sm text-foreground">I have a GIA</span>
              <span className="block text-xs text-muted-foreground mt-0.5">
                General Investment Account outside ISA wrappers.
              </span>
            </span>
          </label>
          {partnerProfile && (
            <>
              <div className="text-xs font-medium text-foreground pt-2 border-t">
                Partner
              </div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={partnerProfile.hasLisa}
                  onChange={(e) => updatePartner({ hasLisa: e.target.checked })}
                  className="h-4 w-4 accent-primary mt-0.5 shrink-0"
                />
                <span>
                  <span className="font-medium text-sm text-foreground">Partner has a LISA</span>
                </span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={partnerProfile.hasGia}
                  onChange={(e) => updatePartner({ hasGia: e.target.checked })}
                  className="h-4 w-4 accent-primary mt-0.5 shrink-0"
                />
                <span>
                  <span className="font-medium text-sm text-foreground">Partner has a GIA</span>
                </span>
              </label>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Stress test defaults</CardTitle>
          <p className="text-xs text-muted-foreground">{STRESS_SETTINGS_DEFAULTS_INTRO}</p>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 max-w-lg">
          <Field
            label="Monte Carlo seed"
            hint={STRESS_MONTE_CARLO_SEED_HINT}
            example={`Empty = default ${DEFAULT_MONTE_CARLO_SEED}; try 7 or 123 to compare paths`}
          >
            <OptionalNumberInput
              value={householdPrefs.monteCarloSeed}
              onChange={(n) =>
                updateHouseholdPrefs({
                  monteCarloSeed: n != null && n > 0 ? Math.round(n) : null,
                })
              }
              placeholder={String(DEFAULT_MONTE_CARLO_SEED)}
              min={1}
              step={1}
            />
          </Field>
          <Field label="Default trials" hint={STRESS_TRIALS_HINT}>
            <NumberInput
              value={householdPrefs.monteCarloTrials ?? 1000}
              onChange={(n) => updateHouseholdPrefs({ monteCarloTrials: n })}
              min={200}
              max={3000}
              step={100}
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Planning &amp; longevity</CardTitle>
          <p className="text-xs text-muted-foreground">
            Career growth is always applied while working. Optional guardrails, care costs, and illustrative IHT.
          </p>
        </CardHeader>
        <CardContent>
          <PlanningLongevityFields profile={profile} onPatch={update} />
        </CardContent>
      </Card>

      {partnerProfile ? (
        <Card>
          <CardHeader>
            <CardTitle>Partner — planning &amp; longevity</CardTitle>
            <p className="text-xs text-muted-foreground">
              Separate care, guardrails, and IHT assumptions for your partner. Household dashboard totals combine both.
            </p>
          </CardHeader>
          <CardContent>
            <PlanningLongevityFields
              profile={partnerProfile}
              onPatch={updatePartner}
              showCareer={true}
            />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Global assumptions</CardTitle>
          <p className="text-xs text-muted-foreground">
            Tweak these to stress-test your projection. Defaults follow PRD §5.2.
          </p>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="CPI inflation" hint="Used to convert nominal/real values.">
            <PercentInput
              value={profile.cpi}
              onChange={(n) => update({ cpi: n })}
              min={0}
              max={10}
            />
          </Field>
          <Field
            label="Drawdown strategy"
            hint="Legacy = ISA then pension (net). Tax-aware grosses up pension withdrawals."
          >
            <Select
              value={profile.drawdownStrategyId ?? "legacy"}
              onValueChange={(v) =>
                update({ drawdownStrategyId: v as "legacy" | "tax_aware" })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="legacy">Legacy (default)</SelectItem>
                <SelectItem value="tax_aware">Tax-aware pension gross-up</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field
            label="Essential spending (flexible)"
            hint="Optional. With discretionary below, replaces flat retirement target for need."
          >
            <MoneyPeriodInput
              annualValue={profile.flexibleSpending?.essentialAnnual ?? 0}
              onAnnualChange={(n) => {
                const d = profile.flexibleSpending?.discretionaryAnnual ?? 0;
                if (n <= 0 && d <= 0) {
                  update({ flexibleSpending: undefined });
                  return;
                }
                update({ flexibleSpending: { essentialAnnual: n, discretionaryAnnual: d } });
              }}
              minAnnual={0}
            />
          </Field>
          <Field label="Discretionary spending (flexible)">
            <MoneyPeriodInput
              annualValue={profile.flexibleSpending?.discretionaryAnnual ?? 0}
              onAnnualChange={(n) => {
                const e = profile.flexibleSpending?.essentialAnnual ?? 0;
                if (n <= 0 && e <= 0) {
                  update({ flexibleSpending: undefined });
                  return;
                }
                update({
                  flexibleSpending: {
                    essentialAnnual: e > 0 ? e : profile.targetRetirementIncome,
                    discretionaryAnnual: n,
                  },
                });
              }}
              minAnnual={0}
            />
          </Field>
          <Field label="Cash interest rate" hint="Non-ISA cash savings only.">
            <PercentInput
              value={profile.cashRate}
              onChange={(n) => update({ cashRate: n })}
              min={0}
              max={10}
            />
          </Field>
          <Field
            label="Cash ISA interest (nominal)"
            hint="Cash ISA balance compounds at this rate (same field as ISA onboarding). S&S ISA uses ISA growth below."
          >
            <PercentInput
              value={profile.cashIsaRate}
              onChange={(n) => update({ cashIsaRate: n })}
              min={0}
              max={10}
            />
          </Field>
          <Field label="Pension growth (nominal)">
            <PercentInput
              value={profile.pensionGrowth}
              onChange={(n) => update({ pensionGrowth: n })}
              min={0}
              max={15}
            />
          </Field>
          <Field
            label="ISA growth (nominal)"
            hint="Stocks & shares ISA and LISA. Cash ISA uses Cash ISA interest above."
          >
            <PercentInput
              value={profile.isaGrowth}
              onChange={(n) => update({ isaGrowth: n })}
              min={0}
              max={15}
            />
          </Field>
          <Field label="GIA growth (nominal)">
            <PercentInput
              value={profile.giaGrowth}
              onChange={(n) => update({ giaGrowth: n })}
              min={0}
              max={15}
            />
          </Field>
          <Field
            label="Property appreciation"
            hint="Real annual growth (today's £). Matches Wealth journey in Real mode."
          >
            <PercentInput
              value={profile.primaryAppreciation}
              onChange={(n) => update({ primaryAppreciation: n })}
              min={0}
              max={10}
            />
          </Field>
          <Field
            label="Rental growth"
            hint="Nominal % p.a. vs CPI sets real rent in projections; matching CPI keeps real BTL rent flat."
          >
            <PercentInput
              value={profile.rentalGrowth}
              onChange={(n) => update({ rentalGrowth: n })}
              min={0}
              max={10}
            />
          </Field>
          <Field
            label="State Pension triple-lock growth"
            hint="Nominal % p.a. converted to real growth: in-payment increases each year after your claim age (State Pension is included in drawdown modelling)."
          >
            <PercentInput
              value={profile.spTripleLockGrowth}
              onChange={(n) => update({ spTripleLockGrowth: n })}
              min={0}
              max={5}
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>FIRE assumptions</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <Field label="Safe withdrawal rate" hint="Default 3.5% (UK conservative).">
            <PercentInput
              value={profile.safeWithdrawalRate}
              onChange={(n) => update({ safeWithdrawalRate: n })}
              min={2.5}
              max={5}
              step={0.1}
            />
          </Field>
          <Field label="Lean FIRE %" hint="As proportion of full target income.">
            <PercentInput
              value={profile.leanFirePct}
              onChange={(n) => update({ leanFirePct: n })}
              min={30}
              max={150}
              step={1}
            />
          </Field>
          <Field label="Fat FIRE %">
            <PercentInput
              value={profile.fatFirePct}
              onChange={(n) => update({ fatFirePct: n })}
              min={100}
              max={300}
              step={1}
            />
          </Field>
          <Field label="Barista part-time income">
            <MoneyPeriodInput
              annualValue={profile.baristaPartTimeIncome}
              onAnnualChange={(n) => update({ baristaPartTimeIncome: n })}
              minAnnual={0}
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>FIRE calculation</CardTitle>
          <p className="text-xs text-muted-foreground">
            Optional: treat State Pension, DB income, and BTL profit as covering part of your retirement income target, and pick which wrappers count as your FIRE pot. When you have a partner, a second card below edits their solo-analysis copy.
          </p>
        </CardHeader>
        <CardContent>
          <FireCalculationSection
            prefs={mergeFireCalculationPrefs(profile.fireCalculationPrefs)}
            onPatch={(next) => update({ fireCalculationPrefs: next })}
            passiveIncomeAtReference={firePreview.passiveIncomeAtReference}
            referenceAge={firePreview.referenceAgeForPassive}
            targetIncome={profile.targetRetirementIncome}
          />
        </CardContent>
      </Card>

      {partnerProfile && partnerFirePreview ? (
        <Card>
          <CardHeader>
            <CardTitle>Partner — FIRE calculation</CardTitle>
            <p className="text-xs text-muted-foreground">
              Used when you view or analyse the partner alone. Couple / family household FIRE still uses the primary holder’s settings above.
            </p>
          </CardHeader>
          <CardContent>
            <FireCalculationSection
              prefs={mergeFireCalculationPrefs(partnerProfile.fireCalculationPrefs)}
              onPatch={(next) => updatePartner({ fireCalculationPrefs: next })}
              passiveIncomeAtReference={partnerFirePreview.passiveIncomeAtReference}
              referenceAge={partnerFirePreview.referenceAgeForPassive}
              targetIncome={partnerProfile.targetRetirementIncome}
            />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Edit your inputs</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-3">
            Opens the same steps as onboarding; your data stays saved. Does not reset onboarding.
          </p>
          <div className="text-xs font-medium text-foreground mb-2">Primary</div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link to="/onboard/you">You</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/onboard/pensions">Pensions</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/onboard/isa">ISA & investments</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/onboard/property">Property</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/onboard/btl">BTL</Link>
            </Button>
          </div>
          {partnerProfile ? (
            <>
              <div className="text-xs font-medium text-foreground mt-4 mb-2">Partner</div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" asChild>
                  <Link to="/onboard/partner-you">Partner — you</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/onboard/partner-pensions">Partner — pensions</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/onboard/partner-isa">Partner — ISA</Link>
                </Button>
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reports</CardTitle>
          <p className="text-xs text-muted-foreground">
            Simple (dashboard) and advanced (full analysis) PDFs, or pick your own sections.
            To keep editable inputs, download your {DATA_PACK_DISPLAY_NAME} below.
          </p>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild>
            <Link to="/reports/builder">
              <FileText className="h-4 w-4" /> Open PDF builder
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card id="data-pack">
        <CardHeader>
          <CardTitle>{DATA_PACK_DISPLAY_NAME}</CardTitle>
          <p className="text-xs text-muted-foreground">
            Your plan is saved automatically on this device (IndexedDB). Download an{" "}
            <span className="font-medium text-foreground">{DATA_PACK_DISPLAY_NAME}</span> to back up
            or move to another browser — profile, partner, scenarios, and dismissed insights.
            PDF reports are read-only snapshots; use the data pack to restore editable inputs.
          </p>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <DataPackControls />
          <Button
            variant="destructive"
            onClick={async () => {
              if (confirm("Reset all data? This cannot be undone.")) {
                await reset();
                location.assign("/");
              }
            }}
          >
            <Trash2 className="h-4 w-4" /> Reset everything
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
