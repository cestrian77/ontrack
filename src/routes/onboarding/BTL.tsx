import { Plus, Trash2 } from "lucide-react";
import { useProfileStore } from "@/store/useProfileStore";
import { Field, NumberInput, PercentInput } from "@/components/forms/Field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StepShell } from "./StepShell";
import {
  DEFAULT_BTL_AGENT_FEE,
  DEFAULT_BTL_INSURANCE,
  DEFAULT_BTL_VOID_RATE,
  DEFAULT_PROPERTY_APPRECIATION,
} from "@/engine/constants/uk";
import type { BTLProperty } from "@/engine/types";

function newBTL(): BTLProperty {
  return {
    id: `btl_${Math.random().toString(36).slice(2, 9)}`,
    label: "BTL property",
    value: 250_000,
    mortgageBalance: 150_000,
    mortgageRate: 0.05,
    mortgageTermYears: 20,
    mortgageType: "interest_only",
    monthlyGrossRent: 1_250,
    voidRate: DEFAULT_BTL_VOID_RATE,
    annualMaintenance: 2_500,
    lettingAgentFeePct: DEFAULT_BTL_AGENT_FEE,
    annualInsurance: DEFAULT_BTL_INSURANCE,
    appreciationRate: DEFAULT_PROPERTY_APPRECIATION,
    ownership: "sole",
  };
}

export default function OnboardingBTL() {
  const { profile, update } = useProfileStore();
  const list = profile.btlProperties;

  const updateBTL = (idx: number, patch: Partial<BTLProperty>) => {
    const next = list.map((p, i) => (i === idx ? { ...p, ...patch } : p));
    update({ btlProperties: next });
  };
  const removeBTL = (idx: number) => {
    update({ btlProperties: list.filter((_, i) => i !== idx) });
  };
  const addBTL = () => {
    if (list.length >= 10) return;
    update({ btlProperties: [...list, newBTL()] });
  };

  return (
    <StepShell
      title="Buy-to-let properties"
      description="Add up to 10 BTLs. We model Section 24 mortgage interest restriction."
      prev="/onboard/property"
      next="/onboard/review"
    >
      {list.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No BTL? Skip ahead. You can always add properties later.
        </p>
      )}

      <div className="space-y-4">
        {list.map((p, idx) => (
          <Card key={p.id}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm">
                {p.label?.trim() || `Property ${idx + 1}`}
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeBTL(idx)}
                aria-label="Remove property"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label="Property name" className="sm:col-span-2">
                <Input
                  value={p.label ?? ""}
                  onChange={(e) => updateBTL(idx, { label: e.target.value })}
                  placeholder="e.g. High Street flat"
                />
              </Field>
              <Field label="Property value">
                <NumberInput
                  prefix="£"
                  value={p.value}
                  onChange={(n) => updateBTL(idx, { value: n })}
                />
              </Field>
              <Field label="Mortgage balance">
                <NumberInput
                  prefix="£"
                  value={p.mortgageBalance}
                  onChange={(n) => updateBTL(idx, { mortgageBalance: n })}
                />
              </Field>
              <Field label="Interest rate">
                <PercentInput
                  value={p.mortgageRate}
                  onChange={(n) => updateBTL(idx, { mortgageRate: n })}
                  min={0}
                  max={15}
                  step={0.05}
                />
              </Field>
              <Field label="Term (years)" hint="0 = unencumbered">
                <NumberInput
                  value={p.mortgageTermYears}
                  onChange={(n) => updateBTL(idx, { mortgageTermYears: n })}
                  min={0}
                  max={35}
                />
              </Field>
              <Field label="Mortgage type">
                <Select
                  value={p.mortgageType}
                  onValueChange={(v) =>
                    updateBTL(idx, {
                      mortgageType: v as "repayment" | "interest_only",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="interest_only">Interest only</SelectItem>
                    <SelectItem value="repayment">Repayment</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Monthly gross rent">
                <NumberInput
                  prefix="£"
                  suffix="/mo"
                  value={p.monthlyGrossRent}
                  onChange={(n) => updateBTL(idx, { monthlyGrossRent: n })}
                />
              </Field>
              <Field label="Void rate" hint="Default ~5% (≈3 weeks/year)">
                <PercentInput
                  value={p.voidRate}
                  onChange={(n) => updateBTL(idx, { voidRate: n })}
                  min={0}
                  max={20}
                />
              </Field>
              <Field label="Letting agent fee" hint="Of effective rent">
                <PercentInput
                  value={p.lettingAgentFeePct}
                  onChange={(n) => updateBTL(idx, { lettingAgentFeePct: n })}
                  min={0}
                  max={20}
                />
              </Field>
              <Field label="Annual maintenance">
                <NumberInput
                  prefix="£"
                  value={p.annualMaintenance}
                  onChange={(n) => updateBTL(idx, { annualMaintenance: n })}
                />
              </Field>
              <Field label="Annual insurance">
                <NumberInput
                  prefix="£"
                  value={p.annualInsurance}
                  onChange={(n) => updateBTL(idx, { annualInsurance: n })}
                />
              </Field>
              <Field
                label="Appreciation"
                hint="Real annual growth (today's £), same convention as primary home."
              >
                <PercentInput
                  value={p.appreciationRate}
                  onChange={(n) => updateBTL(idx, { appreciationRate: n })}
                  min={0}
                  max={10}
                />
              </Field>
              <Field label="Ownership">
                <Select
                  value={p.ownership}
                  onValueChange={(v) =>
                    updateBTL(idx, { ownership: v as "sole" | "joint" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sole">Sole</SelectItem>
                    <SelectItem value="joint">Joint (50/50)</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button
        variant="outline"
        onClick={addBTL}
        disabled={list.length >= 10}
      >
        <Plus className="h-4 w-4" /> Add BTL property
      </Button>
    </StepShell>
  );
}
