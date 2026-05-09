import { useRef } from "react";
import { Download, Upload, Trash2, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, NumberInput, PercentInput } from "@/components/forms/Field";
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
import { exportAll, importAll } from "@/db/repository";
import { Link } from "react-router-dom";

export default function Settings() {
  const profile = useProfileStore((s) => s.profile);
  const partnerProfile = useProfileStore((s) => s.partnerProfile);
  const dependentCount = useProfileStore((s) => s.dependentCount);
  const setPartnerProfile = useProfileStore((s) => s.setPartnerProfile);
  const setDependentCount = useProfileStore((s) => s.setDependentCount);
  const updatePartner = useProfileStore((s) => s.updatePartner);
  const analysisTaxYearLabel = useUiStore((s) => s.analysisTaxYearLabel);
  const setAnalysisTaxYearLabel = useUiStore((s) => s.setAnalysisTaxYearLabel);
  const setActivePersonId = useUiStore((s) => s.setActivePersonId);
  const setAnalysisViewMode = useUiStore((s) => s.setAnalysisViewMode);
  const update = useProfileStore((s) => s.update);
  const reset = useProfileStore((s) => s.reset);
  const fileRef = useRef<HTMLInputElement>(null);

  const onExport = async () => {
    const json = await exportAll();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ontrack-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onImport = async (file: File) => {
    const text = await file.text();
    await importAll(text);
    location.reload();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tax year for analysis</CardTitle>
          <p className="text-xs text-muted-foreground">
            Income tax, NI, allowances, BTL marginal rates, FIRE savings rate, and insights use this frozen UK pack unless a scenario overrides it.
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
              <Field label="Dependents (for Family view label)" hint="Does not change tax or projections yet.">
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
          <Field label="Cash interest rate">
            <PercentInput
              value={profile.cashRate}
              onChange={(n) => update({ cashRate: n })}
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
          <Field label="ISA growth (nominal)">
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
            <NumberInput
              prefix="£"
              suffix="/yr"
              value={profile.baristaPartTimeIncome}
              onChange={(n) => update({ baristaPartTimeIncome: n })}
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Edit your inputs</CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reports</CardTitle>
          <p className="text-xs text-muted-foreground">
            Generate a complete PDF report or build a custom report from selected sections.
            To keep your inputs, use Data → Export JSON below.
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

      <Card>
        <CardHeader>
          <CardTitle>Data</CardTitle>
          <p className="text-xs text-muted-foreground">
            Stored on this device in your browser (IndexedDB). Download a{" "}
            <span className="font-medium text-foreground">.json</span> backup
            (profile, scenarios, dismissed insights) to restore elsewhere or
            after clearing site data. PDF exports are read-only summaries, not
            a restore format.
          </p>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={onExport}>
            <Download className="h-4 w-4" /> Export JSON
          </Button>
          <input
            type="file"
            accept="application/json"
            ref={fileRef}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onImport(f);
            }}
          />
          <Button variant="outline" onClick={() => fileRef.current?.click()}>
            <Upload className="h-4 w-4" /> Import JSON
          </Button>
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
