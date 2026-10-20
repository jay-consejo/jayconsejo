"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Mic, MicOff, PhoneOff } from "lucide-react";
import type { CallState, Caption, Lead } from "@/lib/sofia-call-client";
import type { SofiaCall as Call } from "@/components/use-sofia-call";
import { CallCards, formatLength } from "@/components/sofia-call-cards";

type Props = { call: Call; lead: Lead; onRetry: () => void };

/** Everything inside the contact card once a Nova call starts. */
export function SofiaCall({ call, lead, onRetry }: Props) {
  const { state } = call;
  if (!state) return null;
  if (state.phase === "signing" || state.phase === "mic" || state.phase === "connecting") {
    return <Progress phase={state.phase} />;
  }
  if (state.phase === "talking") {
    return <LiveCall state={state} captions={call.captions} onMute={call.setMuted} onHangup={call.hangup} />;
  }
  return <CallCards state={state} lead={lead} startedAt={call.startedAt} lengthSec={call.lengthSec} onRetry={onRetry} />;
}

const STEPS = ["Checking your details", "Allow your microphone", "Connecting to Sofia"];

function Progress({ phase }: { phase: "signing" | "mic" | "connecting" }) {
  const current = phase === "signing" ? 0 : phase === "mic" ? 1 : 2;
  return (
    <div role="status" className="py-2">
      <div className="text-center">
        <p className="font-display text-2xl font-semibold text-accent-text">
          {current === 0 ? "Preparing your call…" : "Almost there…"}
        </p>
        <p className="mt-2.5 text-text-secondary">
          {current === 0 ? "Sofia's warming up. One moment." : "Sofia picks up as soon as your mic is on."}
        </p>
      </div>
      <ol className="mx-auto mt-7 grid max-w-88 gap-3.5">
        {STEPS.map((label, i) => {
          const done = i < current;
          const now = i === current;
          return (
            <li key={label} className={`flex items-start gap-3 text-sm ${now ? "text-foreground" : "text-text-secondary"}`}>
              <span
                aria-hidden
                className={`grid size-6 flex-none place-items-center rounded-full border-2 ${
                  done
                    ? "border-accent-gold bg-accent-gold text-primary-foreground"
                    : now
                      ? "border-accent-dim border-t-accent-gold motion-safe:animate-spin"
                      : "border-border"
                }`}
              >
                {done && <Check className="size-3.5" strokeWidth={3} />}
              </span>
              <div className="pt-0.5">
                <b className="block font-medium">
                  {label}
                  <span className="sr-only">{done ? " (done)" : now ? " (in progress)" : ""}</span>
                </b>
                {now && i === 1 && (
                  <span className="mt-0.5 block text-sm text-text-secondary">
                    Your browser is asking. Choose <strong className="font-semibold text-foreground">Allow</strong>.
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

type Talking = Extract<CallState, { phase: "talking" }>;

function LiveCall({
  state,
  captions,
  onMute,
  onHangup,
}: {
  state: Talking;
  captions: Caption[];
  onMute: (muted: boolean) => void;
  onHangup: () => void;
}) {
  const elapsed = useElapsed(state.startedAt);
  const list = useRef<HTMLOListElement | null>(null);
  // Whether the caller was at the newest line before this update; scrolling up to read stops the follow.
  const following = useRef(true);
  const lastSofia = [...captions].reverse().find((c) => c.role === "assistant" && c.final);

  useEffect(() => {
    const el = list.current;
    if (el && following.current) el.scrollTop = el.scrollHeight;
  }, [captions]);

  // Stay on the newest line when the list changes size (rotation, window resize).
  useEffect(() => {
    const el = list.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      if (following.current) el.scrollTop = el.scrollHeight;
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div>
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <div aria-hidden className="grid size-11 flex-none place-items-center rounded-full bg-accent-dim font-display text-2xl leading-none font-semibold text-accent-text">
          S
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display text-xl leading-tight font-semibold text-foreground">Sofia</p>
          <p className="text-sm text-text-secondary">Jay&apos;s AI assistant</p>
        </div>
        <p className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.12em] text-text-secondary uppercase">
          <span aria-hidden className="sofia-rec size-2 rounded-full bg-accent-gold" />
          <span className="sr-only">Call time</span>
          <time className="tracking-[0.04em] text-foreground tabular-nums">{elapsed}</time>
        </p>
      </div>

      <div aria-hidden className="flex items-center gap-3 py-4">
        <div className="sofia-bars flex h-7 items-center gap-1" data-talking={state.sofiaSpeaking || undefined}>
          <i />
          <i />
          <i />
          <i />
          <i />
        </div>
        <p className="text-sm font-medium text-foreground">
          {state.sofiaSpeaking ? "Sofia is talking" : "Sofia is listening"}
          <span className="block font-normal text-text-secondary">
            {state.sofiaSpeaking ? "Just talk to interrupt her" : "Take your time"}
          </span>
        </p>
      </div>

      {state.muted && (
        <div role="status" className="mb-3.5 flex items-center gap-2.5 rounded-lg bg-accent-dim px-3.5 py-2.5 text-sm text-foreground">
          <MicOff className="size-5 flex-none text-accent-gold" aria-hidden />
          You&apos;re muted. Sofia can&apos;t hear you.
        </div>
      )}

      <ol
        ref={list}
        onScroll={(e) => {
          const el = e.currentTarget;
          following.current = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
        }}
        tabIndex={0}
        aria-label="Live captions"
        className="sofia-captions grid max-h-75 gap-3.5 overflow-y-auto rounded-lg pt-2 pr-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-gold"
      >
        {captions.map((c) => (
          <li key={c.id} className="grid gap-0.5 text-base leading-relaxed sm:gap-3">
            <span className={`pt-1 text-xs font-semibold tracking-[0.14em] uppercase ${c.role === "assistant" ? "text-accent-text" : "text-text-secondary"}`}>
              {c.role === "assistant" ? "Sofia" : "You"}
            </span>
            <span
              data-pending={c.final ? undefined : ""}
              className={c.role === "assistant" && c.final ? "text-foreground" : "text-text-secondary"}
            >
              {c.text}
            </span>
          </li>
        ))}
      </ol>
      <div className="sr-only" aria-live="polite">
        {lastSofia ? `Sofia: ${lastSofia.text}` : ""}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-5 sm:flex sm:justify-between">
        <button
          type="button"
          onClick={() => onMute(!state.muted)}
          className={`inline-flex h-12 items-center justify-center gap-2 rounded-full border px-6 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-gold sm:min-w-40 ${
            state.muted
              ? "border-accent-gold bg-surface text-accent-text"
              : "border-border text-foreground hover:border-accent-gold"
          }`}
        >
          {state.muted ? <MicOff className="size-5" aria-hidden /> : <Mic className="size-5" aria-hidden />}
          {state.muted ? "Unmute" : "Mute"}
        </button>
        <button
          type="button"
          onClick={onHangup}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-destructive px-6 text-sm font-semibold text-background transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-gold sm:min-w-40"
        >
          <PhoneOff className="size-5" aria-hidden />
          Hang up
        </button>
      </div>
      <p className="mt-3.5 text-center text-xs text-text-secondary sm:text-left">Recorded so Jay can follow up.</p>
    </div>
  );
}

function useElapsed(since: number): string {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return formatLength(Math.max(0, Math.floor((now - since) / 1000)));
}
