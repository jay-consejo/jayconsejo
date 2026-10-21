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

  it("allows only the pinned ElevenLabs widget build, not all of unpkg", () => {
    const d = directives(contentSecurityPolicy({}));
    assert.ok(d.get("script-src")?.includes("https://unpkg.com/@elevenlabs/convai-widget-embed@0.11.7/"));
    assert.ok(!d.get("script-src")?.includes("https://unpkg.com"));
  });

  it("covers what the ElevenLabs widget loads during a call, but not its fingerprint ping", () => {
    const d = directives(contentSecurityPolicy({}));
    assert.ok(d.get("script-src")?.includes("blob:"), "audio worklets from blob: URLs");
    assert.ok(d.get("script-src")?.includes("https://cdn.jsdelivr.net/npm/@alexanderolsen/libsamplerate-js@2.1.2/"));
    assert.ok(d.get("style-src")?.includes("https://fonts.googleapis.com"));
    assert.ok(d.get("font-src")?.includes("https://fonts.gstatic.com"));
    assert.ok(d.get("img-src")?.includes("https://storage.googleapis.com/eleven-public-cdn/"));
    assert.ok(d.get("connect-src")?.includes("wss://livekit.rtc.elevenlabs.io"));
    assert.ok(!d.get("connect-src")?.some((v) => v.includes("openfpcdn")));
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
