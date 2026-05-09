import { describe, it, expect, vi, afterEach } from "vitest";
import { makeDefaultProfile } from "@/engine/constants/defaults";
import { currentTaxYearPack } from "@/engine/constants/taxYears";
import { runProjection } from "@/engine/project/runProjection";
import { generateReportChartImages } from "@/features/reports/renderPdfCharts";

const mockCtx = {
  fillStyle: "",
  strokeStyle: "",
  globalAlpha: 1,
  lineWidth: 1,
  font: "",
  textAlign: "left" as CanvasTextAlign,
  textBaseline: "alphabetic" as CanvasTextBaseline,
  setLineDash: vi.fn(),
  fillRect: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
  fill: vi.fn(),
  fillText: vi.fn(),
} as unknown as CanvasRenderingContext2D;

describe("generateReportChartImages", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("returns empty object when chart sections are not selected", () => {
    const profile = makeDefaultProfile();
    const projection = runProjection(profile);
    const pack = currentTaxYearPack();
    const out = generateReportChartImages({
      sections: ["dashboard-summary"],
      profile,
      projection,
      taxYearPack: pack,
      baseTaxYearPack: pack,
      mode: "real",
      scenarios: [],
    });
    expect(out).toEqual({});
  });

  it("returns PNG data URIs when canvas is available", () => {
    vi.stubGlobal(
      "Path2D",
      class Path2DStub {
        constructor(_d?: string) {}
      },
    );
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(mockCtx);
    vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue("data:image/png;base64,xx");

    const profile = makeDefaultProfile();
    const projection = runProjection(profile);
    const pack = currentTaxYearPack();
    const out = generateReportChartImages({
      sections: ["chart-wealth-journey", "chart-cash-flow"],
      profile,
      projection,
      taxYearPack: pack,
      baseTaxYearPack: pack,
      mode: "real",
      scenarios: [],
    });

    expect(out.wealthJourney).toBe("data:image/png;base64,xx");
    expect(out.cashflow).toBe("data:image/png;base64,xx");
  });

  it("omits chart keys when getContext returns null", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);

    const profile = makeDefaultProfile();
    const projection = runProjection(profile);
    const pack = currentTaxYearPack();
    const out = generateReportChartImages({
      sections: ["chart-wealth-journey"],
      profile,
      projection,
      taxYearPack: pack,
      baseTaxYearPack: pack,
      mode: "real",
      scenarios: [],
    });

    expect(out.wealthJourney).toBeUndefined();
  });
});
