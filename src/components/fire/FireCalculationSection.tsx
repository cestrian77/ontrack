import type { FireCalculationPrefs, FireReferenceAgeMode } from "@/engine/types";
import { mergeFireCalculationPrefs } from "@/engine/fire/firePrefs";
import { Field } from "@/components/forms/Field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { gbp } from "@/lib/utils";

function ToggleRow({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label
      htmlFor={id}
      className="flex items-center gap-2 text-sm cursor-pointer select-none"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-primary shrink-0"
      />
      <span>{label}</span>
    </label>
  );
}

export function FireCalculationSection({
  prefs: prefsPartial,
  onPatch,
  passiveIncomeAtReference,
  referenceAge,
  targetIncome,
  compact,
}: {
  prefs: FireCalculationPrefs;
  onPatch: (next: FireCalculationPrefs) => void;
  passiveIncomeAtReference: number;
  referenceAge: number | null;
  targetIncome: number;
  compact?: boolean;
}) {
  const prefs = mergeFireCalculationPrefs(prefsPartial);
  const patch = (p: Partial<FireCalculationPrefs>) =>
    onPatch(mergeFireCalculationPrefs({ ...prefs, ...p }));

  const gap = Math.max(0, targetIncome - passiveIncomeAtReference);

  return (
    <div className={compact ? "space-y-3" : "space-y-4"}>
      <div className="space-y-2">
        <div className="text-xs font-medium text-foreground">Income offsets</div>
        <p className="text-xs text-muted-foreground">
          Subtract projected passive income from your retirement income target before dividing by your SWR. Amounts come from your projection at the reference age below.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          <ToggleRow
            id="fire-off-sp"
            label="State Pension"
            checked={prefs.offsetStatePension}
            onChange={(v) => patch({ offsetStatePension: v })}
          />
          <ToggleRow
            id="fire-off-db"
            label="Defined benefit pension"
            checked={prefs.offsetDbPension}
            onChange={(v) => patch({ offsetDbPension: v })}
          />
          <ToggleRow
            id="fire-off-btl"
            label="Buy-to-let net (after tax)"
            checked={prefs.offsetBtlNet}
            onChange={(v) => patch({ offsetBtlNet: v })}
          />
        </div>
      </div>

      <Field
        label="Passive income reference"
        hint="Which projection year supplies State Pension / DB / BTL figures for the subtraction."
      >
        <Select
          value={prefs.referenceAgeMode}
          onValueChange={(v) =>
            patch({ referenceAgeMode: v as FireReferenceAgeMode })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="at_retirement">At retirement target age</SelectItem>
            <SelectItem value="steady_state_after_spa">
              Steady state (retirement or SPA, whichever is later)
            </SelectItem>
          </SelectContent>
        </Select>
      </Field>

      <div className="space-y-2">
        <div className="text-xs font-medium text-foreground">FIRE pot (numerator)</div>
        <p className="text-xs text-muted-foreground">
          Choose which balances count toward FIRE progress and crossover age. Excluding pension disables Coast FIRE (it assumes pension growth to the target).
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          <ToggleRow
            id="fire-pot-pen"
            label="Pension"
            checked={prefs.includePensionInPot}
            onChange={(v) => patch({ includePensionInPot: v })}
          />
          <ToggleRow
            id="fire-pot-ssisa"
            label="Stocks & shares ISA"
            checked={prefs.includeSsIsaInPot}
            onChange={(v) => patch({ includeSsIsaInPot: v })}
          />
          <ToggleRow
            id="fire-pot-cashisa"
            label="Cash ISA"
            checked={prefs.includeCashIsaInPot}
            onChange={(v) => patch({ includeCashIsaInPot: v })}
          />
          <ToggleRow
            id="fire-pot-lisa"
            label="LISA"
            checked={prefs.includeLisaInPot}
            onChange={(v) => patch({ includeLisaInPot: v })}
          />
          <ToggleRow
            id="fire-pot-gia"
            label="GIA"
            checked={prefs.includeGiaInPot}
            onChange={(v) => patch({ includeGiaInPot: v })}
          />
          <ToggleRow
            id="fire-pot-cash"
            label="Cash savings"
            checked={prefs.includeCashInPot}
            onChange={(v) => patch({ includeCashInPot: v })}
          />
        </div>
      </div>

      <div className="rounded-md border border-border bg-muted/30 p-3 text-xs space-y-1">
        <div className="font-medium text-foreground">Reference snapshot</div>
        <div className="text-muted-foreground">
          Age used: {referenceAge !== null ? referenceAge : "—"}
        </div>
        <div className="text-muted-foreground">
          Passive income counted (offsets on): {gbp(passiveIncomeAtReference)}
        </div>
        <div className="text-muted-foreground">
          Portfolio income need (max 0, target minus passive): {gbp(gap)}
        </div>
      </div>
    </div>
  );
}
