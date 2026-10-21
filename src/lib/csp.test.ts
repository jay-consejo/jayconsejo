import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { contentSecurityPolicy } from "./csp.ts";
import nextConfig from "../../next.config.ts";

function directives(policy: string): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const part of policy.split(";")) {
    const [name, ...values] = part.trim().split(/\s+/);
    if (name) map.set(name, values);
  }
  return map;
}

describe("contentSecurityPolicy", () => {
  it("locks down the basics in production", () => {
    const d = directives(contentSecurityPolicy({ relayUrl: "wss://sofia.jayconsejo.com/call" }));
    assert.deepEqual(d.get("default-src"), ["'self'"]);
    assert.deepEqual(d.get("object-src"), ["'none'"]);
    assert.deepEqual(d.get("base-uri"), ["'self'"]);
    assert.deepEqual(d.get("form-action"), ["'self'"]);
    assert.deepEqual(d.get("frame-ancestors"), ["'none'"]);
    assert.deepEqual(d.get("worker-src"), ["'self'"]);
    assert.ok(!d.get("script-src")?.includes("'unsafe-eval'"));
  });

  it("allows the relay's origin, without its path, for the Nova call socket", () => {
    const d = directives(contentSecurityPolicy({ relayUrl: "wss://relay.example.test/call" }));
    assert.ok(d.get("connect-src")?.includes("wss://relay.example.test"));
    assert.ok(!d.get("connect-src")?.some((v) => v.includes("/call")));
  });

  it("falls back to the production relay when the URL is unset or not a socket", () => {
    for (const relayUrl of [undefined, "", "https://relay.example.test/call", "not a url"]) {
      const d = directives(contentSecurityPolicy({ relayUrl }));
      assert.ok(d.get("connect-src")?.includes("wss://sofia.jayconsejo.com"), String(relayUrl));
      assert.ok(!d.get("connect-src")?.includes("https://relay.example.test"), String(relayUrl));
    }
  });

  it("allows no ElevenLabs widget hosts (the site no longer loads it)", () => {
    const policy = contentSecurityPolicy({});
    for (const host of ["unpkg.com", "jsdelivr", "elevenlabs", "eleven-public-cdn", "fonts.googleapis", "fonts.gstatic"]) {
      assert.ok(!policy.includes(host), host);
    }
    assert.ok(!directives(policy).get("script-src")?.includes("blob:"));
  });

  it("allows the Cloudflare Web Analytics beacon, which reports to this site's own /cdn-cgi/rum", () => {
    const d = directives(contentSecurityPolicy({}));
    assert.ok(d.get("script-src")?.includes("https://static.cloudflareinsights.com"));
    assert.ok(d.get("connect-src")?.includes("'self'"));
    assert.ok(!d.get("connect-src")?.some((v) => v.includes("cloudflareinsights")));
  });

  it("allows the phone field's flag images", () => {
    const d = directives(contentSecurityPolicy({}));
    assert.ok(d.get("img-src")?.includes("https://purecatamphetamine.github.io/country-flag-icons/"));
  });

  it("allows video and posters from the R2 bucket", () => {
    const d = directives(contentSecurityPolicy({}));
    const r2 = "https://pub-f0ac1ec148884b718fc28632174966a4.r2.dev";
    assert.ok(d.get("media-src")?.includes(r2));
    assert.ok(d.get("img-src")?.includes(r2));
  });

  it("adds 'unsafe-eval' only in development", () => {
    const d = directives(contentSecurityPolicy({ dev: true }));
    assert.ok(d.get("script-src")?.includes("'unsafe-eval'"));
  });
});

describe("next.config", () => {
  it("sends the policy as report-only and hides x-powered-by", async () => {
    assert.equal(nextConfig.poweredByHeader, false);
    const rules = await nextConfig.headers!();
    const all = rules.find((r) => r.source === "/(.*)");
    const keys = all?.headers.map((h) => h.key) ?? [];
    assert.ok(keys.includes("Content-Security-Policy-Report-Only"));
    assert.ok(!keys.includes("Content-Security-Policy"));
  });
});
