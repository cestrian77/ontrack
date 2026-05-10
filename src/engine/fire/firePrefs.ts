import type { FireCalculationPrefs, ProjectionYear } from "@/engine/types";

export const DEFAULT_FIRE_CALCULATION_PREFS: FireCalculationPrefs = {
  offsetStatePension: false,
  offsetDbPension: false,
  offsetBtlNet: false,
  referenceAgeMode: "at_retirement",
  includePensionInPot: true,
  includeSsIsaInPot: true,
  includeCashIsaInPot: true,
  includeLisaInPot: true,
  includeGiaInPot: true,
  includeCashInPot: true,
};

export function mergeFireCalculationPrefs(
  partial?: Partial<FireCalculationPrefs>,
): FireCalculationPrefs {
  return { ...DEFAULT_FIRE_CALCULATION_PREFS, ...partial };
}

export function passiveIncomeOnYear(
  y: ProjectionYear,
  prefs: FireCalculationPrefs,
): number {
  let s = 0;
  if (prefs.offsetStatePension) s += y.statePensionIncome;
  if (prefs.offsetDbPension) s += y.dbIncome;
  if (prefs.offsetBtlNet) s += Math.max(0, y.btlCashflowNet);
  return s;
}

export function firePotForYear(
  y: ProjectionYear,
  prefs: FireCalculationPrefs,
): number {
  let t = 0;
  if (prefs.includePensionInPot) t += y.pensionValue;
  if (prefs.includeSsIsaInPot) t += y.isaValue;
  if (prefs.includeCashIsaInPot) t += y.cashIsaValue;
  if (prefs.includeLisaInPot) t += y.lisaValue;
  if (prefs.includeGiaInPot) t += y.giaValue;
  if (prefs.includeCashInPot) t += y.cashValue;
  return t;
}

export function fireUsesPotFilters(prefs: FireCalculationPrefs): boolean {
  return (
    !prefs.includePensionInPot ||
    !prefs.includeSsIsaInPot ||
    !prefs.includeCashIsaInPot ||
    !prefs.includeLisaInPot ||
    !prefs.includeGiaInPot ||
    !prefs.includeCashInPot
  );
}

export function fireUsesIncomeOffsets(prefs: FireCalculationPrefs): boolean {
  return (
    prefs.offsetStatePension || prefs.offsetDbPension || prefs.offsetBtlNet
  );
}

/** True when any pref differs from web defaults (used to expand FIRE UI by default). */
export function isNonDefaultFireCalculationPrefs(
  partial?: Partial<FireCalculationPrefs>,
): boolean {
  const p = mergeFireCalculationPrefs(partial);
  const d = DEFAULT_FIRE_CALCULATION_PREFS;
  return (
    p.offsetStatePension !== d.offsetStatePension ||
    p.offsetDbPension !== d.offsetDbPension ||
    p.offsetBtlNet !== d.offsetBtlNet ||
    p.referenceAgeMode !== d.referenceAgeMode ||
    p.includePensionInPot !== d.includePensionInPot ||
    p.includeSsIsaInPot !== d.includeSsIsaInPot ||
    p.includeCashIsaInPot !== d.includeCashIsaInPot ||
    p.includeLisaInPot !== d.includeLisaInPot ||
    p.includeGiaInPot !== d.includeGiaInPot ||
    p.includeCashInPot !== d.includeCashInPot
  );
}
