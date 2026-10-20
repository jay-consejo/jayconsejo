"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import dynamic from "next/dynamic";
import Script from "next/script";
import { CheckCircle2, Mail } from "lucide-react";
import parsePhoneNumberFromString from "libphonenumber-js";
import PhoneInput, { type Country } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { CountrySelect } from "@/components/country-select";
import { useSofiaState, type SofiaStatus } from "@/components/sofia-state";
import { useSofiaCall } from "@/components/use-sofia-call";
import type { CallState } from "@/lib/sofia-call-client";

// Loaded on first use, so the call screen doesn't add to the homepage bundle.
const SofiaCall = dynamic(() => import("@/components/sofia-call").then((m) => m.SofiaCall));

/** The page-wide status (it hides the floating Sofia button) for each call phase. */
const STATUS_FOR: Record<CallState["phase"], SofiaStatus> = {
  signing: "signing",
  mic: "signing",
  connecting: "connecting",
  talking: "talking",
  ended: "locked",
  busy: "busy",
  fallback: "fallback",
  refused: "error",
};

const timelineSteps = [
  "You submit",
  "Talk to Sofia",
  "Project brief",
  "Meeting with Jay",
];

type Lead = { name: string; whatsapp: string; email: string };
type FieldErrors = Partial<Record<keyof Lead, string>>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const DISCONNECT_EVENTS = [
  "elevenlabs-convai:call-ended",
  "elevenlabs-convai:disconnect",
  "call-ended",
  "disconnect",
] as const;

type ValidationResult =
  | { ok: true; lead: Lead }
  | { ok: false; errors: FieldErrors };

function validateLead(
  formData: FormData,
  whatsappValue: string,
): ValidationResult {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const errors: FieldErrors = {};

  if (name.length < 2) {
    errors.name = "Please enter your name (2+ characters).";
  }
  if (!EMAIL_REGEX.test(email)) {
    errors.email = "Please enter a valid email (e.g., you@example.com).";
  }

  const parsed = parsePhoneNumberFromString(whatsappValue);
  if (!parsed?.isValid()) {
    errors.whatsapp =
      "Please enter a valid WhatsApp number.";
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, lead: { name, email, whatsapp: parsed!.number } };
}

export function Contact({
  defaultCountry = "PH",
  provider = "elevenlabs",
}: {
  defaultCountry?: string;
  provider?: "nova" | "elevenlabs";
}) {
  const { status, setStatus } = useSofiaState();
  const [lead, setLead] = useState<Lead | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [whatsapp, setWhatsapp] = useState<string>(lead?.whatsapp ?? "");
  const widgetContainerRef = useRef<HTMLDivElement | null>(null);
  const nova = provider === "nova";
  const call = useSofiaCall((s) => {
    if (s.phase === "refused") {
      if (s.status === 409) {
        setServerMessage(s.message || "We already have your info — Jay will reach out within 24 hours.");
        setStatus("already_contacted");
        return;
      }
      setErrorMsg(
        s.status === 429 ? "Too many attempts — please wait a few minutes." : s.message || "Please check your info.",
      );
    }
    setStatus(STATUS_FOR[s.phase]);
  });
  const novaPhase = nova && call.state && call.state.phase !== "refused" ? call.state.phase : null;
  // The progress strip under the card: 0 submit, 1 talk, 2 brief. Hidden on the fallback cards.
  const stripStep =
    novaPhase === "busy" || novaPhase === "fallback" ? null : novaPhase === "ended" ? 2 : novaPhase ? 1 : 0;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const result = validateLead(new FormData(e.currentTarget), whatsapp);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    setLead(result.lead);
    setErrorMsg(null);
    if (nova) {
      // Before any await: the call's audio has to start inside this gesture.
      call.start(result.lead);
      return;
    }
    setStatus("signing");

    try {
      const res = await fetch("/api/sofia/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.lead),
      });

      if (res.status === 409) {
        const body = (await res.json().catch(() => ({}))) as {
          message?: string;
        };
        setServerMessage(
          body.message ||
            "We already have your info — Jay will reach out within 24 hours.",
        );
        setStatus("already_contacted");
        return;
      }

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        setErrorMsg(
          res.status === 429
            ? "Too many attempts — please wait a few minutes."
            : res.status === 400
              ? body.error || "Please check your info."
              : "Couldn't start the call. Please try again.",
        );
        setStatus("error");
        return;
      }
      const data = (await res.json()) as { signedUrl?: string };
      if (!data.signedUrl) {
        setErrorMsg("Couldn't start the call. Please try again.");
        setStatus("error");
        return;
      }
      setSignedUrl(data.signedUrl);
      setStatus("talking");
    } catch {
      setErrorMsg("Network issue. Please try again.");
      setStatus("error");
    }
  }

  function endCall() {
    setSignedUrl(null);
    setStatus("locked");
  }

  useEffect(() => {
    if (status !== "talking") return;
    const container = widgetContainerRef.current;
    if (!container) return;

    let cleanupFns: Array<() => void> = [];

    const attachListeners = () => {
      const widget = container.querySelector("elevenlabs-convai");
      if (!widget) return false;
      const onEnd = (e: Event) => {
        console.log(`[sofia] widget disconnect event: ${e.type}`);
        setSignedUrl(null);
        setStatus("locked");
      };
      DISCONNECT_EVENTS.forEach((name) => {
        widget.addEventListener(name, onEnd as EventListener);
        cleanupFns.push(() =>
          widget.removeEventListener(name, onEnd as EventListener),
        );
      });
      return true;
    };

    if (!attachListeners()) {
      const obs = new MutationObserver(() => {
        if (attachListeners()) obs.disconnect();
      });
      obs.observe(container, { childList: true, subtree: true });
      cleanupFns.push(() => obs.disconnect());
    }

    return () => {
      cleanupFns.forEach((fn) => fn());
      cleanupFns = [];
    };
  }, [status, signedUrl, setStatus]);

  return (
    <section
      id="contact"
      className="relative overflow-hidden px-6 py-24 md:py-32"
    >
      {!nova && (
        <Script
          src="https://unpkg.com/@elevenlabs/convai-widget-embed@0.11.7/dist/index.js"
          integrity="sha384-x7yFJgvQnkRfmQmewthtfovrSJn8TUMndQFtIm/KEsTdZcIUBh5kZwXKZ9RLXJ6y"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      )}
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
            Tell my AI Assistant about your project, right here on this page.
          </p>
        </div>

        <div
          className={`mt-12 rounded-2xl border border-border-subtle/80 bg-card/60 md:p-10 ${novaPhase === "talking" ? "p-5" : "p-8"}`}
        >
          {novaPhase && lead ? (
            <SofiaCall call={call} lead={lead} onRetry={() => call.start(lead)} />
          ) : status === "locked" || status === "already_contacted" ? (
            <div className="space-y-4 py-4 text-center">
              <CheckCircle2 className="mx-auto size-12 text-accent-gold" aria-hidden />
              <h3 className="font-display text-2xl font-semibold text-foreground">
                {status === "locked"
                  ? `Thanks, ${lead?.name ?? "there"}!`
                  : "We already have your info"}
              </h3>
              <p className="text-text-secondary">
                {status === "locked"
                  ? `Jay will reach out within 24 hours. Check your email${lead?.email ? ` (${lead.email})` : ""} for the meeting invite — sender is consejo.jay@gmail.com.`
                  : (serverMessage ?? "Jay will reach out within 24 hours.")}
              </p>
              <p className="text-xs text-text-secondary/70">
                If something urgent came up, reply to the invite email.
              </p>
            </div>
          ) : status === "talking" && signedUrl && lead ? (
            <div ref={widgetContainerRef} className="space-y-5">
              <elevenlabs-convai
                signed-url={signedUrl}
                dynamic-variables={JSON.stringify(lead)}
                variant="expanded"
                default-expanded="true"
                dismissible="false"
              />
              <button
                type="button"
                onClick={endCall}
                className="text-xs font-medium tracking-[0.12em] text-text-secondary uppercase transition-colors hover:text-accent-gold"
              >
                End call
              </button>
            </div>
          ) : status === "signing" ? (
            <div className="py-10 text-center">
              <p className="font-display text-2xl font-semibold text-accent-gold">
                Preparing your call…
              </p>
              <p className="mt-3 text-text-secondary">
                Sofia&apos;s warming up. One moment.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {status === "error" && errorMsg && (
                <div
                  role="alert"
                  className="rounded-lg border border-red-500/40 bg-red-500/8 px-4 py-3 text-sm text-red-400"
                >
                  {errorMsg}
                </div>
              )}
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
                  minLength={2}
                  maxLength={80}
                  autoComplete="name"
                  defaultValue={lead?.name ?? ""}
                  aria-invalid={errors.name ? true : undefined}
                  aria-describedby={errors.name ? "name-error" : undefined}
                  placeholder="e.g. Maria Santos"
                  className="mt-2 flex h-12 w-full rounded-lg border border-border bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus-visible:border-accent-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold/30 aria-[invalid=true]:border-red-500/70 aria-[invalid=true]:focus-visible:ring-red-500/30"
                />
                {errors.name && (
                  <p id="name-error" className="mt-1.5 text-xs text-red-500">
                    {errors.name}
                  </p>
                )}
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="whatsapp"
                    className="text-xs font-medium tracking-[0.12em] text-text-secondary uppercase"
                  >
                    WhatsApp Number
                  </label>
                  <PhoneInput
                    id="whatsapp"
                    international
                    defaultCountry={defaultCountry as Country}
                    value={whatsapp}
                    onChange={(v) => setWhatsapp(v ?? "")}
                    autoComplete="tel"
                    aria-invalid={errors.whatsapp ? true : undefined}
                    aria-describedby={errors.whatsapp ? "whatsapp-error" : undefined}
                    placeholder="917 555 0123"
                    countrySelectComponent={CountrySelect}
                    className={`jc-phone-input mt-2${errors.whatsapp ? " is-invalid" : ""}`}
                  />
                  {errors.whatsapp && (
                    <p id="whatsapp-error" className="mt-1.5 text-xs text-red-500">
                      {errors.whatsapp}
                    </p>
                  )}
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
                    maxLength={254}
                    autoComplete="email"
                    defaultValue={lead?.email ?? ""}
                    aria-invalid={errors.email ? true : undefined}
                    aria-describedby={errors.email ? "email-error" : undefined}
                    placeholder="maria@company.com"
                    className="mt-2 flex h-12 w-full rounded-lg border border-border bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus-visible:border-accent-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold/30 aria-[invalid=true]:border-red-500/70 aria-[invalid=true]:focus-visible:ring-red-500/30"
                  />
                  {errors.email && (
                    <p id="email-error" className="mt-1.5 text-xs text-red-500">
                      {errors.email}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 rounded-xl border border-border-subtle bg-surface/60 p-4">
                <Mail className="mt-0.5 size-5 shrink-0 text-accent-gold" />
                {nova ? (
                  <div>
                    <FormNote />
                    <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                      Your browser will ask to use your microphone. The call is recorded so I can follow up.
                    </p>
                  </div>
                ) : (
                  <FormNote />
                )}
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

        {nova ? (
          stripStep !== null && <ProgressStrip current={stripStep} />
        ) : (
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
        )}
      </div>
    </section>
  );
}

function FormNote() {
  return (
    <p className="text-sm leading-relaxed text-text-secondary">
      Submit, and my{" "}
      <strong className="text-foreground">AI Executive Assistant</strong>{" "}
      will pick up right here in your browser. A short brief — no pitch — so I walk in ready.
    </p>
  );
}

/** The four steps under the card, marking where the visitor is. */
function ProgressStrip({ current }: { current: number }) {
  return (
    <ol className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap sm:gap-2">
      {timelineSteps.map((label, i) => (
        <li
          key={label}
          aria-current={i === current ? "step" : undefined}
          className={`flex items-center gap-3 text-xs font-medium tracking-[0.08em] uppercase ${i === current ? "text-foreground" : "text-text-secondary"}`}
        >
          <span className="flex items-center gap-2">
            <span
              aria-hidden
              className={`size-2 rounded-full border-2 ${
                i <= current ? "border-accent-gold bg-accent-gold" : "border-border"
              } ${i === current ? "ring-3 ring-accent-dim" : ""}`}
            />
            {label}
          </span>
          {i < timelineSteps.length - 1 && (
            <span className="hidden text-muted-foreground sm:inline" aria-hidden>
              →
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}
