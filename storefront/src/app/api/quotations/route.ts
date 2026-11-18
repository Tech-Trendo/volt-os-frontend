import { NextResponse } from "next/server";
import { getStorefrontSession } from "@/lib/auth";
import { getErpApiBase } from "@/lib/erp-client";

export async function GET() {
  const session = await getStorefrontSession();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Sign in to view your quotations." }, { status: 401 });
  }
  const res = await fetch(`${getErpApiBase()}/public/my-quotations`, {
    headers: { Authorization: `Bearer ${session.accessToken}` },
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({ quotations: [] }));
  return NextResponse.json(data, { status: res.status });
}

export async function POST(request: Request) {
  const session = await getStorefrontSession();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Sign in to respond to a quotation." }, { status: 401 });
  }
  try {
    const body = (await request.json()) as { quotationId?: string; action?: string; note?: string };
    if (!body.quotationId || !body.action) {
      return NextResponse.json({ error: "quotationId and action are required." }, { status: 400 });
    }
    const res = await fetch(
      `${getErpApiBase()}/public/my-quotations/${encodeURIComponent(body.quotationId)}/respond`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({ action: body.action, note: body.note || "" }),
      },
    );
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "Unable to submit quotation response." }, { status: 500 });
  }
}
