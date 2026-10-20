import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { ipHash, leadHash, mintTicket, signTicket, TICKET_TTL_MS, type TicketLead } from "./sofia-ticket.ts";

// The relay generates this file from its own verifier; both sides test against identical bytes.
type Vector = {
  name: string;
  lead: TicketLead;
  ip: string;
  nonce: string;
  exp: number;
  leadHash: string;
  ipHash: string;
  ticket: string;
};
const { secret, vectors } = JSON.parse(
  readFileSync(new URL("./sofia-ticket.vectors.json", import.meta.url), "utf8"),
) as { secret: string; vectors: Vector[] };

describe("sofia ticket: shared vectors", () => {
  it("has the expected cases", () => {
    assert.deepEqual(
      vectors.map((v) => v.name),
      ["plain lead", "mixed-case email with spaces", "phone with punctuation", "non-ASCII name", "IPv6 caller"],
    );
  });

  for (const v of vectors) {
    it(`matches the relay for: ${v.name}`, () => {
      assert.equal(leadHash(v.lead, secret), v.leadHash);
      assert.equal(ipHash(v.ip, secret), v.ipHash);
      assert.equal(
        signTicket({ v: 1, nonce: v.nonce, exp: v.exp, leadHash: v.leadHash, ipHash: v.ipHash }, secret),
        v.ticket,
      );
    });
  }
});

describe("sofia ticket: minting", () => {
  const lead = vectors[0]!.lead;

  it("expires one TTL after now and carries a fresh 22-character nonce", () => {
    const now = 1_800_000_000_000;
    const { ticket, expiresAt } = mintTicket(lead, "203.0.113.7", secret, now);
    assert.equal(expiresAt, now + TICKET_TTL_MS);
    const payload = JSON.parse(Buffer.from(ticket.split(".")[0]!, "base64url").toString("utf8"));
    assert.deepEqual(Object.keys(payload), ["v", "nonce", "exp", "leadHash", "ipHash"]);
    assert.equal(payload.exp, expiresAt);
    assert.equal(payload.nonce.length, 22);
  });

  it("never reuses a nonce", () => {
    const a = mintTicket(lead, "203.0.113.7", secret).ticket;
    const b = mintTicket(lead, "203.0.113.7", secret).ticket;
    assert.notEqual(a, b);
  });

  it("keeps the key order even if the payload object is built in another order", () => {
    const v = vectors[0]!;
    const shuffled = { ipHash: v.ipHash, leadHash: v.leadHash, exp: v.exp, nonce: v.nonce, v: 1 as const };
    assert.equal(signTicket(shuffled, secret), v.ticket);
  });
});
