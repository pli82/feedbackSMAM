import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ADMIN_USER: !!process.env.ADMIN_USER,
    ADMIN_PASSWORD_HASH: !!process.env.ADMIN_PASSWORD_HASH,
    JWT_SECRET: !!process.env.JWT_SECRET,
    DATABASE_URL: !!process.env.DATABASE_URL,
  });
}
