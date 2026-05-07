/**
 * Core domain types for OnTrack projection engine.
 * All monetary values are in £; growth rates are decimals (0.05 = 5%).
 * Internal projections operate in real terms (today's £); UI may display nominal via toggle.
 */

export type Region = "england_wales" | "scotland";
export type Employment = "employed" | "self_employed" | "both";
export type MortgageType = "repayment" | "interest_only";
export type Ownership = "sole" | "joint";

export interface BTLProperty {
  id: string;
  label?: string;
  value: number;
  mortgageBalance: number;
  mortgageRate: number; // decimal
  mortgageTermYears: number; // 0 = unencumbered
  mortgageType: MortgageType;
  monthlyGrossRent: number;
  voidRate: number; // decimal
  annualMaintenance: number;
  lettingAgentFeePct: number; // decimal of effective rent
  annualInsurance: number;
  appreciationRate: number; // decimal nominal
  ownership: Ownership;
}

export interface UserProfile {
  // Section A — You
  dateOfBirth: string; // ISO date
  retirementTargetAge: number;
  targetRetirementIncome: number; // £/year, today's money, net of tax
  region: Region;
  partnered: boolean;

  // Section B — Income
  employment: Employment;
  grossSalary: number;
  bonus: number;
  salaryGrowth: number; // decimal
  statePensionClaimAge: number;
  statePensionWeekly: number; // £

  // Section C — Pensions
  pensionPot: number;
  employeeContribPct: number; // decimal of gross salary
  employerContribPct: number; // decimal of gross salary
  sippMonthly: number; // £/mo personal SIPP (relief at source)
  pensionAccessAge: number; // 55 or 57
  pensionGrowth: number; // decimal
  hasDB: boolean;
  dbAnnualIncome: number;
  dbNRA: number;

  // Section D — ISAs & Investments
  ssIsaValue: number;
  ssIsaMonthly: number;
  cashIsaValue: number;
  cashIsaRate: number;
  giaValue: number;
  giaMonthly: number;
  giaGrowth: number;
  isaGrowth: number;
  lisaValue: number;
  lisaMonthly: number;

  // Section E — Property (primary)
  primaryValue: number;
  primaryMortgage: number;
  primaryMortgagePayment: number; // £/mo (display-only; engine derives)
  primaryMortgageRate: number; // decimal
  primaryMortgageTermYears: number;
  primaryMortgageType: MortgageType;
  primaryAppreciation: number;
  primaryOverpayment: number; // £/mo
  /** Optional display name for the primary residence. */
  primaryLabel?: string;

  // Section F — BTL
  btlProperties: BTLProperty[];

  // Section G — Savings & Other
  cashSavings: number;
  expectedInheritance: number;
  inheritanceYear?: number;
  otherIncomeMonthly: number;
  monthlySurplus: number;

  // Global economic assumptions (PRD §5.2)
  cpi: number; // decimal
  cashRate: number;
  rentalGrowth: number;
  spTripleLockGrowth: number;

  // FIRE
  safeWithdrawalRate: number; // decimal e.g. 0.035
  leanFirePct: number; // 0.7 default
  fatFirePct: number; // 1.5 default
  baristaPartTimeIncome: number; // £/yr in semi-retirement

  /**
   * Scenario-only: extra monthly SIPP / ISA / mortgage overpayment with optional linear ramp.
   * Not stored on the saved user profile; applied when merging a parameterized scenario.
   */
  scenarioContributionAdj?: ScenarioContributionAdj;

  updatedAt: string;
}

/** Extra £/mo from year 0; ramp = linear 0 → full over `rampYears` projection years. */
export interface MonthlyBoostParams {
  monthlyExtra: number;
  mode: "flat" | "ramp";
  rampYears: number;
}

export interface ScenarioContributionAdj {
  sippExtraMonthly?: MonthlyBoostParams;
  ssIsaExtraMonthly?: MonthlyBoostParams;
  primaryOverpayExtraMonthly?: MonthlyBoostParams;
}

export interface PropertySaleParam {
  kind: "primary" | "btl";
  /** BTL index in `btlProperties` at scenario application time (before earlier sales in the list). */
  btlIndex?: number;
  /** If selling primary: cash spent on replacement home (reduces net proceeds). */
  replacementCost?: number;
}

export interface ScenarioParams {
  pensionBoost?: MonthlyBoostParams;
  isaBoost?: MonthlyBoostParams;
  mortgageOverpay?: MonthlyBoostParams;
  propertySales?: PropertySaleParam[];
  inheritanceAmount?: number;
  inheritanceYearsFromNow?: number;
}

export interface ProjectionYear {
  year: number;
  age: number;
  pensionValue: number;
  isaValue: number; // S&S ISA
  cashIsaValue: number;
  lisaValue: number;
  giaValue: number;
  cashValue: number;
  primaryEquity: number;
  primaryValue: number;
  primaryMortgageBalance: number;
  btlEquity: number;
  btlValue: number;
  btlMortgageBalance: number;
  totalNetWorth: number;
  investableNetWorth: number; // ex property equity
  annualContributions: {
    pension: number;
    isa: number;
    lisa: number;
    gia: number;
  };
  btlCashflowNet: number; // post-tax
  taxPaid: number;
  statePensionIncome: number;
  dbIncome: number;
  drawdownIncome: number;
  retired: boolean;
}

export interface Projection {
  years: ProjectionYear[];
  meta: {
    currentAge: number;
    retirementAge: number;
    nmpa: number;
    spa: number;
    horizon: number;
  };
}

export interface Insight {
  id: string;
  category:
    | "on_track"
    | "contribution"
    | "isa_bridge"
    | "fire"
    | "property"
    | "tax";
  severity: "positive" | "info" | "warning" | "negative";
  title: string;
  body: string;
  impactScore: number; // higher = higher priority
  actionRoute?: string;
}

export interface Scenario {
  id: string;
  name: string;
  colour: string;
  /** Used only for legacy custom scenarios (no templateId). */
  overrides: Partial<UserProfile>;
  templateId?: string;
  params?: ScenarioParams;
  createdAt: string;
}

export interface FireMetrics {
  fireNumber: number;
  leanFireNumber: number;
  fatFireNumber: number;
  coastFireNumber: number;
  baristaFireNumber: number;
  investableNow: number;
  fireProgressPct: number;
  coastFireProgressPct: number;
  yearsToFire: number | null;
  fireAge: number | null;
  coastReached: boolean;
  savingsRate: number;
}
