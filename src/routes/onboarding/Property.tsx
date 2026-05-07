import { useProfileStore } from "@/store/useProfileStore";
import { Field, NumberInput, PercentInput } from "@/components/forms/Field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StepShell } from "./StepShell";

export default function OnboardingProperty() {
  const { profile, update } = useProfileStore();
  return (
    <StepShell
      title="Primary residence"
      description="Mortgage details so we can model amortisation and equity over time."
      prev="/onboard/isa"
      next="/onboard/btl"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Property name" hint="Optional. Shown on the Property page.">
          <Input
            value={profile.primaryLabel ?? ""}
            onChange={(e) => update({ primaryLabel: e.target.value })}
            placeholder="e.g. Family home"
          />
        </Field>
        <Field label="Property value" example="£350,000">
          <NumberInput
            prefix="£"
            value={profile.primaryValue}
            onChange={(n) => update({ primaryValue: n })}
          />
        </Field>
        <Field label="Mortgage outstanding" example="£200,000">
          <NumberInput
            prefix="£"
            value={profile.primaryMortgage}
            onChange={(n) => update({ primaryMortgage: n })}
          />
        </Field>
        <Field label="Monthly payment" example="£1,100">
          <NumberInput
            prefix="£"
            suffix="/mo"
            value={profile.primaryMortgagePayment}
            onChange={(n) => update({ primaryMortgagePayment: n })}
          />
        </Field>
        <Field label="Mortgage interest rate" example="4.5%">
          <PercentInput
            value={profile.primaryMortgageRate}
            onChange={(n) => update({ primaryMortgageRate: n })}
            min={0}
            max={15}
            step={0.05}
          />
        </Field>
        <Field label="Term remaining (years)" example="22">
          <NumberInput
            value={profile.primaryMortgageTermYears}
            onChange={(n) => update({ primaryMortgageTermYears: n })}
            min={1}
            max={35}
          />
        </Field>
        <Field label="Mortgage type">
          <Select
            value={profile.primaryMortgageType}
            onValueChange={(v) =>
              update({ primaryMortgageType: v as "repayment" | "interest_only" })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="repayment">Repayment</SelectItem>
              <SelectItem value="interest_only">Interest only</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field
          label="Property appreciation"
          hint="Real annual growth (today's £) unless you change global CPI assumptions later."
          example="3%"
        >
          <PercentInput
            value={profile.primaryAppreciation}
            onChange={(n) => update({ primaryAppreciation: n })}
            min={0}
            max={10}
          />
        </Field>
        <Field
          label="Monthly overpayment"
          hint="Optional. Applied to principal each month."
          example="£0"
        >
          <NumberInput
            prefix="£"
            suffix="/mo"
            value={profile.primaryOverpayment}
            onChange={(n) => update({ primaryOverpayment: n })}
          />
        </Field>
      </div>
    </StepShell>
  );
}
