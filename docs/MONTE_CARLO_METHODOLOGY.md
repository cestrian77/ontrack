# Monte Carlo methodology (OnTrack)

## Engine

- One canonical annual step: `runProjection` with an injected `EconomicScenario`.
- Each trial samples nominal returns per asset class (pension, ISA, GIA, cash) using product-default volatilities (editable in Stress test settings).
- Inflation is sampled with a fraction of cash volatility.
- **Property / BTL** appreciation and rent paths follow profile assumptions (not stochastic), matching deterministic mode.

## Success

Default: every retirement year until the user’s **planning horizon age** funds spending without material unmet need (`unmetSpending` &gt; £1).

- **Household:** compared against `householdRetirementIncome` when set; otherwise sum of person targets.
- **Flexible spending:** optional “essential only” success when `flexibleSpending` is on the profile.

## Reproducibility

Seeded `mulberry32` PRNG. Set **Monte Carlo seed** under Settings → Stress test defaults.

## Limits

- Annual time step (no monthly sequence-of-returns).
- Drawdown tax: legacy strategy by default; `tax_aware` on profile for gross-up heuristic.
- Not financial advice — illustrative planning only.
