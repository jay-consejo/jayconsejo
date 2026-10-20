import { createHash } from "node:crypto";
import parsePhoneNumberFromString from "libphonenumber-js";
import { mintTicket, type TicketLead } from "./sofia-ticket.ts";

/**
 * POST /api/sofia/sign: vets the caller's details, then hands back what the browser needs
 * to start a call. Two providers sit behind it while the voice stack moves over:
 * - ElevenLabs (default): a signed conversation URL from their API.
 * - Nova (`SOFIA_PROVIDER=nova`): a one-use ticket for our own voice relay, plus the vetted
 *   lead. The browser must send that exact lead back to the relay, because the ticket
 *   carries a hash of it.
 * Everything the handler touches from outside comes in through `SignDeps`, so tests can
 * drive every branch without a network or a clock.
 */

export type Lead = TicketLead;

export type SignDeps = {
  env: Record<string, string | undefined>;
  fetch: typeof fetch;
  now: () => number;
  log: (line: string) => void;
  logError: (line: string, err?: unknown) => void;
  limiter: RateLimiter;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CONTROL_CHARS = /\p{Cc}/u;
const MAX_NAME_LENGTH = 80;
const MAX_EMAIL_LENGTH = 254;
const SIGNED_URL_SAFETY_MS = 14 * 60 * 1000;
const HEALTH_TIMEOUT_MS = 1_500;
/** check_contact and ElevenLabs: give up and take the failure path instead of holding the caller. */
const OUTSIDE_TIMEOUT_MS = 5_000;
const MIN_SECRET_LENGTH = 32;

const SITE_ORIGINS = ["https://jayconsejo.com", "https://www.jayconsejo.com"];
const LOCAL_ORIGIN = "http://localhost:3000";

const GENERIC_FAILURE = "Couldn't start the call. Please try again.";

export class RateLimiter {
  private readonly buckets = new Map<string, { count: number; windowStart: number }>();
  private readonly max: number;
  private readonly windowMs: number;

  constructor(max = 3, windowMs = 10 * 60 * 1000) {
    this.max = max;
    this.windowMs = windowMs;
  }

  hit(key: string, now: number): { ok: true } | { ok: false; retryAfter: number } {
    const bucket = this.buckets.get(key);
    if (!bucket || now - bucket.windowStart >= this.windowMs) {
      this.buckets.set(key, { count: 1, windowStart: now });
      return { ok: true };
    }
    if (bucket.count >= this.max) {
      return { ok: false, retryAfter: Math.ceil((bucket.windowStart + this.windowMs - now) / 1000) };
    }
    bucket.count += 1;
    return { ok: true };
  }
}

type Validated = { ok: true; lead: Lead } | { ok: false; error: string };

export function validateLead(data: unknown): Validated {
  if (!data || typeof data !== "object") {
    return { ok: false, error: "Please check your info." };
  }
  const { name, email, whatsapp } = data as Record<string, unknown>;
  const n = typeof name === "string" ? name.trim() : "";
  const e = typeof email === "string" ? email.trim() : "";
  const w = typeof whatsapp === "string" ? whatsapp.trim() : "";

  if (n.length < 2 || CONTROL_CHARS.test(n)) {
    return { ok: false, error: "Please enter your name (2+ characters)." };
  }
  if (n.length > MAX_NAME_LENGTH) {
    return { ok: false, error: `Please keep your name to ${MAX_NAME_LENGTH} characters or fewer.` };
  }
  if (e.length > MAX_EMAIL_LENGTH || CONTROL_CHARS.test(e) || !EMAIL_REGEX.test(e)) {
    return { ok: false, error: "Please enter a valid email." };
  }
  const parsed = parsePhoneNumberFromString(w, "PH");
  if (!parsed?.isValid()) {
    return { ok: false, error: "Please enter a valid phone number with country code." };
  }
  return { ok: true, lead: { name: n, email: e, whatsapp: parsed.number } };
}

function getIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() || "unknown";
  return req.headers.get("x-real-ip") ?? "unknown";
}

function shortHash(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 16);
}

/** ws(s)://host/call → http(s)://host/health. Null unless it's a ws or wss URL. */
export function healthUrlFor(relayUrl: string): string | null {
  let url: URL;
  try {
    url = new URL(relayUrl);
  } catch {
    return null;
  }
  if (url.protocol !== "ws:" && url.protocol !== "wss:") return null;
  url.protocol = url.protocol === "wss:" ? "https:" : "http:";
  url.pathname = url.pathname.replace(/\/call\/?$/, "") + "/health";
  url.search = "";
  return url.toString();
}

function isLoopback(relayUrl: string): boolean {
  try {
    const host = new URL(relayUrl).hostname;
    return host === "localhost" || host === "127.0.0.1" || host === "[::1]";
  } catch {
    return false;
  }
}

/**
 * Only our own pages may spend a caller's tickets or signed URLs. The local origin is allowed
 * in development, and for a local production build that talks to a relay on this machine.
 */
function originAllowed(origin: string | null, env: SignDeps["env"]): boolean {
  if (!origin) return false;
  if (SITE_ORIGINS.includes(origin)) return true;
  const local = env.NODE_ENV === "development" || isLoopback(env.SOFIA_RELAY_URL ?? "");
  return local && origin === LOCAL_ORIGIN;
}

/** A form or text/plain body is a "simple" request another site can send without a preflight. */
function isJson(req: Request): boolean {
  const type = req.headers.get("content-type") ?? "";
  return type.split(";")[0]?.trim().toLowerCase() === "application/json";
}

/** Repeat-caller check against the call logger. Fails open: any error lets the call go ahead. */
async function alreadyContacted(lead: Lead, deps: SignDeps): Promise<{ matchedOn: string } | null> {
  const loggerUrl = deps.env.SOFIA_LOGGER_URL;
  const loggerApiKey = deps.env.SOFIA_LOGGER_API_KEY;
  if (!loggerUrl || !loggerApiKey) return null;
  try {
    const checkUrl = new URL(loggerUrl);
    checkUrl.searchParams.set("action", "check_contact");
    checkUrl.searchParams.set("api_key", loggerApiKey);
    checkUrl.searchParams.set("email", lead.email);
    checkUrl.searchParams.set("whatsapp", lead.whatsapp);
    const res = await deps.fetch(checkUrl.toString(), {
      redirect: "follow",
      signal: AbortSignal.timeout(OUTSIDE_TIMEOUT_MS),
    });
    if (!res.ok) {
      deps.logError(`[sofia/sign] check_contact non-200 ${res.status} — failing open`);
      return null;
    }
    const result = (await res.json()) as {
      has_recent_call?: boolean;
      last_call_duration_sec?: number;
      matched_on?: "email" | "whatsapp" | null;
    };
    if (result.has_recent_call && (result.last_call_duration_sec ?? 0) >= 30) {
      return { matchedOn: result.matched_on ?? "?" };
    }
    return null;
  } catch (err) {
    deps.logError("[sofia/sign] check_contact threw — failing open", err);
    return null;
  }
}

async function relayHealthy(healthUrl: string, deps: SignDeps): Promise<boolean> {
  try {
    const res = await deps.fetch(healthUrl, {
      cache: "no-store",
      signal: AbortSignal.timeout(HEALTH_TIMEOUT_MS),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function createSignHandler(deps: SignDeps): (req: Request) => Promise<Response> {
  return async function handleSign(req) {
    const nova = deps.env.SOFIA_PROVIDER === "nova";
    const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
      Response.json(body, {
        status,
        headers: nova ? { "Cache-Control": "no-store", ...headers } : headers,
      });

    if (!originAllowed(req.headers.get("origin"), deps.env)) {
      deps.log("[sofia/sign] origin refused");
      return json({ error: "Not allowed." }, 403);
    }
    if (!isJson(req)) {
      deps.log("[sofia/sign] non-JSON body refused");
      return json({ error: "Not allowed." }, 415);
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return json({ error: "Please check your info." }, 400);
    }
    const validation = validateLead(body);
    if (!validation.ok) {
      return json({ error: validation.error }, 400);
    }
    const { lead } = validation;

    const ip = getIp(req);
    const ipKey = shortHash(ip);
    const rate = deps.limiter.hit(ip, deps.now());
    if (!rate.ok) {
      deps.log(`[sofia/sign] rate-limit hit ip=${ipKey}`);
      return json(
        { error: "Too many attempts — please wait a few minutes." },
        429,
        { "Retry-After": String(rate.retryAfter) },
      );
    }

    const contacted = await alreadyContacted(lead, deps);
    if (contacted) {
      deps.log(`[sofia/sign] already_contacted ip=${ipKey} matched_on=${contacted.matchedOn}`);
      return json(
        {
          code: "already_contacted",
          message:
            "We already have your info — Jay will reach out within 24 hours. Check your email for the invite.",
        },
        409,
      );
    }

    return nova ? signNova(lead, ip, ipKey, deps, json) : signElevenLabs(lead, ipKey, deps, json);
  };
}

type Json = (body: unknown, status?: number, headers?: Record<string, string>) => Response;

async function signNova(lead: Lead, ip: string, ipKey: string, deps: SignDeps, json: Json): Promise<Response> {
  const relayUrl = deps.env.SOFIA_RELAY_URL ?? "";
  const secret = deps.env.SOFIA_TICKET_SECRET ?? "";
  const healthUrl = healthUrlFor(relayUrl);
  if (!healthUrl || secret.length < MIN_SECRET_LENGTH) {
    deps.logError(
      `[sofia/sign] Nova config incomplete: SOFIA_RELAY_URL ${healthUrl ? "ok" : "missing or not ws(s)"}, SOFIA_TICKET_SECRET ${secret.length >= MIN_SECRET_LENGTH ? "ok" : "missing or too short"}`,
    );
    return json({ error: GENERIC_FAILURE }, 502);
  }

  // Check the relay here, so the browser never opens a socket to a relay that's down.
  // Answered as 200: it's an expected state the page shows a card for, and browsers log
  // every 4xx/5xx response as a console error.
  if (!(await relayHealthy(healthUrl, deps))) {
    deps.logError(`[sofia/sign] relay health check failed ip=${ipKey}`);
    return json({ code: "unavailable", error: "Sofia isn't available right now. Leave your details and Jay will reach out." });
  }

  const { ticket, expiresAt } = mintTicket(lead, ip, secret, deps.now());
  deps.log(
    `[sofia/sign] ticket ip=${ipKey} name=${shortHash(lead.name)} email=${shortHash(lead.email)} t=${deps.now()}`,
  );
  return json({ ticket, relayUrl, lead, expiresAt });
}

async function signElevenLabs(lead: Lead, ipKey: string, deps: SignDeps, json: Json): Promise<Response> {
  const apiKey = deps.env.ELEVENLABS_API_KEY;
  const agentId = deps.env.ELEVENLABS_AGENT_ID;
  if (!apiKey || !agentId) {
    deps.logError("[sofia/sign] Missing ELEVENLABS_API_KEY or ELEVENLABS_AGENT_ID");
    return json({ error: GENERIC_FAILURE }, 502);
  }

  try {
    const res = await deps.fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${encodeURIComponent(agentId)}`,
      { headers: { "xi-api-key": apiKey }, signal: AbortSignal.timeout(OUTSIDE_TIMEOUT_MS) },
    );
    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      deps.logError(`[sofia/sign] ElevenLabs ${res.status} ${errBody}`);
      return json({ error: GENERIC_FAILURE }, 502);
    }
    const data = (await res.json()) as { signed_url?: string };
    if (!data.signed_url) {
      deps.logError("[sofia/sign] Missing signed_url in ElevenLabs response");
      return json({ error: GENERIC_FAILURE }, 502);
    }

    const timestamp = deps.now();
    deps.log(
      `[sofia/sign] signed ip=${ipKey} name=${shortHash(lead.name)} email=${shortHash(lead.email)} t=${timestamp}`,
    );
    return json({ signedUrl: data.signed_url, expiresAt: timestamp + SIGNED_URL_SAFETY_MS });
  } catch (err) {
    deps.logError("[sofia/sign] network error", err);
    return json({ error: GENERIC_FAILURE }, 502);
  }
}
