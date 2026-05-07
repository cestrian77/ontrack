import type { UserProfile } from "@/engine/types";
import {
  DEFAULT_CPI,
  DEFAULT_CASH_RATE,
  DEFAULT_EQUITY_GROWTH_NOMINAL,
  DEFAULT_FAT_PCT,
  DEFAULT_LEAN_PCT,
  DEFAULT_PROPERTY_APPRECIATION,
  DEFAULT_RENTAL_GROWTH,
  DEFAULT_SP_TRIPLE_LOCK,
  DEFAULT_SWR,
  STATE_PENSION_WEEKLY_FULL,
} from "./uk";

/** New-user defaults. Most fields start zero; user fills during onboarding. */
export function makeDefaultProfile(): UserProfile {
  const today = new Date();
  const dob = new Date(today.getFullYear() - 35, today.getMonth(), today.getDate());
  return {
    dateOfBirth: dob.toISOString().slice(0, 10),
    retirementTargetAge: 60,
    targetRetirementIncome: 35_000,
    region: "england_wales",
    partnered: false,

    employment: "employed",
    grossSalary: 60_000,
    bonus: 0,
    salaryGrowth: 0.025,
    statePensionClaimAge: 67,
    statePensionWeekly: STATE_PENSION_WEEKLY_FULL,

    pensionPot: 50_000,
    employeeContribPct: 0.05,
    employerContribPct: 0.05,
    sippMonthly: 0,
    pensionAccessAge: 57,
    pensionGrowth: DEFAULT_EQUITY_GROWTH_NOMINAL,
    hasDB: false,
    dbAnnualIncome: 0,
    dbNRA: 65,

    ssIsaValue: 25_000,
    ssIsaMonthly: 300,
    cashIsaValue: 5_000,
    cashIsaRate: DEFAULT_CASH_RATE,
    giaValue: 0,
    giaMonthly: 0,
    giaGrowth: DEFAULT_EQUITY_GROWTH_NOMINAL,
    isaGrowth: DEFAULT_EQUITY_GROWTH_NOMINAL,
    lisaValue: 0,
    lisaMonthly: 0,

    primaryValue: 350_000,
    primaryMortgage: 200_000,
    primaryMortgagePayment: 1_100,
    primaryMortgageRate: 0.045,
    primaryMortgageTermYears: 22,
    primaryMortgageType: "repayment",
    primaryAppreciation: DEFAULT_PROPERTY_APPRECIATION,
    primaryOverpayment: 0,
    primaryLabel: "",

    btlProperties: [],

    cashSavings: 10_000,
    expectedInheritance: 0,
    inheritanceYear: undefined,
    otherIncomeMonthly: 0,
    monthlySurplus: 0,

    cpi: DEFAULT_CPI,
    cashRate: DEFAULT_CASH_RATE,
    rentalGrowth: DEFAULT_RENTAL_GROWTH,
    spTripleLockGrowth: DEFAULT_SP_TRIPLE_LOCK,

    safeWithdrawalRate: DEFAULT_SWR,
    leanFirePct: DEFAULT_LEAN_PCT,
    fatFirePct: DEFAULT_FAT_PCT,
    baristaPartTimeIncome: 12_000,

    updatedAt: new Date().toISOString(),
  };
}
