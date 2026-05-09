import { describe, it, expect, beforeEach } from "vitest";
import { makeDefaultProfile } from "@/engine/constants/defaults";
import { db } from "@/db/dexie";
import { exportAll, importAll, InsightRepo } from "@/db/repository";

describe("exportAll / importAll", () => {
  beforeEach(async () => {
    await db.transaction("rw", db.profile, db.scenarios, db.insights, async () => {
      await db.profile.clear();
      await db.scenarios.clear();
      await db.insights.clear();
    });
  });

  it("round-trips insight dismissals in JSON export", async () => {
    const profile = makeDefaultProfile();
    await db.profile.put({
      id: "singleton",
      data: profile,
      onboardingComplete: true,
      updatedAt: new Date().toISOString(),
    });
    await InsightRepo.dismiss("test_insight_id");

    const json = await exportAll();
    expect(json).toContain("insightDismissals");
    expect(json).toContain("test_insight_id");

    await db.transaction("rw", db.profile, db.scenarios, db.insights, async () => {
      await db.profile.clear();
      await db.scenarios.clear();
      await db.insights.clear();
    });

    await importAll(json);
    const dismissed = await InsightRepo.dismissed();
    expect(dismissed.has("test_insight_id")).toBe(true);
  });

  it("imports legacy v1 JSON without insightDismissals", async () => {
    const legacy = JSON.stringify({
      version: 1,
      exportedAt: new Date().toISOString(),
      profile: {
        id: "singleton",
        data: makeDefaultProfile(),
        onboardingComplete: true,
        updatedAt: new Date().toISOString(),
      },
      scenarios: [],
    });
    await importAll(legacy);
    const row = await db.profile.get("singleton");
    expect(row?.onboardingComplete).toBe(true);
    const insights = await db.insights.toArray();
    expect(insights).toHaveLength(0);
  });
});
