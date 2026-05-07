import { useProfileStore } from "@/store/useProfileStore";
import { Field, NumberInput } from "@/components/forms/Field";
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
  const { profile, update } = useProfileStore();
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
          hint="Today's £, net of tax. The lifestyle income you want."
          example="£35,000 p.a."
        >
          <NumberInput
            prefix="£"
            value={profile.targetRetirementIncome}
            onChange={(n) => update({ targetRetirementIncome: n })}
            min={5_000}
            max={500_000}
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
        <div className="sm:col-span-2 flex items-center justify-between rounded-md border p-3">
          <div>
            <Label>Partnered</Label>
            <p className="text-xs text-muted-foreground">
              We'll factor this in when couples planning ships in Phase 2.
            </p>
          </div>
          <Switch
            checked={profile.partnered}
            onCheckedChange={(v) => update({ partnered: v })}
          />
        </div>

        <Field
          label="Gross salary"
          hint="Pre-tax employment income."
          example="£60,000"
        >
          <NumberInput
            prefix="£"
            value={profile.grossSalary}
            onChange={(n) => update({ grossSalary: n })}
            min={0}
            max={1_000_000}
          />
        </Field>
        <Field
          label="Bonus / variable pay"
          hint="Optional. Added to gross; not pensionable by default."
          example="£0"
        >
          <NumberInput
            prefix="£"
            value={profile.bonus}
            onChange={(n) => update({ bonus: n })}
            min={0}
            max={500_000}
          />
        </Field>
      </div>
    </StepShell>
  );
}
