import { describe, expect, it } from "vitest";
import { signWebhook, verifyWebhookSignature } from "@/lib/webhook";

describe("Storefront Revalidation Webhook HMAC Verification", () => {
  const secret = "test-webhook-secret-2026";
  const body = JSON.stringify({ tags: ["chargers", "site"], paths: ["/chargers"] });

  it("accepts a valid signed payload within the replay window", () => {
    const now = 1770000000;
    const timestamp = String(now - 10);
    const signature = signWebhook(timestamp, body, secret);

    const result = verifyWebhookSignature({
      timestamp,
      signature,
      rawBody: body,
      secret,
      nowSeconds: now,
    });

    expect(result.ok).toBe(true);
  });

  it("rejects a tampered body or wrong secret", () => {
    const now = 1770000000;
    const timestamp = String(now);
    const signature = signWebhook(timestamp, body, secret);

    const tampered = verifyWebhookSignature({
      timestamp,
      signature,
      rawBody: JSON.stringify({ tags: ["all"] }),
      secret,
      nowSeconds: now,
    });
    expect(tampered.ok).toBe(false);

    const wrongSecret = verifyWebhookSignature({
      timestamp,
      signature,
      rawBody: body,
      secret: "wrong-secret",
      nowSeconds: now,
    });
    expect(wrongSecret.ok).toBe(false);
  });

  it("rejects expired timestamps outside maxAgeSeconds", () => {
    const now = 1770000000;
    const staleTs = String(now - 600);
    const signature = signWebhook(staleTs, body, secret);

    const result = verifyWebhookSignature({
      timestamp: staleTs,
      signature,
      rawBody: body,
      secret,
      nowSeconds: now,
      maxAgeSeconds: 300,
    });

    expect(result.ok).toBe(false);
    expect(result.reason).toContain("expired");
  });

  it("rejects missing headers", () => {
    const result = verifyWebhookSignature({
      timestamp: null,
      signature: null,
      rawBody: body,
      secret,
    });

    expect(result.ok).toBe(false);
  });
});
