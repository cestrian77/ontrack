# OnTrack v2 — Architecture (Phase 0)

**Status:** Draft for review — no Phase 1 implementation until approved.  
**Date:** 2026-08-13  
**Scope:** Architecture audit of the existing TypeScript engine and dual-platform (Swift) parity contract.

---

## 1. Executive verdict

`runProjection` **can** become the canonical financial year-step used by deterministic, historical, Monte Carlo, scenario, and optimiser layers — **if** we generalise three seams **before** building those layers:

1. **Economic assumptions per year** (constant today → `EconomicScenario` later).
2. **Drawdown as a pluggable strategy** (hard-coded ISA→pension→GIA→cash today).
3. **Timeline effects as events** (inheritance + scenario property sales today; not a general model).

Do **not** fork three engines. Do **not** rewrite tax/BTL/mortgage/wrapper helpers. Prefer thin adapters around the existing annual loop.

The current household model is already a **post-merge of two person projections**. That direction is correct for UK tax (per person). Deep household drawdown / shared spending should build on that, not replace it with a single blended taxpayer.

---

## 2. Current architecture

### 2.1 Stack and boundaries

| Layer | Location | Role |
| --- | --- | --- |
| Domain types | `src/engine/types.ts` | `UserProfile`, `Projection`, `Scenario`, FIRE prefs |
| Constants | `src/engine/constants/` | Defaults, UK facade, frozen `taxYears/*` packs |
| Pure tax / NI / CGT / dividends | `src/engine/tax/` | Used by BTL, FIRE savings rate, tax UI — **not wired into `taxPaid` on projection years** |
| Pensions | `src/engine/pension/` | Workplace/SIPP, AA taper, DB income |
| Wrappers | `src/engine/wrappers/` | ISA compound, LISA bonus, GIA + CGT drag |
| Property / BTL | `src/engine/property/`, `src/engine/btl/` | Mortgage amortisation, Section 24 cashflow |
| Projection | `src/engine/project/runProjection.ts` | Annual loop to age 100 |
| ISA bridge | `src/engine/project/isaBridge.ts` | **Post-hoc** analytic, not inside the loop |
| FIRE | `src/engine/fire/` | Metrics from profile + projection |
| Household | `src/engine/household/` | `combineProjections`, synthetic profile, semantics |
| Scenarios | `src/engine/scenarios/templates.ts` | Template patches applied **before** `runProjection` |
| Insights | `src/engine/insights/` | Rule engine on projection + FIRE |
| Persistence | `src/db/dexie.ts`, `repository.ts` | Profile v2 (primary + partner), scenarios, insights, projection cache |
| UI | Zustand + routes; `useProjection` in `src/lib/hooks.ts` | Debounced re-run of engine |
| iOS | `ios/OnTrackEngine` | Swift port + golden fixtures |

Financial code is already separated from React. That invariant must remain.

### 2.2 Module dependency (simplified)

```text
UserProfile (+ Scenario patch)
        │
        ▼
   runProjection(profile, { asOfDate, taxYearPack })
        │
        ├── pension/contributions, pension/db
        ├── wrappers/isa, wrappers/gia
        ├── property/mortgage
        ├── btl/cashflow ──► tax/incomeTax (marginal rate)
        └── constants (CPI, rates via profile fields)
        │
        ▼
   Projection { years[], meta }
        │
        ├── computeFire / computeHouseholdFire
        ├── isaBridge
        ├── generateInsights
        └── combineProjections (couple/family view)
```

### 2.3 What is already pure

These are pure (or pure given an injected `TaxYearPack` / frozen `asOfDate`):

- Tax: `incomeTax`, `personalAllowance`, `nationalInsurance`, `cgtOnGain`, `dividendTax`
- Pensions: `workplaceContribAnnual`, `sippGrossAnnual`, `annualAllowance`, `dbAnnualIncomeAtAge`
- Wrappers: `compoundAnnual`, `lisaAnnualGrowth`, `giaAnnualGrowth`, `capIsaMonthly`
- Property/BTL: `monthlyPayment`, `balanceAfterMonths`, `btlAnnualCashflow`
- FIRE: `computeFire`, prefs helpers
- Household merge: `combineProjections`
- ISA bridge: `isaBridge`
- Scenarios: `applyScenario`, `applyPropertySales`

`runProjection` is **effectively pure** when callers pass `asOfDate` and `taxYearPack` (as goldens do). Without those, “today” and the current tax pack make outputs time-dependent.

### 2.4 Persistence today

Dexie `OnTrackDB` v2:

- `profile` singleton: `{ primary, partner, dependentCount, onboardingComplete }`
- `scenarios`
- `insights` (30-day dismiss)
- `projectionCache` (schema present; not a core path for correctness)

Export/import serialises household + scenarios. No life-event store, drawdown strategy prefs, Monte Carlo settings, or historical datasets yet.

---

## 3. Current annual projection lifecycle

`runProjection` loops `i = 0 … horizon` where `horizon = max(100 − currentAge, 1)`.

For each calendar year `startYear + i`, person age `currentAge + i`:

1. **Retirement flag** — `retired = age >= retirementTargetAge`.
2. **Contributions (accumulating years only)**  
   - Workplace % of **static** `grossSalary` (no `salaryGrowth` / `bonus` applied).  
   - SIPP (+ optional scenario ramp extras).  
   - S&S ISA / LISA / GIA monthly → annual.  
   - All contribution streams stop when `retired`.
3. **If `i > 0` — grow balances and update property**  
   - Real rates = Fisher transform of profile nominals vs profile CPI, computed **once** outside the loop.  
   - Pension / S&S ISA / cash ISA / LISA / GIA / cash compound; contributions added end-of-year.  
   - Primary + each BTL: appreciation + mortgage balance path.  
   - Inheritance: if `year === inheritanceYear`, add to cash.
4. **BTL cashflow** — Section 24 net using current rent scale `(1+rentalGrowth)/(1+cpi)^i`. Net is **reported only** (not auto-saved into cash; intentional).
5. **Passive income** — State Pension from SPA (triple-lock real path); DB from NRA.
6. **Drawdown (if retired)** — see §6.
7. **Snapshot** `ProjectionYear` — includes balances, contributions, BTL net, SP/DB, `drawdownIncome`, `taxPaid: 0`.

Year 0 is a snapshot of opening balances (no growth applied before first snapshot).

### 3.1 Conventions baked into the loop

| Convention | Current behaviour |
| --- | --- |
| Horizon | Hard-coded age 100 |
| Units | Real (today’s £); UI may nominalise for display |
| Property appreciation | Applied as entered (treated as real growth), **not** Fisher-deflated like equities |
| Contribution timing | End-of-year |
| Employment surplus | Not modelled as automatic savings into wrappers |
| `taxPaid` on years | Always `0` (tax exists in helpers / BTL / charts, not projection ledger) |
| Cash ISA / LISA in drawdown | **Not** withdrawn (only S&S ISA, pension, GIA, cash) |
| `salaryGrowth`, `bonus`, `monthlySurplus` | Stored on profile; **unused** by `runProjection` |

---

## 4. Hard-coded assumptions inside `runProjection`

1. Constant real equity/cash rates for entire horizon.  
2. Single CPI for all Fisher transforms.  
3. Fixed drawdown priority (ISA bridge-ish, not a strategy object).  
4. Single flat `targetRetirementIncome` (no spending phases).  
5. Retirement binary by age threshold (no phased / career-break model).  
6. Inheritance as two profile fields, not a general event.  
7. Property sales only via **scenario pre-patch** (`applyPropertySales`), not timed mid-horizon inside the loop.  
8. NMPA gate only for pension withdrawals.  
9. Pension withdrawals treated as meeting **net** target £-for-£ with **no** income tax on drawdown.  
10. Horizon, year-step granularity, and real-terms ledger.

These are the main reasons Monte Carlo / historical paths cannot yet share the loop without a generalisation seam.

---

## 5. What blocks variable annual returns / inflation

Rates are closed over once:

```text
rPension = realRate(pensionGrowth, cpi)
rIsa     = realRate(isaGrowth, cpi)
…
```

Then every year uses the same `r*`. Inflation enters only via those transforms and rent/SP real scaling — not as a per-year `EconomicYear`.

**Minimum change to unblock Phases 1, 5, 7:**

- Accept an optional `EconomicScenario` (or resolver `(yearIndex, calendarYear, age) => EconomicYear`).
- Inside the loop, read that year’s inflation and asset returns.
- Default path: build a **constant** scenario from existing `UserProfile` fields so goldens are bit-stable.

No need for separate MC/historical engines if this seam exists.

---

## 6. How withdrawals work today

When `retired`:

```text
need = max(0, targetRetirementIncome − (SP + DB + max(0, BTL net)))
1. Withdraw from S&S ISA (tax-free)
2. If age ≥ NMPA, withdraw from pension (simplified; no tax gross-up)
3. Withdraw from GIA
4. Withdraw from cash
drawdownIncome = need − unmet
```

Implications:

- Unmet spending is **implicit** (`drawdownIncome < need`); not a first-class field.  
- Order ≈ “ISA bridge then pension”, not “cash first”.  
- Cash ISA / LISA unused for spending.  
- No CGT on GIA withdrawals; GIA only has growth-time CGT drag.  
- `isaBridge()` is a **separate** early-retirement check: `needed = target × (NMPA − retireAge)` vs ISA at retirement — it does **not** drive the loop and ignores SP/DB/BTL during the bridge, growth, or actual path withdrawals.

---

## 7. ISA bridge vs projection

| | Projection drawdown | `isaBridge()` |
| --- | --- | --- |
| Role | Path simulation | Static adequacy heuristic |
| Uses SP/DB/BTL | Yes (reduce need) | No |
| Uses actual ISA path | Yes (depletes S&S ISA) | Snapshot at retirement only |
| Cash ISA | Not drawn | Included in “ISA at retirement” |
| Feedback into engine | N/A | None |

v2 should keep a transparent bridge **report**, but eventually align it with the same drawdown strategy outputs (or clearly label it as a simplified rule of thumb). Do not silently change golden/insight behaviour in Phase 1.

---

## 8. IndexedDB / schema implications

Already household-capable (`ProfileRowV2`). Likely future migrations (versioned Dexie upgrades, not destructive):

| Concern | Suggested store / fields | Notes |
| --- | --- | --- |
| Life events | `events` table or `primary.timelineEvents[]` | Prefer structured array on household or person; migrate carefully |
| Spending phases | on profile or household | Avoid double-counting with `targetRetirementIncome` |
| Drawdown strategy id + user order | profile prefs | Default = current behaviour |
| Flexible spending (min / normal) | profile | Phase 8 |
| Monte Carlo / historical UI prefs | `ui` or settings blob | Not financial truth; seed optional |
| Historical market data | **not** IndexedDB | Ship as versioned JSON under `src/engine/data/` or `fixtures/` |
| Projection cache | existing table | Useful for MC chunk results later; optional |

Backwards compatibility: single-person plans with `partner: null` must keep working. New fields optional with defaults matching today’s behaviour.

Export/import (`exportAll`) must version-bump when schema grows.

---

## 9. Swift / iOS parity and goldens

Contract (`docs/ENGINE_DUAL_PLATFORM.md`):

- Shared JSON goldens under `fixtures/engine-goldens/`.  
- TS regenerates via `DUMP_ENGINE_GOLDENS=1`.  
- Swift `ProjectionEngine.runProjection` + `GoldenParityTests`.

**Current parity gap (important):** Swift BTL cashflow is stubbed to `0` (“omitted until full Section-24 port”). Goldens use empty `btlProperties`, so CI still passes. Any BTL-in-loop golden will diverge until Swift catches up.

**Implications for v2:**

1. Phase 1 economic seam must be mirrored in Swift **or** goldens stay on the constant path only until Swift ports the option.  
2. Prefer additive options (`economicScenario?: …`) so default signatures remain compatible.  
3. Every intentional behaviour change requires: TS tests → regenerate goldens → Swift update → `npm run test:ios-engine`.  
4. Do not invent a third “web-only” projection path for MC; MC should call the same year-step (TS first; Swift later).

---

## 10. Regression risks

Highest risk areas if refactors are careless:

1. **Real-rate Fisher transform** and property appreciation asymmetry.  
2. **Year-0 vs year-1** growth/contribution timing.  
3. **Interest-only** primary/BTL balance maths and scenario overpay ramps.  
4. **BTL rentScale** and Section 24 tax.  
5. **Drawdown order** and NMPA gate (FIRE ages, wealth journey, ISA bridge insights).  
6. **Household merge** (`retired = a && b`, primary home once, length = min).  
7. **Scenario `applyPropertySales`** (immediate equity-to-cash, no CGT) vs future mid-horizon disposal.  
8. **Golden snapshots** (indices 0, 5, 10, mid, last).  
9. **Swift drift** if TS changes without port.  
10. UI charts that assume `taxPaid === 0` or specific drawdown semantics.

**Mitigation:** Phase 1 must add regression tests that freeze today’s outputs under constant economics, then prove identical numbers with `EconomicScenario` built from profile defaults.

---

## 11. Proposed architecture

### 11.1 Canonical pipeline

```text
FinancialProfile (person) + HouseholdContext (shared spending/events/property)
        ↓
Resolve timeline (events → year effects)
        ↓
EconomicScenario provider
  • constant (from profile)     → deterministic UI (today)
  • historical sequence         → backtest
  • sampled path (seeded RNG)   → Monte Carlo
        ↓
YearStep / runProjection (ONE engine)
  • contributions
  • UK tax helpers (expand over phases)
  • cashflow
  • DrawdownStrategy.allocateWithdrawal
  • asset growth (that year’s returns)
        ↓
Projection (+ per-year DrawdownReport)
        ↓
Analytics: FIRE, bridge, stress aggregates, optimiser search
        ↓
Dashboard / Stress Test / Scenarios / Get Me OnTrack
```

### 11.2 Economic types (illustrative — follow existing naming)

```ts
interface EconomicYear {
  year: number;          // calendar year
  inflation: number;     // CPI for that year (decimal)
  equityReturn: number;  // nominal (or documented real — pick one convention and stick to it)
  bondReturn: number;
  cashReturn: number;
  propertyGrowth?: number;
}

interface EconomicScenario {
  id?: string;
  years: EconomicYear[];
}
```

**Convention decision (Phase 1 must lock):**  
Today the loop stores **real** balances and converts **nominal** profile rates via CPI. Prefer:

- `EconomicYear` supplies **nominal** returns + inflation;  
- year-step applies Fisher (or equivalent) consistently;  
- constant scenario builder uses existing profile fields so outputs match.

Document the convention in this file when Phase 1 ships.

### 11.3 Drawdown strategy seam (Phase 3; extract stub earlier if cheap)

```ts
interface DrawdownStrategy {
  id: string;
  name: string;
  allocateWithdrawal(ctx: DrawdownContext): DrawdownAllocation;
}
```

Phase 3 strategies A–D. **Default strategy** must reproduce today’s ISA→pension→GIA→cash behaviour exactly.

Each year should eventually expose: gross need, by-wrapper withdrawals, taxable pension, tax, CGT, unmet spending.

### 11.4 Life events & spending phases (Phase 2)

Flexible event model (not one `if` per event type inside the loop):

- one-off / recurring / age or date windows  
- inflation-linked amounts  
- apply as year effects: income, expense, contribution override, property mutation, cash transfer  

Spending phases replace or parameterise flat `targetRetirementIncome` **without double-counting**. Migration: single phase = current target.

### 11.5 Household (Phase 4 evolution)

Keep:

- Per-person ownership of income, pensions, ISAs, GIA, SP, DB, tax region.  
- Combined resources for sustainability views.  
- Dexie primary/partner.

Evolve:

- Explicit household spending + shared events/property ownership.  
- Align retirement flags (one partner retired earlier) in merged analytics.  
- Longevity / death of partner only if modelled carefully (optional later golden).  
- Never merge Personal Allowances.

### 11.6 Monte Carlo / historical (Phases 5–7)

Thin layers **above** the year-step:

- Seeded PRNG (no bare `Math.random()` in engine).  
- Correlated returns → `EconomicScenario` → `runProjection`.  
- Aggregate success using a **single named definition** (e.g. essential spending funded to planning age without investable exhaustion).  
- Historical JSON dataset + methodology docs.  
- UI via Web Worker + cancellation; data stays on-device.

### 11.7 Optimiser (Phase 12)

Bounded search over scenario knobs calling the same projection (+ optional MC). Present options, not “advice”.

---

## 12. Proposed files / modules (incremental)

| Module | Purpose | Phase |
| --- | --- | --- |
| `src/engine/economics/types.ts` | `EconomicYear`, `EconomicScenario` | 1 |
| `src/engine/economics/fromProfile.ts` | Constant scenario from `UserProfile` | 1 |
| `src/engine/economics/realRate.ts` | Shared Fisher helper (extract from loop) | 1 |
| `src/engine/project/runProjection.ts` | Accept optional economics; preserve defaults | 1 |
| `src/engine/project/yearStep.ts` (optional) | Extract inner year body for testability | 1–3 |
| `src/engine/events/` | Timeline event types + resolver | 2 |
| `src/engine/spending/` | Phases + need calculation | 2 |
| `src/engine/drawdown/` | Strategies + reports | 3, 10 |
| `src/engine/household/` | Extend semantics, ownership, longevity | 4 |
| `src/engine/montecarlo/` | RNG, path gen, aggregate | 5 |
| `src/engine/historical/` | Load sequences, named stress windows | 7 |
| `src/engine/optimiser/` | Bounded searches | 12 |
| `src/workers/monteCarloWorker.ts` | Off-main-thread runs | 6 |
| `docs/MONTE_CARLO_METHODOLOGY.md` etc. | As listed in product plan | with phases |

Avoid duplicating `tax/`, `btl/`, `wrappers/` under new trees.

---

## 13. Migration strategy

1. **Phase 0 (this doc)** — agree seams.  
2. **Phase 1** — economic injection + regression goldens; **no** UI change; Swift optional follow-up if API changes.  
3. **Phase 2–3** — events/spending/drawdown; default path ≡ current behaviour.  
4. **Phase 4** — deepen household; schema migration v3+.  
5. **Phase 5–7** — stochastic/historical layers + docs + workers.  
6. **Phase 8–12** — flexibility, disposal CGT, tax-aware heuristics, comparison, optimiser.

Rules:

- Prefer extending `runProjection` options over new entry points.  
- If a second entry point is needed (`runProjectionWithScenario`), it must call the same internals.  
- Intentional behaviour changes require documented fixtures and release notes.  
- Do not change default CPI/equity assumptions “while we’re here”.

---

## 14. New domain types (sketch)

Additive to `types.ts` or neighbouring modules:

- `EconomicYear`, `EconomicScenario`  
- `LifeEvent` (+ typed payloads)  
- `SpendingPhase`  
- `DrawdownStrategyId`, `DrawdownAllocation`, `DrawdownReport`  
- `HouseholdPlan` (shared spending, events, joint assets) — keep `UserProfile` as person  
- `MonteCarloConfig`, `MonteCarloResult`, `SuccessDefinition`  
- `HistoricalDataset`, `HistoricalRunSummary`  
- Extended `ProjectionYear` fields (unmet spending, withdrawal breakdown) — **additive** so old consumers compile  

Scenario params should grow toward the same event/strategy knobs rather than one-off template switches only.

---

## 15. Test strategy

Existing:

- Unit tests per tax/BTL/mortgage/FIRE module  
- `src/test/golden/acceptance.test.ts`  
- `fixtures/engine-goldens` + `engineGoldens.test.ts`  
- Swift golden parity  

v2 additions:

| Kind | Requirement |
| --- | --- |
| Phase 1 regression | Constant `EconomicScenario` ≡ legacy `runProjection` (tight tolerances) |
| Edge cases | Zero/negative returns, zero inflation, immediate retirement, pre-NMPA, depletion, high wealth |
| UK cases | Scottish taxpayer, SP, DB, BTL, ISA-only, pension-only |
| Drawdown | Each strategy; unmet spending; NMPA gate |
| Household goldens | Single; unequal income/pensions; staggered retirement/SPA |
| Monte Carlo | Fixed seed → identical aggregates; success definition asserted |
| Historical | Documented subset of years; deterministic loader |
| Dual platform | Regenerate goldens; Swift port before claiming parity |

Gate every phase with:

```bash
npm test
npm run typecheck
npm run build
```

Plus `npm run test:ios-engine` when engine signatures or golden numbers change.

---

## 16. Implementation sequence (approved plan)

| Phase | Focus | Stop condition |
| --- | --- | --- |
| 0 | Architecture doc (this) | Human review |
| 1 | Economic generalisation + regression | Tests green; outputs unchanged on defaults |
| 2 | Events + spending phases | Comprehensive tests; no double-count |
| 3 | Drawdown strategies A–D | Default ≡ legacy; reports complete |
| 4 | Household deepening + schema | Back-compat + couple goldens |
| 5 | Monte Carlo engine | Seeded, shared year-step |
| 6 | Stress Test UI + workers | Progress/cancel; disclaimer copy |
| 7 | Historical data + backtest | Methodology doc |
| 8 | Flexible spending | Fixed vs flexible comparison |
| 9 | Property disposal mid-horizon + CGT | Worked examples |
| 10 | Tax-aware drawdown heuristics | Explainable allocations |
| 11 | Richer scenario comparison | Success metrics in matrix |
| 12 | Get Me OnTrack optimiser | Options, not single recommendation |

---

## 17. Changes that should be made NOW (before expensive rework)

These are **design decisions for Phase 1 approval**, not a licence to implement unapproved work:

1. **Inject `EconomicScenario` (or year resolver) into `runProjection`** — highest leverage for MC/historical.  
2. **Keep default behaviour byte-stable** via `economicScenarioFromProfile(profile)`.  
3. **Plan drawdown extraction** so Phase 3 does not rewrite the growth loop again; optionally extract a private `applyDrawdownLegacy(...)` in Phase 1/2.  
4. **Treat events as first-class soon** — stop adding one-off fields like `inheritanceYear` for every new shock.  
5. **Define success centrally** before Monte Carlo UI.  
6. **Preserve dual-platform golden contract**; additive options preferred.  
7. **Do not** build a parallel “simulation engine” or move calculations into React.  
8. **Do not** “fix” unused profile fields (`salaryGrowth`, etc.) inside Phase 1 unless explicitly scoped — that changes trajectories.

### Open questions for reviewer

1. Should `EconomicYear` returns be **nominal** (recommended) or **real**?  
2. Should Phase 1 also extract legacy drawdown into a named strategy module (still default-identical), or only economics?  
3. Is mid-horizon property sale (Phase 9) allowed to differ from today’s immediate scenario `applyPropertySales` (no CGT), with the old path kept as a scenario template behaviour?  
4. For couples, is household spending the **sum of targets** (current synthetic profile) or a single shared budget field going forward?  
5. Swift: must Phase 1 land in Swift in the same PR, or is TS+goldens-first acceptable with a tracked parity ticket?

---

## 18. Can `runProjection` be the canonical engine?

**Yes**, with the seams above.

It is already:

- annual-step  
- deterministic with frozen `asOfDate` / tax pack  
- pure-helper composition  
- the sole path used by dashboard, scenarios, reports, FIRE, insights, and household merge  

It is **not yet**:

- economics-path agnostic  
- strategy-based on withdrawals  
- event-driven  
- tax-complete on the projection ledger  
- household-aware inside the year-step (by design: combine after)

Those gaps are additive. Rewriting the application or replacing working tax/BTL maths would be the expensive mistake.

---

## 19. Phase 0 deliverable checklist

- [x] Map existing financial engine  
- [x] Explain annual projection lifecycle  
- [x] Identify pure functions  
- [x] Identify hard-coded `runProjection` assumptions  
- [x] Identify blockers to variable returns/inflation  
- [x] Identify withdrawal behaviour  
- [x] Identify ISA bridge interaction  
- [x] IndexedDB implications  
- [x] Swift/golden implications  
- [x] Regression risks  
- [x] Proposed architecture, migration, types, modules, tests, sequence  

**STOP.** Phase 1 awaits explicit approval.
