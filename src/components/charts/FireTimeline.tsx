import type { FireMetrics, UserProfile } from "@/engine/types";
import { ageFromDob } from "@/engine/project/runProjection";

interface Props {
  profile: UserProfile;
  fire: FireMetrics;
}

export function FireTimeline({ profile, fire }: Props) {
  const today = ageFromDob(profile.dateOfBirth);
  const horizon = profile.retirementTargetAge;
  const range = Math.max(1, horizon - today);
  const points = [
    { label: "Today", age: today, sub: "now" },
    { label: "Coast FIRE", age: fire.coastReached ? today : Math.min(horizon, today + Math.round(range * 0.5)), sub: fire.coastReached ? "Reached" : "estimate" },
    { label: "FIRE", age: fire.fireAge ?? horizon, sub: fire.fireAge ? `age ${fire.fireAge}` : "—" },
    { label: "Retirement target", age: horizon, sub: `age ${horizon}` },
  ];
  return (
    <div className="relative pt-3 pb-1">
      <div className="absolute left-0 right-0 top-7 h-px bg-border" />
      <div className="grid grid-cols-4 gap-2">
        {points.map((p) => {
          const offset = ((p.age - today) / Math.max(1, horizon - today)) * 100;
          return (
            <div key={p.label} className="flex flex-col items-center text-center">
              <div className="relative w-full">
                <div
                  className="absolute -top-1 h-3 w-3 -translate-x-1/2 rounded-full border-2 border-primary bg-background"
                  style={{ left: `${Math.max(0, Math.min(100, offset))}%` }}
                />
              </div>
              <div className="mt-4 text-xs font-medium">{p.label}</div>
              <div className="text-[10px] text-muted-foreground">{p.sub}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
