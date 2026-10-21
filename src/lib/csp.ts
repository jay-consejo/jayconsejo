// Content-Security-Policy for every page. Pages are statically rendered, so there is no
// per-request nonce: Next's inline bootstrap scripts and next-themes need 'unsafe-inline'.

const PRODUCTION_RELAY = "wss://sofia.jayconsejo.com";
const R2 = "https://pub-f0ac1ec148884b718fc28632174966a4.r2.dev";
// react-phone-number-input's default flag images.
const PHONE_FLAGS = "https://purecatamphetamine.github.io/country-flag-icons/";
// Cloudflare injects its Web Analytics beacon at the edge; the script's path is versioned
// (/beacon.min.js/v…), so the host is allowed. It reports to this site's /cdn-cgi/rum ('self').
const CLOUDFLARE_BEACON = "https://static.cloudflareinsights.com";

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
    "script-src": ["'self'", "'unsafe-inline'", CLOUDFLARE_BEACON, ...(dev ? ["'unsafe-eval'"] : [])],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:", R2, PHONE_FLAGS],
    "media-src": ["'self'", "blob:", R2],
    "font-src": ["'self'"],
    "connect-src": ["'self'", relayOrigin(relayUrl)],
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
