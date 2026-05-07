import { create } from "zustand";
import type { UserProfile } from "@/engine/types";
import { makeDefaultProfile } from "@/engine/constants/defaults";
import { ProfileRepo } from "@/db/repository";

interface ProfileState {
  profile: UserProfile;
  onboardingComplete: boolean;
  loaded: boolean;
  load: () => Promise<void>;
  update: (patch: Partial<UserProfile>) => void;
  set: (next: UserProfile) => void;
  completeOnboarding: () => void;
  reset: () => Promise<void>;
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleSave(state: () => ProfileState) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const s = state();
    void ProfileRepo.save(s.profile, s.onboardingComplete);
  }, 300);
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: makeDefaultProfile(),
  onboardingComplete: false,
  loaded: false,
  load: async () => {
    const { profile, onboardingComplete } = await ProfileRepo.load();
    if (profile) set({ profile, onboardingComplete, loaded: true });
    else set({ loaded: true });
  },
  update: (patch) => {
    set((s) => ({ profile: { ...s.profile, ...patch } }));
    scheduleSave(get);
  },
  set: (next) => {
    set({ profile: next });
    scheduleSave(get);
  },
  completeOnboarding: () => {
    set({ onboardingComplete: true });
    scheduleSave(get);
  },
  reset: async () => {
    await ProfileRepo.clear();
    set({ profile: makeDefaultProfile(), onboardingComplete: false });
  },
}));
