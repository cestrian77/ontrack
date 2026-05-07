import { useMemo } from "react";
import type { Projection, UserProfile } from "@/engine/types";
import { gbp } from "@/lib/utils";

interface Props {
  profile: UserProfile;
  projection: Projection;
}

interface Bar {
  label: string;
  value: number;
  cumulative: number;
  colour: string;
  isTotal?: boolean;
}

/** Custom waterfall: builds retirement-age investable wealth bar-by-bar (PRD Chart 4). */
export function Waterfall({ profile, projection }: Props) {
  const bars: Bar[] = useMemo(() => {
    const start = projection.years[0];
    const atRet = projection.years.find((y) => y.age === profile.retirementTargetAge);
    if (!start || !atRet) return [];
    const startingPot =
      start.pensionValue + start.isaValue + start.giaValue + start.lisaValue;

    const totalContribPension = (atRet.pensionValue - start.pensionValue) * 0.5;
    const totalContribIsa = (atRet.isaValue - start.isaValue) * 0.5;
    const growthPension = atRet.pensionValue - start.pensionValue - totalContribPension;
    const growthIsa = atRet.isaValue - start.isaValue - totalContribIsa;
    const btlEquity = atRet.btlEquity;
    const spValue = atRet.statePensionIncome * 20;
    const total = atRet.investableNetWorth + btlEquity + spValue;

    let cum = 0;
    const seq: Bar[] = [
      { label: "Starting pot", value: startingPot, cumulative: (cum += startingPot), colour: "#64748b" },
      { label: "Pension contribs", value: totalContribPension, cumulative: (cum += totalContribPension), colour: "#0f766e" },
      { label: "ISA contribs", value: totalContribIsa, cumulative: (cum += totalContribIsa), colour: "#d4a017" },
      { label: "Pension growth", value: growthPension, cumulative: (cum += growthPension), colour: "#14b8a6" },
      { label: "ISA growth", value: growthIsa, cumulative: (cum += growthIsa), colour: "#f59e0b" },
      { label: "BTL equity", value: btlEquity, cumulative: (cum += btlEquity), colour: "#3b82f6" },
      { label: "SP value", value: spValue, cumulative: (cum += spValue), colour: "#a855f7" },
      { label: "Total", value: total, cumulative: total, colour: "#0f766e", isTotal: true },
    ];
    return seq;
  }, [profile, projection]);

  const maxVal = Math.max(...bars.map((b) => b.cumulative), 1);

  return (
    <div className="space-y-2">
      {bars.map((b) => {
        const widthPct = (Math.max(0, b.isTotal ? b.cumulative : b.value) / maxVal) * 100;
        const offsetPct = b.isTotal ? 0 : ((b.cumulative - b.value) / maxVal) * 100;
        return (
          <div key={b.label} className="flex items-center gap-3 text-xs">
            <div className="w-32 shrink-0 text-muted-foreground">{b.label}</div>
            <div className="relative h-7 flex-1 rounded-md bg-secondary/50 overflow-hidden">
              <div
                className="absolute top-0 h-full rounded-md transition-all"
                style={{
                  left: `${offsetPct}%`,
                  width: `${widthPct}%`,
                  background: b.colour,
                  opacity: b.isTotal ? 0.95 : 0.9,
                }}
              />
            </div>
            <div className="w-24 text-right tabular-nums font-medium">
              {gbp(b.value)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
