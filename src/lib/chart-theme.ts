import type { CSSProperties } from "react";

/** Solid tooltip surface for Recharts (requires `--popover` / `--popover-foreground` in CSS). */
export const chartTooltipContentStyle: CSSProperties = {
  background: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 8,
  fontSize: 12,
  opacity: 1,
  color: "hsl(var(--popover-foreground))",
};

export const chartTooltipWrapperStyle: CSSProperties = {
  opacity: 1,
  outline: "none",
};
