import { Trash2 } from "lucide-react";
import type { BudgetLine, BudgetOwner, ChildProfile } from "@/engine/household/budget/types";
import { BUDGET_TEMPLATES, templateById } from "@/engine/household/budget/templates";
import { newBudgetLineId } from "@/engine/household/budget/compile";
import { MoneyPeriodInput } from "@/components/forms/MoneyPeriodInput";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

type Props = {
  lines: BudgetLine[];
  children: ChildProfile[];
  hasPartner: boolean;
  onChange: (lines: BudgetLine[]) => void;
};

function ownerLabel(owner: BudgetOwner, children: ChildProfile[]): string {
  if (owner === "primary") return "You";
  if (owner === "partner") return "Partner";
  if (owner === "shared") return "Shared";
  if (owner.startsWith("child:")) {
    const id = owner.slice("child:".length);
    return children.find((c) => c.id === id)?.label ?? "Child";
  }
  return owner;
}

export function BudgetLinesTable({ lines, children, hasPartner, onChange }: Props) {
  const updateLine = (id: string, patch: Partial<BudgetLine>) => {
    onChange(lines.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  };

  const removeLine = (id: string) => {
    onChange(lines.filter((l) => l.id !== id));
  };

  const addCustom = () => {
    onChange([
      ...lines,
      {
        id: newBudgetLineId(),
        label: "Custom",
        owner: "shared",
        amountAnnual: 0,
        essential: true,
      },
    ]);
  };

  const addTemplate = (templateId: string) => {
    const t = templateById(templateId);
    if (!t) return;
    onChange([
      ...lines,
      {
        id: newBudgetLineId(),
        templateId: t.id,
        label: t.label,
        owner: "shared",
        amountAnnual: t.hintAnnual ?? 0,
        essential: t.essential,
      },
    ]);
  };

  const ownerOptions: { value: BudgetOwner; label: string }[] = [
    { value: "primary", label: "You" },
    ...(hasPartner ? [{ value: "partner" as const, label: "Partner" }] : []),
    { value: "shared", label: "Shared" },
    ...children.map((c) => ({
      value: `child:${c.id}` as BudgetOwner,
      label: c.label || "Child",
    })),
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 items-center">
        <Select onValueChange={addTemplate}>
          <SelectTrigger className="w-[min(100%,14rem)]">
            <SelectValue placeholder="Add suggested item…" />
          </SelectTrigger>
          <SelectContent>
            {BUDGET_TEMPLATES.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="button" variant="outline" size="sm" onClick={addCustom}>
          Add custom line
        </Button>
      </div>

      {lines.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No budget lines yet. Add suggested categories or a custom line to build your household picture.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="p-2 font-medium">Item</th>
                <th className="p-2 font-medium">Who</th>
                <th className="p-2 font-medium min-w-[11rem]">Amount</th>
                <th className="p-2 font-medium">Essential</th>
                <th className="p-2 w-10" aria-label="Remove" />
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => (
                <tr key={line.id} className="border-t">
                  <td className="p-2 align-top">
                    <Input
                      value={line.label}
                      onChange={(e) => updateLine(line.id, { label: e.target.value })}
                      className="min-w-[10rem]"
                    />
                  </td>
                  <td className="p-2 align-top">
                    <Select
                      value={line.owner}
                      onValueChange={(v) => updateLine(line.id, { owner: v as BudgetOwner })}
                    >
                      <SelectTrigger className="w-[7.5rem]">
                        <SelectValue>{ownerLabel(line.owner, children)}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {ownerOptions.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-2 align-top">
                    <MoneyPeriodInput
                      annualValue={line.amountAnnual}
                      onAnnualChange={(n) => updateLine(line.id, { amountAnnual: n })}
                      defaultPeriod="month"
                      step={10}
                    />
                  </td>
                  <td className="p-2 align-top">
                    <input
                      type="checkbox"
                      checked={line.essential}
                      onChange={(e) => updateLine(line.id, { essential: e.target.checked })}
                      aria-label={`Essential: ${line.label}`}
                    />
                  </td>
                  <td className="p-2 align-top">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeLine(line.id)}
                      aria-label={`Remove ${line.label}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
