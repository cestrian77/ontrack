import type { Projection, UserProfile } from "@/engine/types";

export interface PersonEstateIht {
  label: string;
  age: number;
  ihtDue: number;
}

export interface PlanningSummary {
  hasCare: boolean;
  hasGuardrails: boolean;
  hasEstate: boolean;
  peakAnnualCare: number;
  totalCareYears: number;
  estateByPerson: PersonEstateIht[];
  householdEstateIht: number;
  /** Latest guardrail multiplier in retirement (merged projection). */
  latestGuardrailMultiplier: number | null;
}

function estateFromProjection(
  label: string,
  projection: Projection,
): PersonEstateIht | null {
  const row = projection.years.find((y) => (y.projectedEstateIht ?? 0) > 0);
  if (!row || row.projectedEstateIht == null) return null;
  return { label, age: row.age, ihtDue: row.projectedEstateIht };
}

export function summarizePlanning(
  projection: Projection,
  profiles: { primary: UserProfile; labelPrimary?: string; partner?: UserProfile | null; partnerProjection?: Projection | null },
): PlanningSummary {
  const labelPrimary = profiles.labelPrimary ?? "You";
  const estateByPerson: PersonEstateIht[] = [];
  const primaryEstate = estateFromProjection(labelPrimary, projection);
  if (primaryEstate) estateByPerson.push(primaryEstate);

  if (profiles.partner && profiles.partnerProjection) {
    const partnerEstate = estateFromProjection("Partner", profiles.partnerProjection);
    if (partnerEstate) estateByPerson.push(partnerEstate);
  }

  let peakAnnualCare = 0;
  let totalCareYears = 0;
  let latestGuardrailMultiplier: number | null = null;

  for (const y of projection.years) {
    const care = y.longTermCareCost ?? 0;
    if (care > 0) {
      totalCareYears += 1;
      peakAnnualCare = Math.max(peakAnnualCare, care);
    }
    if (y.retired && y.guardrailSpendingMultiplier != null) {
      latestGuardrailMultiplier = y.guardrailSpendingMultiplier;
    }
  }

  const hasCare =
    Boolean(profiles.primary.longTermCare?.enabled) ||
    Boolean(profiles.partner?.longTermCare?.enabled);
  const hasGuardrails =
    Boolean(profiles.primary.spendingGuardrails?.enabled) ||
    Boolean(profiles.partner?.spendingGuardrails?.enabled);
  const hasEstate =
    Boolean(profiles.primary.estatePlanning?.enabled) ||
    Boolean(profiles.partner?.estatePlanning?.enabled);

  return {
    hasCare,
    hasGuardrails,
    hasEstate,
    peakAnnualCare,
    totalCareYears,
    estateByPerson,
    householdEstateIht: estateByPerson.reduce((s, e) => s + e.ihtDue, 0),
    latestGuardrailMultiplier,
  };
}

export interface PlanningChartRow {
  age: number;
  careCost: number;
  guardrailMultiplier: number | null;
}

export function buildPlanningChartRows(projection: Projection): PlanningChartRow[] {
  return projection.years.map((y) => ({
    age: y.age,
    careCost: y.longTermCareCost ?? 0,
    guardrailMultiplier: y.guardrailSpendingMultiplier ?? null,
  }));
}
