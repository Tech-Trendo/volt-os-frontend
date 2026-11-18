import { NextResponse } from "next/server";
import { getStorefrontSession } from "@/lib/auth";
import { getErpApiBase } from "@/lib/erp-client";

export async function GET() {
  const session = await getStorefrontSession();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Sign in to view your wishlist." }, { status: 401 });
  }
  const res = await fetch(`${getErpApiBase()}/public/wishlist`, {
    headers: { Authorization: `Bearer ${session.accessToken}` },
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({ items: [] }));
  return NextResponse.json(data, { status: res.status });
}

export async function POST(request: Request) {
  const session = await getStorefrontSession();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Sign in to save chargers to your wishlist." }, { status: 401 });
  }
  const body = await request.json();
  const res = await fetch(`${getErpApiBase()}/public/wishlist`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.accessToken}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
