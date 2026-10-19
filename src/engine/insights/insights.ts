import type { TaxYearPack } from "@/engine/constants/taxYears";
import type { FireMetrics, Insight, Projection, UserProfile } from "@/engine/types";
import { summarizePlanning } from "@/engine/planning/summary";
import { isaBridge } from "@/engine/project/isaBridge";
import { overpaymentSummary } from "@/engine/property/mortgage";
import { ageFromDob } from "@/engine/project/runProjection";
import { btlAnnualCashflow } from "@/engine/btl/cashflow";
import { buildTaxYearOutlook } from "@/lib/taxYearOutlook";
import { marginalIncomeRate } from "@/engine/tax/incomeTax";

const fmt = (n: number) =>
  n.toLocaleString("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 });

export interface InsightContext {
  profile: UserProfile;
  projection: Projection;
  fire: FireMetrics;
  taxYearPack: TaxYearPack;
  primaryProfile?: UserProfile;
  partnerProfile?: UserProfile | null;
  partnerProjection?: Projection | null;
}

type Rule = (ctx: InsightContext) => Insight | null;

const onTrack: Rule = ({ profile, projection, fire }) => {
  const atTarget = projection.years.find((y) => y.age === profile.retirementTargetAge);
  if (!atTarget) return null;
  if (fire.firePotAtRetirement >= fire.effectiveFireNumber) {
    return {
      id: "on_track_ahead",
      category: "on_track",
      severity: "positive",
      title: "On track for retirement",
      body: `You are projected to reach your retirement target of ${fmt(profile.targetRetirementIncome)} p.a. at age ${profile.retirementTargetAge}.`,
      impactScore: 80,
      actionRoute: "/dashboard",
    };
  }
  const shortfall = fire.effectiveFireNumber - fire.firePotAtRetirement;
  return {
    id: "on_track_short",
    category: "on_track",
    severity: "negative",
    title: "Projected shortfall at retirement",
    body: `Based on current assumptions, you will have a shortfall of ${fmt(shortfall)} at age ${profile.retirementTargetAge}.`,
    impactScore: 100,
    actionRoute: "/scenarios",
  };
};

const isaBridgeRule: Rule = ({ profile, projection }) => {
  const b = isaBridge(profile, projection);
  if (!b.required) return null;
  if (b.shortfall > 0) {
    return {
      id: "isa_bridge_short",
      category: "isa_bridge",
      severity: "warning",
      title: "ISA bridge appears insufficient",
      body: `You plan to retire at ${profile.retirementTargetAge} but will only have ${fmt(b.isaAtRetirement)} in ISA. You need ${fmt(b.needed)} to cover ages ${profile.retirementTargetAge}–${projection.meta.nmpa}.`,
      impactScore: 90,
      actionRoute: "/dashboard",
    };
  }
  return {
    id: "isa_bridge_ok",
    category: "isa_bridge",
    severity: "positive",
    title: "ISA bridge is adequate",
    body: `You have ${fmt(b.isaAtRetirement)} ISA available against a requirement of ${fmt(b.needed)} for your pre-pension years.`,
    impactScore: 60,
  };
};

const coastFireRule: Rule = ({ fire, profile }) => {
  if (!fire.coastFireApplicable || !fire.coastReached) return null;
  return {
    id: "coast_fire_reached",
    category: "fire",
    severity: "positive",
    title: "You have crossed Coast FIRE",
    body: `Your FIRE pot of ${fmt(fire.firePotNow)} is projected to reach your effective FIRE number of ${fmt(fire.effectiveFireNumber)} by age ${profile.retirementTargetAge} without further contributions.`,
    impactScore: 75,
    actionRoute: "/fire",
  };
};

const fireProgressRule: Rule = ({ fire }) => {
  if (fire.coastFireApplicable && fire.coastReached) return null;
  if (fire.fireProgressPct >= 100) return null;
  const gap = Math.max(0, fire.effectiveFireNumber - fire.firePotNow);
  return {
    id: "fire_distance",
    category: "fire",
    severity: "info",
    title: "Distance to FIRE",
    body: `You are ${fmt(gap)} away from your effective FIRE number${fire.fireAge ? ` (projected at age ${fire.fireAge})` : ""}.`,
    impactScore: 55,
    actionRoute: "/fire",
  };
};

/** HMRC: must be 18–39 to open a LISA; model uses whole-year age vs this upper bound. */
const LISA_MIN_AGE_OPEN = 18;

function lisaBonusInsightEligible(profile: UserProfile, taxYearPack: TaxYearPack): boolean {
  if (!profile.hasLisa) return false;
  const age = ageFromDob(profile.dateOfBirth);
  if (age < LISA_MIN_AGE_OPEN) return false;
  if (age > taxYearPack.lisaMaxAgeContrib) return false;
  const holdsLisa = profile.lisaValue > 0 || profile.lisaMonthly > 0;
  if (!holdsLisa) return false;
  if (profile.lisaValue <= 0 && age >= taxYearPack.lisaMaxAgeOpen) return false;
  return true;
}

const isaAllowanceRule: Rule = ({ profile, taxYearPack }) => {
  const lisaAnnual = profile.hasLisa ? profile.lisaMonthly * 12 : 0;
  const annual = profile.ssIsaMonthly * 12 + lisaAnnual;
  const remaining = taxYearPack.isaAnnualAllowance - annual;
  if (remaining <= 0) return null;
  return {
    id: "isa_allowance_remaining",
    category: "tax",
    severity: "info",
    title: "Potential unused ISA allowance",
    body: `Based on the regular contributions in your plan, you may have up to ${fmt(remaining)} of ISA allowance left this tax year. That excludes any ad hoc or discretionary contributions you have made but not entered here. Allowance resets on 5 April.`,
    impactScore: 45,
    actionRoute: "/tax",
  };
};

const lisaUnused: Rule = ({ profile, taxYearPack }) => {
  if (!lisaBonusInsightEligible(profile, taxYearPack)) return null;
  const annual = profile.lisaMonthly * 12;
  if (annual >= taxYearPack.lisaAnnualAllowance) return null;
  const remaining = taxYearPack.lisaAnnualAllowance - annual;
  return {
    id: "lisa_unused",
    category: "tax",
    severity: "info",
    title: "LISA bonus available",
    body: `Contributing a further ${fmt(remaining)} to your LISA this year unlocks a 25% government bonus of up to ${fmt(remaining * taxYearPack.lisaBonusRate)}.`,
    impactScore: 50,
    actionRoute: "/tax",
  };
};

const taperRule: Rule = ({ profile, taxYearPack }) => {
  if (profile.grossSalary <= taxYearPack.paTaperStart) return null;
  if (profile.grossSalary >= taxYearPack.paTaperEnd) {
    return {
      id: "pa_fully_tapered",
      category: "tax",
      severity: "warning",
      title: "Personal Allowance fully withdrawn",
      body: `Your income above ${fmt(taxYearPack.paTaperEnd)} means you have lost the full ${fmt(taxYearPack.personalAllowance)} personal allowance. Pension contributions can restore it.`,
      impactScore: 85,
      actionRoute: "/tax",
    };
  }
  const lost = (profile.grossSalary - taxYearPack.paTaperStart) / 2;
  return {
    id: "pa_taper",
    category: "tax",
    severity: "warning",
    title: "Personal Allowance is tapering",
    body: `You are above the ${fmt(taxYearPack.paTaperStart)} taper threshold. ${fmt(lost)} of your personal allowance has been withdrawn. Additional pension contributions can restore it.`,
    impactScore: 70,
    actionRoute: "/tax",
  };
};

const overpayMortgage: Rule = ({ profile }) => {
  if (profile.primaryMortgage <= 0) return null;
  if (profile.primaryOverpayment > 0) return null;
  const summary = overpaymentSummary(
    {
      principal: profile.primaryMortgage,
      annualRate: profile.primaryMortgageRate,
      termYears: profile.primaryMortgageTermYears,
      type: profile.primaryMortgageType,
    },
    300,
  );
  if (summary.interestSaved < 1000) return null;
  return {
    id: "overpay_300",
    category: "property",
    severity: "info",
    title: "Mortgage overpayment opportunity",
    body: `Overpaying by £300/month would save ${fmt(summary.interestSaved)} in interest and pay off your mortgage ${Math.floor(summary.monthsSaved / 12)} years and ${summary.monthsSaved % 12} months early.`,
    impactScore: 65,
    actionRoute: "/property",
  };
};

const btlNegativeCashflow: Rule = ({ profile, taxYearPack }) => {
  if (profile.btlProperties.length === 0) return null;
  const totalCf = profile.btlProperties.reduce((s, p) => {
    return (
      s +
      btlAnnualCashflow(p, profile.grossSalary, profile.region, {
        taxYearPack,
      }).netCashflow
    );
  }, 0);
  if (totalCf >= 0) return null;
  return {
    id: "btl_negative",
    category: "property",
    severity: "negative",
    title: "BTL portfolio is cashflow negative",
    body: `Your BTL cashflow is negative by ${fmt(-totalCf)}/year after costs and tax. Review costs or rental assumptions.`,
    impactScore: 88,
    actionRoute: "/property",
  };
};

const btlPropertyTaxShift: Rule = ({ profile, taxYearPack, projection }) => {
  if (profile.btlProperties.length === 0) return null;
  const outlook = buildTaxYearOutlook(profile, taxYearPack, projection);
  if (!outlook?.btlAnnualDelta || outlook.btlAnnualDelta >= 0) return null;
  return {
    id: "btl_property_tax_2027",
    category: "tax",
    severity: "info",
    title: `BTL tax rises in ${outlook.nextPackLabel}`,
    body: `Legislated property income rates and Section 24 credit change from April 2027. At today's rents, your portfolio net cashflow is about ${fmt(-outlook.btlAnnualDelta)}/year lower under ${outlook.nextPackLabel} than ${taxYearPack.label}. Projections step rules by calendar year.`,
    impactScore: 72,
    actionRoute: "/property",
  };
};

const higherRateRelief: Rule = ({ profile, taxYearPack }) => {
  const marginal = marginalIncomeRate(profile.grossSalary, profile.region, taxYearPack);
  if (marginal < 0.4) return null;
  if (profile.sippMonthly > 0) return null;
  return {
    id: "higher_rate_relief",
    category: "tax",
    severity: "info",
    title: "Higher-rate relief available",
    body: `As a higher-rate taxpayer, additional pension contributions attract 40% relief vs 20% in basic rate. A SIPP top-up may be worthwhile.`,
    impactScore: 55,
    actionRoute: "/tax",
  };
};

const longTermCareRule: Rule = (ctx) => {
  const primary = ctx.primaryProfile ?? ctx.profile;
  const summary = summarizePlanning(ctx.projection, {
    primary,
    partner: ctx.partnerProfile,
    partnerProjection: ctx.partnerProjection,
  });
  if (!summary.hasCare || summary.peakAnnualCare <= 0) return null;
  return {
    id: "ltc_modelled",
    category: "property",
    severity: "info",
    title: "Long-term care costs in your plan",
    body: `Your projection includes up to ${fmt(summary.peakAnnualCare)}/year care for ${summary.totalCareYears} years (household total where applicable). Review Settings → Planning & longevity.`,
    impactScore: 62,
    actionRoute: "/settings",
  };
};

const estateIhtRule: Rule = (ctx) => {
  const primary = ctx.primaryProfile ?? ctx.profile;
  const summary = summarizePlanning(ctx.projection, {
    primary,
    partner: ctx.partnerProfile,
    partnerProjection: ctx.partnerProjection,
  });
  if (!summary.hasEstate || summary.householdEstateIht <= 0) return null;
  const detail = summary.estateByPerson
    .map((e) => `${e.label} ${fmt(e.ihtDue)} at age ${e.age}`)
    .join("; ");
  return {
    id: "estate_iht_illustrative",
    category: "tax",
    severity: "info",
    title: "Illustrative inheritance tax",
    body: `Estimated IHT on modelled estates: ${detail}. Simplified bands only — not advice.`,
    impactScore: 58,
    actionRoute: "/settings",
  };
};

const guardrailsRule: Rule = (ctx) => {
  const primary = ctx.primaryProfile ?? ctx.profile;
  if (
    !primary.spendingGuardrails?.enabled &&
    !ctx.partnerProfile?.spendingGuardrails?.enabled
  ) {
    return null;
  }
  const summary = summarizePlanning(ctx.projection, {
    primary,
    partner: ctx.partnerProfile,
    partnerProjection: ctx.partnerProjection,
  });
  if (summary.latestGuardrailMultiplier == null) return null;
  return {
    id: "spending_guardrails",
    category: "on_track",
    severity: "info",
    title: "Dynamic spending guardrails active",
    body: `Latest retirement-year spending scale is ${Math.round(summary.latestGuardrailMultiplier * 100)}% of plan (portfolio-driven). See Planning & longevity on the dashboard.`,
    impactScore: 50,
    actionRoute: "/dashboard",
  };
};

const RULES: Rule[] = [
  onTrack,
  isaBridgeRule,
  coastFireRule,
  fireProgressRule,
  isaAllowanceRule,
  lisaUnused,
  taperRule,
  overpayMortgage,
  btlNegativeCashflow,
  btlPropertyTaxShift,
  higherRateRelief,
  longTermCareRule,
  estateIhtRule,
  guardrailsRule,
];

export function generateInsights(ctx: InsightContext): Insight[] {
  const all = RULES.map((r) => r(ctx)).filter((x): x is Insight => Boolean(x));
  return all.sort((a, b) => b.impactScore - a.impactScore);
}

export function topInsights(
  ctx: InsightContext,
  limit = 5,
  dismissed: Set<string> = new Set(),
): Insight[] {
  return generateInsights(ctx)
    .filter((i) => !dismissed.has(i.id))
    .slice(0, limit);
}
