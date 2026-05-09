import { describe, expect, it } from "vitest";
import { makeDefaultProfile } from "@/engine/constants/defaults";
import { currentTaxYearPack } from "@/engine/constants/taxYears";
import { runProjection } from "@/engine/project/runProjection";
import { computeFire } from "@/engine/fire/fire";
import { buildReportData } from "@/features/reports/buildReportData";
import type { Insight, Scenario } from "@/engine/types";

describe("buildReportData", () => {
  it("builds report metrics and selected scenario comparisons", () => {
    const profile = makeDefaultProfile();
    const projection = runProjection(profile);
    const fire = computeFire(profile, projection);
    const scenarios: Scenario[] = [
      {
        id: "s1",
        name: "Boost ISA",
        colour: "#00AAFF",
        templateId: "boost_isa",
        overrides: {},
        params: { isaBoost: { monthlyExtra: 200, mode: "flat", rampYears: 5 } },
        createdAt: new Date().toISOString(),
      },
    ];
    const insights: Insight[] = [
      {
        id: "i1",
        category: "fire",
        severity: "info",
        title: "Check contributions",
        body: "Increasing ISA contributions can bring FIRE date forward.",
        impactScore: 80,
      },
    ];

    const data = buildReportData({
      profile,
      projection,
      fire,
      baseTaxYearPack: currentTaxYearPack(),
      scenarios,
      selectedScenarioIds: ["s1"],
      insights,
    });

    expect(data.dashboardMetrics.length).toBeGreaterThan(0);
    expect(data.dashboardSummaryFootnotes.length).toBeGreaterThan(0);
    expect(data.scenarioComparisonFootnotes.length).toBeGreaterThan(0);
    expect(data.activeInsights).toHaveLength(1);
    expect(data.scenarioComparison).toHaveLength(1);
    expect(data.scenarioComparison[0]?.scenarioName).toBe("Boost ISA");
    expect(data.chartImages).toBeUndefined();
  });
});
