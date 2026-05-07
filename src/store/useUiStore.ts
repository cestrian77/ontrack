import { create } from "zustand";

interface UiState {
  inflationToggle: "real" | "nominal";
  setInflationToggle: (v: "real" | "nominal") => void;
  selectedScenarioIds: string[];
  toggleScenario: (id: string) => void;
  /** Add to selection if not selected and fewer than 3 slots (e.g. newly created scenario). */
  trySelectScenario: (id: string) => void;
  removeScenarioFromSelection: (id: string) => void;
}

export const useUiStore = create<UiState>((set, get) => ({
  inflationToggle: "real",
  setInflationToggle: (v) => set({ inflationToggle: v }),
  selectedScenarioIds: [],
  toggleScenario: (id) => {
    const cur = get().selectedScenarioIds;
    set({
      selectedScenarioIds: cur.includes(id)
        ? cur.filter((x) => x !== id)
        : [...cur, id].slice(0, 3),
    });
  },
  trySelectScenario: (id) => {
    const cur = get().selectedScenarioIds;
    if (cur.includes(id) || cur.length >= 3) return;
    set({ selectedScenarioIds: [...cur, id] });
  },
  removeScenarioFromSelection: (id) =>
    set({
      selectedScenarioIds: get().selectedScenarioIds.filter((x) => x !== id),
    }),
}));
