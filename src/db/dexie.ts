import Dexie, { type Table } from "dexie";
import type { Scenario, UserProfile } from "@/engine/types";

export interface ProfileRow {
  id: "singleton";
  data: UserProfile;
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
  profile!: Table<ProfileRow, "singleton">;
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
  }
}

export const db = new OnTrackDB();
