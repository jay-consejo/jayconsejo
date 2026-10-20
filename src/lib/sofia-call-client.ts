/**
 * Browser side of a call with Sofia over our voice relay. Framework-free: the UI hands in
 * how to sign, the audio graph and the socket factory, and gets back state changes and
 * captions. The order matters:
 * 1. sign (the server vets the lead and returns a 60 s ticket),
 * 2. open the mic (a permission prompt can take a while, so a ticket older than 45 s is
 *    replaced once),
 * 3. connect and send `start` straight away (the relay wants it within 5 s),
 * 4. send mic audio only after the relay says `ready`.
 */

export type Lead = { name: string; email: string; whatsapp: string };
export type SignedCall = { ticket: string; relayUrl: string; lead: Lead; expiresAt: number };
export type SignOutcome =
  | { ok: true; call: SignedCall }
  | { ok: false; status: number; code?: string; message: string };

export type EndReason = "goodbye" | "caller" | "silence" | "max_length";
export type FallbackReason = "unavailable" | "mic_blocked" | "error";

export type CallState =
  | { phase: "signing" }
  /** The server said no (bad details, already contacted, too many tries): show its message. */
  | { phase: "refused"; status: number; code?: string; message: string }
  | { phase: "connecting" }
  | {
      phase: "talking";
      startedAt: number;
      muted: boolean;
      /** From actual playback, so it's true exactly while Sofia can be heard. */
      sofiaSpeaking: boolean;
      /** The relay's own turn hint. */
      turn: "listening" | "speaking" | null;
    }
  | { phase: "ended"; reason: EndReason }
  | { phase: "busy" }
  /** `retry`: the call never started or lasted under 30 s, so offering "Try again" is fair. */
  | { phase: "fallback"; reason: FallbackReason; retry: boolean };

export type Caption = { id: string; role: "user" | "assistant"; text: string; final: boolean };

/** The audio graph, built by the UI (its AudioContext must be created inside the click). */
export interface CallAudio {
  /** Ask for the mic and get the worklets ready. Rejects if the mic is refused or missing. */
  openMic(): Promise<void>;
  /** Start delivering 16 kHz Int16 mic frames. */
  startSending(onFrame: (frame: ArrayBuffer) => void): void;
  /** Queue one 24 kHz Int16 frame from Sofia. */
  play(frame: ArrayBuffer): void;
  /** Drop queued audio at once. */
  flush(): void;
  /** Called whenever audible playback starts or stops. */
  onPlayback(cb: (playing: boolean) => void): void;
  /** Stop the mic tracks and close the context. */
  close(): void;
}

export type SocketHandlers = {
  open(): void;
  message(data: unknown): void;
  close(code: number, reason: string): void;
};
export interface SocketHandle {
  readonly readyState: number;
  readonly bufferedAmount: number;
  send(data: string | ArrayBuffer): void;
  close(code?: number, reason?: string): void;
}

type Timer = unknown;

export type CallDeps = {
  sign(): Promise<SignOutcome>;
  audio: CallAudio;
  connect(url: string, handlers: SocketHandlers): SocketHandle;
  onState(state: CallState): void;
  onCaptions(captions: Caption[]): void;
  /** Subscribe to the page being hidden or unloaded; returns an unsubscribe. */
  onPageHide?(cb: () => void): () => void;
  /** Development only: close codes and reasons. */
  debug?(line: string): void;
  now?(): number;
  setTimeout?(fn: () => void, ms: number): Timer;
  clearTimeout?(id: Timer): void;
};

export type CallControls = {
  hangup(): void;
  setMuted(muted: boolean): void;
};

const OPEN = 1;
const RESIGN_AFTER_MS = 45_000;
const READY_TIMEOUT_MS = 15_000;
const HANGUP_WAIT_MS = 2_000;
const GOODBYE_WAIT_MS = 15_000;
const RETRY_UNDER_MS = 30_000;
const MAX_BUFFERED_BYTES = 64 * 1024;
const RETRYABLE_4001 = new Set(["ticket_expired", "start_timeout"]);
const END_REASONS = new Set<string>(["goodbye", "caller", "silence", "max_length"]);

export const CLOSE = { normal: 4000, badTicket: 4001, busy: 4029, error: 4500 } as const;

/** Browser socket factory for `CallDeps.connect`. */
export function connectWebSocket(url: string, h: SocketHandlers): SocketHandle {
  const ws = new WebSocket(url);
  ws.binaryType = "arraybuffer";
  ws.onopen = () => h.open();
  ws.onmessage = (e) => h.message(e.data);
  ws.onclose = (e) => h.close(e.code, e.reason);
  return ws;
}

/** `CallDeps.sign` against the site's own endpoint. */
export function signWithApi(form: Lead, fetchFn: typeof fetch = fetch): () => Promise<SignOutcome> {
  return async () => {
    try {
      const res = await fetchFn("/api/sofia/sign", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      const call = res.ok ? parseSignedCall(body) : null;
      if (call) return { ok: true, call };
      const message = typeof body.message === "string" ? body.message : typeof body.error === "string" ? body.error : "";
      return { ok: false, status: res.status, code: typeof body.code === "string" ? body.code : undefined, message };
    } catch {
      return { ok: false, status: 0, message: "" };
    }
  };
}

function parseSignedCall(b: Record<string, unknown>): SignedCall | null {
  const lead = b.lead as Record<string, unknown> | undefined;
  if (typeof b.ticket !== "string" || typeof b.relayUrl !== "string" || typeof b.expiresAt !== "number") return null;
  if (!lead || typeof lead.name !== "string" || typeof lead.email !== "string" || typeof lead.whatsapp !== "string") {
    return null;
  }
  return {
    ticket: b.ticket,
    relayUrl: b.relayUrl,
    expiresAt: b.expiresAt,
    lead: { name: lead.name, email: lead.email, whatsapp: lead.whatsapp },
  };
}

export function startCall(deps: CallDeps): CallControls {
  const now = deps.now ?? (() => Date.now());
  const later = deps.setTimeout ?? ((fn: () => void, ms: number) => setTimeout(fn, ms));
  const cancel = deps.clearTimeout ?? ((id: Timer) => clearTimeout(id as ReturnType<typeof setTimeout>));
  const { audio } = deps;

  let done = false;
  let ending = false; // the call is over; waiting for Sofia's last words or the relay's close
  let hangingUp = false;
  let pendingEnd: EndReason | null = null;
  let readyTimer: Timer | null = null;
  let resigned = false;
  let ws: SocketHandle | null = null;
  let generation = 0; // ignores events from a socket we've replaced
  let ready = false;
  let startedAt = 0;
  let muted = false;
  let sofiaSpeaking = false;
  let turn: "listening" | "speaking" | null = null;
  let call: SignedCall | null = null;
  let signedAt = 0;
  const timers = new Set<Timer>();
  const captions = new Map<string, Caption>();

  const emit = (s: CallState) => {
    if (!done) deps.onState(s);
  };
  const emitTalking = () => {
    if (ready && !ending) emit({ phase: "talking", startedAt, muted, sofiaSpeaking, turn });
  };
  const after = (ms: number, fn: () => void) => {
    const id = later(() => {
      timers.delete(id);
      fn();
    }, ms);
    timers.add(id);
    return id;
  };
  const clearTimers = () => {
    for (const t of timers) cancel(t);
    timers.clear();
  };
  const sendJson = (m: Record<string, unknown>) => {
    if (ws && ws.readyState === OPEN) ws.send(JSON.stringify(m));
  };
  const unsubscribePageHide = deps.onPageHide?.(() => {
    sendJson({ type: "hangup" });
    finish({ phase: "ended", reason: "caller" });
  });

  /** The one way a call stops: settle the state, then release the socket and the audio. */
  function finish(state: CallState) {
    if (done) return;
    emit(state);
    done = true;
    clearTimers();
    unsubscribePageHide?.();
    if (ws && ws.readyState <= OPEN) ws.close(1000);
    ws = null;
    audio.close();
  }

  const retry = () => !ready || now() - startedAt < RETRY_UNDER_MS;
  const fallback = (reason: FallbackReason) => finish({ phase: "fallback", reason, retry: retry() });

  /** The relay ended the call: let Sofia's buffered goodbye play out, then thank the caller. */
  function endGracefully(reason: EndReason) {
    if (ending) return;
    ending = true;
    if (!sofiaSpeaking) return finish({ phase: "ended", reason });
    pendingEnd = reason;
    after(GOODBYE_WAIT_MS, () => finish({ phase: "ended", reason }));
  }

  audio.onPlayback((playing) => {
    sofiaSpeaking = playing;
    if (!playing && pendingEnd) return finish({ phase: "ended", reason: pendingEnd });
    emitTalking();
  });

  function onFrame(frame: ArrayBuffer) {
    if (done || ending || muted || !ready || !ws || ws.readyState !== OPEN) return;
    if (ws.bufferedAmount > MAX_BUFFERED_BYTES) return; // drop rather than fall behind
    ws.send(frame);
  }

  function onMessage(data: unknown) {
    if (data instanceof ArrayBuffer) {
      if (!ending) audio.play(data);
      return;
    }
    if (typeof data !== "string") return;
    let m: Record<string, unknown>;
    try {
      m = JSON.parse(data);
    } catch {
      return;
    }
    if (!m || typeof m !== "object") return;

    switch (m.type) {
      case "ready":
        if (ready) return;
        ready = true;
        startedAt = now();
        if (readyTimer !== null) cancel(readyTimer);
        audio.startSending(onFrame);
        emitTalking();
        return;
      case "caption": {
        // The relay numbers captions; keyed as strings so either form works.
        const { id, role, text, final } = m;
        if ((typeof id !== "number" && typeof id !== "string") || typeof text !== "string") return;
        if (role !== "user" && role !== "assistant") return;
        captions.set(String(id), { id: String(id), role, text, final: final === true });
        deps.onCaptions([...captions.values()]);
        return;
      }
      case "listening":
      case "speaking":
        turn = m.type;
        emitTalking();
        return;
      case "interrupted":
        audio.flush();
        return;
      case "ended":
        if (m.reason === "error") return fallback("error");
        return endGracefully(END_REASONS.has(m.reason as string) ? (m.reason as EndReason) : "goodbye");
      case "busy":
        return finish({ phase: "busy" });
      case "error":
        return fallback(m.code === "unavailable" ? "unavailable" : "error");
    }
  }

  function onClose(code: number, reason: string) {
    deps.debug?.(`[sofia] relay closed ${code} ${reason}`);
    ws = null;
    if (done) return;
    if (hangingUp) return finish({ phase: "ended", reason: "caller" });
    if (pendingEnd) return; // still playing her goodbye
    if (code === CLOSE.normal) return endGracefully(END_REASONS.has(reason) ? (reason as EndReason) : "goodbye");
    if (code === CLOSE.busy) return finish({ phase: "busy" });
    if (code === CLOSE.badTicket && !ready && !resigned && RETRYABLE_4001.has(reason)) {
      resigned = true;
      void sign().then((ok) => ok && connect());
      return;
    }
    fallback("error");
  }

  async function sign(): Promise<boolean> {
    const outcome = await deps.sign();
    if (done) return false;
    if (!outcome.ok) {
      const { status, code, message } = outcome;
      if (status === 400 || status === 409 || status === 429) {
        finish({ phase: "refused", status, code, message });
      } else {
        fallback(status === 503 ? "unavailable" : "error");
      }
      return false;
    }
    call = outcome.call;
    signedAt = now();
    return true;
  }

  function connect() {
    if (done || !call) return;
    const gen = ++generation;
    const { ticket, lead } = call;
    emit({ phase: "connecting" });
    ws = deps.connect(call.relayUrl, {
      open: () => {
        if (gen === generation && !done) sendJson({ type: "start", ticket, lead });
      },
      message: (data) => {
        if (gen === generation && !done) onMessage(data);
      },
      close: (code, reason) => {
        if (gen === generation) onClose(code, reason);
      },
    });
    if (readyTimer !== null) cancel(readyTimer);
    readyTimer = after(READY_TIMEOUT_MS, () => {
      if (!ready) fallback("error");
    });
  }

  async function run() {
    emit({ phase: "signing" });
    if (!(await sign())) return;
    try {
      await audio.openMic();
    } catch {
      return fallback("mic_blocked");
    }
    if (done) return;
    if (now() - signedAt > RESIGN_AFTER_MS) {
      resigned = true;
      if (!(await sign())) return;
    }
    connect();
  }

  void run();

  return {
    hangup() {
      if (done || hangingUp) return;
      hangingUp = true;
      ending = true;
      audio.flush();
      if (!ws || ws.readyState !== OPEN) return finish({ phase: "ended", reason: "caller" });
      // The relay answers with close 4000; if it doesn't within 2 s, close from this side.
      sendJson({ type: "hangup" });
      after(HANGUP_WAIT_MS, () => finish({ phase: "ended", reason: "caller" }));
    },
    setMuted(value) {
      muted = value;
      emitTalking();
    },
  };
}
