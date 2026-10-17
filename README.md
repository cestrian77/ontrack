# OnTrack — UK Retirement Trajectory Planner

A visually rich, **local-first** UK retirement trajectory and wealth projection web app. Implements Phase 1 of the [v5 PRD](./uk-retirement-planner-prd-v5.docx) plus stress testing and planning extensions.

> Projections and stress tests run **client-side**. Profile data stays in your browser (IndexedDB). Only the optional **Contact** form posts to your hosted `/api/contact` endpoint — see [docs/DEPLOY.md](docs/DEPLOY.md).

## Licence

GNU Affero General Public License v3.0

## Highlights

- Annual-step deterministic projection engine to planning horizon (default age 100), real-terms with nominal toggle
- **Career path:** salary growth and bonus while working (pension contributions, BTL marginal rates)
- **Stress test:** Monte Carlo (seeded) and illustrative historical backtest via Web Worker
- **Drawdown:** legacy ordering or tax-aware pension gross-up; optional **spending guardrails**
- **Long-term care** cost window and illustrative **inheritance tax** estimate at a chosen age
- UK tax modelling from frozen per-year packs; England/Wales + Scottish bands, NI, PA taper, CGT, dividend tax
- Pension wrappers, ISAs/LISA/GIA, primary home + BTL (Section 24), mortgage amortisation
- FIRE variants, ISA bridge, scenarios, insights, **PDF reports**
- Couple / family household merge; PWA with offline shell
- **No Open Banking** — intentional for simplicity and privacy

## Stack

React 18 · TypeScript · Vite · Tailwind · Recharts · Zustand · Dexie · Vitest · Cloudflare Pages (static + contact function)

## Run

```bash
npm install
npm run dev          # http://localhost:5173
npm test
npm run typecheck
npm run lint
npm run build
```

## Deploy

See **[docs/DEPLOY.md](docs/DEPLOY.md)** for Cloudflare Pages, contact mail env vars, Turnstile, and security headers.

```bash
npm run build
npx wrangler pages deploy dist
```

CI on `main`: typecheck, tests, lint, build (`.github/workflows/ci.yml`).

## iOS (optional)

Swift companion under `ios/` — not required for the open-source web app. See `docs/ENGINE_DUAL_PLATFORM.md` and `npm run test:ios-engine`.

## Docs

- [Monte Carlo methodology](docs/MONTE_CARLO_METHODOLOGY.md)
- [Historical backtest methodology](docs/HISTORICAL_BACKTEST_METHODOLOGY.md)
- [Architecture (v2 direction)](docs/ONTRACK_V2_ARCHITECTURE.md)
- [Changelog](CHANGELOG.md)

## Privacy

- No analytics on financial inputs; no third-party trackers in the app shell
- Local state in IndexedDB; export/import JSON for backup
- Contact form only when you choose to send a message (optional Turnstile + rate limits on the server)
