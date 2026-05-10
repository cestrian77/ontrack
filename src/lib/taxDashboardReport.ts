import type { TaxYearPack } from "@/engine/constants/taxYears";
import { btlAnnualCashflow, btlYields } from "@/engine/btl/cashflow";
import { workplaceContribAnnual, sippGrossAnnual } from "@/engine/pension/contributions";
import { incomeTax, marginalIncomeRate } from "@/engine/tax/incomeTax";
import { nationalInsurance } from "@/engine/tax/ni";
import type { UserProfile } from "@/engine/types";
import { gbp, pct } from "@/lib/utils";

export interface TaxAllowanceRow {
  label: string;
  used: number;
  cap: number;
}

export type TaxMetricEmphasis = "default" | "muted" | "bold" | "positive" | "negative";

export interface TaxMetricRow {
  label: string;
  value: string;
  emphasis?: TaxMetricEmphasis;
}

export interface TaxDashboardReport {
  packLabel: string;
  allowances: TaxAllowanceRow[];
  incomeRows: TaxMetricRow[];
  pensionRows: TaxMetricRow[];
  marginalRate: string;
  pensionReliefNote: string;
}

const PENSION_RELIEF_NOTE =
  "Net cost of £100 contributed: basic rate £80 · higher rate £60 · additional rate £55.";

/** Pure snapshot of Tax dashboard numbers — shared by TaxDashboard UI and PDF. */
export function buildTaxDashboardReport(
  profile: UserProfile,
  taxYearPack: TaxYearPack,
): TaxDashboardReport {
  const pack = taxYearPack;
  const tax = incomeTax(profile.grossSalary, profile.region, pack);
  const ni = nationalInsurance(profile.grossSalary, pack);
  const net = profile.grossSalary - tax - ni;
  const wp = workplaceContribAnnual(
    profile.grossSalary,
    profile.employeeContribPct,
    profile.employerContribPct,
  );
  const sipp = sippGrossAnnual(profile.sippMonthly);
  const totalPensionContrib = wp.total + sipp;
  const isaContribAnnual =
    profile.ssIsaMonthly * 12 + (profile.hasLisa ? profile.lisaMonthly * 12 : 0);
  const marginal = marginalIncomeRate(profile.grossSalary, profile.region, pack);
  const reliefSaved = sipp * Math.max(0, marginal - 0);

  return {
    packLabel: pack.label,
    allowances: [
      { label: "ISA", used: isaContribAnnual, cap: pack.isaAnnualAllowance },
      { label: "Pension AA", used: totalPensionContrib, cap: pack.pensionAnnualAllowance },
      { label: "CGT exempt", used: 0, cap: pack.cgtAnnualExempt },
      { label: "Dividend", used: 0, cap: pack.dividendAllowance },
      { label: "Personal Savings", used: 0, cap: pack.psaBasic },
    ],
    incomeRows: [
      { label: "Gross salary", value: gbp(profile.grossSalary) },
      { label: "Income tax", value: gbp(tax), emphasis: "muted" },
      { label: "National Insurance", value: gbp(ni), emphasis: "muted" },
      { label: "Net take-home", value: gbp(net), emphasis: "bold" },
      { label: "Marginal rate", value: pct(marginal), emphasis: "muted" },
    ],
    pensionRows: [
      { label: "Workplace contrib", value: gbp(wp.total) },
      { label: "SIPP gross (incl. relief)", value: gbp(sipp) },
      { label: "Total pension contrib", value: gbp(totalPensionContrib), emphasis: "bold" },
      { label: "Tax relief saved (vs ISA)", value: gbp(reliefSaved), emphasis: "positive" },
    ],
    marginalRate: pct(marginal),
    pensionReliefNote: PENSION_RELIEF_NOTE,
  };
}

export interface BtlPropertyReportBlock {
  title: string;
  rows: TaxMetricRow[];
  propertyId: string;
}

/** Per-property BTL metrics matching BTLDashboard cards (no charts). */
export function buildBtlPropertyReportBlocks(
  profile: UserProfile,
  taxYearPack: TaxYearPack,
): BtlPropertyReportBlock[] {
  return profile.btlProperties.map((p, idx) => {
    const cf = btlAnnualCashflow(p, profile.grossSalary, profile.region, {
      taxYearPack,
    });
    const y = btlYields(p, cf);
    const label = p.label?.trim() || `BTL ${idx + 1}`;
    return {
      propertyId: p.id,
      title: `${label}: ${gbp(p.value)}`,
      rows: [
        { label: "Gross yield", value: `${y.grossYield.toFixed(2)}%` },
        { label: "Net yield", value: `${y.netYield.toFixed(2)}%` },
        { label: "Cash-on-cash", value: `${y.cashOnCash.toFixed(2)}%` },
        {
          label: "Monthly cashflow (post-tax)",
          value: gbp(cf.netCashflow / 12),
          emphasis: cf.netCashflow >= 0 ? "positive" : "negative",
        },
        { label: "Current equity", value: gbp(p.value - p.mortgageBalance) },
        { label: "S24 credit", value: gbp(cf.s24Credit) },
      ],
    };
  });
}
