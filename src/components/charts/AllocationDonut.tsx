import { useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { Projection, UserProfile } from "@/engine/types";
import { cn, gbp, pct } from "@/lib/utils";
import { chartTooltipContentStyle, chartTooltipWrapperStyle } from "@/lib/chart-theme";
import { useIsNarrowScreen } from "@/lib/hooks";

interface Props {
  profile: UserProfile;
  projection: Projection;
}

const COLOURS: Record<string, string> = {
  Pension: "#0f766e",
  ISA: "#d4a017",
  GIA: "#10b981",
  Cash: "#64748b",
  "Primary equity": "#1e3a8a",
  "BTL equity": "#3b82f6",
  LISA: "#a855f7",
};

export function AllocationDonut({ profile, projection }: Props) {
  const narrow = useIsNarrowScreen();
  const [view, setView] = useState<"now" | "retirement">("now");
  const target = view === "now"
    ? projection.years[0]
    : projection.years.find((y) => y.age === profile.retirementTargetAge) ??
      projection.years[0];
  if (!target) return null;
  const data = [
    { name: "Pension", value: target.pensionValue },
    { name: "ISA", value: target.isaValue + target.cashIsaValue },
    { name: "GIA", value: target.giaValue },
    { name: "Cash", value: target.cashValue },
    { name: "Primary equity", value: target.primaryEquity },
    { name: "BTL equity", value: target.btlEquity },
    { name: "LISA", value: target.lisaValue },
  ].filter((d) => d.value > 0);
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-end gap-2 mb-1">
        <button
          type="button"
          className={cn(
            "text-xs rounded-md min-h-10 min-w-[5.5rem] px-3 py-2 touch-manipulation",
            view === "now" ? "bg-secondary" : "text-muted-foreground",
          )}
          onClick={() => setView("now")}
        >
          Today
        </button>
        <button
          type="button"
          className={cn(
            "text-xs rounded-md min-h-10 min-w-[5.5rem] px-3 py-2 touch-manipulation",
            view === "retirement" ? "bg-secondary" : "text-muted-foreground",
          )}
          onClick={() => setView("retirement")}
        >
          At retirement
        </button>
      </div>
      {narrow ? (
        <p className="text-xs text-muted-foreground mb-2 md:hidden">Tap a segment for amounts.</p>
      ) : null}
      <ResponsiveContainer width="100%" height={narrow ? 240 : 220}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            cx="50%"
            cy="50%"
            innerRadius={narrow ? 48 : 55}
            outerRadius={narrow ? 82 : 88}
            paddingAngle={1}
            isAnimationActive={false}
          >
            {data.map((d) => (
              <Cell key={d.name} fill={COLOURS[d.name]} />
            ))}
          </Pie>
          <Tooltip
            trigger={narrow ? "click" : "hover"}
            wrapperStyle={chartTooltipWrapperStyle}
            contentStyle={chartTooltipContentStyle}
            formatter={(v: number, name: string) => [
              `${gbp(v)} (${pct(v / total)})`,
              name,
            ]}
          />
        </PieChart>
      </ResponsiveContainer>
      <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
        {data.map((d) => (
          <li key={d.name} className="flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: COLOURS[d.name] }}
            />
            <span className="text-muted-foreground">{d.name}</span>
            <span className="ml-auto tabular-nums">{pct(d.value / total)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
