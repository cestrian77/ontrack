import { CheckCircle2, Info, Sparkles, TriangleAlert, X } from "lucide-react";
import type { Insight } from "@/engine/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

interface Props {
  insight: Insight;
  onDismiss?: (id: string) => void;
}

const ICON: Record<Insight["severity"], React.ComponentType<{ className?: string }>> = {
  positive: CheckCircle2,
  info: Info,
  warning: TriangleAlert,
  negative: TriangleAlert,
};

const STYLE: Record<Insight["severity"], string> = {
  positive: "border-success/40 bg-success/10",
  info: "border-border bg-card",
  warning: "border-warning/40 bg-warning/10",
  negative: "border-destructive/40 bg-destructive/10",
};

export function InsightCard({ insight, onDismiss }: Props) {
  const Icon = ICON[insight.severity];
  return (
    <div
      className={cn(
        "rounded-lg border p-4 flex gap-3 animate-fade-in",
        STYLE[insight.severity],
      )}
    >
      <Icon
        className={cn(
          "h-5 w-5 mt-0.5 shrink-0",
          insight.severity === "positive" && "text-success",
          insight.severity === "warning" && "text-warning",
          insight.severity === "negative" && "text-destructive",
          insight.severity === "info" && "text-muted-foreground",
        )}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="font-semibold text-sm">{insight.title}</div>
          {onDismiss && (
            <button
              aria-label="Dismiss"
              onClick={() => onDismiss(insight.id)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-1">{insight.body}</p>
        {insight.actionRoute && (
          <Button
            asChild
            variant="link"
            className="h-auto p-0 text-xs mt-2"
          >
            <Link to={insight.actionRoute}>
              <Sparkles className="h-3 w-3" /> Explore
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
