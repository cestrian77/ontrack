import { Trash2 } from "lucide-react";
import type { ChildProfile } from "@/engine/household/budget/types";
import { newChildId } from "@/engine/household/budget/compile";
import { Field, NumberInput } from "@/components/forms/Field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoneyPeriodInput } from "@/components/forms/MoneyPeriodInput";

type Props = {
  children: ChildProfile[];
  onChange: (children: ChildProfile[]) => void;
};

function defaultChild(): ChildProfile {
  return {
    id: newChildId(),
    label: "Child",
    dateOfBirth: "2015-01-01",
    atHomeUntilAge: 18,
    universitySupport: {
      enabled: false,
      tuitionAnnual: 9250,
      livingContributionAnnual: 8000,
      fromAge: 18,
      years: 3,
    },
  };
}

export function ChildrenSection({ children, onChange }: Props) {
  const patch = (id: string, next: Partial<ChildProfile>) => {
    onChange(children.map((c) => (c.id === id ? { ...c, ...next } : c)));
  };

  const patchUni = (id: string, next: Partial<NonNullable<ChildProfile["universitySupport"]>>) => {
    onChange(
      children.map((c) => {
        if (c.id !== id) return c;
        const base = c.universitySupport ?? defaultChild().universitySupport!;
        return { ...c, universitySupport: { ...base, ...next } };
      }),
    );
  };

  return (
    <div className="space-y-4">
      <Button type="button" variant="outline" size="sm" onClick={() => onChange([...children, defaultChild()])}>
        Add child
      </Button>

      {children.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Optional: add children to model costs that end when they leave home, plus illustrative university support.
        </p>
      ) : (
        children.map((child) => (
          <div key={child.id} className="rounded-lg border p-4 space-y-3">
            <div className="flex flex-wrap gap-2 items-start justify-between">
              <div className="grid gap-3 sm:grid-cols-2 flex-1 min-w-[12rem]">
                <Field label="Name">
                  <Input
                    value={child.label}
                    onChange={(e) => patch(child.id, { label: e.target.value })}
                  />
                </Field>
                <Field label="Date of birth">
                  <Input
                    type="date"
                    value={child.dateOfBirth}
                    onChange={(e) => patch(child.id, { dateOfBirth: e.target.value })}
                  />
                </Field>
                <Field label="At home until age" hint="Household child costs typically end here.">
                  <NumberInput
                    value={child.atHomeUntilAge}
                    onChange={(n) => patch(child.id, { atHomeUntilAge: n })}
                    min={16}
                    max={30}
                  />
                </Field>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onChange(children.filter((c) => c.id !== child.id))}
                aria-label={`Remove ${child.label}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={child.universitySupport?.enabled ?? false}
                onChange={(e) => patchUni(child.id, { enabled: e.target.checked })}
              />
              Include parental university support (illustrative)
            </label>
            {child.universitySupport?.enabled && (
              <div className="grid gap-3 sm:grid-cols-2 pl-0 sm:pl-6">
                <Field label="Tuition contribution / yr">
                  <MoneyPeriodInput
                    annualValue={child.universitySupport.tuitionAnnual}
                    onAnnualChange={(n) => patchUni(child.id, { tuitionAnnual: n })}
                  />
                </Field>
                <Field label="Living contribution / yr">
                  <MoneyPeriodInput
                    annualValue={child.universitySupport.livingContributionAnnual}
                    onAnnualChange={(n) => patchUni(child.id, { livingContributionAnnual: n })}
                  />
                </Field>
                <Field label="From age">
                  <NumberInput
                    value={child.universitySupport.fromAge}
                    onChange={(n) => patchUni(child.id, { fromAge: n })}
                    min={17}
                    max={25}
                  />
                </Field>
                <Field label="Years">
                  <NumberInput
                    value={child.universitySupport.years}
                    onChange={(n) => patchUni(child.id, { years: n })}
                    min={1}
                    max={6}
                  />
                </Field>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
