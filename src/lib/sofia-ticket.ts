import { createHmac, randomBytes } from "node:crypto";

/**
 * One-use call tickets for the voice relay. The relay verifies them with the same shared
 * secret, so every byte has to match its rules: the lead and IP hashes, the payload key
 * order, and a MAC over the base64url body string. `sofia-ticket.vectors.json` pins this.
 */

export type TicketLead = { name: string; email: string; whatsapp: string };

export type TicketPayload = {
  v: 1;
  nonce: string;
  /** Expiry, Unix ms. */
  exp: number;
  leadHash: string;
  ipHash: string;
};

export const TICKET_TTL_MS = 60_000;

const b64 = (data: Buffer | string) => Buffer.from(data).toString("base64url");
const hmac = (secret: string, data: string) => createHmac("sha256", secret).update(data).digest();

/** Keyed hash of the vetted lead, so the browser can't swap details after the server checked them. */
export function leadHash(lead: TicketLead, secret: string): string {
  const canonical = [
    lead.name.trim(),
    lead.email.trim().toLowerCase(),
    lead.whatsapp.replace(/[^\d+]/g, ""),
  ].join("\n");
  return b64(hmac(secret, `lead:${canonical}`));
}

export function ipHash(ip: string, secret: string): string {
  return b64(hmac(secret, `ip:${ip}`)).slice(0, 22);
}

export function newNonce(): string {
  return randomBytes(16).toString("base64url");
}

export function signTicket(payload: TicketPayload, secret: string): string {
  // Fixed key order: the relay checks the MAC over these exact bytes.
  const ordered: TicketPayload = {
    v: payload.v,
    nonce: payload.nonce,
    exp: payload.exp,
    leadHash: payload.leadHash,
    ipHash: payload.ipHash,
  };
  const body = b64(JSON.stringify(ordered));
  return `${body}.${b64(hmac(secret, body))}`;
}

export function mintTicket(
  lead: TicketLead,
  ip: string,
  secret: string,
  now: number = Date.now(),
): { ticket: string; expiresAt: number } {
  const exp = now + TICKET_TTL_MS;
  const ticket = signTicket(
    { v: 1, nonce: newNonce(), exp, leadHash: leadHash(lead, secret), ipHash: ipHash(ip, secret) },
    secret,
  );
  return { ticket, expiresAt: exp };
}
