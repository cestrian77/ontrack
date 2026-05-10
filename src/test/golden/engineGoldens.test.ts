import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { makeDefaultProfile } from "@/engine/constants/defaults";
import { computeFire } from "@/engine/fire/fire";
import { runProjection } from "@/engine/project/runProjection";
import { taxYearPackByLabel } from "@/engine/constants/taxYears";
import type { FireMetrics, Projection, ProjectionYear, UserProfile } from "@/engine/types";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "../../..");
const GOLDENS_DIR = join(REPO_ROOT, "fixtures/engine-goldens/cases");

const AS_OF = "2026-05-10";
const TAX_LABEL = "2026/27";

function opts() {
  return {
    asOfDate: AS_OF,
    taxYearPack: taxYearPackByLabel(TAX_LABEL),
  };
}

function snapshotYear(years: ProjectionYear[], index: number) {
  const y = years[index];
  return {
    index,
    year: y.year,
    age: y.age,
    totalNetWorth: y.totalNetWorth,
    investableNetWorth: y.investableNetWorth,
    pensionValue: y.pensionValue,
    isaValue: y.isaValue,
    primaryEquity: y.primaryEquity,
    retired: y.retired,
  };
}

function fireSnapshot(f: FireMetrics) {
  return {
    fireNumber: f.fireNumber,
    leanFireNumber: f.leanFireNumber,
    fatFireNumber: f.fatFireNumber,
    coastFireNumber: f.coastFireNumber,
    baristaFireNumber: f.baristaFireNumber,
    investableNow: f.investableNow,
    fireProgressPct: f.fireProgressPct,
    coastFireProgressPct: f.coastFireProgressPct,
    yearsToFire: f.yearsToFire,
    fireAge: f.fireAge,
    coastReached: f.coastReached,
    savingsRate: f.savingsRate,
  };
}

function buildPrdFireProfile(): UserProfile {
  const p = makeDefaultProfile();
  p.dateOfBirth = "1990-05-10";
  p.targetRetirementIncome = 40_000;
  p.safeWithdrawalRate = 0.035;
  p.updatedAt = `${AS_OF}T12:00:00.000Z`;
  return p;
}

function buildDefaultFrozenProfile(): UserProfile {
  const p = makeDefaultProfile();
  p.dateOfBirth = "1990-05-10";
  p.updatedAt = `${AS_OF}T12:00:00.000Z`;
  return p;
}

function buildFixture(
  id: string,
  description: string,
  profile: UserProfile,
  projection: Projection,
  fire: FireMetrics,
) {
  const years = projection.years;
  const last = years.length - 1;
  const mid = Math.min(25, last);
  return {
    engineGoldenVersion: 1 as const,
    id,
    description,
    asOfDate: AS_OF,
    taxYearLabel: TAX_LABEL,
    profile,
    expected: {
      fire: fireSnapshot(fire),
      projection: {
        meta: projection.meta,
        yearSnapshots: [
          snapshotYear(years, 0),
          snapshotYear(years, 5),
          snapshotYear(years, 10),
          snapshotYear(years, mid),
          snapshotYear(years, last),
        ],
      },
    },
  };
}

function loadCase(filename: string) {
  const path = join(GOLDENS_DIR, filename);
  return JSON.parse(readFileSync(path, "utf-8")) as ReturnType<typeof buildFixture>;
}

function assertClose(
  actual: number,
  expected: number,
  tol: number,
  label: string,
) {
  expect(
    Math.abs(actual - expected),
    `${label}: got ${actual} expected ${expected}`,
  ).toBeLessThanOrEqual(tol);
}

describe("engine goldens (fixtures/engine-goldens/cases)", () => {
  it("regenerates JSON when DUMP_ENGINE_GOLDENS=1", () => {
    if (process.env.DUMP_ENGINE_GOLDENS !== "1") return;

    if (!existsSync(GOLDENS_DIR)) mkdirSync(GOLDENS_DIR, { recursive: true });

    const o = opts();
    const prdProfile = buildPrdFireProfile();
    const prdProj = runProjection(prdProfile, o);
    const prdFire = computeFire(prdProfile, prdProj, o.taxYearPack);
    writeFileSync(
      join(GOLDENS_DIR, "prd-fire-example.json"),
      JSON.stringify(
        buildFixture(
          "prd-fire-example",
          "PRD §6.1.1-style FIRE number; deterministic asOf + tax pack",
          prdProfile,
          prdProj,
          prdFire,
        ),
        null,
        2,
      ) + "\n",
      "utf-8",
    );

    const defProfile = buildDefaultFrozenProfile();
    const defProj = runProjection(defProfile, o);
    const defFire = computeFire(defProfile, defProj, o.taxYearPack);
    writeFileSync(
      join(GOLDENS_DIR, "default-profile-1990-dob.json"),
      JSON.stringify(
        buildFixture(
          "default-profile-1990-dob",
          "makeDefaultProfile-shaped inputs with fixed DOB for trajectory checks",
          defProfile,
          defProj,
          defFire,
        ),
        null,
        2,
      ) + "\n",
      "utf-8",
    );
  });

  it("prd-fire-example.json matches engine output", () => {
    const g = loadCase("prd-fire-example.json");
    const o = opts();
    const proj = runProjection(g.profile as UserProfile, o);
    const fire = computeFire(g.profile as UserProfile, proj, o.taxYearPack);

    assertClose(fire.fireNumber, g.expected.fire.fireNumber, 0.01, "fireNumber");
    assertClose(
      fire.investableNow,
      g.expected.fire.investableNow,
      0.01,
      "investableNow",
    );
    expect(fire.yearsToFire).toBe(g.expected.fire.yearsToFire);
    expect(fire.fireAge).toBe(g.expected.fire.fireAge);
    expect(fire.coastReached).toBe(g.expected.fire.coastReached);

    expect(proj.meta).toEqual(g.expected.projection.meta);
    for (const snap of g.expected.projection.yearSnapshots) {
      const y = proj.years[snap.index];
      assertClose(y.totalNetWorth, snap.totalNetWorth, 0.02, `tnw@${snap.index}`);
      assertClose(
        y.investableNetWorth,
        snap.investableNetWorth,
        0.02,
        `inw@${snap.index}`,
      );
      expect(y.age).toBe(snap.age);
    }
  });

  it("default-profile-1990-dob.json matches engine output", () => {
    const g = loadCase("default-profile-1990-dob.json");
    const o = opts();
    const proj = runProjection(g.profile as UserProfile, o);
    const fire = computeFire(g.profile as UserProfile, proj, o.taxYearPack);

    assertClose(fire.fireNumber, g.expected.fire.fireNumber, 0.01, "fireNumber");
    expect(proj.meta).toEqual(g.expected.projection.meta);
    for (const snap of g.expected.projection.yearSnapshots) {
      const y = proj.years[snap.index];
      assertClose(y.totalNetWorth, snap.totalNetWorth, 0.02, `tnw@${snap.index}`);
    }
  });
});
