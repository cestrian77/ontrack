import { scaleLinear } from "d3-scale";
import { area, curveMonotoneX, line, stack, stackOffsetNone, stackOrderNone } from "d3-shape";
import type { SeriesPoint } from "d3-shape";
import type { TaxYearPack } from "@/engine/constants/taxYears";
import type { Projection, Scenario, UserProfile } from "@/engine/types";
import { gbp } from "@/lib/utils";
import { PROJECTION_ASSET_LAYERS } from "@/lib/projection-assets";
import type { ReportChartImages } from "@/features/reports/buildReportData";
import type { ReportSectionId } from "@/features/reports/sections";
import {
  buildWealthJourneySeriesData,
  WEALTH_JOURNEY_LAYER_COLOURS,
  type InflationChartMode,
  type WealthJourneyChartRow,
} from "@/features/reports/chartData/wealthJourneySeries";
import { buildCashflowSeriesData, type CashflowChartRow } from "@/features/reports/chartData/cashflowSeries";

const W = 900;
const H = 320;
const M = { top: 32, right: 20, bottom: 40, left: 78 };

function canvasToDataUrl(canvas: HTMLCanvasElement): string | undefined {
  try {
    return canvas.toDataURL("image/png");
  } catch {
    return undefined;
  }
}

function drawYAxisTicks(
  ctx: CanvasRenderingContext2D,
  yScale: ReturnType<typeof scaleLinear<number>>,
  x0: number,
  ticks: number[],
) {
  ctx.strokeStyle = "#cbd5e1";
  ctx.fillStyle = "#64748b";
  ctx.font = "11px system-ui, sans-serif";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  for (const t of ticks) {
    const y = yScale(t);
    ctx.beginPath();
    ctx.moveTo(x0, y);
    ctx.lineTo(W - M.right, y);
    ctx.stroke();
    ctx.fillText(gbp(t), x0 - 6, y);
  }
}

function drawXAxisTicks(
  ctx: CanvasRenderingContext2D,
  xScale: ReturnType<typeof scaleLinear<number>>,
  y0: number,
  ages: number[],
  maxTicks: number,
) {
  const minA = ages[0] ?? 0;
  const maxA = ages[ages.length - 1] ?? 100;
  const step = Math.max(5, Math.ceil((maxA - minA) / maxTicks / 5) * 5);
  ctx.strokeStyle = "#94a3b8";
  ctx.fillStyle = "#64748b";
  ctx.font = "11px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  for (let a = Math.ceil(minA / step) * step; a <= maxA; a += step) {
    if (a < minA) continue;
    const x = xScale(a);
    ctx.beginPath();
    ctx.moveTo(x, M.top);
    ctx.lineTo(x, y0);
    ctx.stroke();
    ctx.fillText(String(Math.round(a)), x, y0 + 4);
  }
}

function renderWealthJourneyPng({
  profile,
  projection,
  scenarios,
  mode,
  baseTaxYearPack,
  resolveScenarioProfile,
}: {
  profile: UserProfile;
  projection: Projection;
  scenarios: Scenario[];
  mode: InflationChartMode;
  baseTaxYearPack: TaxYearPack;
  resolveScenarioProfile?: (scenario: Scenario) => UserProfile;
}): string | undefined {
  if (typeof document === "undefined") return undefined;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return undefined;

  const { rows, fireY } = buildWealthJourneySeriesData({
    profile,
    projection,
    scenarios,
    mode,
    baseTaxYearPack,
    resolveScenarioProfile,
  });
  if (rows.length === 0) return canvasToDataUrl(canvas);

  const keys = PROJECTION_ASSET_LAYERS.map((l) => l.key);
  const stackGen = stack<WealthJourneyChartRow>()
    .keys(keys)
    .order(stackOrderNone)
    .offset(stackOffsetNone);
  const stacked = stackGen(rows);

  const lastSeries = stacked[stacked.length - 1];
  const stackedMax = Math.max(
    0,
    ...lastSeries.map((d) => (Number.isFinite(d[1]) ? d[1] : 0)),
  );
  let scenarioMax = 0;
  scenarios.forEach((_, idx) => {
    const k = `scenario_${idx}`;
    for (const r of rows) {
      const v = r[k];
      if (typeof v === "number" && Number.isFinite(v)) scenarioMax = Math.max(scenarioMax, v);
    }
  });
  const yMax = Math.max(stackedMax, fireY, scenarioMax) * 1.06 || 1;

  const ages = rows.map((r) => r.age);
  const xMin = ages[0] ?? 0;
  const xMax = ages[ages.length - 1] ?? xMin + 1;

  const xScale = scaleLinear()
    .domain([xMin, xMax])
    .range([M.left, W - M.right]);
  const yScale = scaleLinear()
    .domain([0, yMax])
    .range([H - M.bottom, M.top]);

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 1;
  const yTicks = yScale.ticks(5);
  drawYAxisTicks(ctx, yScale, M.left, yTicks);
  drawXAxisTicks(ctx, xScale, H - M.bottom, ages, 8);

  const areaGen = area<SeriesPoint<WealthJourneyChartRow>>()
    .x((d) => xScale(d.data.age))
    .y0((d) => yScale(d[0]))
    .y1((d) => yScale(d[1]))
    .curve(curveMonotoneX);

  for (const serie of stacked) {
    const key = String(serie.key);
    const fill = WEALTH_JOURNEY_LAYER_COLOURS[key as keyof typeof WEALTH_JOURNEY_LAYER_COLOURS] ?? "#64748b";
    const path = areaGen(serie);
    if (!path) continue;
    ctx.fillStyle = fill;
    ctx.globalAlpha = 0.75;
    ctx.strokeStyle = fill;
    ctx.lineWidth = 1;
    const p = new Path2D(path);
    ctx.fill(p);
    ctx.stroke(p);
    ctx.globalAlpha = 1;
  }

  scenarios.forEach((s, idx) => {
    const k = `scenario_${idx}`;
    const lineGen = line<WealthJourneyChartRow>()
      .x((d) => xScale(d.age))
      .y((d) => yScale(d[k] ?? NaN))
      .defined((d) => Number.isFinite(d[k]))
      .curve(curveMonotoneX);
    const path = lineGen(rows);
    if (!path) return;
    ctx.strokeStyle = s.colour;
    ctx.lineWidth = 2;
    ctx.stroke(new Path2D(path));
  });

  const fy = yScale(fireY);
  if (Number.isFinite(fy)) {
    ctx.strokeStyle = "#16a34a";
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(M.left, fy);
    ctx.lineTo(W - M.right, fy);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#334155";
    ctx.font = "10px system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`FIRE ${gbp(fireY)}`, M.left + 4, fy - 6);
  }

  const vline = (age: number, dash: number[], opacity: number) => {
    const x = xScale(age);
    if (x < M.left || x > W - M.right) return;
    ctx.strokeStyle = `rgba(15,23,42,${opacity})`;
    ctx.setLineDash(dash);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, M.top);
    ctx.lineTo(x, H - M.bottom);
    ctx.stroke();
    ctx.setLineDash([]);
  };

  vline(profile.retirementTargetAge, [4, 4], 0.85);
  ctx.fillStyle = "#334155";
  ctx.font = "10px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Retirement", xScale(profile.retirementTargetAge), M.top - 4);

  vline(projection.meta.nmpa, [2, 4], 0.45);
  ctx.fillText("NMPA", xScale(projection.meta.nmpa), M.top + 10);
  vline(projection.meta.spa, [2, 4], 0.45);
  ctx.fillText("SPA", xScale(projection.meta.spa), M.top + 10);

  ctx.fillStyle = "#64748b";
  ctx.font = "11px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(mode === "nominal" ? "Nominal £" : "Real £", M.left, H - 8);

  return canvasToDataUrl(canvas);
}

function renderCashflowPng({
  profile,
  projection,
  taxYearPack,
  mode,
}: {
  profile: UserProfile;
  projection: Projection;
  taxYearPack: TaxYearPack;
  mode: InflationChartMode;
}): string | undefined {
  if (typeof document === "undefined") return undefined;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return undefined;

  const rows = buildCashflowSeriesData({ profile, projection, taxYearPack, mode });
  if (rows.length === 0) return canvasToDataUrl(canvas);

  const cashMax = Math.max(...rows.map((r) => r.cashflow), 0);
  const targetVals = rows.map((r) => r.target).filter((t): t is number => t != null && Number.isFinite(t));
  const targetMax = targetVals.length ? Math.max(...targetVals) : 0;
  const yMax = Math.max(cashMax, targetMax) * 1.08 || 1;

  const ages = rows.map((r) => r.age);
  const xMin = ages[0] ?? 0;
  const xMax = ages[ages.length - 1] ?? xMin + 1;

  const xScale = scaleLinear()
    .domain([xMin, xMax])
    .range([M.left, W - M.right]);
  const yScale = scaleLinear()
    .domain([0, yMax])
    .range([H - M.bottom, M.top]);

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 1;
  drawYAxisTicks(ctx, yScale, M.left, yScale.ticks(5));
  drawXAxisTicks(ctx, xScale, H - M.bottom, ages, 8);

  const cashLine = line<CashflowChartRow>()
    .x((d) => xScale(d.age))
    .y((d) => yScale(d.cashflow))
    .curve(curveMonotoneX)(rows);
  if (cashLine) {
    ctx.strokeStyle = "#2563eb";
    ctx.lineWidth = 2;
    ctx.stroke(new Path2D(cashLine));
  }

  const targetLine = line<CashflowChartRow>()
    .x((d) => xScale(d.age))
    .y((d) => yScale(d.target ?? NaN))
    .defined((d) => d.target != null && Number.isFinite(d.target))
    .curve(curveMonotoneX)(rows);
  if (targetLine) {
    ctx.strokeStyle = "#64748b";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.stroke(new Path2D(targetLine));
    ctx.setLineDash([]);
  }

  const xRet = xScale(profile.retirementTargetAge);
  ctx.strokeStyle = "rgba(15,23,42,0.55)";
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(xRet, M.top);
  ctx.lineTo(xRet, H - M.bottom);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "#334155";
  ctx.font = "10px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Retirement", xRet, M.top - 4);

  ctx.fillStyle = "#64748b";
  ctx.font = "11px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(mode === "nominal" ? "Nominal £" : "Real £", M.left, H - 8);

  return canvasToDataUrl(canvas);
}

/** Builds PNG data URIs for chart sections selected by the user. */
export function generateReportChartImages({
  sections,
  profile,
  projection,
  taxYearPack,
  baseTaxYearPack,
  mode,
  scenarios,
  resolveScenarioProfile,
}: {
  sections: ReportSectionId[];
  profile: UserProfile;
  projection: Projection;
  taxYearPack: TaxYearPack;
  baseTaxYearPack: TaxYearPack;
  mode: InflationChartMode;
  scenarios: Scenario[];
  resolveScenarioProfile?: (scenario: Scenario) => UserProfile;
}): ReportChartImages {
  const out: ReportChartImages = {};
  if (sections.includes("chart-wealth-journey")) {
    const uri = renderWealthJourneyPng({
      profile,
      projection,
      scenarios,
      mode,
      baseTaxYearPack,
      resolveScenarioProfile,
    });
    if (uri) out.wealthJourney = uri;
  }
  if (sections.includes("chart-cash-flow")) {
    const uri = renderCashflowPng({ profile, projection, taxYearPack, mode });
    if (uri) out.cashflow = uri;
  }
  return out;
}
