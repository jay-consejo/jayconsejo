import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import parsePhoneNumberFromString from "libphonenumber-js";

export const runtime = "nodejs";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Lead = { name: string; email: string; whatsapp: string };

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 3;
const SIGNED_URL_SAFETY_MS = 14 * 60 * 1000;

const ipBuckets = new Map<string, { count: number; windowStart: number }>();

type Validated =
  | { ok: true; lead: Lead }
  | { ok: false; error: string };

function validateLead(data: unknown): Validated {
  if (!data || typeof data !== "object") {
    return { ok: false, error: "Please check your info." };
  }
  const { name, email, whatsapp } = data as Record<string, unknown>;
  const n = typeof name === "string" ? name.trim() : "";
  const e = typeof email === "string" ? email.trim() : "";
  const w = typeof whatsapp === "string" ? whatsapp.trim() : "";

  if (n.length < 2) {
    return { ok: false, error: "Please enter your name (2+ characters)." };
  }
  if (!EMAIL_REGEX.test(e)) {
    return { ok: false, error: "Please enter a valid email." };
  }
  const parsed = parsePhoneNumberFromString(w, "PH");
  if (!parsed?.isValid()) {
    return {
      ok: false,
      error: "Please enter a valid phone number with country code.",
    };
  }
  return { ok: true, lead: { name: n, email: e, whatsapp: parsed.number } };
}

function getIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() || "unknown";
  return req.headers.get("x-real-ip") ?? "unknown";
}

function checkRateLimit(
  ip: string,
): { ok: true } | { ok: false; retryAfter: number } {
  const now = Date.now();
  const bucket = ipBuckets.get(ip);
  if (!bucket || now - bucket.windowStart >= RATE_LIMIT_WINDOW_MS) {
    ipBuckets.set(ip, { count: 1, windowStart: now });
    return { ok: true };
  }
  if (bucket.count >= RATE_LIMIT_MAX) {
    const retryAfter = Math.ceil(
      (bucket.windowStart + RATE_LIMIT_WINDOW_MS - now) / 1000,
    );
    return { ok: false, retryAfter };
  }
  bucket.count += 1;
  return { ok: true };
}

function shortHash(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 16);
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Please check your info." },
      { status: 400 },
    );
  }

  const validation = validateLead(body);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const ip = getIp(req);
  const rate = checkRateLimit(ip);
  if (!rate.ok) {
    console.log(`[sofia/sign] rate-limit hit ip=${ip}`);
    return NextResponse.json(
      { error: "Too many attempts — please wait a few minutes." },
      {
        status: 429,
        headers: { "Retry-After": String(rate.retryAfter) },
      },
    );
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  const agentId = process.env.ELEVENLABS_AGENT_ID;
  if (!apiKey || !agentId) {
    console.error(
      "[sofia/sign] Missing ELEVENLABS_API_KEY or ELEVENLABS_AGENT_ID",
    );
    return NextResponse.json(
      { error: "Couldn't start the call. Please try again." },
      { status: 502 },
    );
  }

  try {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${encodeURIComponent(agentId)}`,
      { headers: { "xi-api-key": apiKey } },
    );
    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      console.error(`[sofia/sign] ElevenLabs ${res.status} ${errBody}`);
      return NextResponse.json(
        { error: "Couldn't start the call. Please try again." },
        { status: 502 },
      );
    }
    const data = (await res.json()) as { signed_url?: string };
    if (!data.signed_url) {
      console.error("[sofia/sign] Missing signed_url in ElevenLabs response");
      return NextResponse.json(
        { error: "Couldn't start the call. Please try again." },
        { status: 502 },
      );
    }

    const timestamp = Date.now();
    console.log(
      `[sofia/sign] signed ip=${ip} name=${shortHash(validation.lead.name)} email=${shortHash(validation.lead.email)} t=${timestamp}`,
    );

    return NextResponse.json({
      signedUrl: data.signed_url,
      expiresAt: timestamp + SIGNED_URL_SAFETY_MS,
    });
  } catch (err) {
    console.error("[sofia/sign] network error", err);
    return NextResponse.json(
      { error: "Couldn't start the call. Please try again." },
      { status: 502 },
    );
  }
}
