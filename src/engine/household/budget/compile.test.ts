import { describe, expect, it } from "vitest";
import { makeDefaultProfile } from "@/engine/constants/defaults";
import { currentTaxYearPack } from "@/engine/constants/taxYears";
import { compileHouseholdBudget, newBudgetLineId, newChildId } from "./compile";

describe("compileHouseholdBudget", () => {
  it("rolls up essential and discretionary for the current year", () => {
    const primary = makeDefaultProfile();
    const budget = {
      lines: [
        {
          id: newBudgetLineId(),
          label: "Groceries",
          owner: "shared" as const,
          amountAnnual: 6000,
          essential: true,
        },
        {
          id: newBudgetLineId(),
          label: "Eating out",
          owner: "shared" as const,
          amountAnnual: 2000,
          essential: false,
        },
      ],
      children: [],
    };
    const compiled = compileHouseholdBudget(budget, {
      primary,
      partner: null,
      taxYearPack: currentTaxYearPack(),
      asOf: new Date("2026-06-01"),
    });
    expect(compiled.rollupNow.essentialAnnual).toBe(6000);
    expect(compiled.rollupNow.discretionaryAnnual).toBe(2000);
    expect(compiled.rollupNow.totalAnnual).toBe(8000);
  });

  it("generates university events when enabled", () => {
    const primary = makeDefaultProfile();
    const childId = newChildId();
    const budget = {
      lines: [],
      children: [
        {
          id: childId,
          label: "Child",
          dateOfBirth: "2010-01-01",
          atHomeUntilAge: 18,
          universitySupport: {
            enabled: true,
            tuitionAnnual: 9250,
            livingContributionAnnual: 5000,
            fromAge: 18,
            years: 3,
          },
        },
      ],
      syncProjectionEvents: true,
    };
    const compiled = compileHouseholdBudget(budget, {
      primary,
      partner: null,
      taxYearPack: currentTaxYearPack(),
      asOf: new Date("2026-06-01"),
    });
    expect(compiled.generatedEvents.some((e) => e.label?.includes("university"))).toBe(
      true,
    );
    const uni = compiled.generatedEvents.find((e) => e.label?.includes("university"));
    expect(uni?.annualAmount).toBe(14250);
  });
});
