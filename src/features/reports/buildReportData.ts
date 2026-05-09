import type { TaxYearPack } from "@/engine/constants/taxYears";
import { ageFromDob } from "@/engine/project/runProjection";
import type { FireMetrics, Insight, Projection, Scenario, UserProfile } from "@/engine/types";
import { applyScenario } from "@/engine/scenarios/templates";
import { computeFire } from "@/engine/fire/fire";
import { runProjection } from "@/engine/project/runProjection";
import { scenarioTaxYearPack } from "@/lib/taxYearContext";
import {
  REPORT_DASHBOARD_FOOTNOTES,
  REPORT_SCENARIO_FIRE_FOOTNOTES,
} from "@/lib/fireMetricsExplain";
import { gbp, pct } from "@/lib/utils";

export interface ReportMetric {
  label: string;
  value: string;
}

export interface ReportScenarioComparisonRow {
  scenarioName: string;
  netWorthAtRetirement: string;
  fireAge: string;
  fireNumber: string;
}

/** PNG data URIs for optional PDF chart sections (generated at export time). */
export interface ReportChartImages {
  wealthJourney?: string;
  cashflow?: string;
}

export interface ReportData {
  generatedAt: string;
  profileName: string;
  dashboardMetrics: ReportMetric[];
  dashboardSummaryFootnotes: readonly string[];
  scenarioComparison: ReportScenarioComparisonRow[];
  scenarioComparisonFootnotes: readonly string[];
  activeInsights: Array<{ title: string; body: string; severity: Insight["severity"] }>;
  assumptions: ReportMetric[];
  chartImages?: ReportChartImages;
}

interface BuildReportDataArgs {
  profile: UserProfile;
  projection: Projection;
  fire: FireMetrics;
  baseTaxYearPack: TaxYearPack;
  scenarios: Scenario[];
  selectedScenarioIds: string[];
  insights: Insight[];
}

export function buildReportData({
  profile,
  projection,
  fire,
  baseTaxYearPack,
  scenarios,
  selectedScenarioIds,
  insights,
}: BuildReportDataArgs): ReportData {
  const age = ageFromDob(profile.dateOfBirth);
  const retirementYear = projection.years.find((y) => y.age === profile.retirementTargetAge);
  const selectedScenarios = scenarios.filter((scenario) => selectedScenarioIds.includes(scenario.id));

  return {
    generatedAt: new Date().toISOString(),
    profileName: `Age ${age} profile`,
    dashboardMetrics: [
      { label: "Current age", value: String(age) },
      { label: "Target retirement age", value: String(profile.retirementTargetAge) },
      { label: "Target retirement income", value: gbp(profile.targetRetirementIncome) },
      { label: "Net worth today", value: gbp(projection.years[0]?.totalNetWorth ?? 0) },
      { label: "Net worth at retirement", value: gbp(retirementYear?.totalNetWorth ?? 0) },
      { label: "FIRE number", value: gbp(fire.fireNumber) },
      { label: "FIRE progress", value: pct(Math.min(1, fire.fireProgressPct / 100)) },
      { label: "FIRE age", value: fire.fireAge ? `Age ${fire.fireAge}` : "Not reached" },
    ],
    dashboardSummaryFootnotes: [...REPORT_DASHBOARD_FOOTNOTES],
    scenarioComparison: selectedScenarios.map((scenario) => {
      const updatedProfile = applyScenario(profile, scenario);
      const pack = scenarioTaxYearPack(baseTaxYearPack, scenario.params?.taxYearLabel);
      const scenarioProjection = runProjection(updatedProfile, { taxYearPack: pack });
      const scenarioFire = computeFire(updatedProfile, scenarioProjection, pack);
      const scenarioAtRetirement = scenarioProjection.years.find(
        (year) => year.age === updatedProfile.retirementTargetAge,
      );
      return {
        scenarioName: scenario.name,
        netWorthAtRetirement: gbp(scenarioAtRetirement?.totalNetWorth ?? 0),
        fireAge: scenarioFire.fireAge ? `Age ${scenarioFire.fireAge}` : "Not reached",
        fireNumber: gbp(scenarioFire.fireNumber),
      };
    }),
    scenarioComparisonFootnotes: [...REPORT_SCENARIO_FIRE_FOOTNOTES],
    activeInsights: insights.slice(0, 8).map((insight) => ({
      title: insight.title,
      body: insight.body,
      severity: insight.severity,
    })),
    assumptions: [
      { label: "Tax year (analysis)", value: baseTaxYearPack.label },
      { label: "CPI inflation", value: pct(profile.cpi) },
      { label: "Cash rate", value: pct(profile.cashRate) },
      { label: "Pension growth (nominal)", value: pct(profile.pensionGrowth) },
      { label: "ISA growth (nominal)", value: pct(profile.isaGrowth) },
      { label: "GIA growth (nominal)", value: pct(profile.giaGrowth) },
      { label: "Property appreciation (real)", value: pct(profile.primaryAppreciation) },
      { label: "Rental growth", value: pct(profile.rentalGrowth) },
      { label: "Safe withdrawal rate", value: pct(profile.safeWithdrawalRate) },
      { label: "Lean FIRE ratio", value: pct(profile.leanFirePct) },
      { label: "Fat FIRE ratio", value: pct(profile.fatFirePct) },
    ],
  };
}
