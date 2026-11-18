import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { verifyWebhookSignature } from "@/lib/webhook";
import { clearFallbackCache } from "@/lib/erp-client";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const timestamp = request.headers.get("x-webhook-timestamp");
  const signature = request.headers.get("x-webhook-signature");
  const secret = process.env.CMS_WEBHOOK_SECRET || "voltos-cms-webhook-dev-secret-2026";

  const check = verifyWebhookSignature({ timestamp, signature, rawBody, secret });
  if (!check.ok) {
    return NextResponse.json({ error: check.reason || "Invalid signature." }, { status: 401 });
  }

  let body: { tags?: string[]; paths?: string[]; entityType?: string } = {};
  try {
    body = JSON.parse(rawBody || "{}");
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const tags = Array.isArray(body.tags) && body.tags.length > 0 ? body.tags : ["site", "chargers", "pages", "settings"];
  const paths = Array.isArray(body.paths) && body.paths.length > 0 ? body.paths : ["/", "/chargers", "/about", "/services", "/contact", "/faq"];

  for (const tag of tags) {
    revalidateTag(tag);
  }
  for (const p of paths) {
    revalidatePath(p);
  }
  await clearFallbackCache();

  return NextResponse.json({ revalidated: true, tags, paths });
}
