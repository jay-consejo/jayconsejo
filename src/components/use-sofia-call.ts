"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createCallAudio } from "@/lib/sofia-audio";
import type { CallControls, CallState, Caption, Lead } from "@/lib/sofia-call-client";

export type SofiaCall = {
  state: CallState | null;
  captions: Caption[];
  /** Set once Sofia picked up; the fallback cards tell "dropped" from "never connected". */
  startedAt: number | null;
  /** Length of the finished call in seconds, for the thanks card. */
  lengthSec: number | null;
  /** Call from the click or submit handler itself, before any `await`. */
  start(lead: Lead): void;
  hangup(): void;
  setMuted(muted: boolean): void;
  reset(): void;
};

/** `onChange` hears every state change as it happens (for the page-wide Sofia status). */
export function useSofiaCall(onChange?: (state: CallState) => void): SofiaCall {
  const [state, setState] = useState<CallState | null>(null);
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [lengthSec, setLengthSec] = useState<number | null>(null);
  const controls = useRef<CallControls | null>(null);
  const started = useRef<number | null>(null);
  const listener = useRef(onChange);
  useEffect(() => {
    listener.current = onChange;
  });

  const onState = useCallback((s: CallState) => {
    if (s.phase === "talking" && started.current === null) {
      started.current = s.startedAt;
      setStartedAt(s.startedAt);
    }
    if (s.phase === "ended" && started.current !== null) {
      setLengthSec(Math.round((Date.now() - started.current) / 1000));
    }
    setState(s);
    listener.current?.(s);
  }, []);

  const start = useCallback(
    (lead: Lead) => {
      controls.current?.hangup();
      // Created here, inside the user's gesture, so iOS lets it play.
      const audio = createCallAudio();
      started.current = null;
      setStartedAt(null);
      setLengthSec(null);
      setCaptions([]);
      onState({ phase: "signing" });

      import("@/lib/sofia-call-client")
        .then(({ startCall, signWithApi, connectWebSocket }) => {
          controls.current = startCall({
            sign: signWithApi(lead),
            audio,
            connect: connectWebSocket,
            onState,
            onCaptions: setCaptions,
            onPageHide: (cb) => {
              window.addEventListener("pagehide", cb);
              return () => window.removeEventListener("pagehide", cb);
            },
            debug: process.env.NODE_ENV === "development" ? (line) => console.debug(line) : undefined,
          });
        })
        .catch(() => {
          audio.close();
          onState({ phase: "fallback", reason: "unavailable", retry: false });
        });
    },
    [onState],
  );

  useEffect(() => () => controls.current?.hangup(), []);

  return {
    state,
    captions,
    startedAt,
    lengthSec,
    start,
    hangup: () => controls.current?.hangup(),
    setMuted: (muted) => controls.current?.setMuted(muted),
    reset: () => {
      controls.current = null;
      setState(null);
      setCaptions([]);
    },
  };
}
