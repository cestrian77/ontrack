import type { Projection, ProjectionYear, UserProfile } from "@/engine/types";

export interface CombineProjectionsOptions {
  /** When true, partner rows contribute zero to primary residence fields (shared home on primary only). */
  excludePartnerPrimary: boolean;
}

function zeroPrimaryFields(y: ProjectionYear): ProjectionYear {
  return {
    ...y,
    primaryEquity: 0,
    primaryValue: 0,
    primaryMortgageBalance: 0,
  };
}

function mergeYear(
  a: ProjectionYear,
  b: ProjectionYear,
  opts: CombineProjectionsOptions,
): ProjectionYear {
  const bEff = opts.excludePartnerPrimary ? zeroPrimaryFields(b) : b;

  const pensionValue = a.pensionValue + bEff.pensionValue;
  const isaValue = a.isaValue + bEff.isaValue;
  const cashIsaValue = a.cashIsaValue + bEff.cashIsaValue;
  const lisaValue = a.lisaValue + bEff.lisaValue;
  const giaValue = a.giaValue + bEff.giaValue;
  const cashValue = a.cashValue + bEff.cashValue;
  const primaryEquity = a.primaryEquity + bEff.primaryEquity;
  const primaryValue = a.primaryValue + bEff.primaryValue;
  const primaryMortgageBalance = a.primaryMortgageBalance + bEff.primaryMortgageBalance;
  const btlEquity = a.btlEquity + bEff.btlEquity;
  const btlValue = a.btlValue + bEff.btlValue;
  const btlMortgageBalance = a.btlMortgageBalance + bEff.btlMortgageBalance;
  const investableNetWorth = pensionValue + isaValue + cashIsaValue + lisaValue + giaValue + cashValue;
  const totalNetWorth = investableNetWorth + primaryEquity + btlEquity;

  return {
    year: a.year,
    age: a.age,
    pensionValue,
    isaValue,
    cashIsaValue,
    lisaValue,
    giaValue,
    cashValue,
    primaryEquity,
    primaryValue,
    primaryMortgageBalance,
    btlEquity,
    btlValue,
    btlMortgageBalance,
    totalNetWorth,
    investableNetWorth,
    annualContributions: {
      pension: a.annualContributions.pension + bEff.annualContributions.pension,
      isa: a.annualContributions.isa + bEff.annualContributions.isa,
      lisa: a.annualContributions.lisa + bEff.annualContributions.lisa,
      gia: a.annualContributions.gia + bEff.annualContributions.gia,
    },
    btlCashflowNet: a.btlCashflowNet + bEff.btlCashflowNet,
    taxPaid: a.taxPaid + bEff.taxPaid,
    statePensionIncome: a.statePensionIncome + bEff.statePensionIncome,
    dbIncome: a.dbIncome + bEff.dbIncome,
    drawdownIncome: a.drawdownIncome + bEff.drawdownIncome,
    retired: a.retired && bEff.retired,
  };
}

/**
 * Merge two projections aligned by row index (same calendar year per index).
 * Length is min(lenA, lenB) so ages refer to the primary person's age on each row.
 */
export function combineProjections(
  primary: Projection,
  partner: Projection,
  profiles: { primary: UserProfile; partner: UserProfile },
  opts: CombineProjectionsOptions = { excludePartnerPrimary: true },
): Projection {
  const n = Math.min(primary.years.length, partner.years.length);
  const years: ProjectionYear[] = [];
  for (let i = 0; i < n; i++) {
    years.push(mergeYear(primary.years[i], partner.years[i], opts));
  }

  const retirementAge = Math.max(
    profiles.primary.retirementTargetAge,
    profiles.partner.retirementTargetAge,
  );

  return {
    years,
    meta: {
      ...primary.meta,
      retirementAge,
      horizon: n,
      isHousehold: true,
    },
  };
}
