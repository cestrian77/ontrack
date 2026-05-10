# Dual-platform engine strategy (web + native iOS)

## Decision: Option B (for now)

We are **not** introducing a shared Rust core yet. The web app keeps the TypeScript engine under [`src/engine/`](../src/engine/). The iOS app will get a **Swift port** of that engine over time.

**Why Option B first:** It ships a native SwiftUI shell and persistence immediately, without WASM/FFI toolchain and CI complexity. The main risk—numeric drift—is mitigated by **shared golden fixtures**.

**When to revisit Option A (Rust):** If tax/projection logic becomes painful to maintain twice, extract a Rust crate and compile to WASM (web) + static library (iOS). The golden JSON contract in [`fixtures/engine-goldens/`](../fixtures/engine-goldens/) is intentionally portable for that move.

## Golden contract

- **Location:** [`fixtures/engine-goldens/cases/*.json`](../fixtures/engine-goldens/cases)
- **Schema:** [`fixtures/engine-goldens/schema/engine-golden-v1.schema.json`](../fixtures/engine-goldens/schema/engine-golden-v1.schema.json)
- **Regenerate from TypeScript (after engine changes):**  
  `DUMP_ENGINE_GOLDENS=1 npx vitest run src/test/golden/engineGoldens.test.ts`
- **Swift:** [`ios/OnTrackEngine`](../ios/OnTrackEngine) implements `ProjectionEngine.runProjection` / `FireEngine.computeFire` and [`GoldenParityTests`](../ios/OnTrackEngine/Tests/OnTrackEngineTests/GoldenParityTests.swift) asserts numeric parity with the same JSON files.

`runProjection` accepts `asOfDate` and `taxYearPack` so projections are **deterministic** across platforms and CI.

## Web-first UI

Advanced **FIRE calculation** controls (income offsets, pot buckets, reference age) are implemented in the React app ([`/fire`](../src/routes/Fire.tsx), [Settings](../src/routes/Settings.tsx)). The iOS shell surfaces the same engine outputs; full preference editing may lag the web until native forms catch up.

## Tax-year pack updates (both platforms until Rust exists)

1. Add a new file under [`src/engine/constants/taxYears/`](../src/engine/constants/taxYears/) (copy the prior year and update figures from HMRC/Scottish Budget/DWP sources—see existing file headers).
2. Register the pack in [`src/engine/constants/taxYears/index.ts`](../src/engine/constants/taxYears/index.ts) `TAX_YEAR_PACKS` in chronological order.
3. Run `npm run check:tax-year` and the full test suite.
4. **iOS / Swift:** mirror the same constants in the Swift engine module when ported; until then, goldens pin `taxYearLabel` (e.g. `2026/27`) so CI catches missing updates.
5. Regenerate engine goldens if the frozen `asOfDate` falls into a different pack or outputs shift.
