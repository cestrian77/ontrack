import { create } from "zustand";
import type { AnalysisViewMode } from "@/engine/household/semantics";

export type AnalysisPersonId = "primary" | "partner";

interface UiState {
  inflationToggle: "real" | "nominal";
  setInflationToggle: (v: "real" | "nominal") => void;
  /** When null, tax/projection use the UK tax year for today's calendar date. */
  analysisTaxYearLabel: string | null;
  setAnalysisTaxYearLabel: (v: string | null) => void;
  analysisViewMode: AnalysisViewMode;
  setAnalysisViewMode: (v: AnalysisViewMode) => void;
  /** Whose detail forms and individual analysis use (primary vs partner). */
  activePersonId: AnalysisPersonId;
  setActivePersonId: (v: AnalysisPersonId) => void;
  selectedScenarioIds: string[];
  toggleScenario: (id: string) => void;
  /** Add to selection if not selected and fewer than 3 slots (e.g. newly created scenario). */
  trySelectScenario: (id: string) => void;
  removeScenarioFromSelection: (id: string) => void;
}

export const useUiStore = create<UiState>((set, get) => ({
  inflationToggle: "real",
  setInflationToggle: (v) => set({ inflationToggle: v }),
  analysisTaxYearLabel: null,
  setAnalysisTaxYearLabel: (v) => set({ analysisTaxYearLabel: v }),
  analysisViewMode: "individual",
  setAnalysisViewMode: (v) => set({ analysisViewMode: v }),
  activePersonId: "primary",
  setActivePersonId: (v) => set({ activePersonId: v }),
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
