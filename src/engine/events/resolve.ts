import type { LifeEvent, PropertySaleLifeEvent, UserProfile } from "@/engine/types";

export interface YearEventEffect {
  cashDelta: number;
  incomeDelta: number;
  expenseDelta: number;
  propertySales: PropertySaleLifeEvent[];
}

const emptyEffect = (): YearEventEffect => ({
  cashDelta: 0,
  incomeDelta: 0,
  expenseDelta: 0,
  propertySales: [],
});

export function timelineEventsForProfile(profile: UserProfile): LifeEvent[] {
  const events: LifeEvent[] = [...(profile.timelineEvents ?? [])];
  if (
    profile.expectedInheritance > 0 &&
    profile.inheritanceYear &&
    !events.some((e) => e.kind === "inheritance" && e.calendarYear === profile.inheritanceYear)
  ) {
    events.push({
      id: "legacy-inheritance",
      kind: "inheritance",
      calendarYear: profile.inheritanceYear,
      amount: profile.expectedInheritance,
    });
  }
  return events;
}

export function resolveYearEvents(
  events: LifeEvent[],
  calendarYear: number,
): YearEventEffect {
  const effect = emptyEffect();
  for (const ev of events) {
    switch (ev.kind) {
      case "lump_sum_income":
        if (ev.calendarYear === calendarYear) effect.cashDelta += ev.amount;
        break;
      case "lump_sum_expense":
        if (ev.calendarYear === calendarYear) effect.cashDelta -= ev.amount;
        break;
      case "recurring_income":
        if (calendarYear >= ev.fromYear && calendarYear <= ev.toYear) {
          effect.incomeDelta += ev.annualAmount;
        }
        break;
      case "recurring_expense":
        if (calendarYear >= ev.fromYear && calendarYear <= ev.toYear) {
          effect.expenseDelta += ev.annualAmount;
        }
        break;
      case "inheritance":
        if (ev.calendarYear === calendarYear) effect.cashDelta += ev.amount;
        break;
      case "property_sale":
        if (ev.calendarYear === calendarYear) effect.propertySales.push(ev);
        break;
      default:
        break;
    }
  }
  return effect;
}
