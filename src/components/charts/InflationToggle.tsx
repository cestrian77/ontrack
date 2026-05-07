import { useUiStore } from "@/store/useUiStore";

export function InflationToggle() {
  const mode = useUiStore((s) => s.inflationToggle);
  const setMode = useUiStore((s) => s.setInflationToggle);
  return (
    <div className="inline-flex rounded-md border bg-card text-xs p-0.5">
      <button
        className={`px-2 py-1 rounded ${
          mode === "real" ? "bg-secondary text-foreground" : "text-muted-foreground"
        }`}
        onClick={() => setMode("real")}
      >
        Real (today's £)
      </button>
      <button
        className={`px-2 py-1 rounded ${
          mode === "nominal" ? "bg-secondary text-foreground" : "text-muted-foreground"
        }`}
        onClick={() => setMode("nominal")}
      >
        Nominal
      </button>
    </div>
  );
}
