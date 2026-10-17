/** Per-calendar-year nominal assumptions (Fisher → real inside projection). */
export interface EconomicYear {
  year: number;
  inflation: number;
  pensionReturn: number;
  isaReturn: number;
  giaReturn: number;
  cashReturn: number;
  cashIsaReturn: number;
  rentalGrowth: number;
  spTripleLockGrowth: number;
}

export interface EconomicScenario {
  id?: string;
  years: EconomicYear[];
}
