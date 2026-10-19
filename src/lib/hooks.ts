import { useEffect, useMemo, useState } from "react";
import type { FireMetrics, Projection, UserProfile } from "@/engine/types";
import { runProjection } from "@/engine/project/runProjection";
import { computeFire } from "@/engine/fire/fire";
import { computeHouseholdFire } from "@/engine/fire/householdFire";
import { combineProjections } from "@/engine/household/combineProjections";
import { buildHouseholdSyntheticProfile } from "@/engine/household/syntheticProfile";
import { generateInsights } from "@/engine/insights/insights";
import { useProfileStore } from "@/store/useProfileStore";
import { useUiStore } from "@/store/useUiStore";
import { baseTaxYearPack } from "@/lib/taxYearContext";
import { InsightRepo } from "@/db/repository";
import type { TaxYearPack } from "@/engine/constants/taxYears";
import type { AnalysisViewMode } from "@/engine/household/semantics";
export function useDebounced<T>(value: T, ms = 300): T {
  const [d, setD] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setD(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return d;
}

export function useProjection(profileOverride?: UserProfile): {
  projection: Projection;
  fire: FireMetrics;
  taxYearPack: TaxYearPack;
  /** Profile for chart labels, retirement lines, and insights (synthetic when household). */
  analysisProfile: UserProfile;
  /** Primary holder profile (always the saved primary, not synthetic). */
  primaryProfile: UserProfile;
  partnerProfile: UserProfile | null;
  partnerProjection: Projection | null;
  analysisViewMode: AnalysisViewMode;
  isHouseholdAnalysis: boolean;
} {
  const primary = useProfileStore((s) => s.profile);
  const partner = useProfileStore((s) => s.partnerProfile);
  const householdPrefs = useProfileStore((s) => s.householdPrefs);
  const analysisTaxYearLabel = useUiStore((s) => s.analysisTaxYearLabel);
  const analysisViewMode = useUiStore((s) => s.analysisViewMode);
  const activePersonId = useUiStore((s) => s.activePersonId);

  const effPrimary = profileOverride ?? primary;
  const debouncedEffPrimary = useDebounced(effPrimary, 300);
  const debouncedPartner = useDebounced(partner, 300);

  const taxYearPack = useMemo(
    () => baseTaxYearPack(analysisTaxYearLabel),
    [analysisTaxYearLabel],
  );

  return useMemo(() => {
    const prim = debouncedEffPrimary;
    const part = debouncedPartner;
    const canHousehold =
      (analysisViewMode === "couple" || analysisViewMode === "family") &&
      part !== null;

    const planningHorizonAge = householdPrefs.planningHorizonAge ?? 100;
    const runOpts = {
      taxYearPack,
      planningHorizonAge,
      freezeTaxYearPack: analysisTaxYearLabel != null,
    };

    if (canHousehold) {
      const projA = runProjection(prim, runOpts);
      const projB = runProjection(part, runOpts);
      const projection = combineProjections(projA, projB, {
        primary: prim,
        partner: part,
      });
      const fire = computeHouseholdFire(prim, part, projection, taxYearPack);
      const analysisProfile = buildHouseholdSyntheticProfile(prim, part, householdPrefs);
      return {
        projection,
        fire,
        taxYearPack,
        analysisProfile,
        primaryProfile: prim,
        partnerProfile: part,
        partnerProjection: projB,
        analysisViewMode,
        isHouseholdAnalysis: true,
      };
    }

    const single =
      activePersonId === "partner" && part ? part : prim;
    const projection = runProjection(single, runOpts);
    const fire = computeFire(single, projection, taxYearPack);
    return {
      projection,
      fire,
      taxYearPack,
      analysisProfile: single,
      primaryProfile: prim,
      partnerProfile: part,
      partnerProjection: null,
      analysisViewMode,
      isHouseholdAnalysis: false,
    };
  }, [
    debouncedEffPrimary,
    debouncedPartner,
    taxYearPack,
    analysisViewMode,
    activePersonId,
    householdPrefs,
  ]);
}

export function useDismissedInsights(): {
  dismissed: Set<string>;
  reload: () => Promise<void>;
} {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const reload = async () => {
    setDismissed(await InsightRepo.dismissed());
  };
  useEffect(() => {
    void reload();
  }, []);
  return { dismissed, reload };
}

export function useInsights() {
  const { projection, fire, taxYearPack, analysisProfile } = useProjection();
  const all = useMemo(
    () => generateInsights({ profile: analysisProfile, projection, fire, taxYearPack }),
    [analysisProfile, projection, fire, taxYearPack],
  );
  return { all, projection, fire, taxYearPack, analysisProfile };
}

const NARROW_CHART_MQ = "(max-width: 767px)";

/** Small screens / phones: chart density, tap tooltips, taller plot areas. */
export function useIsNarrowScreen(): boolean {
  const [narrow, setNarrow] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(NARROW_CHART_MQ).matches : false,
  );
  useEffect(() => {
    const m = window.matchMedia(NARROW_CHART_MQ);
    const onChange = () => setNarrow(m.matches);
    onChange();
    m.addEventListener("change", onChange);
    return () => m.removeEventListener("change", onChange);
  }, []);
  return narrow;
}
