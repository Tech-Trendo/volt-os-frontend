import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { getErpApiBase } from "./erp-client";
import { enquirySchema } from "./validation";
import { checkRateLimit } from "./rate-limit";

export interface QueuedEnquiry {
  idempotency_key: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  charger_slug?: string | null;
  charger_id?: string | null;
  company?: string;
  location?: string;
  request_type?: "enquiry" | "quotation";
  quantity?: number;
  site_type?: string;
  installation_required?: boolean;
  items?: { chargerSlug?: string; name?: string; quantity: number }[];
  queuedAt: string;
  attempts: number;
}

const DEFAULT_QUEUE_FILE = path.join(process.cwd(), ".data", "enquiry-retry-queue.json");

export function signEnquiryBody(rawBody: string, secret: string): string {
  return "sha256=" + crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
}

async function readQueue(queuePath = DEFAULT_QUEUE_FILE): Promise<QueuedEnquiry[]> {
  try {
    const raw = await fs.readFile(queuePath, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as QueuedEnquiry[]) : [];
  } catch {
    return [];
  }
}

async function writeQueue(items: QueuedEnquiry[], queuePath = DEFAULT_QUEUE_FILE): Promise<void> {
  await fs.mkdir(path.dirname(queuePath), { recursive: true });
  await fs.writeFile(queuePath, JSON.stringify(items, null, 2), "utf8");
}

export async function postEnquiryToErp(
  payload: Omit<QueuedEnquiry, "queuedAt" | "attempts">,
  fetchImpl: typeof fetch = fetch,
): Promise<{ ok: boolean; status: number; data?: Record<string, unknown>; transientError?: boolean }> {
  const apiKey = process.env.STOREFRONT_ENQUIRY_API_KEY || "voltos-enquiry-api-key-dev-2026";
  const hmacSecret = process.env.STOREFRONT_ENQUIRY_HMAC_SECRET || process.env.CMS_WEBHOOK_SECRET || "voltos-cms-webhook-dev-secret-2026";
  const rawBody = JSON.stringify(payload);
  const signature = signEnquiryBody(rawBody, hmacSecret);

  try {
    const res = await fetchImpl(`${getErpApiBase()}/public/enquiries`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Enquiry-Api-Key": apiKey,
        "X-Enquiry-Signature": signature,
      },
      body: rawBody,
      signal: AbortSignal.timeout(6000),
    });

    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (res.ok) {
      return { ok: true, status: res.status, data };
    }
    return {
      ok: false,
      status: res.status,
      data,
      transientError: res.status >= 500 || res.status === 429,
    };
  } catch {
    return { ok: false, status: 503, transientError: true };
  }
}

export async function flushPendingEnquiries(opts?: {
  queuePath?: string;
  fetchImpl?: typeof fetch;
}): Promise<{ flushed: number; remaining: number }> {
  const queuePath = opts?.queuePath ?? DEFAULT_QUEUE_FILE;
  const fetchImpl = opts?.fetchImpl ?? fetch;
  const items = await readQueue(queuePath);
  if (items.length === 0) return { flushed: 0, remaining: 0 };

  const remaining: QueuedEnquiry[] = [];
  let flushed = 0;

  for (const item of items) {
    const { queuedAt, attempts, ...body } = item;
    const res = await postEnquiryToErp(body, fetchImpl);
    if (res.ok || (res.status >= 400 && res.status < 500 && res.status !== 429)) {
      flushed++;
    } else {
      remaining.push({ ...item, queuedAt, attempts: attempts + 1 });
    }
  }

  await writeQueue(remaining, queuePath);
  return { flushed, remaining: remaining.length };
}

export async function submitEnquiryWithRetry(
  rawInput: unknown,
  meta: { ip: string },
  opts?: { queuePath?: string; fetchImpl?: typeof fetch },
) {
  const rate = checkRateLimit(`enquiry:${meta.ip}`, 8, 10 * 60 * 1000);
  if (!rate.allowed) {
    return {
      status: 429,
      payload: { error: `Too many enquiries submitted. Please wait ${rate.retryAfterSec}s.` },
    };
  }

  const parsed = enquirySchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      status: 400,
      payload: { error: parsed.error.issues[0]?.message || "Please check all required fields." },
    };
  }

  if (parsed.data.website && parsed.data.website.trim().length > 0) {
    return { status: 200, payload: { message: "Enquiry received.", spamFiltered: true } };
  }

  const queuePath = opts?.queuePath ?? DEFAULT_QUEUE_FILE;
  const fetchImpl = opts?.fetchImpl ?? fetch;

  // Opportunistically flush any previously queued enquiries first
  void flushPendingEnquiries({ queuePath, fetchImpl }).catch(() => {});

  const extra = (rawInput && typeof rawInput === "object" ? rawInput : {}) as {
    chargerSlug?: string;
    company?: string;
    location?: string;
    requestType?: "enquiry" | "quotation";
    quantity?: number;
    siteType?: string;
    installationRequired?: boolean;
    items?: { chargerSlug?: string; name?: string; quantity: number }[];
  };

  const idempotencyKey = crypto.randomUUID();
  const erpPayload: Omit<QueuedEnquiry, "queuedAt" | "attempts"> = {
    idempotency_key: idempotencyKey,
    name: parsed.data.name,
    email: parsed.data.email,
    phone: parsed.data.phone,
    message: parsed.data.message,
    charger_id: parsed.data.chargerId || null,
    charger_slug: extra.chargerSlug || null,
    company: extra.company || "",
    location: extra.location || "",
    request_type: extra.requestType === "quotation" ? "quotation" : "enquiry",
    quantity: extra.quantity ?? 1,
    site_type: extra.siteType || "",
    installation_required: extra.installationRequired ?? true,
    items: Array.isArray(extra.items) ? extra.items : [],
  };

  const result = await postEnquiryToErp(erpPayload, fetchImpl);
  if (result.ok) {
    return {
      status: 201,
      payload: {
        id: result.data?.id,
        code: result.data?.code,
        quotationId: result.data?.quotationId ?? null,
        quotationCode: result.data?.quotationCode ?? null,
        estimatedTotalNpr: result.data?.estimatedTotalNpr ?? null,
        queued: false,
        message:
          String(result.data?.message || "") ||
          "Thank you! Your enquiry has been received by our sales team.",
      },
    };
  }

  if (result.transientError) {
    const queue = await readQueue(queuePath);
    queue.push({
      ...erpPayload,
      queuedAt: new Date().toISOString(),
      attempts: 1,
    });
    await writeQueue(queue, queuePath);
    return {
      status: 202,
      payload: {
        id: idempotencyKey,
        queued: true,
        message: "Thank you! Your enquiry has been received and queued for our sales team.",
      },
    };
  }

  return {
    status: result.status || 400,
    payload: { error: String(result.data?.error || "Unable to submit enquiry.") },
  };
}
