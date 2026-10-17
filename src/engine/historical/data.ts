import type { EconomicYear } from "@/engine/economics/types";

/** UK-ish blended nominal series (illustrative). Version for reproducibility. */
export const HISTORICAL_DATASET_VERSION = "uk-blend-v1";

export interface HistoricalYearRow {
  year: number;
  inflation: number;
  equityReturn: number;
  cashReturn: number;
}

/** Subset of years for tests and demos (full horizon padded by repeating last). */
export const HISTORICAL_UK_BLEND: HistoricalYearRow[] = [
  { year: 2000, inflation: 0.009, equityReturn: -0.101, cashReturn: 0.058 },
  { year: 2001, inflation: 0.016, equityReturn: -0.132, cashReturn: 0.048 },
  { year: 2002, inflation: 0.017, equityReturn: -0.222, cashReturn: 0.041 },
  { year: 2003, inflation: 0.015, equityReturn: 0.204, cashReturn: 0.038 },
  { year: 2004, inflation: 0.013, equityReturn: 0.127, cashReturn: 0.048 },
  { year: 2005, inflation: 0.021, equityReturn: 0.207, cashReturn: 0.047 },
  { year: 2006, inflation: 0.024, equityReturn: 0.107, cashReturn: 0.049 },
  { year: 2007, inflation: 0.027, equityReturn: 0.042, cashReturn: 0.057 },
  { year: 2008, inflation: 0.039, equityReturn: -0.307, cashReturn: 0.042 },
  { year: 2009, inflation: 0.022, equityReturn: 0.227, cashReturn: 0.003 },
  { year: 2010, inflation: 0.031, equityReturn: 0.126, cashReturn: 0.005 },
  { year: 2011, inflation: 0.045, equityReturn: -0.055, cashReturn: 0.009 },
  { year: 2012, inflation: 0.027, equityReturn: 0.158, cashReturn: 0.018 },
  { year: 2013, inflation: 0.024, equityReturn: 0.188, cashReturn: 0.005 },
  { year: 2014, inflation: 0.012, equityReturn: 0.041, cashReturn: 0.005 },
  { year: 2015, inflation: 0.0, equityReturn: 0.069, cashReturn: 0.005 },
  { year: 2016, inflation: 0.011, equityReturn: 0.163, cashReturn: 0.004 },
  { year: 2017, inflation: 0.031, equityReturn: 0.133, cashReturn: 0.003 },
  { year: 2018, inflation: 0.024, equityReturn: -0.097, cashReturn: 0.007 },
  { year: 2019, inflation: 0.018, equityReturn: 0.192, cashReturn: 0.007 },
  { year: 2020, inflation: 0.008, equityReturn: 0.118, cashReturn: 0.002 },
  { year: 2021, inflation: 0.054, equityReturn: 0.187, cashReturn: 0.001 },
  { year: 2022, inflation: 0.114, equityReturn: -0.058, cashReturn: 0.019 },
  { year: 2023, inflation: 0.042, equityReturn: 0.144, cashReturn: 0.048 },
  { year: 2024, inflation: 0.025, equityReturn: 0.085, cashReturn: 0.045 },
];

export function historicalScenarioFromProfile(
  profile: import("@/engine/types").UserProfile,
  startYear: number,
  yearCount: number,
  rows: HistoricalYearRow[] = HISTORICAL_UK_BLEND,
): import("@/engine/economics/types").EconomicScenario {
  const years: EconomicYear[] = [];
  for (let i = 0; i < yearCount; i++) {
    const cal = startYear + i;
    const row = rows.find((r) => r.year === cal) ?? rows[(i + rows.length) % rows.length];
    years.push({
      year: cal,
      inflation: row.inflation,
      pensionReturn: row.equityReturn,
      isaReturn: row.equityReturn,
      giaReturn: row.equityReturn,
      cashReturn: row.cashReturn,
      cashIsaReturn: row.cashReturn,
      rentalGrowth: profile.rentalGrowth,
      spTripleLockGrowth: profile.spTripleLockGrowth,
    });
  }
  return { id: `historical-${HISTORICAL_DATASET_VERSION}`, years };
}
