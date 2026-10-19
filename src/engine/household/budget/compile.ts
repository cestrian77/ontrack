import { ageFromDob } from "@/engine/project/runProjection";
import type { UserProfile } from "@/engine/types";
import type {
  BudgetLine,
  BudgetOwner,
  BudgetRollup,
  ChildProfile,
  CompiledHouseholdBudget,
  HouseholdBudget,
  NearTermYearRow,
  UniversitySupportPrefs,
} from "./types";
import { BUDGET_EVENT_ID_PREFIX } from "./types";
import type { RecurringLifeEvent } from "@/engine/types";
import {
  annualNetEmploymentIncome,
  annualOtherIncome,
} from "@/engine/cashflow/employmentIncome";
import type { TaxYearPack } from "@/engine/constants/taxYears";

function ownerKey(owner: BudgetOwner): string {
  return owner;
}

function lineActiveInYear(line: BudgetLine, calendarYear: number): boolean {
  if (line.fromCalendarYear != null && calendarYear < line.fromCalendarYear) return false;
  if (line.toCalendarYear != null && calendarYear > line.toCalendarYear) return false;
  return line.amountAnnual > 0;
}

function rollupLines(lines: BudgetLine[], calendarYear: number): BudgetRollup {
  const byOwner: Record<string, number> = {};
  let essentialAnnual = 0;
  let discretionaryAnnual = 0;
  for (const line of lines) {
    if (!lineActiveInYear(line, calendarYear)) continue;
    const amt = line.amountAnnual;
    byOwner[ownerKey(line.owner)] = (byOwner[ownerKey(line.owner)] ?? 0) + amt;
    if (line.essential) essentialAnnual += amt;
    else discretionaryAnnual += amt;
  }
  return {
    essentialAnnual,
    discretionaryAnnual,
    totalAnnual: essentialAnnual + discretionaryAnnual,
    byOwner,
  };
}

function calendarYearForAge(dob: string, age: number): number {
  const birth = new Date(dob);
  return birth.getFullYear() + age;
}

function defaultUniversity(): UniversitySupportPrefs {
  return {
    enabled: false,
    tuitionAnnual: 9250,
    livingContributionAnnual: 8000,
    fromAge: 18,
    years: 3,
  };
}

/** Child-linked lines end when child leaves home (unless overridden on line). */
function effectiveChildLineYears(
  line: BudgetLine,
  child: ChildProfile,
): { from?: number; to?: number } {
  if (!line.owner.startsWith("child:")) return {};
  const childId = line.owner.slice("child:".length);
  if (childId !== child.id) return {};
  const leaveAge = child.atHomeUntilAge;
  const toYear = calendarYearForAge(child.dateOfBirth, leaveAge) - 1;
  return {
    from: line.fromCalendarYear,
    to: line.toCalendarYear ?? toYear,
  };
}

function linesWithChildWindows(
  lines: BudgetLine[],
  children: ChildProfile[],
): BudgetLine[] {
  return lines.map((line) => {
    const child = children.find((c) => line.owner === `child:${c.id}`);
    if (!child) return line;
    const win = effectiveChildLineYears(line, child);
    return {
      ...line,
      fromCalendarYear: win.from ?? line.fromCalendarYear,
      toCalendarYear: win.to ?? line.toCalendarYear,
    };
  });
}

function universityEvents(child: ChildProfile): RecurringLifeEvent[] {
  const uni = child.universitySupport ?? defaultUniversity();
  if (!uni.enabled) return [];
  const fromYear = calendarYearForAge(child.dateOfBirth, uni.fromAge);
  const toYear = fromYear + Math.max(0, uni.years - 1);
  const annual = uni.tuitionAnnual + uni.livingContributionAnnual;
  if (annual <= 0) return [];
  return [
    {
      id: `${BUDGET_EVENT_ID_PREFIX}uni-${child.id}`,
      kind: "recurring_expense",
      label: `${child.label}: university support`,
      fromYear,
      toYear,
      annualAmount: annual,
    },
  ];
}

function lineEventYears(
  line: BudgetLine,
  children: ChildProfile[],
  asOfYear: number,
): { fromYear: number; toYear: number } | null {
  if (line.amountAnnual <= 0) return null;
  let fromYear = line.fromCalendarYear;
  let toYear = line.toCalendarYear;
  if (line.owner.startsWith("child:")) {
    const childId = line.owner.slice("child:".length);
    const child = children.find((c) => c.id === childId);
    if (child) {
      const birthYear = new Date(child.dateOfBirth).getFullYear();
      fromYear = fromYear ?? Math.max(asOfYear, birthYear);
      toYear = toYear ?? calendarYearForAge(child.dateOfBirth, child.atHomeUntilAge) - 1;
    }
  }
  if (fromYear == null && toYear == null) return null;
  const from = fromYear ?? asOfYear;
  const to = toYear ?? from + 30;
  if (to < from) return null;
  return { fromYear: from, toYear: to };
}

export function generateBudgetTimelineEvents(
  children: ChildProfile[],
  expandedLines: BudgetLine[],
  asOfYear: number,
): RecurringLifeEvent[] {
  const events: RecurringLifeEvent[] = [];
  for (const line of expandedLines) {
    const years = lineEventYears(line, children, asOfYear);
    if (!years) continue;
    events.push({
      id: `${BUDGET_EVENT_ID_PREFIX}line-${line.id}`,
      kind: "recurring_expense",
      label: line.label,
      fromYear: years.fromYear,
      toYear: years.toYear,
      annualAmount: line.amountAnnual,
    });
  }
  for (const child of children) {
    events.push(...universityEvents(child));
  }
  return events;
}

function householdEmploymentIncome(
  primary: UserProfile,
  partner: UserProfile | null,
  pack: TaxYearPack,
): number {
  let sum =
    annualNetEmploymentIncome(primary, pack) + annualOtherIncome(primary);
  if (partner) {
    sum += annualNetEmploymentIncome(partner, pack) + annualOtherIncome(partner);
  }
  return sum;
}

function statedAnnualInvesting(primary: UserProfile, partner: UserProfile | null): number {
  const one = (p: UserProfile) =>
    p.ssIsaMonthly * 12 +
    (p.hasLisa ? p.lisaMonthly * 12 : 0) +
    (p.hasGia ? p.giaMonthly * 12 : 0) +
    p.sippMonthly * 12 +
    p.grossSalary * p.employeeContribPct;
  return one(primary) + (partner ? one(partner) : 0);
}

function filterLinesForView(
  lines: BudgetLine[],
  view: "household" | "primary" | "partner",
  hasPartner: boolean,
): BudgetLine[] {
  if (view === "household" || !hasPartner) return lines;
  if (view === "primary") {
    return lines.filter((l) => l.owner === "primary" || l.owner === "shared");
  }
  return lines.filter((l) => l.owner === "partner" || l.owner === "shared");
}

export interface CompileBudgetContext {
  primary: UserProfile;
  partner: UserProfile | null;
  taxYearPack: TaxYearPack;
  asOf?: Date;
  view?: "household" | "primary" | "partner";
  nearTermYears?: number;
}

export function compileHouseholdBudget(
  budget: HouseholdBudget,
  ctx: CompileBudgetContext,
): CompiledHouseholdBudget {
  const asOf = ctx.asOf ?? new Date();
  const calendarYear = asOf.getFullYear();
  const view = ctx.view ?? "household";
  const expanded = linesWithChildWindows(budget.lines, budget.children);
  const visible = filterLinesForView(
    expanded,
    view,
    ctx.partner != null,
  );

  const rollupNow = rollupLines(visible, calendarYear);
  const rollup = rollupLines(visible, calendarYear);

  const generatedEvents = budget.syncProjectionEvents
    ? generateBudgetTimelineEvents(budget.children, expanded, calendarYear)
    : [];

  const horizon = ctx.nearTermYears ?? 5;
  const incomeBase = householdEmploymentIncome(ctx.primary, ctx.partner, ctx.taxYearPack);
  const investing = statedAnnualInvesting(ctx.primary, ctx.partner);
  const nearTerm: NearTermYearRow[] = [];

  for (let i = 0; i < horizon; i++) {
    const year = calendarYear + i;
    const yearRollup = rollupLines(visible, year);
    const agePrimary = ageFromDob(ctx.primary.dateOfBirth, asOf) + i;
    const outgoingsAnnual = yearRollup.totalAnnual;
    const surplusAnnual = incomeBase - outgoingsAnnual;
    nearTerm.push({
      calendarYear: year,
      agePrimary,
      incomeAnnual: incomeBase,
      outgoingsAnnual,
      surplusAnnual,
      statedInvestingAnnual: investing,
      gapAnnual: surplusAnnual - investing,
    });
  }

  return {
    rollup,
    rollupNow,
    generatedEvents,
    nearTerm,
  };
}

export function emptyHouseholdBudget(): HouseholdBudget {
  return { lines: [], children: [], syncProjectionEvents: true };
}

export function newBudgetLineId(): string {
  return `bl-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function newChildId(): string {
  return `ch-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
