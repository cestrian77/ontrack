# Deploying OnTrack (Cloudflare Pages)

## GitHub → Cloudflare Pages (recommended)

If your site is already connected in the Cloudflare dashboard (**Workers & Pages** → your project → **Settings** → **Builds**):

1. Push to the branch Cloudflare watches (usually `main`).
2. Cloudflare runs the build command you configured (recommended: `npm ci && npm run build`).
3. Output directory: **`dist`** (matches `wrangler.jsonc` / Vite).

You do **not** need to run `wrangler pages deploy` locally when this integration is enabled — push to GitHub is enough.

This repo also runs **GitHub Actions** CI on push/PR (typecheck, tests, lint, build) in `.github/workflows/ci.yml`. That does not deploy by itself; Cloudflare’s git integration does.

## Manual deploy

```bash
npm ci
npm test
npm run build
npx wrangler pages deploy dist
```

`wrangler.jsonc` sets `pages_build_output_dir` to `./dist`.

## Contact form (`/api/contact`)

Set **production** environment variables in Cloudflare Pages → Settings → Environment variables (or `wrangler pages secret put`):

| Variable | Required | Purpose |
| --- | --- | --- |
| `CONTACT_TO_EMAIL` | Yes | Inbox for form submissions |
| `CONTACT_FROM_EMAIL` | Yes | Verified sender with your mail provider |
| `CONTACT_ALLOWED_ORIGIN` | Yes (prod) | Comma-separated origins, e.g. `https://ontrack.example.com,https://ontrack.pages.dev` |
| `BREVO_API_KEY` or `SMTP2GO_API_KEY` | One of | Outbound mail |
| `TURNSTILE_SECRET_KEY` | Recommended | Bot protection (pair with `VITE_TURNSTILE_SITE_KEY` at build time) |

Local dev: `npm run build && npm run dev:pages` on port 8788, and `npm run dev` so Vite proxies `/api` to wrangler.

## Turnstile (optional — contact form only)

**Turnstile** is Cloudflare’s CAPTCHA alternative. You only need it if you want bot protection on **Contact**.

- **Not required** for the planner, stress test, or PWA — skip it unless you care about contact spam.
- If you use it: in Cloudflare Turnstile, create a site widget, then set:
  - **Pages build env:** `VITE_TURNSTILE_SITE_KEY` (public site key — baked into the JS at build time)
  - **Pages runtime env:** `TURNSTILE_SECRET_KEY` (server secret for `/api/contact`)

If neither key is set, the contact form still works; only origin allowlist + rate limiting apply.

## Security headers

`public/_headers` is copied to `dist` and applies baseline headers on Cloudflare Pages.

## Rate limiting

The contact function includes a best-effort per-isolate limit. Enable **Cloudflare WAF rate limiting** on `POST /api/contact` for production traffic.
