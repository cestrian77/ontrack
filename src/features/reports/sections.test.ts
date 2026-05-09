import { describe, expect, it } from "vitest";
import { FULL_REPORT_SECTION_IDS, REPORT_SECTIONS } from "@/features/reports/sections";

describe("report sections", () => {
  it("includes all section ids in full report set", () => {
    expect(FULL_REPORT_SECTION_IDS).toEqual(REPORT_SECTIONS.map((section) => section.id));
  });

  it("does not include settings section", () => {
    expect(FULL_REPORT_SECTION_IDS).not.toContain("settings");
  });
});
