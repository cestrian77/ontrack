import { create } from "zustand";
import type { HouseholdPrefs, UserProfile } from "@/engine/types";
import { DEFAULT_MONTE_CARLO_VOLATILITY } from "@/engine/montecarlo/defaults";
import { makeDefaultProfile } from "@/engine/constants/defaults";
import { ProfileRepo } from "@/db/repository";

interface ProfileState {
  /** Primary account holder (your) profile. */
  profile: UserProfile;
  partnerProfile: UserProfile | null;
  dependentCount: number;
  householdPrefs: HouseholdPrefs;
  onboardingComplete: boolean;
  loaded: boolean;
  load: () => Promise<void>;
  update: (patch: Partial<UserProfile>) => void;
  updatePartner: (patch: Partial<UserProfile>) => void;
  setPartnerProfile: (next: UserProfile | null) => void;
  set: (next: UserProfile) => void;
  setDependentCount: (n: number) => void;
  updateHouseholdPrefs: (patch: Partial<HouseholdPrefs>) => void;
  completeOnboarding: () => void;
  reset: () => Promise<void>;
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleSave(state: () => ProfileState) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const s = state();
    void ProfileRepo.save({
      profile: s.profile,
      partnerProfile: s.partnerProfile,
      dependentCount: s.dependentCount,
      householdPrefs: s.householdPrefs,
      onboardingComplete: s.onboardingComplete,
    });
  }, 300);
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: makeDefaultProfile(),
  partnerProfile: null,
  dependentCount: 0,
  householdPrefs: {
    planningHorizonAge: 100,
    monteCarloTrials: 1000,
    monteCarloSeed: null,
    successUsesEssentialOnly: false,
    householdRetirementIncome: null,
    monteCarloVolatility: DEFAULT_MONTE_CARLO_VOLATILITY,
  },
  onboardingComplete: false,
  loaded: false,
  load: async () => {
    const row = await ProfileRepo.load();
    if (row.profile) {
      set({
        profile: row.profile,
        partnerProfile: row.partnerProfile,
        dependentCount: row.dependentCount,
        householdPrefs: row.householdPrefs,
        onboardingComplete: row.onboardingComplete,
        loaded: true,
      });
    } else set({ loaded: true });
  },
  update: (patch) => {
    set((s) => ({ profile: { ...s.profile, ...patch } }));
    scheduleSave(get);
  },
  updatePartner: (patch) => {
    set((s) => {
      if (!s.partnerProfile) return s;
      return { partnerProfile: { ...s.partnerProfile, ...patch } };
    });
    scheduleSave(get);
  },
  setPartnerProfile: (next) => {
    set({ partnerProfile: next });
    scheduleSave(get);
  },
  set: (next) => {
    set({ profile: next });
    scheduleSave(get);
  },
  setDependentCount: (n) => {
    set({ dependentCount: Math.max(0, Math.round(n)) });
    scheduleSave(get);
  },
  updateHouseholdPrefs: (patch) => {
    set((s) => ({ householdPrefs: { ...s.householdPrefs, ...patch } }));
    scheduleSave(get);
  },
  completeOnboarding: () => {
    set({ onboardingComplete: true });
    scheduleSave(get);
  },
  reset: async () => {
    await ProfileRepo.clear();
    set({
      profile: makeDefaultProfile(),
      partnerProfile: null,
      dependentCount: 0,
      householdPrefs: {
        planningHorizonAge: 100,
        monteCarloTrials: 1000,
        monteCarloSeed: null,
        successUsesEssentialOnly: false,
        householdRetirementIncome: null,
        monteCarloVolatility: DEFAULT_MONTE_CARLO_VOLATILITY,
      },
      onboardingComplete: false,
    });
  },
}));
