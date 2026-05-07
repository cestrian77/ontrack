import { useId } from "react";
import { gbp, pct } from "@/lib/utils";
import type { FireMetrics } from "@/engine/types";

interface Props {
  fire: FireMetrics;
  size?: number;
}

export function FireRing({ fire, size = 200 }: Props) {
  const id = useId();
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const progress = Math.min(1, fire.fireProgressPct / 100);
  const offset = c * (1 - progress);
  const coast = Math.min(1, fire.coastFireProgressPct / 100);

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      <div
        className="relative shrink-0 mx-auto flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <svg
          width={size}
          height={size}
          className="absolute inset-0 -rotate-90 block"
          aria-hidden
        >
          <defs>
            <linearGradient id={`fireGrad-${id}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" />
              <stop offset="100%" stopColor="hsl(var(--accent))" />
            </linearGradient>
          </defs>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="hsl(var(--secondary))"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={`url(#fireGrad-${id})`}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 400ms ease" }}
          />
        </svg>
        <div className="relative z-10 flex flex-col items-center justify-center text-center pointer-events-none px-2 max-w-[min(200px,100%)]">
          <div className="text-3xl font-semibold tabular-nums leading-tight">
            {pct(progress)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {gbp(fire.investableNow)} / {gbp(fire.fireNumber)}
          </div>
        </div>
      </div>

      <div className="w-full max-w-[260px] space-y-2 pt-1 border-t border-border">
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground">Coast FIRE</span>
            <span
              className={
                fire.coastReached ? "text-success" : "text-muted-foreground"
              }
            >
              {fire.coastReached ? "Reached" : pct(coast)}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
            <div
              className={`h-full ${fire.coastReached ? "bg-success" : "bg-primary"}`}
              style={{ width: `${Math.min(100, coast * 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
