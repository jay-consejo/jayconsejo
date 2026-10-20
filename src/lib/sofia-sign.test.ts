import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { describe, it } from "node:test";
import { createSignHandler, healthUrlFor, RateLimiter, type SignDeps } from "./sofia-sign.ts";
import { ipHash, leadHash, TICKET_TTL_MS } from "./sofia-ticket.ts";

const SECRET = "test-secret-0123456789-abcdefghijklmnop"; // gitleaks:allow (test fixture)
const IP = "203.0.113.7";
const NOW = 1_800_000_000_000;
const SITE = "https://jayconsejo.com";
const RELAY = "wss://relay.example.test/call";
const HEALTH = "https://relay.example.test/health";
const LOGGER = "https://logger.example.test/exec";

const FORM = { name: "  Ana Reyes ", email: " Ana@Example.com ", whatsapp: "0917 123 4567" };
const VETTED = { name: "Ana Reyes", email: "Ana@Example.com", whatsapp: "+639171234567" };

type Route = (url: string, init?: RequestInit) => Promise<Response>;

function setup(opts: { env?: Record<string, string | undefined>; routes?: Record<string, Route> } = {}) {
  const logs: string[] = [];
  const calls: string[] = [];
  const routes: Record<string, Route> = {
    [HEALTH]: async () => Response.json({ ok: true }),
    ...opts.routes,
  };
  const deps: SignDeps = {
    env: {
      NODE_ENV: "production",
      SOFIA_PROVIDER: "nova",
      SOFIA_RELAY_URL: RELAY,
      SOFIA_TICKET_SECRET: SECRET,
      ...opts.env,
    },
    fetch: (async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      calls.push(url);
      const route = Object.entries(routes).find(([prefix]) => url.startsWith(prefix))?.[1];
      if (!route) throw new Error(`unexpected fetch ${url}`);
      return route(url, init);
    }) as typeof fetch,
    now: () => NOW,
    log: (line) => logs.push(line),
    logError: (line, err) => logs.push(err === undefined ? line : `${line} ${String(err)}`),
    limiter: new RateLimiter(),
  };
  return { handle: createSignHandler(deps), logs, calls };
}

function request(body: unknown, headers: Record<string, string> = { origin: SITE }): Request {
  return new Request("https://jayconsejo.com/api/sofia/sign", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": `${IP}, 10.0.0.1`, ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

function decodeTicket(ticket: string) {
  const [body, mac] = ticket.split(".");
  return {
    payload: JSON.parse(Buffer.from(body, "base64url").toString("utf8")),
    macOk: createHmac("sha256", SECRET).update(body).digest("base64url") === mac,
  };
}

function assertNoLeaks(logs: string[], ...values: string[]) {
  for (const line of logs) {
    for (const v of values) assert.ok(!line.includes(v), `log line leaks ${v}: ${line}`);
  }
}

describe("sofia sign: Nova", () => {
  it("returns a ticket, the relay URL and the vetted lead, uncached", async () => {
    const { handle, logs, calls } = setup();
    const res = await handle(request(FORM));

    assert.equal(res.status, 200);
    assert.equal(res.headers.get("cache-control"), "no-store");
    const data = await res.json();
    assert.deepEqual(Object.keys(data).sort(), ["expiresAt", "lead", "relayUrl", "ticket"]);
    assert.equal(data.relayUrl, RELAY);
    assert.deepEqual(data.lead, VETTED);
    assert.equal(data.expiresAt, NOW + TICKET_TTL_MS);
    assert.deepEqual(calls, [HEALTH]);

    const { payload, macOk } = decodeTicket(data.ticket);
    assert.ok(macOk);
    assert.deepEqual(Object.keys(payload), ["v", "nonce", "exp", "leadHash", "ipHash"]);
    assert.equal(payload.exp, NOW + TICKET_TTL_MS);
    assert.equal(payload.leadHash, leadHash(VETTED, SECRET));
    assert.equal(payload.ipHash, ipHash(IP, SECRET));
    assertNoLeaks(logs, IP, SECRET, VETTED.email, data.ticket);
  });

  it("refuses other origins and requests with no origin", async () => {
    const refused: Record<string, string>[] = [{ origin: "https://evil.example" }, {}, { origin: "http://localhost:3000" }];
    for (const headers of refused) {
      const { handle, calls } = setup();
      const res = await handle(request(FORM, headers));
      assert.equal(res.status, 403, JSON.stringify(headers));
      assert.deepEqual(calls, [], "no outside calls for a refused origin");
    }
  });

  it("accepts the www origin", async () => {
    const { handle } = setup();
    assert.equal((await handle(request(FORM, { origin: "https://www.jayconsejo.com" }))).status, 200);
  });

  it("accepts localhost in development and with a relay on this machine", async () => {
    const local = { origin: "http://localhost:3000" };
    const dev = setup({ env: { NODE_ENV: "development" } });
    assert.equal((await dev.handle(request(FORM, local))).status, 200);

    const loopback = setup({
      env: { SOFIA_RELAY_URL: "ws://localhost:8787/call" },
      routes: { "http://localhost:8787/health": async () => Response.json({ ok: true }) },
    });
    assert.equal((await loopback.handle(request(FORM, local))).status, 200);
  });

  it("rejects bad JSON and bad details with 400", async () => {
    const { handle } = setup();
    assert.equal((await handle(request("{not json"))).status, 400);
    const res = await handle(request({ ...FORM, email: "nope" }));
    assert.equal(res.status, 400);
    assert.equal((await res.json()).error, "Please enter a valid email.");
    assert.equal((await handle(request({ ...FORM, whatsapp: "123" }))).status, 400);
  });

  it("caps the name at 80 and the email at 254 characters", async () => {
    const at = (n: number) => "a".repeat(n - "@example.com".length) + "@example.com";
    const cases: [Record<string, string>, number, string?][] = [
      [{ name: "A".repeat(80) }, 200],
      [{ name: "A".repeat(81) }, 400, "Please keep your name to 80 characters or fewer."],
      [{ email: at(254) }, 200],
      [{ email: at(255) }, 400, "Please enter a valid email."],
    ];
    for (const [over, status, error] of cases) {
      const { handle, calls } = setup();
      const res = await handle(request({ ...FORM, ...over }));
      assert.equal(res.status, status, JSON.stringify(over).slice(0, 40));
      if (error) {
        assert.equal((await res.json()).error, error);
        assert.deepEqual(calls, [], "nothing outside is called for a refused lead");
      }
    }
  });

  it("refuses control characters in the name or email, but not accents or other scripts", async () => {
    for (const over of [{ name: "Ana\u0000Reyes" }, { name: "Ana\u0007" }, { name: "Ana\u0085Reyes" }, { email: "ana\u007f@example.com" }]) {
      const { handle, calls } = setup();
      assert.equal((await handle(request({ ...FORM, ...over }))).status, 400, JSON.stringify(over));
      assert.deepEqual(calls, []);
    }
    for (const name of ["José Ñúñez", "王小明", "Anne-Marie O'Brien"]) {
      const { handle } = setup();
      assert.equal((await handle(request({ ...FORM, name }))).status, 200, name);
    }
  });

  it("rate-limits the 4th try from one IP with Retry-After", async () => {
    const { handle, logs } = setup();
    for (let i = 0; i < 3; i++) assert.equal((await handle(request(FORM))).status, 200);
    const res = await handle(request(FORM));
    assert.equal(res.status, 429);
    assert.equal(res.headers.get("retry-after"), "600");
    assertNoLeaks(logs, IP);
  });

  it("returns 409 for a recent caller, checked against the vetted phone number", async () => {
    let checked = "";
    const { handle, logs, calls } = setup({
      env: { SOFIA_LOGGER_URL: LOGGER, SOFIA_LOGGER_API_KEY: "logger-key-value" },
      routes: {
        [LOGGER]: async (url) => {
          checked = url;
          return Response.json({ has_recent_call: true, last_call_duration_sec: 45, matched_on: "email" });
        },
      },
    });
    const res = await handle(request(FORM));
    assert.equal(res.status, 409);
    assert.equal((await res.json()).code, "already_contacted");
    assert.equal(new URL(checked).searchParams.get("whatsapp"), VETTED.whatsapp);
    assert.ok(!calls.includes(HEALTH), "no relay probe after a 409");
    assertNoLeaks(logs, IP, "logger-key-value");
  });

  it("lets the call go ahead when the logger fails", async () => {
    const { handle } = setup({
      env: { SOFIA_LOGGER_URL: LOGGER, SOFIA_LOGGER_API_KEY: "logger-key-value" },
      routes: { [LOGGER]: async () => new Response("oops", { status: 500 }) },
    });
    assert.equal((await handle(request(FORM))).status, 200);
  });

  it("answers unavailable (200, no ticket) when the relay is down, erroring or slow", async () => {
    const down: Route = async () => {
      throw new TypeError("fetch failed");
    };
    const erroring: Route = async () => new Response("bad gateway", { status: 502 });
    const slow: Route = (_url, init) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(init.signal?.reason));
      });
    for (const [label, route] of [["down", down], ["erroring", erroring], ["slow", slow]] as const) {
      const { handle, logs } = setup({ routes: { [HEALTH]: route } });
      const started = Date.now();
      const res = await handle(request(FORM));
      assert.equal(res.status, 200, label);
      const body = await res.json();
      assert.equal(body.code, "unavailable");
      assert.equal(body.ticket, undefined);
      assert.equal(res.headers.get("cache-control"), "no-store");
      assert.ok(Date.now() - started < 2_500, `${label} probe gave up in time`);
      assertNoLeaks(logs, IP);
    }
  });

  it("returns 502 without printing values when config is missing or weak", async () => {
    const cases: Record<string, string | undefined>[] = [
      { SOFIA_RELAY_URL: undefined },
      { SOFIA_RELAY_URL: "https://relay.example.test/call" },
      { SOFIA_TICKET_SECRET: undefined },
      { SOFIA_TICKET_SECRET: "short-secret-value" },
    ];
    for (const env of cases) {
      const { handle, logs, calls } = setup({ env });
      const res = await handle(request(FORM));
      assert.equal(res.status, 502, JSON.stringify(env));
      assert.deepEqual(calls, [], "no probe without a complete config");
      assert.ok(logs.some((l) => l.includes("Nova config incomplete")));
      assertNoLeaks(logs, "short-secret-value", "https://relay.example.test", SECRET, IP);
    }
  });
});

describe("sofia sign: ElevenLabs (default provider)", () => {
  const eleven = { SOFIA_PROVIDER: undefined, ELEVENLABS_API_KEY: "el-key-value", ELEVENLABS_AGENT_ID: "agent-1" };
  const signed: Route = async () => Response.json({ signed_url: "wss://eleven.example.test/convai?sig=abc" });

  it("returns a signed URL to our own origin and logs a hashed IP", async () => {
    const { handle, logs } = setup({
      env: eleven,
      routes: { "https://api.elevenlabs.io/": signed },
    });
    const res = await handle(request(FORM));
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.signedUrl, "wss://eleven.example.test/convai?sig=abc");
    assert.equal(data.expiresAt, NOW + 14 * 60 * 1000);
    assert.ok(logs.some((l) => l.startsWith("[sofia/sign] signed ip=")));
    assertNoLeaks(logs, IP, "el-key-value");
  });

  it("refuses other origins and requests with no origin", async () => {
    const refused: Record<string, string>[] = [{ origin: "https://evil.example" }, {}, { origin: "http://localhost:3000" }];
    for (const headers of refused) {
      const { handle, calls } = setup({ env: eleven, routes: { "https://api.elevenlabs.io/": signed } });
      const res = await handle(request(FORM, headers));
      assert.equal(res.status, 403, JSON.stringify(headers));
      assert.deepEqual(calls, [], "no signed URL or logger lookup for a refused origin");
    }
  });

  it("accepts localhost in development", async () => {
    const { handle } = setup({
      env: { ...eleven, NODE_ENV: "development" },
      routes: { "https://api.elevenlabs.io/": signed },
    });
    assert.equal((await handle(request(FORM, { origin: "http://localhost:3000" }))).status, 200);
  });

  it("returns 502 when its keys are missing", async () => {
    const { handle } = setup({ env: { ...eleven, ELEVENLABS_API_KEY: undefined } });
    assert.equal((await handle(request(FORM))).status, 502);
  });
});

describe("sofia sign: outside calls time out after 5 s", () => {
  const hang: Route = (_url, init) =>
    new Promise((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(init.signal?.reason));
    });
  const timed = async (run: () => Promise<Response>) => {
    const started = Date.now();
    const res = await run();
    return { res, ms: Date.now() - started };
  };

  it("lets the call go ahead when check_contact hangs, and returns 502 when ElevenLabs hangs", { timeout: 10_000 }, async () => {
    const logger = setup({
      env: { SOFIA_LOGGER_URL: LOGGER, SOFIA_LOGGER_API_KEY: "logger-key-value" },
      routes: { [LOGGER]: hang },
    });
    const eleven = setup({
      env: { SOFIA_PROVIDER: undefined, ELEVENLABS_API_KEY: "el-key-value", ELEVENLABS_AGENT_ID: "agent-1" },
      routes: { "https://api.elevenlabs.io/": hang },
    });
    const [a, b] = await Promise.all([timed(() => logger.handle(request(FORM))), timed(() => eleven.handle(request(FORM)))]);

    assert.equal(a.res.status, 200, "check_contact fails open");
    assert.ok((await a.res.json()).ticket);
    assert.equal(b.res.status, 502);
    for (const { ms } of [a, b]) assert.ok(ms >= 4_500 && ms < 6_500, `gave up after ${ms} ms`);
    assertNoLeaks([...logger.logs, ...eleven.logs], IP, "logger-key-value", "el-key-value");
  });
});

describe("sofia sign: content type (both providers)", () => {
  const providers = {
    nova: {},
    elevenlabs: { SOFIA_PROVIDER: undefined, ELEVENLABS_API_KEY: "el-key-value", ELEVENLABS_AGENT_ID: "agent-1" },
  };
  const signed: Route = async () => Response.json({ signed_url: "wss://eleven.example.test/convai?sig=abc" });

  it("refuses a body that isn't sent as JSON with 415", async () => {
    for (const [name, env] of Object.entries(providers)) {
      for (const type of ["text/plain", "application/x-www-form-urlencoded", "multipart/form-data; boundary=x", ""]) {
        const { handle, calls } = setup({ env, routes: { "https://api.elevenlabs.io/": signed } });
        const res = await handle(request(FORM, { origin: SITE, "content-type": type }));
        assert.equal(res.status, 415, `${name} ${type || "(none)"}`);
        assert.deepEqual(calls, [], "no outside calls for a non-JSON body");
      }
    }
  });

  it("accepts application/json with parameters, in any case", async () => {
    for (const [name, env] of Object.entries(providers)) {
      for (const type of ["application/json; charset=utf-8", "Application/JSON"]) {
        const { handle } = setup({ env, routes: { "https://api.elevenlabs.io/": signed } });
        assert.equal((await handle(request(FORM, { origin: SITE, "content-type": type }))).status, 200, `${name} ${type}`);
      }
    }
  });
});

describe("healthUrlFor", () => {
  it("maps the call URL to the health URL", () => {
    assert.equal(healthUrlFor("wss://sofia.jayconsejo.com/call"), "https://sofia.jayconsejo.com/health");
    assert.equal(healthUrlFor("ws://localhost:8787/call"), "http://localhost:8787/health");
    assert.equal(healthUrlFor("ws://localhost:8787/call?x=1"), "http://localhost:8787/health");
  });

  it("refuses anything that isn't ws or wss", () => {
    assert.equal(healthUrlFor(""), null);
    assert.equal(healthUrlFor("not a url"), null);
    assert.equal(healthUrlFor("https://sofia.jayconsejo.com/call"), null);
  });
});
