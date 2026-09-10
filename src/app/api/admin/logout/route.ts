import { NextResponse } from "next/server";
import { stergeCookieAdmin } from "@/lib/auth";

export async function POST() {
  stergeCookieAdmin();
  return NextResponse.json({ ok: true });
}
