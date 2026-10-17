import { describe, expect, it } from "vitest";
import {
  ADVANCED_REPORT_SECTION_IDS,
  FULL_REPORT_SECTION_IDS,
  REPORT_SECTIONS,
  SIMPLE_REPORT_SECTION_IDS,
} from "@/features/reports/sections";

describe("report sections", () => {
  it("includes all section ids in full report set", () => {
    expect(FULL_REPORT_SECTION_IDS).toEqual(REPORT_SECTIONS.map((section) => section.id));
  });

  it("does not include settings section", () => {
    expect(FULL_REPORT_SECTION_IDS).not.toContain("settings");
  });

  it("defines simple dashboard report and advanced full report presets", () => {
    expect(SIMPLE_REPORT_SECTION_IDS).toEqual([
      "dashboard-summary",
      "chart-wealth-journey",
      "chart-cash-flow",
    ]);
    expect(ADVANCED_REPORT_SECTION_IDS).toEqual(FULL_REPORT_SECTION_IDS);
    expect(SIMPLE_REPORT_SECTION_IDS.every((id) => ADVANCED_REPORT_SECTION_IDS.includes(id))).toBe(
      true,
    );
  });
});
