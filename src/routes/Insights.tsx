import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDismissedInsights, useProjection } from "@/lib/hooks";
import { generateInsights } from "@/engine/insights/insights";
import { InsightCard } from "@/components/insights/InsightCard";
import { InsightRepo } from "@/db/repository";

export default function Insights() {
  const {
    projection,
    fire,
    taxYearPack,
    analysisProfile,
    primaryProfile,
    partnerProfile,
    partnerProjection,
  } = useProjection();
  const { dismissed, reload } = useDismissedInsights();

  const all = useMemo(
    () =>
      generateInsights({
        profile: analysisProfile,
        projection,
        fire,
        taxYearPack,
        primaryProfile,
        partnerProfile,
        partnerProjection,
      }),
    [
      analysisProfile,
      projection,
      fire,
      taxYearPack,
      primaryProfile,
      partnerProfile,
      partnerProjection,
    ],
  );
  const active = all.filter((i) => !dismissed.has(i.id));
  const hidden = all.filter((i) => dismissed.has(i.id));

  const dismiss = async (id: string) => {
    await InsightRepo.dismiss(id);
    await reload();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Insights</CardTitle>
          <p className="text-xs text-muted-foreground">
            Rule-based, prioritised by financial impact. Dismissed insights re-appear after 30 days.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {active.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No active insights right now. Try changing inputs in Settings to see how the model responds.
            </p>
          )}
          {active.map((i) => (
            <InsightCard key={i.id} insight={i} onDismiss={dismiss} />
          ))}
        </CardContent>
      </Card>

      {hidden.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Recently dismissed</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {hidden.map((i) => (
              <InsightCard key={i.id} insight={i} />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
