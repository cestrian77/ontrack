import type { Scenario, UserProfile } from "@/engine/types";
import type { ProfileRowV2 } from "./dexie";
import { db } from "./dexie";

function normalizeUserProfile(data: UserProfile): UserProfile {
  return {
    ...data,
    hasLisa: data.hasLisa ?? true,
    hasGia: data.hasGia ?? true,
  };
}

function normalizeHouseholdRow(row: ProfileRowV2): ProfileRowV2 {
  return {
    ...row,
    primary: normalizeUserProfile(row.primary),
    partner: row.partner ? normalizeUserProfile(row.partner) : null,
    dependentCount: row.dependentCount ?? 0,
  };
}

export const ProfileRepo = {
  async load(): Promise<{
    profile: UserProfile | null;
    partnerProfile: UserProfile | null;
    dependentCount: number;
    onboardingComplete: boolean;
  }> {
    const row = await db.profile.get("singleton");
    if (!row) {
      return {
        profile: null,
        partnerProfile: null,
        dependentCount: 0,
        onboardingComplete: false,
      };
    }
    const n = normalizeHouseholdRow(row);
    return {
      profile: n.primary,
      partnerProfile: n.partner,
      dependentCount: n.dependentCount,
      onboardingComplete: n.onboardingComplete,
    };
  },
  async save(args: {
    profile: UserProfile;
    partnerProfile: UserProfile | null;
    dependentCount: number;
    onboardingComplete: boolean;
  }): Promise<void> {
    const now = new Date().toISOString();
    await db.profile.put({
      id: "singleton",
      primary: { ...args.profile, updatedAt: now },
      partner: args.partnerProfile
        ? { ...args.partnerProfile, updatedAt: now }
        : null,
      dependentCount: args.dependentCount,
      onboardingComplete: args.onboardingComplete,
      updatedAt: now,
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
  const household = await db.profile.get("singleton");
  const scenarios = await db.scenarios.toArray();
  const insightDismissals = await db.insights.toArray();
  return JSON.stringify(
    {
      version: 2,
      exportedAt: new Date().toISOString(),
      household,
      scenarios,
      insightDismissals,
    },
    null,
    2,
  );
}

function normalizeImportedHousehold(raw: unknown): ProfileRowV2 | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;

  if (o.primary && typeof o.primary === "object") {
    return {
      id: "singleton",
      primary: normalizeUserProfile(o.primary as UserProfile),
      partner:
        o.partner && typeof o.partner === "object"
          ? normalizeUserProfile(o.partner as UserProfile)
          : null,
      dependentCount: typeof o.dependentCount === "number" ? o.dependentCount : 0,
      onboardingComplete: Boolean(o.onboardingComplete),
      updatedAt:
        typeof o.updatedAt === "string"
          ? o.updatedAt
          : new Date().toISOString(),
    };
  }

  if (o.data && typeof o.data === "object") {
    return {
      id: "singleton",
      primary: normalizeUserProfile(o.data as UserProfile),
      partner: null,
      dependentCount: 0,
      onboardingComplete: Boolean(o.onboardingComplete),
      updatedAt:
        typeof o.updatedAt === "string"
          ? o.updatedAt
          : new Date().toISOString(),
    };
  }

  return null;
}

export async function importAll(json: string): Promise<void> {
  const parsed = JSON.parse(json) as Record<string, unknown>;
  const version = parsed.version;
  if (version !== 1 && version !== 2) {
    throw new Error("Unsupported export version");
  }

  let householdRow: ProfileRowV2 | null = null;
  if (version === 2) {
    householdRow = normalizeImportedHousehold(parsed.household);
  } else {
    householdRow = normalizeImportedHousehold(parsed.profile);
  }

  const scenarios = parsed.scenarios;
  const insightDismissals = parsed.insightDismissals;

  await db.transaction("rw", db.profile, db.scenarios, db.insights, async () => {
    await db.profile.clear();
    await db.scenarios.clear();
    await db.insights.clear();
    if (householdRow) await db.profile.put(normalizeHouseholdRow(householdRow));
    if (Array.isArray(scenarios)) {
      for (const s of scenarios) await db.scenarios.put(s as Scenario);
    }
    if (Array.isArray(insightDismissals)) {
      for (const row of insightDismissals) {
        if (
          row &&
          typeof row === "object" &&
          "id" in row &&
          "dismissedAt" in row &&
          typeof (row as { id: unknown }).id === "string" &&
          typeof (row as { dismissedAt: unknown }).dismissedAt === "string"
        ) {
          await db.insights.put({
            id: (row as { id: string }).id,
            dismissedAt: (row as { dismissedAt: string }).dismissedAt,
          });
        }
      }
    }
  });
}
