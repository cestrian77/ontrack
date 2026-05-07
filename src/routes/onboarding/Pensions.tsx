import { useProfileStore } from "@/store/useProfileStore";
import { Field, NumberInput, PercentInput } from "@/components/forms/Field";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { StepShell } from "./StepShell";

export default function OnboardingPensions() {
  const { profile, update } = useProfileStore();
  return (
    <StepShell
      title="Pensions"
      description="Workplace, SIPP, and DB pensions. We model relief automatically."
      prev="/onboard/you"
      next="/onboard/isa"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Current pension pot"
          hint="Total across all DC pensions."
          example="£50,000"
        >
          <NumberInput
            prefix="£"
            value={profile.pensionPot}
            onChange={(n) => update({ pensionPot: n })}
          />
        </Field>
        <Field
          label="Employee contribution"
          hint="As % of gross salary, via salary sacrifice or net pay arrangement."
          example="5%"
        >
          <PercentInput
            value={profile.employeeContribPct}
            onChange={(n) => update({ employeeContribPct: n })}
            min={0}
            max={100}
          />
        </Field>
        <Field
          label="Employer contribution"
          hint="As % of gross salary."
          example="5%"
        >
          <PercentInput
            value={profile.employerContribPct}
            onChange={(n) => update({ employerContribPct: n })}
            min={0}
            max={100}
          />
        </Field>
        <Field
          label="Personal SIPP"
          hint="Net contribution per month. Relief at source added automatically."
          example="£100/mo"
        >
          <NumberInput
            prefix="£"
            suffix="/mo"
            value={profile.sippMonthly}
            onChange={(n) => update({ sippMonthly: n })}
          />
        </Field>
        <Field
          label="Pension access age"
          hint="55 if you have protected NMPA; otherwise 57 (post-2028)."
          example="57"
        >
          <NumberInput
            value={profile.pensionAccessAge}
            onChange={(n) => update({ pensionAccessAge: n })}
            min={55}
            max={75}
          />
        </Field>
        <Field
          label="Pension growth"
          hint="Nominal annual return assumption."
          example="5%"
        >
          <PercentInput
            value={profile.pensionGrowth}
            onChange={(n) => update({ pensionGrowth: n })}
            min={0}
            max={15}
          />
        </Field>
        <Field label="State Pension claim age" hint="Default: SPA 67." example="67">
          <NumberInput
            value={profile.statePensionClaimAge}
            onChange={(n) => update({ statePensionClaimAge: n })}
            min={60}
            max={75}
          />
        </Field>
        <Field
          label="State Pension forecast"
          hint="Weekly amount from your HMRC State Pension forecast (default = full new SP)."
          example="£221.20/wk"
        >
          <NumberInput
            prefix="£"
            suffix="/wk"
            step={0.1}
            value={profile.statePensionWeekly}
            onChange={(n) => update({ statePensionWeekly: n })}
          />
        </Field>

        <div className="sm:col-span-2 flex items-center justify-between rounded-md border p-3">
          <div>
            <Label>Defined Benefit pension</Label>
            <p className="text-xs text-muted-foreground">
              Treated as a fixed inflation-linked income stream from NRA.
            </p>
          </div>
          <Switch
            checked={profile.hasDB}
            onCheckedChange={(v) => update({ hasDB: v })}
          />
        </div>

        {profile.hasDB && (
          <>
            <Field
              label="DB accrued annual income"
              example="£8,000 p.a."
            >
              <NumberInput
                prefix="£"
                value={profile.dbAnnualIncome}
                onChange={(n) => update({ dbAnnualIncome: n })}
              />
            </Field>
            <Field
              label="DB Normal Retirement Age"
              example="65"
            >
              <NumberInput
                value={profile.dbNRA}
                onChange={(n) => update({ dbNRA: n })}
                min={55}
                max={68}
              />
            </Field>
          </>
        )}
      </div>
    </StepShell>
  );
}
