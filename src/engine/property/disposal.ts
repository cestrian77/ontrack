import type { BTLProperty } from "@/engine/types";
import type { PropertySaleLifeEvent } from "@/engine/types";

export interface PrimaryDisposalState {
  primaryValue: number;
  primaryBalance: number;
  cashDelta: number;
}

export function applyPrimarySale(
  state: PrimaryDisposalState,
  ev: PropertySaleLifeEvent,
): PrimaryDisposalState {
  const equity = Math.max(0, state.primaryValue - state.primaryBalance);
  const replacement = ev.replacementCost ?? 0;
  const cgt = ev.cgtDue ?? 0;
  const proceeds = ev.netProceeds ?? Math.max(0, equity - replacement - cgt);
  return {
    primaryValue: replacement,
    primaryBalance: 0,
    cashDelta: proceeds,
  };
}

export function applyBtlSale(
  _property: BTLProperty,
  balance: number,
  value: number,
  ev: PropertySaleLifeEvent,
): { value: number; balance: number; cashDelta: number } {
  const equity = Math.max(0, value - balance);
  const cgt = ev.cgtDue ?? 0;
  const proceeds = ev.netProceeds ?? Math.max(0, equity - cgt);
  return { value: 0, balance: 0, cashDelta: proceeds };
}
