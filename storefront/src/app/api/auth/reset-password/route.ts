import { NextResponse } from "next/server";
import { getErpApiBase } from "@/lib/erp-client";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = await fetch(`${getErpApiBase()}/public/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "Unable to reach ERP auth service." }, { status: 503 });
  }
}
