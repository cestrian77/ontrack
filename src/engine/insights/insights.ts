import type { FireMetrics, Insight, Projection, UserProfile } from "@/engine/types";
import { isaBridge } from "@/engine/project/isaBridge";
import {
  ISA_ANNUAL_ALLOWANCE,
  LISA_ANNUAL_ALLOWANCE,
  PA_TAPER_END,
  PA_TAPER_START,
  PERSONAL_ALLOWANCE,
} from "@/engine/constants/uk";
import { overpaymentSummary } from "@/engine/property/mortgage";
import { ageFromDob } from "@/engine/project/runProjection";
import { btlAnnualCashflow } from "@/engine/btl/cashflow";
import { marginalIncomeRate } from "@/engine/tax/incomeTax";

const fmt = (n: number) =>
  n.toLocaleString("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 });

export interface InsightContext {
  profile: UserProfile;
  projection: Projection;
  fire: FireMetrics;
}

type Rule = (ctx: InsightContext) => Insight | null;

const onTrack: Rule = ({ profile, projection, fire }) => {
  const atTarget = projection.years.find((y) => y.age === profile.retirementTargetAge);
  if (!atTarget) return null;
  if (atTarget.investableNetWorth >= fire.fireNumber) {
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
  const shortfall = fire.fireNumber - atTarget.investableNetWorth;
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
  if (!fire.coastReached) return null;
  return {
    id: "coast_fire_reached",
    category: "fire",
    severity: "positive",
    title: "You have crossed Coast FIRE",
    body: `Your existing investments of ${fmt(fire.investableNow)} are projected to reach your FIRE number of ${fmt(fire.fireNumber)} by age ${profile.retirementTargetAge} without further contributions.`,
    impactScore: 75,
    actionRoute: "/fire",
  };
};

const fireProgressRule: Rule = ({ fire }) => {
  if (fire.coastReached) return null;
  return {
    id: "fire_distance",
    category: "fire",
    severity: "info",
    title: "Distance to FIRE",
    body: `You are ${fmt(fire.fireNumber - fire.investableNow)} away from your FIRE number${fire.fireAge ? ` (projected at age ${fire.fireAge})` : ""}.`,
    impactScore: 55,
    actionRoute: "/fire",
  };
};

const isaAllowanceRule: Rule = ({ profile }) => {
  const annual = profile.ssIsaMonthly * 12 + profile.lisaMonthly * 12;
  const remaining = ISA_ANNUAL_ALLOWANCE - annual;
  if (remaining <= 0) return null;
  return {
    id: "isa_allowance_remaining",
    category: "tax",
    severity: "info",
    title: "Unused ISA allowance",
    body: `You have ${fmt(remaining)} of unused ISA allowance this tax year. This resets on 5 April.`,
    impactScore: 45,
    actionRoute: "/tax",
  };
};

const lisaUnused: Rule = ({ profile }) => {
  const age = ageFromDob(profile.dateOfBirth);
  if (age > 50) return null;
  const annual = profile.lisaMonthly * 12;
  if (annual >= LISA_ANNUAL_ALLOWANCE) return null;
  const remaining = LISA_ANNUAL_ALLOWANCE - annual;
  return {
    id: "lisa_unused",
    category: "tax",
    severity: "info",
    title: "LISA bonus available",
    body: `Contributing a further ${fmt(remaining)} to your LISA this year unlocks a 25% government bonus of up to ${fmt(remaining * 0.25)}.`,
    impactScore: 50,
    actionRoute: "/tax",
  };
};

const taperRule: Rule = ({ profile }) => {
  if (profile.grossSalary <= PA_TAPER_START) return null;
  if (profile.grossSalary >= PA_TAPER_END) {
    return {
      id: "pa_fully_tapered",
      category: "tax",
      severity: "warning",
      title: "Personal Allowance fully withdrawn",
      body: `Your income above ${fmt(PA_TAPER_END)} means you have lost the full ${fmt(PERSONAL_ALLOWANCE)} personal allowance. Pension contributions can restore it.`,
      impactScore: 85,
      actionRoute: "/tax",
    };
  }
  const lost = ((profile.grossSalary - PA_TAPER_START) / 2);
  return {
    id: "pa_taper",
    category: "tax",
    severity: "warning",
    title: "Personal Allowance is tapering",
    body: `You are above the ${fmt(PA_TAPER_START)} taper threshold. ${fmt(lost)} of your personal allowance has been withdrawn. Additional pension contributions can restore it.`,
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

const btlNegativeCashflow: Rule = ({ profile }) => {
  if (profile.btlProperties.length === 0) return null;
  const totalCf = profile.btlProperties.reduce((s, p) => {
    return s + btlAnnualCashflow(p, profile.grossSalary, profile.region).netCashflow;
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

const higherRateRelief: Rule = ({ profile }) => {
  const marginal = marginalIncomeRate(profile.grossSalary, profile.region);
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
  higherRateRelief,
];

export function generateInsights(ctx: InsightContext): Insight[] {
  const all = RULES.map((r) => r(ctx)).filter((x): x is Insight => Boolean(x));
  return all.sort((a, b) => b.impactScore - a.impactScore);
}

export function topInsights(ctx: InsightContext, limit = 5, dismissed: Set<string> = new Set()): Insight[] {
  return generateInsights(ctx)
    .filter((i) => !dismissed.has(i.id))
    .slice(0, limit);
}
