"use client";

import type { ReactNode } from "react";
import { CircleCheck, Clock, CloudOff, Mail, MicOff, PhoneOff, RotateCcw } from "lucide-react";
import type { CallState, Lead } from "@/lib/sofia-call-client";

const JAY_EMAIL = "consejo.jay@gmail.com";

type EndState = Extract<CallState, { phase: "ended" | "busy" | "fallback" | "refused" }>;

type Props = {
  state: EndState;
  lead: Lead;
  /** When Sofia picked up, or null if she never did. */
  startedAt: number | null;
  lengthSec: number | null;
  onRetry: () => void;
};

export function formatLength(sec: number): string {
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}

/** The thanks card and the cards for calls that can't happen or broke off. */
export function CallCards({ state, lead, startedAt, lengthSec, onRetry }: Props) {
  if (state.phase === "ended") {
    return (
      <div role="status" className="py-2 text-center">
        <Badge>
          <CircleCheck className="size-6.5" />
        </Badge>
        <h3 className="font-display text-2xl font-semibold text-foreground">Thanks, {lead.name}!</h3>
        <p className="mx-auto mt-2.5 max-w-lg text-text-secondary">
          Jay has your brief and will reach out within 24 hours. Booked a time? The invite is on its way to{" "}
          {lead.email}.
        </p>
        {lengthSec !== null && (
          <p className="mt-4.5 text-sm text-text-secondary">
            Call length <b className="font-medium text-foreground tabular-nums">{formatLength(lengthSec)}</b>
          </p>
        )}
        <p className="mx-auto mt-2.5 max-w-lg text-xs text-text-secondary">
          Something urgent? Email Jay at <EmailLink />.
        </p>
      </div>
    );
  }

  if (state.phase === "busy") {
    return (
      <Fallback icon={<Clock className="size-6.5" />} title="Sofia's on other calls right now" onRetry={onRetry}
        leave="Rather not wait? Jay will reach out within 24 hours. Or email him at">
        Try again in a few minutes. If you have a call open in another tab, close it first.
      </Fallback>
    );
  }

  if (state.phase === "fallback" && state.reason === "mic_blocked") {
    return (
      <Fallback icon={<MicOff className="size-6.5" />} title="Your microphone is blocked" onRetry={onRetry}
        leave="Rather not talk? Jay will reach out within 24 hours. Or email him at">
        Sofia needs your mic to hear you. To turn it on:
        <ol className="mx-auto mt-4.5 max-w-104 list-decimal space-y-1.5 pl-5 text-left text-sm">
          <li>Click the icon just left of the web address.</li>
          <li>
            Set <b className="font-medium text-foreground">Microphone</b> to{" "}
            <b className="font-medium text-foreground">Allow</b>.
          </li>
          <li>
            Press <b className="font-medium text-foreground">Try again</b>.
          </li>
        </ol>
        <span className="mt-2.5 block text-xs">
          On iPhone: tap the page-settings icon in the address bar → Website Settings → Microphone → Allow.
        </span>
      </Fallback>
    );
  }

  // Dropped mid-call vs never connected: a call that never started reads as "offline".
  if (state.phase === "fallback" && state.reason === "error" && startedAt !== null) {
    return (
      <Fallback icon={<PhoneOff className="size-6.5" />} title="The call dropped" onRetry={state.retry ? onRetry : undefined}
        leave={state.retry ? "Or skip it: Jay will reach out within 24 hours, or email him at" : "Jay will reach out within 24 hours. Or email him at"}>
        The connection was lost. Sorry about that.
      </Fallback>
    );
  }

  return (
    <Fallback icon={<CloudOff className="size-6.5" />} title="Sofia can't take calls right now"
      leave="Jay will reach out within 24 hours. Or email him at">
      She&apos;s offline for a moment. Please try again a little later.
    </Fallback>
  );
}

function Fallback({
  icon,
  title,
  children,
  leave,
  onRetry,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
  leave: string;
  onRetry?: () => void;
}) {
  return (
    <div role="alert" className="py-2 text-center">
      <Badge>{icon}</Badge>
      <h3 className="font-display text-2xl font-semibold text-foreground">{title}</h3>
      <div className="mx-auto mt-2.5 max-w-lg text-text-secondary">{children}</div>
      {onRetry && (
        <div className="mt-5.5 flex justify-center">
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex h-12 min-w-45 items-center justify-center gap-2 rounded-full bg-accent-gold px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-accent-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-text"
          >
            <RotateCcw className="size-5" aria-hidden />
            Try again
          </button>
        </div>
      )}
      <div className="mt-6 flex gap-3 rounded-xl border border-border-subtle bg-surface/60 p-4 text-left">
        <Mail className="mt-0.5 size-5 flex-none text-accent-gold" aria-hidden />
        <p className="text-sm text-text-secondary">
          {leave} <EmailLink />.
        </p>
      </div>
    </div>
  );
}

function Badge({ children }: { children: ReactNode }) {
  return (
    <div aria-hidden className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-accent-dim text-accent-gold">
      {children}
    </div>
  );
}

function EmailLink() {
  return (
    <a href={`mailto:${JAY_EMAIL}`} className="font-medium text-accent-text underline-offset-3 hover:underline">
      {JAY_EMAIL}
    </a>
  );
}
