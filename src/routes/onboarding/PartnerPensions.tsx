import { Navigate } from "react-router-dom";
import { useProfileStore } from "@/store/useProfileStore";
import { Field, NumberInput, PercentInput } from "@/components/forms/Field";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { StepShell } from "./StepShell";

export default function OnboardingPartnerPensions() {
  const profile = useProfileStore((s) => s.profile);
  const partnerProfile = useProfileStore((s) => s.partnerProfile);
  const updatePartner = useProfileStore((s) => s.updatePartner);

  if (!profile.partnered || !partnerProfile) {
    return <Navigate to="/onboard/btl" replace />;
  }

  const p = partnerProfile;

  return (
    <StepShell
      title="Partner pensions"
      description="Workplace, SIPP, and DB for your partner. Uses their gross salary from the previous step."
      prev="/onboard/partner-you"
      next="/onboard/partner-isa"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Current pension pot" example="£30,000">
          <NumberInput
            prefix="£"
            value={p.pensionPot}
            onChange={(n) => updatePartner({ pensionPot: n })}
          />
        </Field>
        <Field label="Employee contribution" example="5%">
          <PercentInput
            value={p.employeeContribPct}
            onChange={(n) => updatePartner({ employeeContribPct: n })}
            min={0}
            max={100}
          />
        </Field>
        <Field label="Employer contribution" example="5%">
          <PercentInput
            value={p.employerContribPct}
            onChange={(n) => updatePartner({ employerContribPct: n })}
            min={0}
            max={100}
          />
        </Field>
        <Field label="Personal SIPP" example="£100/mo">
          <NumberInput
            prefix="£"
            suffix="/mo"
            value={p.sippMonthly}
            onChange={(n) => updatePartner({ sippMonthly: n })}
          />
        </Field>
        <Field label="Pension access age" example="57">
          <NumberInput
            value={p.pensionAccessAge}
            onChange={(n) => updatePartner({ pensionAccessAge: n })}
            min={55}
            max={75}
          />
        </Field>
        <Field label="Pension growth" example="5%">
          <PercentInput
            value={p.pensionGrowth}
            onChange={(n) => updatePartner({ pensionGrowth: n })}
            min={0}
            max={15}
          />
        </Field>
        <Field label="State Pension claim age" example="67">
          <NumberInput
            value={p.statePensionClaimAge}
            onChange={(n) => updatePartner({ statePensionClaimAge: n })}
            min={60}
            max={75}
          />
        </Field>
        <Field label="State Pension forecast" example="£221.20/wk">
          <NumberInput
            prefix="£"
            suffix="/wk"
            step={0.1}
            value={p.statePensionWeekly}
            onChange={(n) => updatePartner({ statePensionWeekly: n })}
          />
        </Field>

        <div className="sm:col-span-2 flex items-center justify-between rounded-md border p-3">
          <div>
            <Label>Defined Benefit pension</Label>
            <p className="text-xs text-muted-foreground">
              Fixed inflation-linked income from NRA.
            </p>
          </div>
          <Switch
            checked={p.hasDB}
            onCheckedChange={(v) => updatePartner({ hasDB: v })}
          />
        </div>

        {p.hasDB && (
          <>
            <Field label="DB accrued annual income" example="£8,000 p.a.">
              <NumberInput
                prefix="£"
                value={p.dbAnnualIncome}
                onChange={(n) => updatePartner({ dbAnnualIncome: n })}
              />
            </Field>
            <Field label="DB Normal Retirement Age" example="65">
              <NumberInput
                value={p.dbNRA}
                onChange={(n) => updatePartner({ dbNRA: n })}
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
