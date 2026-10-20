import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  type CallAudio,
  type CallState,
  type Caption,
  type SignOutcome,
  type SocketHandle,
  type SocketHandlers,
  startCall,
} from "./sofia-call-client.ts";

const LEAD = { name: "Ana Reyes", email: "ana@example.com", whatsapp: "+639171234567" };
const RELAY = "wss://relay.example.test/call";

class FakeClock {
  now = 1_000_000;
  private timers = new Map<number, { at: number; fn: () => void }>();
  private next = 1;
  setTimeout = (fn: () => void, ms: number) => {
    const id = this.next++;
    this.timers.set(id, { at: this.now + ms, fn });
    return id;
  };
  clearTimeout = (id: unknown) => {
    this.timers.delete(id as number);
  };
  advance(ms: number) {
    const until = this.now + ms;
    for (;;) {
      const due = [...this.timers.entries()].filter(([, t]) => t.at <= until).sort((a, b) => a[1].at - b[1].at)[0];
      if (!due) break;
      this.timers.delete(due[0]);
      this.now = due[1].at;
      due[1].fn();
    }
    this.now = until;
  }
}

class FakeSocket implements SocketHandle {
  readyState = 0;
  bufferedAmount = 0;
  sent: (string | ArrayBuffer)[] = [];
  closedWith: { code?: number; reason?: string } | null = null;
  readonly url: string;
  private readonly h: SocketHandlers;
  constructor(url: string, handlers: SocketHandlers) {
    this.url = url;
    this.h = handlers;
  }
  send(data: string | ArrayBuffer) {
    this.sent.push(data);
  }
  close(code?: number, reason?: string) {
    this.closedWith = { code, reason };
    this.readyState = 3;
  }
  // relay side
  open() {
    this.readyState = 1;
    this.h.open();
  }
  msg(m: Record<string, unknown>) {
    this.h.message(JSON.stringify(m));
  }
  raw(data: unknown) {
    this.h.message(data);
  }
  binary(buf: ArrayBuffer) {
    this.h.message(buf);
  }
  serverClose(code: number, reason = "") {
    this.readyState = 3;
    this.h.close(code, reason);
  }
  json() {
    return this.sent.filter((s): s is string => typeof s === "string").map((s) => JSON.parse(s));
  }
  frames() {
    return this.sent.filter((s) => s instanceof ArrayBuffer);
  }
}

class FakeAudio implements CallAudio {
  log: string[] = [];
  played: ArrayBuffer[] = [];
  micError: Error | null = null;
  micDelayMs = 0;
  sendFrame: ((f: ArrayBuffer) => void) | null = null;
  private playbackCb: ((playing: boolean) => void) | null = null;
  private readonly clock: FakeClock;
  constructor(clock: FakeClock) {
    this.clock = clock;
  }
  async openMic() {
    this.log.push("openMic");
    this.clock.now += this.micDelayMs;
    if (this.micError) throw this.micError;
  }
  startSending(onFrame: (f: ArrayBuffer) => void) {
    this.log.push("startSending");
    this.sendFrame = onFrame;
  }
  play(frame: ArrayBuffer) {
    this.played.push(frame);
  }
  flush() {
    this.log.push("flush");
  }
  onPlayback(cb: (playing: boolean) => void) {
    this.playbackCb = cb;
  }
  close() {
    this.log.push("close");
  }
  setPlaying(playing: boolean) {
    this.playbackCb?.(playing);
  }
  closes() {
    return this.log.filter((l) => l === "close").length;
  }
}

const tick = () => new Promise((r) => setImmediate(r));

function setup(opts: { signs?: SignOutcome[]; debug?: boolean } = {}) {
  const clock = new FakeClock();
  const audio = new FakeAudio(clock);
  const sockets: FakeSocket[] = [];
  const states: CallState[] = [];
  let captions: Caption[] = [];
  const debugLines: string[] = [];
  let signCount = 0;
  let pageHide: (() => void) | null = null;
  const signs = opts.signs ?? [];
  const call = startCall({
    sign: async () => {
      const outcome = signs[signCount] ?? {
        ok: true,
        call: { ticket: `ticket-${signCount + 1}`, relayUrl: RELAY, lead: LEAD, expiresAt: clock.now + 60_000 },
      };
      signCount++;
      return outcome;
    },
    audio,
    connect: (url, handlers) => {
      const s = new FakeSocket(url, handlers);
      sockets.push(s);
      return s;
    },
    now: () => clock.now,
    setTimeout: clock.setTimeout,
    clearTimeout: clock.clearTimeout,
    onState: (s) => states.push(s),
    onCaptions: (c) => (captions = c),
    onPageHide: (cb) => {
      pageHide = cb;
      return () => (pageHide = null);
    },
    debug: opts.debug ? (line) => debugLines.push(line) : undefined,
  });
  return {
    call,
    clock,
    audio,
    sockets,
    states,
    get captions() {
      return captions;
    },
    get state() {
      return states.at(-1);
    },
    get signCount() {
      return signCount;
    },
    get pageHide() {
      return pageHide;
    },
    debugLines,
    get ws() {
      return sockets.at(-1)!;
    },
  };
}

/** Sign, mic, socket open, `ready`: a live call. */
async function live(opts?: Parameters<typeof setup>[0]) {
  const t = setup(opts);
  await tick();
  t.ws.open();
  t.ws.msg({ type: "ready" });
  return t;
}

describe("call client: setup", () => {
  it("signs, opens the mic, then connects and sends the vetted lead with the ticket", async () => {
    const t = setup();
    assert.equal(t.states[0]?.phase, "signing");
    await tick();
    assert.deepEqual(t.audio.log, ["openMic"]);
    assert.deepEqual(t.states.map((s) => s.phase), ["signing", "mic", "connecting"]);
    assert.equal(t.ws.url, RELAY);
    assert.deepEqual(t.ws.sent, []);
    t.ws.open();
    assert.deepEqual(t.ws.json(), [{ type: "start", ticket: "ticket-1", lead: LEAD }]);
  });

  it("shows the sign refusal for 400, 409 and 429, with no mic and no socket", async () => {
    for (const status of [400, 409, 429]) {
      const t = setup({ signs: [{ ok: false, status, code: status === 409 ? "already_contacted" : undefined, message: "m" }] });
      await tick();
      assert.deepEqual(t.state, { phase: "refused", status, code: status === 409 ? "already_contacted" : undefined, message: "m" });
      assert.deepEqual(t.sockets, []);
      assert.ok(!t.audio.log.includes("openMic"));
      assert.equal(t.audio.closes(), 1);
    }
  });

  it("falls back as unavailable on 503 or code unavailable, and as an error on 502 or a network failure", async () => {
    const cases: [number, string, string?][] = [[503, "unavailable"], [200, "unavailable", "unavailable"], [502, "error"], [0, "error"]];
    for (const [status, reason, code] of cases) {
      const t = setup({ signs: [{ ok: false, status, code, message: "m" }] });
      await tick();
      assert.deepEqual(t.state, { phase: "fallback", reason, retry: true }, String(status));
      assert.deepEqual(t.sockets, []);
    }
  });

  it("shows the mic-blocked card when the mic is refused, without touching the relay", async () => {
    const t = setup();
    t.audio.micError = Object.assign(new Error("denied"), { name: "NotAllowedError" });
    await tick();
    assert.deepEqual(t.state, { phase: "fallback", reason: "mic_blocked", retry: true });
    assert.deepEqual(t.sockets, []);
    assert.equal(t.audio.closes(), 1);
  });

  it("signs again before connecting when the mic prompt took over 45 s", async () => {
    const t = setup();
    t.audio.micDelayMs = 46_000;
    await tick();
    assert.equal(t.signCount, 2);
    t.ws.open();
    assert.equal(t.ws.json()[0].ticket, "ticket-2");
  });

  it("falls back if the relay never says ready", async () => {
    const t = setup();
    await tick();
    t.ws.open();
    t.clock.advance(15_000);
    assert.deepEqual(t.state, { phase: "fallback", reason: "error", retry: true });
    assert.ok(t.ws.closedWith);
    assert.equal(t.audio.closes(), 1);
  });
});

describe("call client: relay events", () => {
  it("ready starts the mic and the call timer", async () => {
    const t = await live();
    assert.ok(t.audio.log.includes("startSending"));
    assert.deepEqual(t.state, { phase: "talking", startedAt: t.clock.now, muted: false, sofiaSpeaking: false, turn: null });
  });

  it("plays binary frames", async () => {
    const t = await live();
    const frame = new ArrayBuffer(960);
    t.ws.binary(frame);
    assert.deepEqual(t.audio.played, [frame]);
  });

  it("keeps captions in first-seen order and replaces text by id", async () => {
    const t = await live();
    // The relay numbers its captions.
    t.ws.msg({ type: "caption", id: 1, role: "assistant", text: "Hi Ana,", final: false });
    t.ws.msg({ type: "caption", id: 2, role: "user", text: "Hi", final: true });
    t.ws.msg({ type: "caption", id: 1, role: "assistant", text: "Hi Ana, I'm Sofia.", final: true });
    t.ws.msg({ type: "caption", id: 2, role: "user", text: "Hi there", final: true });
    assert.deepEqual(t.captions, [
      { id: "1", role: "assistant", text: "Hi Ana, I'm Sofia.", final: true },
      { id: "2", role: "user", text: "Hi there", final: true },
    ]);
    t.ws.msg({ type: "caption", id: 3, role: "assistant", text: "So", final: false });
    assert.deepEqual(t.captions.at(-1), { id: "3", role: "assistant", text: "So", final: false });
    t.ws.msg({ type: "caption", id: "4", role: "assistant", text: "string ids work too", final: true });
    assert.equal(t.captions.length, 4);
  });

  it("ignores malformed messages", async () => {
    const t = await live();
    t.ws.raw("{not json");
    t.ws.raw(new Blob(["x"]));
    t.ws.msg({ type: "caption", id: null, role: "assistant", text: "x" });
    t.ws.msg({ type: "caption", id: 5, role: "system", text: "x" });
    t.ws.msg({ type: "caption", id: 6, role: "assistant" });
    t.ws.msg({ type: "something-new" });
    assert.deepEqual(t.captions, []);
    assert.equal(t.state?.phase, "talking");
  });

  it("listening and speaking are hints; playback decides when Sofia is talking", async () => {
    const t = await live();
    t.ws.msg({ type: "speaking" });
    assert.equal(t.state?.phase === "talking" && t.state.turn, "speaking");
    assert.equal(t.state?.phase === "talking" && t.state.sofiaSpeaking, false);
    t.audio.setPlaying(true);
    assert.equal(t.state?.phase === "talking" && t.state.sofiaSpeaking, true);
    t.ws.msg({ type: "listening" });
    assert.equal(t.state?.phase === "talking" && t.state.sofiaSpeaking, true, "still playing");
    t.audio.setPlaying(false);
    assert.equal(t.state?.phase === "talking" && t.state.sofiaSpeaking, false);
  });

  it("interrupted flushes playback at once", async () => {
    const t = await live();
    t.ws.msg({ type: "interrupted" });
    assert.equal(t.audio.log.at(-1), "flush");
  });

  for (const reason of ["goodbye", "caller", "silence", "max_length"]) {
    it(`ended ${reason} shows the thanks card once Sofia's last words have played`, async () => {
      const t = await live();
      t.audio.setPlaying(true);
      t.ws.msg({ type: "ended", reason });
      t.ws.serverClose(4000, reason);
      assert.equal(t.state?.phase, "talking", "still playing her goodbye");
      assert.equal(t.audio.closes(), 0);
      t.audio.setPlaying(false);
      assert.deepEqual(t.state, { phase: "ended", reason });
      assert.equal(t.audio.closes(), 1);
    });
  }

  it("ended waits at most 15 s for playback", async () => {
    const t = await live();
    t.audio.setPlaying(true);
    t.ws.msg({ type: "ended", reason: "goodbye" });
    t.clock.advance(15_000);
    assert.deepEqual(t.state, { phase: "ended", reason: "goodbye" });
  });

  it("stops sending mic frames once the call has ended", async () => {
    const t = await live();
    t.audio.setPlaying(true);
    t.ws.msg({ type: "ended", reason: "goodbye" });
    t.audio.sendFrame?.(new ArrayBuffer(1024));
    assert.equal(t.ws.frames().length, 0);
  });

  it("ended error goes to the fallback", async () => {
    const t = await live();
    t.ws.msg({ type: "ended", reason: "error" });
    assert.deepEqual(t.state, { phase: "fallback", reason: "error", retry: true });
  });

  it("busy shows the busy card, and the 4029 close that follows changes nothing", async () => {
    const t = setup();
    await tick();
    t.ws.open();
    t.ws.msg({ type: "busy" });
    t.ws.serverClose(4029, "busy");
    assert.deepEqual(t.state, { phase: "busy" });
    assert.equal(t.states.filter((s) => s.phase === "busy").length, 1);
    assert.equal(t.audio.closes(), 1);
  });

  it("error goes to the fallback as unavailable, and the ended + 4500 after it change nothing", async () => {
    const t = await live();
    t.ws.msg({ type: "error", code: "unavailable" });
    t.ws.msg({ type: "ended", reason: "error" });
    t.ws.serverClose(4500, "error");
    assert.deepEqual(t.state, { phase: "fallback", reason: "unavailable", retry: true });
    assert.equal(t.audio.closes(), 1);
  });
});

describe("call client: close codes", () => {
  it("4000 with no ended message still ends the call", async () => {
    const t = await live();
    t.ws.serverClose(4000, "goodbye");
    assert.deepEqual(t.state, { phase: "ended", reason: "goodbye" });
  });

  for (const reason of ["ticket_expired", "start_timeout"]) {
    it(`4001 ${reason} before ready signs again once and reconnects silently`, async () => {
      const t = setup();
      await tick();
      t.ws.open();
      t.ws.serverClose(4001, reason);
      await tick();
      assert.equal(t.signCount, 2);
      assert.equal(t.sockets.length, 2);
      assert.ok(!t.states.some((s) => s.phase === "fallback"));
      t.ws.open();
      assert.equal(t.ws.json()[0].ticket, "ticket-2");
      t.ws.serverClose(4001, reason);
      await tick();
      assert.equal(t.signCount, 2, "only once");
      assert.deepEqual(t.state, { phase: "fallback", reason: "error", retry: true });
    });
  }

  it("the 45 s re-sign uses up the one re-sign", async () => {
    const t = setup();
    t.audio.micDelayMs = 46_000;
    await tick();
    t.ws.open();
    t.ws.serverClose(4001, "ticket_expired");
    await tick();
    assert.equal(t.signCount, 2);
    assert.equal(t.state?.phase, "fallback");
  });

  it("other 4001 reasons go straight to the fallback", async () => {
    for (const reason of ["ticket_replayed", "ticket_lead_mismatch", "ticket_bad_signature", "bad_start"]) {
      const t = setup();
      await tick();
      t.ws.open();
      t.ws.serverClose(4001, reason);
      await tick();
      assert.equal(t.signCount, 1, reason);
      assert.deepEqual(t.state, { phase: "fallback", reason: "error", retry: true });
    }
  });

  it("4001 after ready is not retried", async () => {
    const t = await live();
    t.ws.serverClose(4001, "ticket_expired");
    await tick();
    assert.equal(t.signCount, 1);
    assert.equal(t.state?.phase, "fallback");
  });

  it("4029 shows the busy card", async () => {
    const t = setup();
    await tick();
    t.ws.open();
    t.ws.serverClose(4029, "busy");
    assert.deepEqual(t.state, { phase: "busy" });
  });

  for (const code of [4500, 1006, 1011]) {
    it(`${code} falls back and offers a retry only on calls under 30 s`, async () => {
      const short = await live();
      short.clock.advance(29_000);
      short.ws.serverClose(code);
      assert.deepEqual(short.state, { phase: "fallback", reason: "error", retry: true });

      const long = await live();
      long.clock.advance(30_000);
      long.ws.serverClose(code);
      assert.deepEqual(long.state, { phase: "fallback", reason: "error", retry: false });
      assert.equal(long.audio.closes(), 1);
    });
  }

  it("logs close reasons only when a debug logger is given", async () => {
    const quiet = setup();
    await tick();
    quiet.ws.open();
    quiet.ws.serverClose(4001, "ticket_replayed");
    assert.deepEqual(quiet.debugLines, []);

    const loud = setup({ debug: true });
    await tick();
    loud.ws.open();
    loud.ws.serverClose(4001, "ticket_replayed");
    assert.ok(loud.debugLines.some((l) => l.includes("4001") && l.includes("ticket_replayed")));
  });
});

describe("call client: mic frames", () => {
  it("sends nothing before ready", async () => {
    const t = setup();
    await tick();
    t.ws.open();
    assert.equal(t.audio.sendFrame, null, "mic not started before ready");
    assert.equal(t.ws.frames().length, 0);
  });

  it("sends frames after ready, drops them while muted", async () => {
    const t = await live();
    t.audio.sendFrame!(new ArrayBuffer(1024));
    assert.equal(t.ws.frames().length, 1);
    t.call.setMuted(true);
    assert.equal(t.state?.phase === "talking" && t.state.muted, true);
    t.audio.sendFrame!(new ArrayBuffer(1024));
    assert.equal(t.ws.frames().length, 1);
    t.call.setMuted(false);
    t.audio.sendFrame!(new ArrayBuffer(1024));
    assert.equal(t.ws.frames().length, 2);
  });

  it("drops a frame instead of queueing when the socket is backed up past 64 KB", async () => {
    const t = await live();
    t.ws.bufferedAmount = 64 * 1024 + 1;
    t.audio.sendFrame!(new ArrayBuffer(1024));
    assert.equal(t.ws.frames().length, 0);
    t.ws.bufferedAmount = 64 * 1024;
    t.audio.sendFrame!(new ArrayBuffer(1024));
    assert.equal(t.ws.frames().length, 1);
  });
});

describe("call client: hanging up", () => {
  it("hangup sends hangup, flushes, and ends on the relay's 4000", async () => {
    const t = await live();
    t.call.hangup();
    assert.deepEqual(t.ws.json().at(-1), { type: "hangup" });
    assert.ok(t.audio.log.includes("flush"));
    t.audio.sendFrame!(new ArrayBuffer(1024));
    assert.equal(t.ws.frames().length, 0, "mic stops at once");
    t.ws.serverClose(4000, "caller");
    assert.deepEqual(t.state, { phase: "ended", reason: "caller" });
    assert.equal(t.audio.closes(), 1);
  });

  it("doesn't play audio that arrives after hanging up", async () => {
    const t = await live();
    t.call.hangup();
    t.ws.binary(new ArrayBuffer(960));
    assert.deepEqual(t.audio.played, []);
  });

  it("ignores captions and audio that arrive after the call has finished", async () => {
    const t = await live();
    t.ws.msg({ type: "error", code: "unavailable" });
    t.ws.msg({ type: "caption", id: 9, role: "assistant", text: "late", final: true });
    t.ws.binary(new ArrayBuffer(960));
    assert.deepEqual(t.captions, []);
    assert.deepEqual(t.audio.played, []);
  });

  it("hangup closes locally if the relay doesn't answer within 2 s", async () => {
    const t = await live();
    t.call.hangup();
    t.clock.advance(1_999);
    assert.equal(t.ws.closedWith, null);
    t.clock.advance(1);
    assert.ok(t.ws.closedWith);
    assert.deepEqual(t.state, { phase: "ended", reason: "caller" });
    assert.equal(t.audio.closes(), 1);
  });

  it("hangup while still signing never opens a socket", async () => {
    const t = setup();
    t.call.hangup();
    await tick();
    assert.deepEqual(t.sockets, []);
    assert.deepEqual(t.state, { phase: "ended", reason: "caller" });
    assert.equal(t.audio.closes(), 1);
  });

  it("pagehide sends hangup, closes the socket and the audio", async () => {
    const t = await live();
    assert.ok(t.pageHide);
    t.pageHide!();
    assert.deepEqual(t.ws.json().at(-1), { type: "hangup" });
    assert.ok(t.ws.closedWith);
    assert.equal(t.audio.closes(), 1);
    assert.equal(t.pageHide, null, "listener removed");
  });

  it("removes the pagehide listener when the call ends", async () => {
    const t = await live();
    t.ws.serverClose(4500);
    assert.equal(t.pageHide, null);
  });
});
