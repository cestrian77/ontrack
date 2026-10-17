import type { HouseholdPrefs, Scenario, UserProfile } from "@/engine/types";

/** ~10 MB JSON export cap to avoid freezing the browser on import. */
export const MAX_IMPORT_BYTES = 10 * 1024 * 1024;
import { DEFAULT_MONTE_CARLO_VOLATILITY } from "@/engine/montecarlo/defaults";
import { mergeFireCalculationPrefs } from "@/engine/fire/firePrefs";
import type { ProfileRowV2 } from "./dexie";
import { db } from "./dexie";

function normalizeUserProfile(data: UserProfile): UserProfile {
  return {
    ...data,
    hasLisa: data.hasLisa ?? true,
    hasGia: data.hasGia ?? true,
    fireCalculationPrefs: mergeFireCalculationPrefs(data.fireCalculationPrefs),
  };
}

function normalizeHouseholdPrefs(prefs?: HouseholdPrefs): HouseholdPrefs {
  return {
    planningHorizonAge: prefs?.planningHorizonAge ?? 100,
    monteCarloTrials: prefs?.monteCarloTrials ?? 1000,
    monteCarloSeed: prefs?.monteCarloSeed ?? null,
    successUsesEssentialOnly: prefs?.successUsesEssentialOnly ?? false,
    householdRetirementIncome: prefs?.householdRetirementIncome ?? null,
    monteCarloVolatility: prefs?.monteCarloVolatility ?? DEFAULT_MONTE_CARLO_VOLATILITY,
  };
}

function normalizeHouseholdRow(row: ProfileRowV2): ProfileRowV2 {
  return {
    ...row,
    primary: normalizeUserProfile(row.primary),
    partner: row.partner ? normalizeUserProfile(row.partner) : null,
    dependentCount: row.dependentCount ?? 0,
    householdPrefs: normalizeHouseholdPrefs(row.householdPrefs),
  };
}

export const ProfileRepo = {
  async load(): Promise<{
    profile: UserProfile | null;
    partnerProfile: UserProfile | null;
    dependentCount: number;
    householdPrefs: HouseholdPrefs;
    onboardingComplete: boolean;
  }> {
    const row = await db.profile.get("singleton");
    if (!row) {
      return {
        profile: null,
        partnerProfile: null,
        dependentCount: 0,
        householdPrefs: normalizeHouseholdPrefs(),
        onboardingComplete: false,
      };
    }
    const n = normalizeHouseholdRow(row);
    return {
      profile: n.primary,
      partnerProfile: n.partner,
      dependentCount: n.dependentCount,
      householdPrefs: n.householdPrefs ?? normalizeHouseholdPrefs(),
      onboardingComplete: n.onboardingComplete,
    };
  },
  async save(args: {
    profile: UserProfile;
    partnerProfile: UserProfile | null;
    dependentCount: number;
    householdPrefs?: HouseholdPrefs;
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
      householdPrefs: normalizeHouseholdPrefs(args.householdPrefs),
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
      version: 3,
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
      householdPrefs: normalizeHouseholdPrefs(
        o.householdPrefs as HouseholdPrefs | undefined,
      ),
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
      householdPrefs: normalizeHouseholdPrefs(),
      onboardingComplete: Boolean(o.onboardingComplete),
      updatedAt:
        typeof o.updatedAt === "string"
          ? o.updatedAt
          : new Date().toISOString(),
    };
  }

  return null;
}

function isScenarioLike(value: unknown): value is Scenario {
  if (!value || typeof value !== "object") return false;
  const o = value as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.name === "string" &&
    typeof o.colour === "string" &&
    typeof o.createdAt === "string" &&
    (o.overrides == null || typeof o.overrides === "object")
  );
}

export async function importAll(json: string): Promise<void> {
  if (json.length > MAX_IMPORT_BYTES) {
    throw new Error(`Import file is too large (max ${MAX_IMPORT_BYTES / (1024 * 1024)} MB).`);
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(json) as Record<string, unknown>;
  } catch {
    throw new Error("Invalid JSON file.");
  }

  const version = parsed.version;
  if (version !== 1 && version !== 2 && version !== 3) {
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
      for (const s of scenarios) {
        if (!isScenarioLike(s)) {
          throw new Error("Invalid scenario entry in import file.");
        }
        await db.scenarios.put(s);
      }
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
