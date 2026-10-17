import { describe, expect, it } from "vitest";
import { applySpendingGuardrails, DEFAULT_SPENDING_GUARDRAILS } from "./guardrails";

describe("applySpendingGuardrails", () => {
  it("scales discretionary spending when enabled", () => {
    const res = applySpendingGuardrails(
      { gross: 40_000, essential: 30_000, discretionary: 10_000 },
      { ...DEFAULT_SPENDING_GUARDRAILS, enabled: true },
      0.5,
    );
    expect(res.multiplier).toBe(0.8);
    expect(res.gross).toBe(30_000 + 10_000 * 0.8);
  });

  it("passes through when disabled", () => {
    const res = applySpendingGuardrails(
      { gross: 40_000, essential: 40_000, discretionary: 0 },
      { ...DEFAULT_SPENDING_GUARDRAILS, enabled: false },
      0.5,
    );
    expect(res.gross).toBe(40_000);
    expect(res.multiplier).toBe(1);
  });
});
