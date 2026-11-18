import fs from "fs/promises";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  flushPendingEnquiries,
  signEnquiryBody,
  submitEnquiryWithRetry,
} from "@/lib/enquiry-queue";

describe("Storefront Enquiry Sync & Retry Queue", () => {
  let tmpDir: string;
  let queuePath: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "storefront-enquiry-test-"));
    queuePath = path.join(tmpDir, "queue.json");
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it("validates invalid payloads and returns 400 without contacting ERP", async () => {
    const mockFetch = vi.fn();
    const res = await submitEnquiryWithRetry(
      { name: "A", email: "bad-email", phone: "123", message: "short" },
      { ip: "10.0.0.1" },
      { queuePath, fetchImpl: mockFetch as unknown as typeof fetch },
    );

    expect(res.status).toBe(400);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("silently absorbs honeypot spam without calling ERP", async () => {
    const mockFetch = vi.fn();
    const res = await submitEnquiryWithRetry(
      {
        name: "Spam Bot",
        email: "bot@spam.example",
        phone: "+977-9800000000",
        message: "Buy cheap links now please click here!",
        website: "https://spam.example",
      },
      { ip: "10.0.0.2" },
      { queuePath, fetchImpl: mockFetch as unknown as typeof fetch },
    );

    expect(res.status).toBe(200);
    expect(res.payload).toMatchObject({ spamFiltered: true });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("posts signed enquiry to ERP and returns 201 with ERP reference code", async () => {
    const mockFetch = vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
      const headers = (init?.headers ?? {}) as Record<string, string>;
      const body = String(init?.body ?? "");
      const secret =
        process.env.STOREFRONT_ENQUIRY_HMAC_SECRET ||
        process.env.CMS_WEBHOOK_SECRET ||
        "voltos-cms-webhook-dev-secret-2026";
      expect(headers["X-Enquiry-Api-Key"]).toBeTruthy();
      expect(headers["X-Enquiry-Signature"]).toBe(signEnquiryBody(body, secret));

      return new Response(JSON.stringify({ id: "42", code: "ENQ-2026-042" }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    });

    const res = await submitEnquiryWithRetry(
      {
        name: "Ramesh Adhikari",
        email: "ramesh@kathmanduev.np",
        phone: "+977-9841234567",
        message: "Looking for two 60kW DC fast chargers for Pokhara highway hub.",
        chargerSlug: "autel-maxicharger-dc-60kw",
      },
      { ip: "10.0.0.3" },
      { queuePath, fetchImpl: mockFetch as unknown as typeof fetch },
    );

    expect(res.status).toBe(201);
    expect(res.payload).toMatchObject({ id: "42", code: "ENQ-2026-042", queued: false });
  });

  it("queues enquiry to durable retry file when ERP is unreachable and flushes upon recovery", async () => {
    const offlineFetch = vi.fn(async () => {
      throw new Error("ECONNREFUSED");
    });

    const queuedRes = await submitEnquiryWithRetry(
      {
        name: "Sita Gurung",
        email: "sita@pokharahotel.np",
        phone: "+977-9851122334",
        message: "Need three 22kW AC chargers for resort guest parking.",
      },
      { ip: "10.0.0.4" },
      { queuePath, fetchImpl: offlineFetch as unknown as typeof fetch },
    );

    expect(queuedRes.status).toBe(202);
    expect(queuedRes.payload).toMatchObject({ queued: true });

    const queuedRaw = JSON.parse(await fs.readFile(queuePath, "utf8")) as { idempotency_key: string }[];
    expect(queuedRaw).toHaveLength(1);
    expect(queuedRaw[0].idempotency_key).toBeTruthy();

    // Now ERP recovers and accepts the queued enquiry
    const onlineFetch = vi.fn(async () => {
      return new Response(JSON.stringify({ id: "99", code: "ENQ-2026-099" }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    });

    const flushResult = await flushPendingEnquiries({
      queuePath,
      fetchImpl: onlineFetch as unknown as typeof fetch,
    });

    expect(flushResult).toEqual({ flushed: 1, remaining: 0 });
    expect(onlineFetch).toHaveBeenCalledTimes(1);

    const afterFlush = JSON.parse(await fs.readFile(queuePath, "utf8")) as unknown[];
    expect(afterFlush).toHaveLength(0);
  });

  it("enforces rate limiting after repeated submissions from the same IP", async () => {
    const mockFetch = vi.fn(
      async () =>
        new Response(JSON.stringify({ id: "1", code: "ENQ-1" }), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        }),
    );

    const payload = {
      name: "Rate Test",
      email: "rate@test.np",
      phone: "+977-9811111111",
      message: "Checking rate limiter behavior for public enquiry submissions.",
    };

    let lastStatus = 0;
    for (let i = 0; i < 9; i++) {
      const res = await submitEnquiryWithRetry(
        payload,
        { ip: "198.51.100.77" },
        { queuePath, fetchImpl: mockFetch as unknown as typeof fetch },
      );
      lastStatus = res.status;
    }

    expect(lastStatus).toBe(429);
  });
});
