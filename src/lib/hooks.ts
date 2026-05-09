import { useEffect, useMemo, useState } from "react";
import type { FireMetrics, Projection, UserProfile } from "@/engine/types";
import { runProjection } from "@/engine/project/runProjection";
import { computeFire } from "@/engine/fire/fire";
import { generateInsights } from "@/engine/insights/insights";
import { useProfileStore } from "@/store/useProfileStore";
import { useUiStore } from "@/store/useUiStore";
import { baseTaxYearPack } from "@/lib/taxYearContext";
import { InsightRepo } from "@/db/repository";
import type { TaxYearPack } from "@/engine/constants/taxYears";

export function useDebounced<T>(value: T, ms = 300): T {
  const [d, setD] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setD(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return d;
}

export function useProjection(profile?: UserProfile): {
  projection: Projection;
  fire: FireMetrics;
  taxYearPack: TaxYearPack;
} {
  const stored = useProfileStore((s) => s.profile);
  const analysisTaxYearLabel = useUiStore((s) => s.analysisTaxYearLabel);
  const p = profile ?? stored;
  const debounced = useDebounced(p, 300);
  const taxYearPack = useMemo(
    () => baseTaxYearPack(analysisTaxYearLabel),
    [analysisTaxYearLabel],
  );
  return useMemo(() => {
    const projection = runProjection(debounced, { taxYearPack });
    const fire = computeFire(debounced, projection, taxYearPack);
    return { projection, fire, taxYearPack };
  }, [debounced, taxYearPack]);
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
  const { projection, fire, taxYearPack } = useProjection();
  const profile = useProfileStore((s) => s.profile);
  const all = useMemo(
    () => generateInsights({ profile, projection, fire, taxYearPack }),
    [profile, projection, fire, taxYearPack],
  );
  return { all, projection, fire, taxYearPack };
}
