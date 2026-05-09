# OnTrack — UK Retirement Trajectory Planner

A visually rich, **local-first** UK retirement trajectory and wealth projection web app. Implements Phase 1 of the [v5 PRD](./uk-retirement-planner-prd-v5.docx).

> All projections run client-side. No financial data ever leaves your device.

## Highlights

- Annual-step deterministic projection engine to age 100 (real-terms with nominal toggle)
- UK tax modelling from frozen per-year packs (active year follows the calendar); England/Wales + Scottish bands, NI, PA taper, CGT, dividend tax
- Pension wrappers: workplace, SIPP relief at source, salary sacrifice efficiency, Annual Allowance with taper, MPAA, DB streams
- ISA / LISA (25% bonus, age 50/60 rules) / GIA (with CGT drag) / Cash ISA — `£20k` combined cap enforced
- Primary residence + up to 10 BTLs with **Section 24** mortgage interest restriction modelled (PRD §8.2)
- Mortgage amortisation: repayment, interest-only, with overpayment summary (interest saved + months saved)
- All 5 FIRE variants: Full, Lean, Fat, Coast, Barista — with progress %, FIRE age, Coast crossover
- ISA bridge analysis when retiring before NMPA
- Rule-based insights across all 6 PRD categories with 30-day dismissal window
- 8 charts: Wealth Journey, Retirement Income Stack, FIRE Ring + Timeline, Waterfall, Mortgage Amort, BTL Dashboard, Allocation Donut, Tax Efficiency
- Up to 3 named scenarios with side-by-side delta comparison; 10 prebuilt templates
- Dark mode, responsive 375px+ to 1280px+, mobile bottom nav, inflation toggle on every monetary chart
- PWA installable with offline shell

## Stack

React 18 · TypeScript · Vite · Tailwind · shadcn-style components · Recharts · Zustand · Dexie (IndexedDB) · Vitest · vite-plugin-pwa · Cloudflare Pages

## Run

```bash
npm install
npm run dev          # dev server on http://localhost:5173
npm test             # run engine + acceptance test suites
npm run typecheck    # strict TS check
npm run build        # production build to ./dist (PWA assets generated)
```

## Deploy to Cloudflare Pages

```bash
npm run build
npx wrangler pages deploy dist
```

`wrangler.jsonc` is included with the project name `ontrack` and `pages_build_output_dir = ./dist`.

## Project structure

```
src/
  app/                  # router, layout, theme provider
  routes/               # pages (Welcome, onboarding, dashboard, fire, scenarios, property, tax, insights, settings)
  components/
    ui/                 # shadcn-style primitives
    charts/             # 8 PRD charts
    forms/              # Field, NumberInput, PercentInput
    insights/           # InsightCard
  engine/
    types.ts            # core domain types
    constants/          # uk.ts (PRD §14), defaults.ts (§5.2)
    tax/                # incomeTax (E&W + Scotland), ni, cgt, dividend
    pension/            # contributions, relief, AA taper, DB
    wrappers/           # isa, gia, lisa
    property/           # mortgage amortisation + overpayment
    btl/                # cashflow with Section 24
    project/            # runProjection, isaBridge
    fire/               # FIRE metrics
    insights/           # rule engine
    scenarios/          # 10 prebuilt templates + apply
  db/                   # Dexie schema + repositories (export/import)
  store/                # Zustand stores (profile, scenarios, ui)
  lib/                  # cn, gbp/pct formatters, hooks
  test/                 # setup + golden acceptance tests
```

## Verified PRD examples

The test suite includes golden cases for:

- §5.3.1 PA taper between £100k–£125,140
- §5.3.1/5.3.2 England/Wales and Scottish income tax bands
- §5.3.3 NI bands
- §5.4.2 Annual Allowance taper
- §5.8.1 Mortgage amortisation (£200k @ 5% / 25y → £1,169.18/mo)
- §6.1.1 FIRE number (£40k ÷ 3.5% = £1,142,857)
- §6.1.4 Coast FIRE
- §8.2 Section 24 worked example (£15k rent → £1,200 net cashflow at higher rate)

## Scope

This implementation covers **Phase 1 Must + Should + Could** (PRD §16.1–16.3). Items deferred to Phase 2/3 (Monte Carlo, drawdown sequencing optimiser, Bed & ISA automation, BTL CGT optimisation, couples module, Open Banking, cloud sync, PDF export) are not included.

## Privacy

- No analytics that capture financial input values
- No third-party trackers
- All state in IndexedDB; export/import as JSON for portability
