import type { DrawdownAllocation, DrawdownContext, DrawdownStrategy } from "./types";

/** ISA (S&S) → pension → GIA → cash; pension treated as net £1-for-£1 (legacy). */
export function allocateLegacyDrawdown(ctx: DrawdownContext): DrawdownAllocation {
  const b = { ...ctx.balances };
  let need = Math.max(0, ctx.netNeed);
  const fromSsIsa = Math.min(b.ssIsa, need);
  b.ssIsa -= fromSsIsa;
  need -= fromSsIsa;

  let fromPensionNet = 0;
  let fromPensionGross = 0;
  if (ctx.age >= ctx.nmpa && need > 0) {
    fromPensionNet = Math.min(b.pension, need);
    fromPensionGross = fromPensionNet;
    b.pension -= fromPensionNet;
    need -= fromPensionNet;
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
    taxOnDrawdown: 0,
    netDrawdown,
    unmet: need,
  };
}

export const legacyDrawdownStrategy: DrawdownStrategy = {
  id: "legacy",
  allocate: allocateLegacyDrawdown,
};
