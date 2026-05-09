import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProfileStore } from "@/store/useProfileStore";
import { useUiStore } from "@/store/useUiStore";
import type { AnalysisViewMode } from "@/engine/household/semantics";

export function AnalysisViewSwitch() {
  const partner = useProfileStore((s) => s.partnerProfile);
  const dependentCount = useProfileStore((s) => s.dependentCount);
  const mode = useUiStore((s) => s.analysisViewMode);
  const setMode = useUiStore((s) => s.setAnalysisViewMode);
  const activePersonId = useUiStore((s) => s.activePersonId);
  const setActivePersonId = useUiStore((s) => s.setActivePersonId);

  const canHousehold = partner !== null;

  const onMode = (v: AnalysisViewMode) => {
    if ((v === "couple" || v === "family") && !canHousehold) return;
    setMode(v);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={mode} onValueChange={(v) => onMode(v as AnalysisViewMode)}>
        <SelectTrigger className="h-8 w-[140px] text-xs" aria-label="Analysis view">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="individual">Individual</SelectItem>
          <SelectItem value="couple" disabled={!canHousehold}>
            Couple{!canHousehold ? " (add partner)" : ""}
          </SelectItem>
          <SelectItem value="family" disabled={!canHousehold}>
            Family{!canHousehold ? " (add partner)" : ""}
          </SelectItem>
        </SelectContent>
      </Select>
      {mode === "individual" && (
        <Select
          value={activePersonId}
          onValueChange={(v) =>
            setActivePersonId(v as "primary" | "partner")
          }
        >
          <SelectTrigger
            className="h-8 w-[120px] text-xs"
            aria-label="Whose finances"
            disabled={!canHousehold}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="primary">You</SelectItem>
            <SelectItem value="partner" disabled={!canHousehold}>
              Partner
            </SelectItem>
          </SelectContent>
        </Select>
      )}
      {mode === "family" && dependentCount > 0 && (
        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
          {dependentCount} dependent{dependentCount === 1 ? "" : "s"} (context only)
        </span>
      )}
    </div>
  );
}
