import { NextResponse } from "next/server";
import { getStorefrontSession } from "@/lib/auth";
import { getErpApiBase } from "@/lib/erp-client";
import { submitEnquiryWithRetry } from "@/lib/enquiry-queue";

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    const body = await request.json();
    const res = await submitEnquiryWithRetry(body, { ip });
    return NextResponse.json(res.payload, { status: res.status });
  } catch {
    return NextResponse.json({ error: "Failed to submit enquiry." }, { status: 500 });
  }
}

export async function GET() {
  const session = await getStorefrontSession();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Sign in to view your enquiries." }, { status: 401 });
  }
  const res = await fetch(`${getErpApiBase()}/public/my-enquiries`, {
    headers: { Authorization: `Bearer ${session.accessToken}` },
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({ enquiries: [] }));
  return NextResponse.json(data, { status: res.status });
}
