import crypto from "crypto";

export function signWebhook(timestamp: string, rawBody: string, secret: string): string {
  const digest = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");
  return `sha256=${digest}`;
}

export function verifyWebhookSignature(params: {
  timestamp: string | null;
  signature: string | null;
  rawBody: string;
  secret: string;
  nowSeconds?: number;
  maxAgeSeconds?: number;
}): { ok: boolean; reason?: string } {
  const { timestamp, signature, rawBody, secret } = params;
  const nowSec = params.nowSeconds ?? Math.floor(Date.now() / 1000);
  const maxAge = params.maxAgeSeconds ?? 300;

  if (!secret) return { ok: false, reason: "Webhook secret is not configured." };
  if (!timestamp || !signature) return { ok: false, reason: "Missing signature headers." };

  const tsNum = Number(timestamp);
  if (!Number.isFinite(tsNum) || Math.abs(nowSec - tsNum) > maxAge) {
    return { ok: false, reason: "Webhook timestamp expired or invalid." };
  }

  const expected = signWebhook(timestamp, rawBody, secret);
  const a = Buffer.from(expected);
  const b = Buffer.from(signature.trim());
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return { ok: false, reason: "Invalid webhook HMAC signature." };
  }
  return { ok: true };
}
