import { create } from "zustand";
import type { Scenario } from "@/engine/types";
import { ScenarioRepo } from "@/db/repository";

interface ScenarioState {
  scenarios: Scenario[];
  loaded: boolean;
  load: () => Promise<void>;
  upsert: (s: Scenario) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useScenarioStore = create<ScenarioState>((set, get) => ({
  scenarios: [],
  loaded: false,
  load: async () => {
    const list = await ScenarioRepo.list();
    set({ scenarios: list, loaded: true });
  },
  upsert: async (s) => {
    await ScenarioRepo.upsert(s);
    await get().load();
  },
  remove: async (id) => {
    await ScenarioRepo.remove(id);
    await get().load();
  },
}));
