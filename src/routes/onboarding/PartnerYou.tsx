import { Navigate } from "react-router-dom";
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
import { ageFromDob } from "@/engine/project/runProjection";
import { StepShell } from "./StepShell";
import type { Employment } from "@/engine/types";

export default function OnboardingPartnerYou() {
  const profile = useProfileStore((s) => s.profile);
  const partnerProfile = useProfileStore((s) => s.partnerProfile);
  const updatePartner = useProfileStore((s) => s.updatePartner);

  if (!profile.partnered || !partnerProfile) {
    return <Navigate to="/onboard/btl" replace />;
  }

  const p = partnerProfile;
  const age = ageFromDob(p.dateOfBirth);
  const valid =
    !!p.dateOfBirth &&
    p.retirementTargetAge > age + 1 &&
    p.targetRetirementIncome >= 5_000;

  return (
    <StepShell
      title="Your partner"
      description="Income and targets for your partner. Shared home and joint BTL stay on your steps only — we merge household totals in Couple/Family view."
      prev="/onboard/btl"
      next="/onboard/partner-pensions"
      canContinue={valid}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Date of birth" hint="Partner's date of birth.">
          <Input
            type="date"
            autoComplete="bday"
            value={p.dateOfBirth}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => updatePartner({ dateOfBirth: e.target.value })}
          />
        </Field>
        <Field
          label="Retirement target age"
          hint="Age they plan to stop relying on employment income."
          example="60"
        >
          <NumberInput
            value={p.retirementTargetAge}
            onChange={(n) => updatePartner({ retirementTargetAge: n })}
            min={45}
            max={80}
          />
        </Field>
        <Field
          label="Target retirement income"
          hint="Today's £, net of tax — their share of household need."
          example="£28,000 p.a."
        >
          <NumberInput
            prefix="£"
            value={p.targetRetirementIncome}
            onChange={(n) => updatePartner({ targetRetirementIncome: n })}
            min={5_000}
            max={500_000}
          />
        </Field>
        <Field label="Region" hint="Scottish tax bands if applicable.">
          <Select
            value={p.region}
            onValueChange={(v) =>
              updatePartner({ region: v as "england_wales" | "scotland" })
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
        <Field label="Employment" hint="Used for NI and BTL modelling.">
          <Select
            value={p.employment}
            onValueChange={(v) =>
              updatePartner({ employment: v as Employment })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="employed">Employed</SelectItem>
              <SelectItem value="self_employed">Self-employed</SelectItem>
              <SelectItem value="both">Both</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Gross salary" hint="Pre-tax employment income.">
          <NumberInput
            prefix="£"
            value={p.grossSalary}
            onChange={(n) => updatePartner({ grossSalary: n })}
            min={0}
            max={1_000_000}
          />
        </Field>
        <Field label="Bonus / variable pay" hint="Optional.">
          <NumberInput
            prefix="£"
            value={p.bonus}
            onChange={(n) => updatePartner({ bonus: n })}
            min={0}
            max={500_000}
          />
        </Field>
        <Field
          label="Other income (monthly)"
          hint="Taxable add-ons while employed."
        >
          <NumberInput
            prefix="£"
            suffix="/mo"
            value={p.otherIncomeMonthly}
            onChange={(n) => updatePartner({ otherIncomeMonthly: n })}
            min={0}
          />
        </Field>
      </div>
    </StepShell>
  );
}
