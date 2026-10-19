import type { LifeEvent, RecurringLifeEvent } from "@/engine/types";

/** Who pays this line in the household budget (stored on household, not per profile). */
export type BudgetOwner = "primary" | "partner" | "shared" | `child:${string}`;

export interface BudgetLine {
  id: string;
  label: string;
  /** Suggested category id from templates, if any. */
  templateId?: string;
  owner: BudgetOwner;
  /** Annual amount in today's £ (real terms). */
  amountAnnual: number;
  essential: boolean;
  /** Inclusive calendar years; omit for always active. */
  fromCalendarYear?: number;
  toCalendarYear?: number;
}

export interface UniversitySupportPrefs {
  enabled: boolean;
  /** Parental tuition contribution (illustrative; default England cap). */
  tuitionAnnual: number;
  livingContributionAnnual: number;
  fromAge: number;
  years: number;
}

export interface ChildProfile {
  id: string;
  label: string;
  dateOfBirth: string;
  /** Last age at which "at home" household costs apply (default 18). */
  atHomeUntilAge: number;
  universitySupport?: UniversitySupportPrefs;
}

export interface HouseholdBudget {
  lines: BudgetLine[];
  children: ChildProfile[];
  /** When set, child/uni schedules are merged into primary timelineEvents on apply. */
  syncProjectionEvents?: boolean;
  lastAppliedAt?: string;
}

export interface BudgetRollup {
  essentialAnnual: number;
  discretionaryAnnual: number;
  totalAnnual: number;
  byOwner: Record<string, number>;
}

export interface NearTermYearRow {
  calendarYear: number;
  agePrimary: number;
  incomeAnnual: number;
  outgoingsAnnual: number;
  surplusAnnual: number;
  statedInvestingAnnual: number;
  gapAnnual: number;
}

export interface CompiledHouseholdBudget {
  rollup: BudgetRollup;
  /** Lines active in the current calendar year. */
  rollupNow: BudgetRollup;
  generatedEvents: RecurringLifeEvent[];
  nearTerm: NearTermYearRow[];
}

export const BUDGET_EVENT_ID_PREFIX = "budget-auto-";

export function isBudgetGeneratedEvent(ev: LifeEvent): boolean {
  return ev.id.startsWith(BUDGET_EVENT_ID_PREFIX);
}
