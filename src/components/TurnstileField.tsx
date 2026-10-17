import { useEffect, useRef, useState } from "react";

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY?.trim() ?? "";

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
        },
      ) => string;
      reset: (widgetId: string) => void;
    };
  }
}

type Props = {
  onToken: (token: string | null) => void;
};

/** Cloudflare Turnstile when VITE_TURNSTILE_SITE_KEY is set at build time. */
export function TurnstileField({ onToken }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!SITE_KEY) return;
    const existing = document.querySelector('script[src*="turnstile/v0/api.js"]');
    if (existing) {
      setReady(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.onload = () => setReady(true);
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!SITE_KEY || !ready || !ref.current || !window.turnstile) return;
    if (widgetId.current) return;
    widgetId.current = window.turnstile.render(ref.current, {
      sitekey: SITE_KEY,
      callback: (token) => onToken(token),
      "expired-callback": () => onToken(null),
    });
  }, [ready, onToken]);

  if (!SITE_KEY) return null;

  return (
    <div className="space-y-1">
      <div ref={ref} />
      <p className="text-xs text-muted-foreground">Protected by Cloudflare Turnstile.</p>
    </div>
  );
}

export function turnstileRequired(): boolean {
  return SITE_KEY.length > 0;
}
