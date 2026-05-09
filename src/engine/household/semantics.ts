/**
 * Phase-1 household / couple semantics (UK planner).
 *
 * - Tax: per-person projections only; combined view sums cashflows and balances.
 *   No marriage allowance, transferable allowances, or joint tax filing.
 * - Primary residence: counted once — enter the shared home on the primary profile;
 *   partner profile should keep primary property fields at zero (defaults do this).
 * - BTL: enter each landlord's sole BTL on that person; avoid duplicating the same
 *   joint BTL on both profiles.
 * - FIRE (household): target income = sum of each person's target retirement income;
 *   SWR and lean/fat/coast use primary's rates on that combined target; progress uses
 *   combined investable net worth from the merged projection.
 * - Horizon: merged series length = min(lengthA, lengthB); same calendar year per index.
 */

export type AnalysisViewMode = "individual" | "couple" | "family";

export const HOUSEHOLD_VIEW_FOOTNOTE =
  "Household view is an indicative merge of two projections. It is not joint tax advice; enter one shared primary home on the primary profile only.";
