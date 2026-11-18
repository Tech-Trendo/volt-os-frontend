import { NextResponse } from "next/server";
import { getErpApiBase } from "@/lib/erp-client";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      username_or_email?: string;
      email?: string;
      password?: string;
    };
    const identifier = (body.username_or_email || body.email || "").trim();
    const password = body.password || "";

    if (!identifier || !password) {
      return NextResponse.json(
        { error: "Email/username and password are required." },
        { status: 400 },
      );
    }

    const res = await fetch(`${getErpApiBase()}/auth/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username_or_email: identifier, password }),
      cache: "no-store",
    });

    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      const nonField = Array.isArray(data.non_field_errors) ? data.non_field_errors[0] : null;
      const errMsg =
        (typeof nonField === "string" && nonField) ||
        (typeof data.detail === "string" && data.detail) ||
        (typeof data.error === "string" && data.error) ||
        (typeof data.message === "string" && data.message) ||
        "Invalid ERP credentials.";
      return NextResponse.json({ error: errMsg }, { status: res.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Unable to reach the Volt OS backend server. Please try again." },
      { status: 502 },
    );
  }
}
