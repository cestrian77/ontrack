import { describe, expect, it } from "vitest";
import { makeDefaultProfile } from "@/engine/constants/defaults";
import { TAX_YEAR_2025_26 } from "@/engine/constants/taxYears/2025-26";
import { DEFAULT_MONTE_CARLO_VOLATILITY } from "./defaults";
import { runMonteCarlo } from "./runMonteCarlo";
import { mulberry32 } from "./rng";

describe("monte carlo", () => {
  it("is reproducible with fixed seed", () => {
    const profile = makeDefaultProfile();
    const pack = TAX_YEAR_2025_26;
    const a = runMonteCarlo(profile, pack, {
      trials: 50,
      seed: 12345,
      volatility: DEFAULT_MONTE_CARLO_VOLATILITY,
      asOfDate: "2026-04-06",
    });
    const b = runMonteCarlo(profile, pack, {
      trials: 50,
      seed: 12345,
      volatility: DEFAULT_MONTE_CARLO_VOLATILITY,
      asOfDate: "2026-04-06",
    });
    expect(a.successRate).toBe(b.successRate);
    expect(a.terminalWealthP50).toBe(b.terminalWealthP50);
  });

  it("mulberry32 is deterministic", () => {
    const r1 = mulberry32(99);
    const r2 = mulberry32(99);
    expect(r1()).toBe(r2());
  });
});
