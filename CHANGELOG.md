# Changelog

User-facing summaries also appear in the app at `/whats-new` (`src/lib/releaseNotes.ts`).

## 1.2.0 — 2026-10-19

### Added

- **Spending** page: household budget lines and children, compile totals, apply to retirement income and projection events (saved in data pack).
- **2027/28** tax-year pack; property income rates and 22% Section 24 finance-cost credit from 6 April 2027.
- Projections **step registered tax-year packs** along the calendar horizon by default (BTL property tax, drawdown); pin a year in Settings to freeze one pack.
- Pension drawdown enforces **NMPA 57** from calendar year 2028 when the profile still allows 55.
- Help: retirement income target (real vs nominal), stress-test methodology; Tax/BTL dashboards show tax-year outlook where relevant.
- Money period inputs (monthly/annual) on onboarding and settings fields.

### Changed

- Monte Carlo runner aligns stepped tax years with the main projection when not frozen.
- Engine goldens record `steppedTaxYears` in metadata.

### Model notes

- 2027/28 **personal allowance allocation** across property vs other income is **not** modelled yet (documented in Help).
- Scottish property bands use +2pp on Scottish income rates until devolved rates are confirmed.

## 1.1.1 — 2026-03-21

### Added

- Dashboard **Planning & longevity** card (care costs chart, guardrail multiplier, per-person IHT).
- Partner-specific care, guardrails, and IHT in Settings.
- Insights for care, IHT, and guardrails when enabled.

## 1.1.0 — 2026-03-21

### Added

- Salary growth and bonus on the career path while working (pension contributions, BTL marginal rates).
- Dynamic spending guardrails (Guyton–Klinger-style) in Settings.
- Long-term care cost window and illustrative inheritance tax estimate at a chosen age.
- Stress test: historical mode uses a single path; worker run IDs; methodology links in Help.
- Monte Carlo seed and default trials in Settings.
- Contact form: Cloudflare Turnstile (optional) and server rate limiting.
- CI workflow (typecheck, test, lint, build), ESLint flat config, `public/_headers`, `docs/DEPLOY.md`.

### Fixed

- Import JSON: size cap, validation, confirm dialog, and error handling.
- Household historical backtest no longer repeats identical trials.

## 1.0.2

- Earlier Phase 1 web release (deterministic engine, FIRE, BTL, scenarios, PWA).
