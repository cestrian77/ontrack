/**
 * Core domain types for OnTrack projection engine.
 * All monetary values are in £; growth rates are decimals (0.05 = 5%).
 * Internal projections operate in real terms (today's £); UI may display nominal via toggle.
 */

export type Region = "england_wales" | "scotland";
export type Employment = "employed" | "self_employed" | "both";
export type MortgageType = "repayment" | "interest_only";
export type Ownership = "sole" | "joint";

export type DrawdownStrategyId = "legacy" | "tax_aware";

export interface SpendingPhase {
  id: string;
  fromAge: number;
  toAge: number;
  /** Real £/year in today's money. */
  annualAmount: number;
  label?: string;
}

/** Optional essential vs discretionary split (Phase 8). When set, gross need = sum. */
export interface FlexibleSpending {
  essentialAnnual: number;
  discretionaryAnnual: number;
}

/** Dynamic spending guardrails (Guyton–Klinger-style) in real terms. */
export interface SpendingGuardrails {
  enabled: boolean;
  /** Min spending as fraction of planned need when portfolio is weak (e.g. 0.8). */
  floorPctOfPlan: number;
  /** Max spending as fraction of planned need when portfolio is strong (e.g. 1.2). */
  ceilingPctOfPlan: number;
}

/** Illustrative long-term / social care costs in retirement (real £/yr). */
export interface LongTermCarePrefs {
  enabled: boolean;
  fromAge: number;
  annualCostReal: number;
  years: number;
}

/** Simplified UK inheritance tax modelling at a chosen age (illustrative). */
export interface EstatePlanningPrefs {
  enabled: boolean;
  modelAtAge: number;
  nilRateBand: number;
  residenceNilRateBand: number;
  primaryHomeToDirectDescendants: boolean;
  transferredNilRateToSpouse: boolean;
  /** Fraction of estate left to charity (0–1); 10%+ may reduce rate to 36%. */
  charitableLegacyPct: number;
}

export type LifeEventKind =
  | "lump_sum_income"
  | "lump_sum_expense"
  | "recurring_income"
  | "recurring_expense"
  | "property_sale"
  | "inheritance";

export interface LifeEventBase {
  id: string;
  kind: LifeEventKind;
  label?: string;
}

export interface LumpSumLifeEvent extends LifeEventBase {
  kind: "lump_sum_income" | "lump_sum_expense";
  calendarYear: number;
  amount: number;
}

export interface RecurringLifeEvent extends LifeEventBase {
  kind: "recurring_income" | "recurring_expense";
  fromYear: number;
  toYear: number;
  annualAmount: number;
}

export interface PropertySaleLifeEvent extends LifeEventBase {
  kind: "property_sale";
  calendarYear: number;
  target: "primary" | "btl";
  btlIndex?: number;
  netProceeds?: number;
  replacementCost?: number;
  cgtDue?: number;
}

export interface InheritanceLifeEvent extends LifeEventBase {
  kind: "inheritance";
  calendarYear: number;
  amount: number;
}

export type LifeEvent =
  | LumpSumLifeEvent
  | RecurringLifeEvent
  | PropertySaleLifeEvent
  | InheritanceLifeEvent;

export interface AssetClassVolatility {
  /** Annualised nominal return stdev (decimal, e.g. 0.15). */
  stdev: number;
}

export interface MonteCarloVolatilityPrefs {
  pension: AssetClassVolatility;
  isa: AssetClassVolatility;
  gia: AssetClassVolatility;
  cash: AssetClassVolatility;
}

/** Which projection row supplies passive income for FIRE income offsets. */
export type FireReferenceAgeMode = "at_retirement" | "steady_state_after_spa";

export interface FireCalculationPrefs {
  offsetStatePension: boolean;
  offsetDbPension: boolean;
  offsetBtlNet: boolean;
  referenceAgeMode: FireReferenceAgeMode;
  includePensionInPot: boolean;
  includeSsIsaInPot: boolean;
  includeCashIsaInPot: boolean;
  includeLisaInPot: boolean;
  includeGiaInPot: boolean;
  includeCashInPot: boolean;
}

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
  /** Uncheck if you do not use a LISA; hides LISA-specific insights. */
  hasLisa: boolean;
  /** Uncheck if you do not use a GIA; hides GIA-specific insights when shown. */
  hasGia: boolean;

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
  /** Optional; defaults preserve classic FIRE (full target ÷ SWR vs full investable pot). */
  fireCalculationPrefs?: FireCalculationPrefs;

  /**
   * Scenario-only: extra monthly SIPP / ISA / mortgage overpayment with optional linear ramp.
   * Not stored on the saved user profile; applied when merging a parameterized scenario.
   */
  scenarioContributionAdj?: ScenarioContributionAdj;

  /** Real spending bands in retirement; default = single phase from targetRetirementIncome. */
  spendingPhases?: SpendingPhase[];
  timelineEvents?: LifeEvent[];
  flexibleSpending?: FlexibleSpending;
  spendingGuardrails?: SpendingGuardrails;
  longTermCare?: LongTermCarePrefs;
  estatePlanning?: EstatePlanningPrefs;
  /** Withdrawal ordering / tax handling; default legacy (ISA → pension → GIA → cash). */
  drawdownStrategyId?: DrawdownStrategyId;

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
  /** If set, projection/tax for this scenario uses this frozen pack instead of the global analysis year. */
  taxYearLabel?: string;
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
  /** UK tax-year ruleset applied this projection year (when stepping is enabled). */
  taxYearLabel?: string;
  taxPaid: number;
  statePensionIncome: number;
  dbIncome: number;
  drawdownIncome: number;
  retired: boolean;
  grossSpendingNeed?: number;
  essentialSpendingNeed?: number;
  discretionarySpendingNeed?: number;
  unmetSpending?: number;
  eventIncome?: number;
  eventExpense?: number;
  employmentGross?: number;
  longTermCareCost?: number;
  guardrailSpendingMultiplier?: number;
  projectedEstateIht?: number;
  withdrawals?: {
    fromSsIsa: number;
    fromPensionNet: number;
    fromGia: number;
    fromCash: number;
    taxOnDrawdown: number;
  };
}

export interface Projection {
  years: ProjectionYear[];
  meta: {
    currentAge: number;
    retirementAge: number;
    nmpa: number;
    spa: number;
    horizon: number;
    /** Set when `combineProjections` merged two people (indicative household view). */
    isHousehold?: boolean;
    planningHorizonAge?: number;
    /** False when a single frozen tax-year pack is used for the whole horizon. */
    steppedTaxYears?: boolean;
  };
}

/** Re-exported from budget module for persistence; see `engine/household/budget/types`. */
export type {
  BudgetLine,
  BudgetOwner,
  ChildProfile,
  HouseholdBudget,
  UniversitySupportPrefs,
} from "@/engine/household/budget/types";

export interface HouseholdPrefs {
  /** Shared retirement budget when viewing couple/family; defaults to sum of person targets. */
  householdRetirementIncome?: number | null;
  monteCarloVolatility?: MonteCarloVolatilityPrefs;
  /** User planning horizon for stress test (default 100). */
  planningHorizonAge?: number;
  monteCarloTrials?: number;
  monteCarloSeed?: number | null;
  successUsesEssentialOnly?: boolean;
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
  /** Which person's profile the scenario layers on; default primary. */
  personScope?: "primary" | "partner";
}

export interface FireMetrics {
  /** Classic: full target income ÷ SWR (and scaled variants); ignores passive income offsets. */
  fireNumber: number;
  leanFireNumber: number;
  fatFireNumber: number;
  coastFireNumber: number;
  baristaFireNumber: number;
  investableNow: number;
  /** Progress of FIRE pot vs effective FIRE number (see prefs). */
  fireProgressPct: number;
  coastFireProgressPct: number;
  yearsToFire: number | null;
  fireAge: number | null;
  coastReached: boolean;
  savingsRate: number;
  /** Pot needed from portfolio after optional passive offsets, ÷ SWR. */
  effectiveFireNumber: number;
  effectiveLeanFireNumber: number;
  effectiveFatFireNumber: number;
  effectiveCoastFireNumber: number;
  effectiveBaristaFireNumber: number;
  /** Sum of included buckets (year 0). */
  firePotNow: number;
  /** FIRE pot at first year with age ≥ retirement target. */
  firePotAtRetirement: number;
  /** Sum of enabled passive components on the reference row. */
  passiveIncomeAtReference: number;
  referenceAgeForPassive: number | null;
  /** Coast FIRE progress only meaningful when pension is in the FIRE pot. */
  coastFireApplicable: boolean;
  fireCalculationUsesIncomeOffsets: boolean;
  fireCalculationUsesPotFilters: boolean;
}
