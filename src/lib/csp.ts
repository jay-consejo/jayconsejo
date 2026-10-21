// Content-Security-Policy for every page. Pages are statically rendered, so there is no
// per-request nonce: Next's inline bootstrap scripts and next-themes need 'unsafe-inline'.

const PRODUCTION_RELAY = "wss://sofia.jayconsejo.com";
const R2 = "https://pub-f0ac1ec148884b718fc28632174966a4.r2.dev";
// Must match the widget script pinned in components/sections/contact.tsx.
const ELEVENLABS_WIDGET = "https://unpkg.com/@elevenlabs/convai-widget-embed@0.11.7/";
// What the widget loads during a call: audio worklets (from blob: URLs, plus a resampler
// on jsdelivr), its font, flag and noise images, and the API and LiveKit sockets. Its
// FingerprintJS monitoring ping (m1.openfpcdn.io) is left out on purpose.
const ELEVENLABS_WORKLETS = ["blob:", "https://cdn.jsdelivr.net/npm/@alexanderolsen/libsamplerate-js@2.1.2/"];
const ELEVENLABS_IMAGES = "https://storage.googleapis.com/eleven-public-cdn/";
const ELEVENLABS_CONNECT = [
  "https://api.elevenlabs.io",
  "wss://api.elevenlabs.io",
  "https://livekit.rtc.elevenlabs.io",
  "wss://livekit.rtc.elevenlabs.io",
];
// react-phone-number-input's default flag images.
const PHONE_FLAGS = "https://purecatamphetamine.github.io/country-flag-icons/";

// The Nova call socket's origin, from SOFIA_RELAY_URL (e.g. wss://host/call → wss://host).
function relayOrigin(relayUrl: string | undefined): string {
  try {
    const url = new URL(relayUrl ?? "");
    if (url.protocol === "wss:" || url.protocol === "ws:") return `${url.protocol}//${url.host}`;
  } catch {}
  return PRODUCTION_RELAY;
}

export function contentSecurityPolicy({ relayUrl, dev = false }: { relayUrl?: string; dev?: boolean }): string {
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": [
      "'self'",
      "'unsafe-inline'",
      ELEVENLABS_WIDGET,
      ...ELEVENLABS_WORKLETS,
      ...(dev ? ["'unsafe-eval'"] : []),
    ],
    "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    "img-src": ["'self'", "data:", "blob:", R2, ELEVENLABS_IMAGES, PHONE_FLAGS],
    "media-src": ["'self'", "blob:", R2],
    "font-src": ["'self'", "https://fonts.gstatic.com"],
    "connect-src": ["'self'", relayOrigin(relayUrl), ...ELEVENLABS_CONNECT],
    "worker-src": ["'self'"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
  };
  return Object.entries(directives)
    .map(([name, values]) => `${name} ${values.join(" ")}`)
    .join("; ");
}
