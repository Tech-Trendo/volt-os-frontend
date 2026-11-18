import { NextResponse } from "next/server";
import { PREVIEW_TOKEN_COOKIE } from "@/lib/cms";

export async function DELETE() {
  const response = NextResponse.json({ preview: false });
  response.cookies.delete(PREVIEW_TOKEN_COOKIE);
  return response;
}
