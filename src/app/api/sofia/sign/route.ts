import { createSignHandler, RateLimiter } from "@/lib/sofia-sign";
import { SOFIA_ONLINE } from "@/lib/sofia-switch";

export const runtime = "nodejs";

// One limiter per server instance, as before: the rate limit is in memory.
const handleSign = createSignHandler({
  env: process.env,
  fetch: (input, init) => fetch(input, init),
  now: () => Date.now(),
  log: (line) => console.log(line),
  logError: (line, err) => (err === undefined ? console.error(line) : console.error(line, err)),
  limiter: new RateLimiter(),
  online: SOFIA_ONLINE,
});

export function POST(req: Request) {
  return handleSign(req);
}
