# Historical backtest methodology

OnTrack replays an illustrative UK-blended nominal return series (`src/engine/historical/data.ts`, version `uk-blend-v1`) through the same `runProjection` loop used for deterministic planning.

- Returns apply to pension, ISA, and GIA buckets; cash uses the series cash leg.
- Property and BTL appreciation remain profile-driven (not historical).
- One path is shown in Stress test → Historical backtest (not a distribution).

Source data is simplified for education; verify against primary sources before relying on results.
