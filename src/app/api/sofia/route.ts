import { NextResponse } from "next/server";

type Payload = { name?: unknown; whatsapp?: unknown; email?: unknown };

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function looksLikeEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export async function POST(request: Request) {
  let body: Payload;
  try {
    body = (await request.json()) as Payload;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON." },
      { status: 400 },
    );
  }

  const { name, whatsapp, email } = body;
  if (!isNonEmptyString(name) || !isNonEmptyString(whatsapp) || !isNonEmptyString(email)) {
    return NextResponse.json(
      { ok: false, error: "Name, WhatsApp, and email are required." },
      { status: 400 },
    );
  }
  if (!looksLikeEmail(email)) {
    return NextResponse.json(
      { ok: false, error: "Please enter a valid email address." },
      { status: 400 },
    );
  }

  const endpoint = process.env.SOFIA_ENDPOINT;
  const apiKey = process.env.SOFIA_API_KEY;

  if (!endpoint) {
    return NextResponse.json(
      { ok: false, error: "Call service is not configured yet. Try again soon or email jay directly." },
      { status: 503 },
    );
  }

  try {
    const upstream = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify({
        name: name.trim(),
        whatsapp: whatsapp.trim(),
        email: email.trim(),
        source: "jayconsejo.com/contact",
      }),
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { ok: false, error: "Call service is temporarily unavailable. Please try again." },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Network error reaching the call service. Please try again." },
      { status: 502 },
    );
  }
}
