import type { UserProfile } from "@/engine/types";

export interface OnboardingStepMeta {
  to: string;
  label: string;
}

export function buildOnboardingSteps(
  profile: UserProfile,
  partnerProfile: UserProfile | null,
): OnboardingStepMeta[] {
  const includePartner = Boolean(profile.partnered && partnerProfile);
  const primary: OnboardingStepMeta[] = [
    { to: "you", label: "You" },
    { to: "pensions", label: "Pensions" },
    { to: "isa", label: "ISA & Investments" },
    { to: "property", label: "Property" },
    { to: "btl", label: "BTL" },
  ];
  const partner: OnboardingStepMeta[] = includePartner
    ? [
        { to: "partner-you", label: "Partner" },
        { to: "partner-pensions", label: "Partner pensions" },
        { to: "partner-isa", label: "Partner ISAs" },
      ]
    : [];
  return [...primary, ...partner, { to: "review", label: "Review" }];
}
