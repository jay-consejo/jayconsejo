"use client";

import { useState, type FormEvent } from "react";
import Script from "next/script";
import { Mail } from "lucide-react";

const timelineSteps = [
  "You submit",
  "Talk to Sofia",
  "5-min project brief",
  "Meeting with Jay",
];

type Status = "idle" | "talking";
type Lead = { name: string; whatsapp: string; email: string };

export function Contact() {
  const [status, setStatus] = useState<Status>("idle");
  const [lead, setLead] = useState<Lead | null>(null);
  const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setLead({
      name: String(formData.get("name") ?? "").trim(),
      whatsapp: String(formData.get("whatsapp") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
    });
    setStatus("talking");
  }

  function resetToForm() {
    setStatus("idle");
    setLead(null);
  }

  return (
    <section
      id="contact"
      className="relative overflow-hidden px-6 py-24 md:py-32"
    >
      <Script
        src="https://unpkg.com/@elevenlabs/convai-widget-embed"
        strategy="afterInteractive"
      />
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
            Got 5 minutes? Talk to my AI Assistant right here for a quick brief.
          </p>
        </div>

        <div className="mt-12 rounded-2xl border border-border-subtle/80 bg-card/60 p-8 md:p-10">
          {status === "talking" && lead && agentId ? (
            <div className="space-y-5">
              <elevenlabs-convai
                agent-id={agentId}
                dynamic-variables={JSON.stringify(lead)}
              />
              <button
                type="button"
                onClick={resetToForm}
                className="text-xs font-medium tracking-[0.12em] text-text-secondary uppercase transition-colors hover:text-accent-gold"
              >
                ← Start over
              </button>
            </div>
          ) : status === "talking" && !agentId ? (
            <div className="py-6 text-center">
              <p className="font-display text-2xl font-semibold text-accent-gold">
                Almost there.
              </p>
              <p className="mt-3 text-text-secondary">
                The widget isn&apos;t configured yet — email{" "}
                <a
                  href="mailto:jay@jayconsejo.com"
                  className="text-accent-gold underline underline-offset-4 hover:text-accent-light"
                >
                  jay@jayconsejo.com
                </a>{" "}
                directly and I&apos;ll reply within the day.
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
                  placeholder="e.g. Maria Santos"
                  className="mt-2 flex h-12 w-full rounded-lg border border-border bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus-visible:border-accent-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold/30"
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
                    placeholder="+63 917 000 0000"
                    className="mt-2 flex h-12 w-full rounded-lg border border-border bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus-visible:border-accent-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold/30"
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
                    placeholder="maria@company.com"
                    className="mt-2 flex h-12 w-full rounded-lg border border-border bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus-visible:border-accent-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold/30"
                  />
                </div>
              </div>

              <div className="flex gap-3 rounded-xl border border-border-subtle bg-surface/60 p-4">
                <Mail className="mt-0.5 size-5 shrink-0 text-accent-gold" />
                <p className="text-sm leading-relaxed text-text-secondary">
                  Submit, and my{" "}
                  <strong className="text-foreground">AI Executive Assistant</strong>{" "}
                  will pick up right here in your browser. A 5-minute brief — no pitch — so I walk in ready.
                </p>
              </div>

              <button
                type="submit"
                className="inline-flex h-12 w-full items-center justify-center rounded-full bg-accent-gold px-6 text-sm font-semibold text-primary-foreground transition-all hover:bg-accent-light hover:shadow-[0_0_32px_var(--accent-dim)]"
              >
                Talk to My AI Assistant
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
