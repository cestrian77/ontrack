import { describe, expect, it } from "vitest";
import { baseTaxYearPack, scenarioTaxYearPack } from "@/lib/taxYearContext";
import {
  TAX_YEAR_PACKS,
  currentTaxYearPack,
  isCurrentTaxYearRegistered,
  resolveTaxYearPack,
  taxYearLabelForDate,
  taxYearPackByLabel,
} from "./index";

describe("UK tax-year resolver", () => {
  it("labels dates inside a tax year using start-year/end-yy format", () => {
    expect(taxYearLabelForDate(new Date("2024-04-06"))).toBe("2024/25");
    expect(taxYearLabelForDate(new Date("2025-04-05"))).toBe("2024/25");
    expect(taxYearLabelForDate(new Date("2025-04-06"))).toBe("2025/26");
    expect(taxYearLabelForDate(new Date("2026-04-06"))).toBe("2026/27");
    expect(taxYearLabelForDate(new Date("2027-01-15"))).toBe("2026/27");
  });

  it("resolves the right pack for dates inside each registered year", () => {
    expect(resolveTaxYearPack(new Date("2024-06-01")).label).toBe("2024/25");
    expect(resolveTaxYearPack(new Date("2025-06-01")).label).toBe("2025/26");
    expect(resolveTaxYearPack(new Date("2026-06-01")).label).toBe("2026/27");
    expect(resolveTaxYearPack(new Date("2027-06-01")).label).toBe("2027/28");
  });

  it("falls back to the most recent registered pack for future dates", () => {
    const future = new Date("2099-01-01");
    const last = TAX_YEAR_PACKS[TAX_YEAR_PACKS.length - 1];
    expect(resolveTaxYearPack(future).label).toBe(last.label);
  });

  it("looks up packs by label", () => {
    expect(taxYearPackByLabel("2024/25").label).toBe("2024/25");
    expect(() => taxYearPackByLabel("1999/00")).toThrow();
  });

  it("recognises that the current real-world date has a registered pack", () => {
    expect(isCurrentTaxYearRegistered()).toBe(true);
  });

  it("packs are chronologically ordered without gaps", () => {
    for (let i = 1; i < TAX_YEAR_PACKS.length; i++) {
      const prev = TAX_YEAR_PACKS[i - 1];
      const curr = TAX_YEAR_PACKS[i];
      expect(prev.endsOn).toBe(curr.startsOn);
    }
  });

  it("each pack contains the headline UK-wide allowances", () => {
    for (const p of TAX_YEAR_PACKS) {
      expect(p.personalAllowance).toBeGreaterThan(0);
      expect(p.isaAnnualAllowance).toBeGreaterThan(0);
      expect(p.pensionAnnualAllowance).toBeGreaterThan(0);
      expect(p.statePensionAnnualFull).toBeGreaterThan(0);
      expect(p.btlSection24CreditRate).toBeGreaterThan(0);
      expect(p.englandWalesPropertyIncomeBands.length).toBeGreaterThan(0);
    }
  });

  it("2027/28 uses higher property rates and S24 credit", () => {
    const p = taxYearPackByLabel("2027/28");
    const prev = taxYearPackByLabel("2026/27");
    expect(p.btlSection24CreditRate).toBe(0.22);
    expect(prev.btlSection24CreditRate).toBe(0.2);
    expect(p.englandWalesPropertyIncomeBands[1].rate).toBe(0.22);
    expect(prev.englandWalesPropertyIncomeBands[1].rate).toBe(0.2);
  });
});

describe("taxYearContext helpers", () => {
  it("baseTaxYearPack uses calendar when label is null", () => {
    expect(baseTaxYearPack(null).label).toBe(currentTaxYearPack().label);
  });

  it("baseTaxYearPack resolves explicit label", () => {
    expect(baseTaxYearPack("2025/26").label).toBe("2025/26");
  });

  it("scenarioTaxYearPack overrides base when set", () => {
    const base = taxYearPackByLabel("2025/26");
    expect(scenarioTaxYearPack(base, "2026/27").label).toBe("2026/27");
  });

  it("scenarioTaxYearPack falls back to base when unset", () => {
    const base = taxYearPackByLabel("2024/25");
    expect(scenarioTaxYearPack(base, undefined).label).toBe("2024/25");
  });
});
