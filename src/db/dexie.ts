import Dexie, { type Table } from "dexie";
import type { HouseholdPrefs, Scenario, UserProfile } from "@/engine/types";

/** @deprecated v1 shape — migrated to ProfileRowV2 on upgrade */
export interface ProfileRow {
  id: "singleton";
  data: UserProfile;
  onboardingComplete: boolean;
  updatedAt: string;
}

export interface ProfileRowV2 {
  id: "singleton";
  primary: UserProfile;
  partner: UserProfile | null;
  dependentCount: number;
  householdPrefs?: HouseholdPrefs;
  onboardingComplete: boolean;
  updatedAt: string;
}

export interface InsightStateRow {
  id: string;
  dismissedAt: string;
}

export interface ProjectionCacheRow {
  hash: string;
  data: unknown;
  cachedAt: string;
}

export class OnTrackDB extends Dexie {
  profile!: Table<ProfileRowV2, "singleton">;
  scenarios!: Table<Scenario, string>;
  insights!: Table<InsightStateRow, string>;
  projectionCache!: Table<ProjectionCacheRow, string>;

  constructor() {
    super("OnTrackDB");
    this.version(1).stores({
      profile: "id, updatedAt",
      scenarios: "id, name, createdAt",
      insights: "id, dismissedAt",
      projectionCache: "hash, cachedAt",
    });
    this.version(2)
      .stores({
        profile: "id, updatedAt",
        scenarios: "id, name, createdAt",
        insights: "id, dismissedAt",
        projectionCache: "hash, cachedAt",
      })
      .upgrade((tx) => {
        return tx
          .table("profile")
          .toCollection()
          .modify((row: Record<string, unknown>) => {
            if (row.data != null && row.primary == null) {
              row.primary = row.data;
              delete row.data;
              row.partner = null;
              row.dependentCount = 0;
            }
          });
      });
    this.version(3)
      .stores({
        profile: "id, updatedAt",
        scenarios: "id, name, createdAt",
        insights: "id, dismissedAt",
        projectionCache: "hash, cachedAt",
      })
      .upgrade((tx) => {
        return tx.table("profile").toCollection().modify((row: ProfileRowV2) => {
          row.householdPrefs = row.householdPrefs ?? {};
        });
      });
  }
}

export const db = new OnTrackDB();
