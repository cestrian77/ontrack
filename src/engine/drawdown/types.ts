import type { Region } from "@/engine/types";
import type { TaxYearPack } from "@/engine/constants/taxYears";

export type DrawdownStrategyId = "legacy" | "tax_aware";

export interface WrapperBalances {
  pension: number;
  ssIsa: number;
  cashIsa: number;
  lisa: number;
  gia: number;
  cash: number;
}

export interface DrawdownContext {
  age: number;
  nmpa: number;
  region: Region;
  taxYearPack: TaxYearPack;
  /** Net spending need after passive income (real £). */
  netNeed: number;
  balances: WrapperBalances;
  /** Other taxable income this year (SP, DB, BTL) for tax-aware gross-up. */
  otherTaxableIncome: number;
  strategyId: DrawdownStrategyId;
}

export interface DrawdownAllocation {
  fromSsIsa: number;
  fromCashIsa: number;
  fromLisa: number;
  fromPensionGross: number;
  fromPensionNet: number;
  fromGia: number;
  fromCash: number;
  taxOnDrawdown: number;
  netDrawdown: number;
  unmet: number;
}

export interface DrawdownStrategy {
  id: DrawdownStrategyId;
  allocate(ctx: DrawdownContext): DrawdownAllocation;
}
