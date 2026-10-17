import type { DrawdownStrategyId } from "./types";
import { legacyDrawdownStrategy } from "./legacy";
import { taxAwareDrawdownStrategy } from "./taxAware";

export function getDrawdownStrategy(id: DrawdownStrategyId = "legacy") {
  return id === "tax_aware" ? taxAwareDrawdownStrategy : legacyDrawdownStrategy;
}

export * from "./types";
export { legacyDrawdownStrategy, taxAwareDrawdownStrategy };
