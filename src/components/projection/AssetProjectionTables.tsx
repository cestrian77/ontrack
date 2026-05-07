import type { Projection } from "@/engine/types";
import { gbp } from "@/lib/utils";
import { PROJECTION_ASSET_LAYERS } from "@/lib/projection-assets";
import { useUiStore } from "@/store/useUiStore";

interface Props {
  projection: Projection;
  cpi: number;
}

export function AssetProjectionTables({ projection, cpi }: Props) {
  const mode = useUiStore((s) => s.inflationToggle);

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Expand each asset to see balances by age. Amounts follow your{" "}
        <span className="text-foreground">Real / Nominal</span> toggle (same as Wealth journey).
      </p>
      <div className="space-y-2">
        {PROJECTION_ASSET_LAYERS.map(({ key, label }) => (
          <details
            key={key}
            className="rounded-lg border bg-card text-card-foreground overflow-hidden"
          >
            <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium flex items-center justify-between gap-2 hover:bg-secondary/40 [&::-webkit-details-marker]:hidden">
              <span>{label}</span>
              <span className="text-muted-foreground text-xs font-normal tabular-nums">
                {projection.years.length} rows
              </span>
            </summary>
            <div className="border-t max-h-64 overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-card z-[1] border-b">
                  <tr>
                    <th className="text-left py-2 px-4 font-medium text-muted-foreground">
                      Age
                    </th>
                    <th className="text-left py-2 px-4 font-medium text-muted-foreground">
                      Year
                    </th>
                    <th className="text-right py-2 px-4 font-medium text-muted-foreground">
                      Value
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {projection.years.map((row, i) => {
                    const factor =
                      mode === "nominal" ? Math.pow(1 + cpi, i) : 1;
                    const raw = row[key] as number;
                    const value = raw * factor;
                    return (
                      <tr key={`${row.age}-${row.year}`} className="border-b border-border/60 last:border-0">
                        <td className="py-1.5 px-4 tabular-nums">{row.age}</td>
                        <td className="py-1.5 px-4 tabular-nums">{row.year}</td>
                        <td className="py-1.5 px-4 text-right tabular-nums font-medium">
                          {gbp(value)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
