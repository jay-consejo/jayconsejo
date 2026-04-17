"use client";

import { useState, type FormEvent } from "react";
import { Mail } from "lucide-react";

const timelineSteps = [
  "You submit",
  "AI Assistant calls",
  "5-min project brief",
  "Meeting with Jay",
];

type Status = "idle" | "loading" | "success" | "error";

export function Contact() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    const formData = new FormData(e.currentTarget);
    const payload = {
      name: String(formData.get("name") ?? ""),
      whatsapp: String(formData.get("whatsapp") ?? ""),
      email: String(formData.get("email") ?? ""),
    };

    try {
      const res = await fetch("/api/sofia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data: { ok: boolean; error?: string } = await res.json();
      if (!data.ok) {
        setErrorMessage(data.error ?? "Something went wrong. Please try again.");
        setStatus("error");
        return;
      }
      setStatus("success");
    } catch {
      setErrorMessage("Network error. Please try again.");
      setStatus("error");
    }
  }

  return (
    <section
      id="contact"
      className="relative overflow-hidden px-6 py-24 md:py-32"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(circle at 50% 0%, rgba(200, 168, 126, 0.10) 0%, transparent 55%)",
        }}
      />
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <p className="text-xs font-medium tracking-[0.22em] text-accent-gold/80 uppercase">
            Let&apos;s Talk
          </p>
          <h2 className="mt-4 font-display text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Let&apos;s make something real.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-text-secondary">
            Got 5 minutes? My AI Assistant will call for a quick brief. Then we meet.
          </p>
        </div>

        <div className="mt-12 rounded-2xl border border-border-subtle/80 bg-card/60 p-8 md:p-10">
          {status === "success" ? (
            <div className="py-6 text-center">
              <p className="font-display text-2xl font-semibold text-accent-gold">
                Thank you.
              </p>
              <p className="mt-3 text-text-secondary">
                My AI Executive Assistant calls within minutes. Keep your phone close.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="name"
                  className="text-xs font-medium tracking-[0.12em] text-text-secondary uppercase"
                >
                  Your Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  disabled={status === "loading"}
                  placeholder="e.g. Maria Santos"
                  className="mt-2 flex h-12 w-full rounded-lg border border-border bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus-visible:border-accent-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold/30 disabled:opacity-60"
                />
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="whatsapp"
                    className="text-xs font-medium tracking-[0.12em] text-text-secondary uppercase"
                  >
                    WhatsApp Number
                  </label>
                  <input
                    id="whatsapp"
                    name="whatsapp"
                    type="tel"
                    required
                    disabled={status === "loading"}
                    placeholder="+63 917 000 0000"
                    className="mt-2 flex h-12 w-full rounded-lg border border-border bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus-visible:border-accent-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold/30 disabled:opacity-60"
                  />
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="text-xs font-medium tracking-[0.12em] text-text-secondary uppercase"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    disabled={status === "loading"}
                    placeholder="maria@company.com"
                    className="mt-2 flex h-12 w-full rounded-lg border border-border bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus-visible:border-accent-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold/30 disabled:opacity-60"
                  />
                </div>
              </div>

              <div className="flex gap-3 rounded-xl border border-border-subtle bg-surface/60 p-4">
                <Mail className="mt-0.5 size-5 shrink-0 text-accent-gold" />
                <p className="text-sm leading-relaxed text-text-secondary">
                  Submit, and my{" "}
                  <strong className="text-foreground">AI Executive Assistant</strong>{" "}
                  calls within minutes. A 5-minute brief — no pitch — so I walk in ready.
                </p>
              </div>

              {status === "error" && errorMessage && (
                <p
                  role="alert"
                  className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                >
                  {errorMessage}
                </p>
              )}

              <button
                type="submit"
                disabled={status === "loading"}
                className="inline-flex h-12 w-full items-center justify-center rounded-full bg-accent-gold px-6 text-sm font-semibold text-primary-foreground transition-all hover:bg-accent-light hover:shadow-[0_0_32px_var(--accent-dim)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {status === "loading"
                  ? "Sending…"
                  : "Get a Call from My AI Assistant"}
              </button>
            </form>
          )}
        </div>

        <ol className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap sm:gap-2">
          {timelineSteps.map((step, i) => (
            <li
              key={step}
              className="flex items-center gap-3 text-xs font-medium tracking-[0.08em] text-text-secondary uppercase"
            >
              <span className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-accent-gold" aria-hidden />
                {step}
              </span>
              {i < timelineSteps.length - 1 && (
                <span className="text-muted-foreground" aria-hidden>
                  →
                </span>
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
