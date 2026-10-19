# Changelog

User-facing summaries also appear in the app at `/whats-new` (`src/lib/releaseNotes.ts`).

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
