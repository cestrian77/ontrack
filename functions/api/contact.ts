/**
 * Cloudflare Pages Function: POST /api/contact
 *
 * Secrets (wrangler pages secret put … or Dashboard → Pages → Settings → Environment variables):
 *   CONTACT_TO_EMAIL      — recipient inbox
 *   CONTACT_FROM_EMAIL    — verified sender with your provider
 *   CONTACT_ALLOWED_ORIGIN — optional comma-separated list of allowed Origin values, e.g.
 *                            https://yourdomain.com,https://your-project.pages.dev
 *                            If unset, only http://localhost and http://127.0.0.1 (any port) are allowed.
 *
 * Set exactly one mail provider:
 *   BREVO_API_KEY         — Brevo (Sendinblue) REST API key
 *   SMTP2GO_API_KEY       — SMTP2GO REST API key (header X-Smtp2go-Api-Key)
 *
 * Local: run `npm run build` then `npm run dev:pages` (wrangler pages dev) on port 8788,
 * and in another terminal `npm run dev` so Vite proxies /api → 8788 (see vite.config.ts).
 */

type Env = {
  CONTACT_TO_EMAIL: string;
  CONTACT_FROM_EMAIL: string;
  CONTACT_ALLOWED_ORIGIN?: string;
  BREVO_API_KEY?: string;
  SMTP2GO_API_KEY?: string;
};

const REASON_LABEL: Record<string, string> = {
  general: "General contact",
  issue: "Report an issue",
  feature: "Suggest a feature",
  privacy: "Privacy / data",
};

const MAX_NAME = 200;
const MAX_EMAIL = 320;
const MAX_MESSAGE = 10000;

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function originAllowed(origin: string | null, env: Env): boolean {
  if (!origin) return false;
  const raw = env.CONTACT_ALLOWED_ORIGIN?.trim();
  if (!raw) {
    try {
      const u = new URL(origin);
      return u.hostname === "localhost" || u.hostname === "127.0.0.1";
    } catch {
      return false;
    }
  }
  const allowed = raw.split(",").map((s) => s.trim()).filter(Boolean);
  return allowed.includes(origin);
}

async function sendBrevo(
  apiKey: string,
  from: string,
  to: string,
  subject: string,
  text: string,
): Promise<Response> {
  return fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      sender: { email: from, name: "OnTrack" },
      to: [{ email: to }],
      subject,
      textContent: text,
    }),
  });
}

async function sendSmtp2go(
  apiKey: string,
  from: string,
  to: string,
  subject: string,
  text: string,
): Promise<Response> {
  return fetch("https://api.smtp2go.com/v3/email/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Smtp2go-Api-Key": apiKey,
    },
    body: JSON.stringify({
      sender: from,
      to: [to],
      subject,
      text_body: text,
    }),
  });
}

export async function onRequestPost(context: {
  request: Request;
  env: Env;
}): Promise<Response> {
  const { request, env } = context;
  const origin = request.headers.get("Origin");

  if (!originAllowed(origin, env)) {
    return json({ error: "Forbidden" }, 403);
  }

  if (!env.CONTACT_TO_EMAIL || !env.CONTACT_FROM_EMAIL) {
    return json({ error: "Contact endpoint is not configured." }, 503);
  }

  const brevo = env.BREVO_API_KEY?.trim();
  const smtp2go = env.SMTP2GO_API_KEY?.trim();
  if (!brevo && !smtp2go) {
    return json({ error: "No mail provider key configured." }, 503);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body." }, 400);
  }

  if (!body || typeof body !== "object") {
    return json({ error: "Invalid body." }, 400);
  }

  const o = body as Record<string, unknown>;
  const reason = typeof o.reason === "string" ? o.reason : "";
  const name = typeof o.name === "string" ? o.name.trim() : "";
  const email = typeof o.email === "string" ? o.email.trim() : "";
  const message = typeof o.message === "string" ? o.message.trim() : "";

  if (!REASON_LABEL[reason]) {
    return json({ error: "Invalid reason." }, 400);
  }
  if (!name || name.length > MAX_NAME) {
    return json({ error: "Invalid name." }, 400);
  }
  if (!email || email.length > MAX_EMAIL || !isValidEmail(email)) {
    return json({ error: "Invalid email." }, 400);
  }
  if (!message || message.length > MAX_MESSAGE) {
    return json({ error: "Invalid message." }, 400);
  }

  const reasonLabel = REASON_LABEL[reason];
  const subject = `[OnTrack] ${reasonLabel} — ${name}`;
  const text = [
    `Reason: ${reasonLabel} (${reason})`,
    `From: ${name} <${email}>`,
    "",
    message,
  ].join("\n");

  const upstream = brevo
    ? await sendBrevo(brevo, env.CONTACT_FROM_EMAIL, env.CONTACT_TO_EMAIL, subject, text)
    : await sendSmtp2go(smtp2go!, env.CONTACT_FROM_EMAIL, env.CONTACT_TO_EMAIL, subject, text);

  if (!upstream.ok) {
    const errText = await upstream.text().catch(() => "");
    console.error("Mail provider error", upstream.status, errText.slice(0, 500));
    return json({ error: "Failed to send message." }, 502);
  }

  return json({ ok: true });
}
