import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const REASONS = [
  { value: "general", label: "General contact" },
  { value: "issue", label: "Report an issue" },
  { value: "feature", label: "Suggest a feature" },
  { value: "privacy", label: "Privacy / data" },
] as const;

type Reason = (typeof REASONS)[number]["value"];

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

export default function Contact() {
  const [reason, setReason] = useState<Reason>("general");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errorText, setErrorText] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorText("");
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedMessage = message.trim();
    if (!trimmedName || !trimmedEmail || !trimmedMessage) {
      setErrorText("Please fill in all fields.");
      return;
    }
    if (!isValidEmail(trimmedEmail)) {
      setErrorText("Please enter a valid email address.");
      return;
    }
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason,
          name: trimmedName,
          email: trimmedEmail,
          message: trimmedMessage,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setErrorText(data.error ?? "Something went wrong. Please try again later.");
        setStatus("error");
        return;
      }
      setStatus("success");
      setMessage("");
    } catch {
      setErrorText("Network error. Check your connection or try again later.");
      setStatus("error");
    }
  }

  return (
    <div className="container max-w-lg px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Contact</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Send a message to the OnTrack team. We read every submission.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Get in touch</CardTitle>
          <CardDescription>Choose a topic, then write your message.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs
            value={reason}
            onValueChange={(v) => {
              setReason(v as Reason);
              setStatus("idle");
              setErrorText("");
            }}
          >
            <TabsList className="grid w-full grid-cols-2 h-auto gap-1 p-1 sm:grid-cols-4">
              {REASONS.map(({ value, label }) => (
                <TabsTrigger key={value} value={value} className="text-xs sm:text-sm py-2 px-1">
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contact-name">Name</Label>
              <Input
                id="contact-name"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={200}
                disabled={status === "sending"}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-email">Email</Label>
              <Input
                id="contact-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={320}
                disabled={status === "sending"}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-message">Message</Label>
              <textarea
                id="contact-message"
                className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={10000}
                disabled={status === "sending"}
              />
            </div>
            {errorText ? (
              <p className="text-sm text-destructive" role="alert">
                {errorText}
              </p>
            ) : null}
            {status === "success" ? (
              <p className="text-sm text-success" role="status">
                Thanks — your message was sent.
              </p>
            ) : null}
            <Button type="submit" disabled={status === "sending"}>
              {status === "sending" ? "Sending…" : "Send message"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
