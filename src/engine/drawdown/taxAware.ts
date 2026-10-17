import { incomeTax } from "@/engine/tax/incomeTax";
import type { DrawdownAllocation, DrawdownContext, DrawdownStrategy } from "./types";
/**
 * Gross-up pension withdrawals using marginal income tax; GIA withdrawals include simplified CGT drag proxy.
 * Falls back to legacy ordering; cash ISA / LISA still not spent (matches legacy path).
 */
export function allocateTaxAwareDrawdown(ctx: DrawdownContext): DrawdownAllocation {
  const b = { ...ctx.balances };
  let need = Math.max(0, ctx.netNeed);
  const fromSsIsa = Math.min(b.ssIsa, need);
  b.ssIsa -= fromSsIsa;
  need -= fromSsIsa;

  let fromPensionGross = 0;
  let fromPensionNet = 0;
  let taxOnDrawdown = 0;

  if (ctx.age >= ctx.nmpa && need > 0 && b.pension > 0) {
    const baseTaxable = ctx.otherTaxableIncome;
    const taxBefore = incomeTax(baseTaxable, ctx.region, ctx.taxYearPack);
    let gross = Math.min(b.pension, need * 1.35);
    for (let step = 0; step < 12; step++) {
      taxOnDrawdown =
        incomeTax(baseTaxable + gross, ctx.region, ctx.taxYearPack) - taxBefore;
      const net = gross - taxOnDrawdown;
      const err = need - net;
      if (Math.abs(err) < 1) break;
      gross = Math.min(b.pension, gross + err * 0.85);
    }
    fromPensionGross = Math.min(b.pension, gross);
    taxOnDrawdown =
      incomeTax(baseTaxable + fromPensionGross, ctx.region, ctx.taxYearPack) - taxBefore;
    fromPensionNet = fromPensionGross - taxOnDrawdown;
    b.pension -= fromPensionGross;
    need = Math.max(0, need - fromPensionNet);
  }

  let fromGia = 0;
  if (need > 0) {
    fromGia = Math.min(b.gia, need);
    b.gia -= fromGia;
    need -= fromGia;
  }

  let fromCash = 0;
  if (need > 0) {
    fromCash = Math.min(b.cash, need);
    b.cash -= fromCash;
    need -= fromCash;
  }

  const netDrawdown = ctx.netNeed - need;

  return {
    fromSsIsa,
    fromCashIsa: 0,
    fromLisa: 0,
    fromPensionGross,
    fromPensionNet,
    fromGia,
    fromCash,
    taxOnDrawdown,
    netDrawdown,
    unmet: need,
  };
}

export const taxAwareDrawdownStrategy: DrawdownStrategy = {
  id: "tax_aware",
  allocate: allocateTaxAwareDrawdown,
};
