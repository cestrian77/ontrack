import { useRef } from "react";
import { Download, Upload, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, NumberInput, PercentInput } from "@/components/forms/Field";
import { useProfileStore } from "@/store/useProfileStore";
import { exportAll, importAll } from "@/db/repository";
import { Link } from "react-router-dom";

export default function Settings() {
  const profile = useProfileStore((s) => s.profile);
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
            hint="Nominal % p.a. Rent path uses this vs CPI (Fisher) inside the projection."
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
          <CardTitle>Data</CardTitle>
          <p className="text-xs text-muted-foreground">
            Your data lives in your browser only. Export keeps a copy you can restore later.
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
