import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { makeDefaultProfile } from "@/engine/constants/defaults";
import { currentTaxYearPack } from "@/engine/constants/taxYears";
import { runProjection } from "@/engine/project/runProjection";
import { computeFire } from "@/engine/fire/fire";
import { buildReportData } from "@/features/reports/buildReportData";
import { downloadReportPdf } from "@/features/reports/downloadReport";

vi.mock("@react-pdf/renderer", () => ({
  pdf: vi.fn(() => ({
    toBlob: vi.fn().mockResolvedValue(new Blob(["%PDF-mock"], { type: "application/pdf" })),
  })),
}));

vi.mock("@/features/reports/ReportDocument", () => ({
  ReportDocument: () => null,
}));

describe("downloadReportPdf", () => {
  beforeEach(() => {
    const anchor = document.createElement("a");
    vi.spyOn(anchor, "click").mockImplementation(() => {});
    vi.spyOn(document, "createElement").mockImplementation((tag) => {
      if (tag === "a") return anchor;
      return document.createElement.bind(document)(tag) as HTMLAnchorElement;
    });
    globalThis.URL.createObjectURL = vi.fn().mockReturnValue("blob:mock-url");
    globalThis.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("creates blob, object URL, and triggers download", async () => {
    const profile = makeDefaultProfile();
    const projection = runProjection(profile);
    const fire = computeFire(profile, projection);
    const data = buildReportData({
      profile,
      projection,
      fire,
      baseTaxYearPack: currentTaxYearPack(),
      scenarios: [],
      selectedScenarioIds: [],
      insights: [],
    });

    await downloadReportPdf({ data, sections: ["dashboard-summary"] });

    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
    const { pdf } = await import("@react-pdf/renderer");
    expect(pdf).toHaveBeenCalled();
  });
});
