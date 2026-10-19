import { useState } from "react";
import { NumberInput } from "@/components/forms/Field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  annualFromPeriod,
  annualMinMaxForPeriod,
  MONEY_PERIOD_LABELS,
  periodFromAnnual,
  type MoneyPeriod,
} from "@/lib/moneyPeriod";
import { cn } from "@/lib/utils";

type Props = {
  /** Stored value — always annual £ in the profile/engine. */
  annualValue: number;
  onAnnualChange: (annual: number) => void;
  defaultPeriod?: MoneyPeriod;
  minAnnual?: number;
  maxAnnual?: number;
  step?: number;
  /** Round stored annual £ to whole pounds (default). Use false for weekly State Pension etc. */
  roundAnnual?: boolean;
  className?: string;
};

export function MoneyPeriodInput({
  annualValue,
  onAnnualChange,
  defaultPeriod = "year",
  minAnnual,
  maxAnnual,
  step,
  roundAnnual = true,
  className,
}: Props) {
  const [period, setPeriod] = useState<MoneyPeriod>(defaultPeriod);
  const { min, max } = annualMinMaxForPeriod(minAnnual, maxAnnual, period);
  const display = periodFromAnnual(annualValue, period);
  const toStoredAnnual = (n: number) => {
    const annual = annualFromPeriod(n, period);
    return roundAnnual ? Math.round(annual) : Math.round(annual * 100) / 100;
  };

  return (
    <div className={cn("flex gap-2", className)}>
      <NumberInput
        className="min-w-0 flex-1"
        prefix="£"
        value={Math.round(display * 100) / 100}
        onChange={(n) => onAnnualChange(toStoredAnnual(n))}
        min={min}
        max={max}
        step={step}
      />
      <Select
        value={period}
        onValueChange={(v) => setPeriod(v as MoneyPeriod)}
      >
        <SelectTrigger className="w-[8.5rem] shrink-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(MONEY_PERIOD_LABELS) as MoneyPeriod[]).map((key) => (
            <SelectItem key={key} value={key}>
              {MONEY_PERIOD_LABELS[key]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
