import type { TaxYearPack } from "@/engine/constants/taxYears";
import { ageFromDob } from "@/engine/project/runProjection";
import type { FireMetrics, Insight, Projection, Scenario, UserProfile } from "@/engine/types";
import {
  applyScenario,
  SCENARIO_TEMPLATES,
  summarizeScenario,
} from "@/engine/scenarios/templates";
import { computeFire } from "@/engine/fire/fire";
import { runProjection } from "@/engine/project/runProjection";
import { scenarioTaxYearPack } from "@/lib/taxYearContext";
import {
  REPORT_DASHBOARD_FOOTNOTES,
  REPORT_FIRE_DETAIL_FOOTNOTES,
  REPORT_SCENARIO_FIRE_FOOTNOTES,
} from "@/lib/fireMetricsExplain";
import {
  buildBtlPropertyReportBlocks,
  buildTaxDashboardReport,
  type BtlPropertyReportBlock,
  type TaxDashboardReport,
} from "@/lib/taxDashboardReport";
import { buildTaxYearOutlook } from "@/lib/taxYearOutlook";
import { gbp, pct } from "@/lib/utils";

export interface ReportMetric {
  label: string;
  value: string;
}

export interface ReportScenarioComparisonRow {
  scenarioName: string;
  templateName: string;
  personScope: "primary" | "partner";
  summary: string;
  netWorthAtRetirement: string;
  fireAge: string;
  fireNumber: string;
}

/** PNG data URIs for optional PDF chart sections (generated at export time). */
export interface ReportChartImages {
  wealthJourney?: string;
  cashflow?: string;
}

export interface TaxPersonReportSnapshot {
  personLabel: string;
  tax: TaxDashboardReport;
  btlBlocks: BtlPropertyReportBlock[];
}

export interface ReportData {
  generatedAt: string;
  profileName: string;
  analysisTaxYearLabel: string;
  dashboardMetrics: ReportMetric[];
  dashboardSummaryFootnotes: readonly string[];
  fireDetailMetrics: ReportMetric[];
  fireDetailFootnotes: readonly string[];
  scenarioComparison: ReportScenarioComparisonRow[];
  scenarioComparisonFootnotes: readonly string[];
  activeInsights: Array<{ title: string; body: string; severity: Insight["severity"] }>;
  assumptions: ReportMetric[];
  taxPersonSnapshots: TaxPersonReportSnapshot[];
  chartImages?: ReportChartImages;
}

interface BuildReportDataArgs {
  /** Shown metrics / assumptions (individual or household synthetic). */
  profile: UserProfile;
  primaryProfile: UserProfile;
  partnerProfile?: UserProfile | null;
  projection: Projection;
  fire: FireMetrics;
  baseTaxYearPack: TaxYearPack;
  scenarios: Scenario[];
  selectedScenarioIds: string[];
  insights: Insight[];
  /** Overrides default `Age N profile` / household label. */
  profileDisplayName?: string;
  /** Settings tax year label (same pack as base projection). */
  analysisTaxYearLabel: string;
}

function scenarioTemplateName(scenario: Scenario): string {
  if (!scenario.templateId) return "Custom scenario";
  const meta = SCENARIO_TEMPLATES.find((t) => t.id === scenario.templateId);
  return meta?.name ?? scenario.templateId;
}

function buildFireDetailMetrics(fire: FireMetrics, profile: UserProfile): ReportMetric[] {
  const coastNote = fire.coastFireApplicable
    ? fire.coastReached
      ? " · Reached"
      : " · Not yet"
    : "N/A (no pension in pot)";
  return [
    { label: "FIRE number (classic)", value: gbp(fire.fireNumber) },
    { label: "FIRE number (effective)", value: gbp(fire.effectiveFireNumber) },
    { label: "FIRE pot now", value: gbp(fire.firePotNow) },
    { label: "FIRE pot at retirement target", value: gbp(fire.firePotAtRetirement) },
    { label: "FIRE progress", value: pct(Math.min(1, fire.fireProgressPct / 100)) },
    { label: "FIRE age", value: fire.fireAge ? `Age ${fire.fireAge}` : "Beyond horizon" },
    { label: "Years to FIRE", value: fire.yearsToFire !== null ? String(fire.yearsToFire) : "—" },
    { label: "Savings rate", value: pct(fire.savingsRate, 1) },
    {
      label: "Passive income at reference",
      value: gbp(fire.passiveIncomeAtReference),
    },
    {
      label: "Reference age (passive)",
      value: fire.referenceAgeForPassive !== null ? String(fire.referenceAgeForPassive) : "—",
    },
    {
      label: "Full FIRE (effective)",
      value: `${gbp(fire.effectiveFireNumber)} · ${pct(profile.safeWithdrawalRate, 2)} SWR`,
    },
    {
      label: "Lean FIRE (effective)",
      value: `${gbp(fire.effectiveLeanFireNumber)} · ${pct(profile.leanFirePct, 0)} of target`,
    },
    {
      label: "Fat FIRE (effective)",
      value: `${gbp(fire.effectiveFatFireNumber)} · ${pct(profile.fatFirePct, 0)} of target`,
    },
    {
      label: "Coast FIRE (effective)",
      value: fire.coastFireApplicable ? `${gbp(fire.effectiveCoastFireNumber)}${coastNote}` : coastNote,
    },
    {
      label: "Barista FIRE (effective)",
      value: `${gbp(fire.effectiveBaristaFireNumber)} · ${gbp(profile.baristaPartTimeIncome)}/yr part-time`,
    },
    {
      label: "Income offsets in FIRE calc",
      value: fire.fireCalculationUsesIncomeOffsets ? "Yes" : "No",
    },
    {
      label: "Pot filters in FIRE calc",
      value: fire.fireCalculationUsesPotFilters ? "Yes" : "No",
    },
  ];
}

export function buildReportData({
  profile,
  primaryProfile,
  partnerProfile = null,
  projection,
  fire,
  baseTaxYearPack,
  scenarios,
  selectedScenarioIds,
  insights,
  profileDisplayName,
  analysisTaxYearLabel,
}: BuildReportDataArgs): ReportData {
  const age = ageFromDob(profile.dateOfBirth);
  const retirementYear = projection.years.find((y) => y.age === profile.retirementTargetAge);
  const selectedScenarios = scenarios.filter((scenario) => selectedScenarioIds.includes(scenario.id));

  const taxPersonSnapshots: TaxPersonReportSnapshot[] = [
    {
      personLabel: partnerProfile ? "You (primary)" : "You",
      tax: buildTaxDashboardReport(primaryProfile, baseTaxYearPack),
      btlBlocks: buildBtlPropertyReportBlocks(primaryProfile, baseTaxYearPack),
    },
  ];
  if (partnerProfile) {
    taxPersonSnapshots.push({
      personLabel: "Partner",
      tax: buildTaxDashboardReport(partnerProfile, baseTaxYearPack),
      btlBlocks: buildBtlPropertyReportBlocks(partnerProfile, baseTaxYearPack),
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    profileName: profileDisplayName ?? `Age ${age} profile`,
    analysisTaxYearLabel,
    dashboardMetrics: [
      { label: "Current age", value: String(age) },
      { label: "Target retirement age", value: String(profile.retirementTargetAge) },
      { label: "Target retirement income", value: gbp(profile.targetRetirementIncome) },
      { label: "Net worth today", value: gbp(projection.years[0]?.totalNetWorth ?? 0) },
      { label: "Net worth at retirement", value: gbp(retirementYear?.totalNetWorth ?? 0) },
      { label: "FIRE number (effective)", value: gbp(fire.effectiveFireNumber) },
      { label: "FIRE number (classic)", value: gbp(fire.fireNumber) },
      { label: "FIRE progress", value: pct(Math.min(1, fire.fireProgressPct / 100)) },
      { label: "FIRE age", value: fire.fireAge ? `Age ${fire.fireAge}` : "Not reached" },
    ],
    dashboardSummaryFootnotes: [...REPORT_DASHBOARD_FOOTNOTES],
    fireDetailMetrics: buildFireDetailMetrics(fire, profile),
    fireDetailFootnotes: [...REPORT_FIRE_DETAIL_FOOTNOTES],
    scenarioComparison: selectedScenarios.map((scenario) => {
      const base =
        scenario.personScope === "partner" && partnerProfile
          ? partnerProfile
          : primaryProfile;
      const updatedProfile = applyScenario(base, scenario);
      const pack = scenarioTaxYearPack(baseTaxYearPack, scenario.params?.taxYearLabel);
      const scenarioProjection = runProjection(updatedProfile, {
        taxYearPack: pack,
        freezeTaxYearPack: !!scenario.params?.taxYearLabel,
      });
      const scenarioFire = computeFire(updatedProfile, scenarioProjection, pack);
      const scenarioAtRetirement = scenarioProjection.years.find(
        (year) => year.age === updatedProfile.retirementTargetAge,
      );
      return {
        scenarioName: scenario.name,
        templateName: scenarioTemplateName(scenario),
        personScope: scenario.personScope ?? "primary",
        summary: summarizeScenario(scenario),
        netWorthAtRetirement: gbp(scenarioAtRetirement?.totalNetWorth ?? 0),
        fireAge: scenarioFire.fireAge ? `Age ${scenarioFire.fireAge}` : "Not reached",
        fireNumber: gbp(scenarioFire.effectiveFireNumber),
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
      {
        label: "Tax rules in projection",
        value: projection.meta.steppedTaxYears
          ? "Step with calendar (registered packs)"
          : "Frozen to analysis year",
      },
      ...(buildTaxYearOutlook(primaryProfile, baseTaxYearPack, projection)
        ? [
            {
              label: "Next tax-year BTL impact (illustrative)",
              value: (() => {
                const o = buildTaxYearOutlook(primaryProfile, baseTaxYearPack, projection);
                if (!o?.btlAnnualDelta) return "See dashboard";
                return o.btlAnnualDelta < 0
                  ? `${gbp(-o.btlAnnualDelta)}/yr vs ${baseTaxYearPack.label} (${o.nextPackLabel})`
                  : "Neutral at current rents";
              })(),
            },
          ]
        : []),
      { label: "CPI inflation", value: pct(profile.cpi) },
      { label: "Cash rate", value: pct(profile.cashRate) },
      { label: "Cash ISA interest (nominal)", value: pct(profile.cashIsaRate) },
      { label: "Pension growth (nominal)", value: pct(profile.pensionGrowth) },
      { label: "ISA growth (nominal)", value: pct(profile.isaGrowth) },
      { label: "GIA growth (nominal)", value: pct(profile.giaGrowth) },
      { label: "Property appreciation (real)", value: pct(profile.primaryAppreciation) },
      { label: "Rental growth", value: pct(profile.rentalGrowth) },
      { label: "Safe withdrawal rate", value: pct(profile.safeWithdrawalRate) },
      { label: "Lean FIRE ratio", value: pct(profile.leanFirePct) },
      { label: "Fat FIRE ratio", value: pct(profile.fatFirePct) },
    ],
    taxPersonSnapshots,
  };
}
