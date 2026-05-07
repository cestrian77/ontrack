import type { Projection, UserProfile } from "@/engine/types";

export interface IsaBridge {
  required: boolean;
  bridgeYears: number;
  isaAtRetirement: number;
  needed: number;
  shortfall: number; // negative if surplus
}

/**
 * ISA Bridge analysis (PRD §5.9.2).
 * If retiring before NMPA, bridge income gap with ISA from retirement to NMPA.
 */
export function isaBridge(
  profile: UserProfile,
  projection: Projection,
): IsaBridge {
  const { retirementAge, nmpa } = projection.meta;
  if (retirementAge >= nmpa) {
    return {
      required: false,
      bridgeYears: 0,
      isaAtRetirement: 0,
      needed: 0,
      shortfall: 0,
    };
  }
  const bridgeYears = nmpa - retirementAge;
  const atRetire = projection.years.find((y) => y.age === retirementAge);
  const isaAtRetirement = atRetire ? atRetire.isaValue + atRetire.cashIsaValue : 0;
  const needed = profile.targetRetirementIncome * bridgeYears;
  return {
    required: true,
    bridgeYears,
    isaAtRetirement,
    needed,
    shortfall: needed - isaAtRetirement,
  };
}
