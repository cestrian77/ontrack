import type { UserProfile } from "@/engine/types";
import { DEFAULT_LONG_TERM_CARE } from "@/engine/care/longTermCare";
import { DEFAULT_ESTATE_PLANNING } from "@/engine/estate/iht";
import { DEFAULT_SPENDING_GUARDRAILS } from "@/engine/spending/guardrails";
import { Field, NumberInput, PercentInput } from "@/components/forms/Field";
import { MoneyPeriodInput } from "@/components/forms/MoneyPeriodInput";

type Props = {
  profile: UserProfile;
  onPatch: (patch: Partial<UserProfile>) => void;
  showCareer?: boolean;
};

export function PlanningLongevityFields({
  profile,
  onPatch,
  showCareer = true,
}: Props) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {showCareer && (
        <>
          <Field label="Salary growth (while working)" hint="Real terms; compounds each projection year.">
            <PercentInput
              value={profile.salaryGrowth}
              onChange={(n) => onPatch({ salaryGrowth: n })}
              min={0}
              max={15}
            />
          </Field>
          <Field label="Bonus / variable pay" hint="Grows with salary path when set.">
            <MoneyPeriodInput
              annualValue={profile.bonus}
              onAnnualChange={(n) => onPatch({ bonus: n })}
              minAnnual={0}
            />
          </Field>
        </>
      )}

      <label className="flex items-center gap-2 text-sm sm:col-span-2">
        <input
          type="checkbox"
          checked={profile.spendingGuardrails?.enabled ?? false}
          onChange={(e) => {
            const base = profile.spendingGuardrails ?? DEFAULT_SPENDING_GUARDRAILS;
            onPatch({
              spendingGuardrails: { ...base, enabled: e.target.checked },
            });
          }}
        />
        Dynamic spending guardrails (retirement)
      </label>
      <Field label="Guardrail floor (% of plan)">
        <PercentInput
          value={(profile.spendingGuardrails ?? DEFAULT_SPENDING_GUARDRAILS).floorPctOfPlan}
          onChange={(n) => {
            const base = profile.spendingGuardrails ?? DEFAULT_SPENDING_GUARDRAILS;
            onPatch({ spendingGuardrails: { ...base, floorPctOfPlan: n } });
          }}
          min={50}
          max={100}
        />
      </Field>
      <Field label="Guardrail ceiling (% of plan)">
        <PercentInput
          value={(profile.spendingGuardrails ?? DEFAULT_SPENDING_GUARDRAILS).ceilingPctOfPlan}
          onChange={(n) => {
            const base = profile.spendingGuardrails ?? DEFAULT_SPENDING_GUARDRAILS;
            onPatch({ spendingGuardrails: { ...base, ceilingPctOfPlan: n } });
          }}
          min={100}
          max={150}
        />
      </Field>

      <label className="flex items-center gap-2 text-sm sm:col-span-2">
        <input
          type="checkbox"
          checked={profile.longTermCare?.enabled ?? false}
          onChange={(e) => {
            const base = profile.longTermCare ?? DEFAULT_LONG_TERM_CARE;
            onPatch({ longTermCare: { ...base, enabled: e.target.checked } });
          }}
        />
        Model long-term / social care costs
      </label>
      <Field label="Care from age">
        <NumberInput
          value={(profile.longTermCare ?? DEFAULT_LONG_TERM_CARE).fromAge}
          onChange={(n) => {
            const base = profile.longTermCare ?? DEFAULT_LONG_TERM_CARE;
            onPatch({ longTermCare: { ...base, fromAge: n } });
          }}
          min={65}
          max={100}
        />
      </Field>
      <Field label="Care cost (real)" hint="In today&apos;s £; projected in real terms.">
        <MoneyPeriodInput
          annualValue={(profile.longTermCare ?? DEFAULT_LONG_TERM_CARE).annualCostReal}
          onAnnualChange={(n) => {
            const base = profile.longTermCare ?? DEFAULT_LONG_TERM_CARE;
            onPatch({ longTermCare: { ...base, annualCostReal: n } });
          }}
          minAnnual={0}
        />
      </Field>
      <Field label="Care duration (years)">
        <NumberInput
          value={(profile.longTermCare ?? DEFAULT_LONG_TERM_CARE).years}
          onChange={(n) => {
            const base = profile.longTermCare ?? DEFAULT_LONG_TERM_CARE;
            onPatch({ longTermCare: { ...base, years: n } });
          }}
          min={1}
          max={30}
        />
      </Field>

      <label className="flex items-center gap-2 text-sm sm:col-span-2">
        <input
          type="checkbox"
          checked={profile.estatePlanning?.enabled ?? false}
          onChange={(e) => {
            const base = profile.estatePlanning ?? DEFAULT_ESTATE_PLANNING;
            onPatch({ estatePlanning: { ...base, enabled: e.target.checked } });
          }}
        />
        Illustrative inheritance tax at a chosen age
      </label>
      <Field label="Model IHT at age">
        <NumberInput
          value={(profile.estatePlanning ?? DEFAULT_ESTATE_PLANNING).modelAtAge}
          onChange={(n) => {
            const base = profile.estatePlanning ?? DEFAULT_ESTATE_PLANNING;
            onPatch({ estatePlanning: { ...base, modelAtAge: n } });
          }}
          min={60}
          max={100}
        />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={
            (profile.estatePlanning ?? DEFAULT_ESTATE_PLANNING).primaryHomeToDirectDescendants
          }
          onChange={(e) => {
            const base = profile.estatePlanning ?? DEFAULT_ESTATE_PLANNING;
            onPatch({
              estatePlanning: {
                ...base,
                primaryHomeToDirectDescendants: e.target.checked,
              },
            });
          }}
        />
        Residence nil-rate band (home to descendants)
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={
            (profile.estatePlanning ?? DEFAULT_ESTATE_PLANNING).transferredNilRateToSpouse
          }
          onChange={(e) => {
            const base = profile.estatePlanning ?? DEFAULT_ESTATE_PLANNING;
            onPatch({
              estatePlanning: {
                ...base,
                transferredNilRateToSpouse: e.target.checked,
              },
            });
          }}
        />
        Double nil-rate bands (spouse unused allowance)
      </label>
    </div>
  );
}
