import { create } from "zustand";
import type { UserProfile } from "@/engine/types";
import { makeDefaultProfile } from "@/engine/constants/defaults";
import { ProfileRepo } from "@/db/repository";

interface ProfileState {
  /** Primary account holder (your) profile. */
  profile: UserProfile;
  partnerProfile: UserProfile | null;
  dependentCount: number;
  onboardingComplete: boolean;
  loaded: boolean;
  load: () => Promise<void>;
  update: (patch: Partial<UserProfile>) => void;
  updatePartner: (patch: Partial<UserProfile>) => void;
  setPartnerProfile: (next: UserProfile | null) => void;
  set: (next: UserProfile) => void;
  setDependentCount: (n: number) => void;
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
      onboardingComplete: s.onboardingComplete,
    });
  }, 300);
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: makeDefaultProfile(),
  partnerProfile: null,
  dependentCount: 0,
  onboardingComplete: false,
  loaded: false,
  load: async () => {
    const row = await ProfileRepo.load();
    if (row.profile) {
      set({
        profile: row.profile,
        partnerProfile: row.partnerProfile,
        dependentCount: row.dependentCount,
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
      onboardingComplete: false,
    });
  },
}));
