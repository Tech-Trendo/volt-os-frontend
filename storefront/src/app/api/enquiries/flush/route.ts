import { NextResponse } from "next/server";
import { flushPendingEnquiries } from "@/lib/enquiry-queue";

export async function POST() {
  const result = await flushPendingEnquiries();
  return NextResponse.json(result);
}
