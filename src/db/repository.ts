import type { Scenario, UserProfile } from "@/engine/types";
import { db } from "./dexie";

export const ProfileRepo = {
  async load(): Promise<{
    profile: UserProfile | null;
    onboardingComplete: boolean;
  }> {
    const row = await db.profile.get("singleton");
    if (!row) return { profile: null, onboardingComplete: false };
    return { profile: row.data, onboardingComplete: row.onboardingComplete };
  },
  async save(profile: UserProfile, onboardingComplete: boolean): Promise<void> {
    await db.profile.put({
      id: "singleton",
      data: { ...profile, updatedAt: new Date().toISOString() },
      onboardingComplete,
      updatedAt: new Date().toISOString(),
    });
  },
  async clear(): Promise<void> {
    await db.profile.clear();
  },
};

export const ScenarioRepo = {
  async list(): Promise<Scenario[]> {
    return db.scenarios.toArray();
  },
  async upsert(scenario: Scenario): Promise<void> {
    await db.scenarios.put(scenario);
  },
  async remove(id: string): Promise<void> {
    await db.scenarios.delete(id);
  },
};

export const InsightRepo = {
  async dismissed(): Promise<Set<string>> {
    const all = await db.insights.toArray();
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return new Set(
      all
        .filter((i) => new Date(i.dismissedAt).getTime() > cutoff)
        .map((i) => i.id),
    );
  },
  async dismiss(id: string): Promise<void> {
    await db.insights.put({ id, dismissedAt: new Date().toISOString() });
  },
};

export async function exportAll(): Promise<string> {
  const profile = await db.profile.get("singleton");
  const scenarios = await db.scenarios.toArray();
  const insightDismissals = await db.insights.toArray();
  return JSON.stringify(
    {
      version: 1,
      exportedAt: new Date().toISOString(),
      profile,
      scenarios,
      insightDismissals,
    },
    null,
    2,
  );
}

export async function importAll(json: string): Promise<void> {
  const parsed = JSON.parse(json);
  if (parsed.version !== 1) throw new Error("Unsupported export version");
  await db.transaction("rw", db.profile, db.scenarios, db.insights, async () => {
    await db.profile.clear();
    await db.scenarios.clear();
    await db.insights.clear();
    if (parsed.profile) await db.profile.put(parsed.profile);
    if (Array.isArray(parsed.scenarios)) {
      for (const s of parsed.scenarios) await db.scenarios.put(s);
    }
    if (Array.isArray(parsed.insightDismissals)) {
      for (const row of parsed.insightDismissals) {
        if (
          row &&
          typeof row.id === "string" &&
          typeof row.dismissedAt === "string"
        ) {
          await db.insights.put({ id: row.id, dismissedAt: row.dismissedAt });
        }
      }
    }
  });
}
