import { useProfileStore } from "@/store/useProfileStore";
import { makePartnerProfileDefaults } from "@/engine/constants/defaults";
import { Field, NumberInput } from "@/components/forms/Field";
import { MoneyPeriodInput } from "@/components/forms/MoneyPeriodInput";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ageFromDob } from "@/engine/project/runProjection";
import { StepShell } from "./StepShell";

export default function OnboardingYou() {
  const profile = useProfileStore((s) => s.profile);
  const partnerProfile = useProfileStore((s) => s.partnerProfile);
  const update = useProfileStore((s) => s.update);
  const setPartnerProfile = useProfileStore((s) => s.setPartnerProfile);
  const age = ageFromDob(profile.dateOfBirth);
  const valid =
    !!profile.dateOfBirth &&
    profile.retirementTargetAge > age + 1 &&
    profile.targetRetirementIncome >= 5_000;

  return (
    <StepShell
      title="A few things about you"
      description="We use these to derive your projection horizon and target."
      next="/onboard/pensions"
      canContinue={valid}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Date of birth" hint="Used to derive your current age.">
          <Input
            type="date"
            autoComplete="bday"
            value={profile.dateOfBirth}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => update({ dateOfBirth: e.target.value })}
          />
        </Field>
        <Field
          label="Retirement target age"
          hint="The age at which you'd like to stop relying on employment income."
          example="60"
        >
          <NumberInput
            value={profile.retirementTargetAge}
            onChange={(n) => update({ retirementTargetAge: n })}
            min={45}
            max={80}
          />
        </Field>
        <Field
          label="Target retirement income"
          hint="Today's £, net of tax. The lifestyle income you want. Stored and projected per year."
          example="£35,000 per year"
        >
          <MoneyPeriodInput
            annualValue={profile.targetRetirementIncome}
            onAnnualChange={(n) => update({ targetRetirementIncome: n })}
            minAnnual={5_000}
            maxAnnual={500_000}
          />
        </Field>
        <Field label="Region" hint="Applies Scottish income tax bands if selected.">
          <Select
            value={profile.region}
            onValueChange={(v) =>
              update({ region: v as "england_wales" | "scotland" })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="england_wales">England / Wales</SelectItem>
              <SelectItem value="scotland">Scotland</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <div className="sm:col-span-2 space-y-2 rounded-md border p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <Label>Partnered</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Turn on to capture your partner&apos;s income, pensions, and investments in onboarding
                (after Property &amp; BTL — shared home and BTL stay on your steps only). Then use the
                header switch (Individual / Couple / Family) for merged projections. You can refine their
                details anytime in{" "}
                <span className="text-foreground font-medium">Settings → Household &amp; partner</span>.
              </p>
            </div>
            <Switch
              checked={profile.partnered}
              onCheckedChange={(v) => {
                update({ partnered: v });
                if (v && !partnerProfile) {
                  setPartnerProfile(makePartnerProfileDefaults());
                }
              }}
            />
          </div>
          {profile.partnered && partnerProfile && (
            <p className="text-xs text-muted-foreground border-t pt-2">
              Next: continue through your steps — you&apos;ll enter partner income, pensions, and ISAs after
              the BTL step. Shared primary home and BTL are only on your Property / BTL screens.
            </p>
          )}
        </div>

        <Field
          label="Gross salary"
          hint="Pre-tax employment income (annual in projections)."
          example="£60,000 per year"
        >
          <MoneyPeriodInput
            annualValue={profile.grossSalary}
            onAnnualChange={(n) => update({ grossSalary: n })}
            minAnnual={0}
            maxAnnual={1_000_000}
          />
        </Field>
        <Field
          label="Bonus / variable pay"
          hint="Optional. Added to gross; not pensionable by default."
          example="£0 per year"
        >
          <MoneyPeriodInput
            annualValue={profile.bonus}
            onAnnualChange={(n) => update({ bonus: n })}
            minAnnual={0}
            maxAnnual={500_000}
          />
        </Field>
      </div>
    </StepShell>
  );
}
