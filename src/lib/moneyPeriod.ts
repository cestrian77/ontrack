import { gbp } from "@/lib/utils";

export type MoneyPeriod = "week" | "month" | "year";

export const MONEY_PERIOD_LABELS: Record<MoneyPeriod, string> = {
  week: "Per week",
  month: "Per month",
  year: "Per year",
};

/** Convert a figure in the chosen period to annual £ (engine storage). */
export function annualFromPeriod(amount: number, period: MoneyPeriod): number {
  if (!Number.isFinite(amount)) return 0;
  switch (period) {
    case "week":
      return amount * 52;
    case "month":
      return amount * 12;
    case "year":
      return amount;
  }
}

/** Convert annual £ to a figure in the chosen period for display/editing. */
export function periodFromAnnual(annual: number, period: MoneyPeriod): number {
  if (!Number.isFinite(annual)) return 0;
  switch (period) {
    case "week":
      return annual / 52;
    case "month":
      return annual / 12;
    case "year":
      return annual;
  }
}

/** Read-only labels for stored annual £ (review, reports). */
export function gbpPerYear(n: number): string {
  return `${gbp(n)}/yr`;
}

export function annualMinMaxForPeriod(
  minAnnual: number | undefined,
  maxAnnual: number | undefined,
  period: MoneyPeriod,
): { min?: number; max?: number } {
  return {
    min: minAnnual !== undefined ? periodFromAnnual(minAnnual, period) : undefined,
    max: maxAnnual !== undefined ? periodFromAnnual(maxAnnual, period) : undefined,
  };
}
