import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "admin_token";
const MAX_AGE_SECONDS = 60 * 60 * 8; // 8 ore

function getSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET nu este configurat.");
  }
  return new TextEncoder().encode(secret);
}

export async function semneazaTokenAdmin(): Promise<string> {
  return new SignJWT({ rol: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verificaTokenAdmin(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload.rol === "admin";
  } catch {
    return false;
  }
}

export function setaCookieAdmin(token: string) {
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export function stergeCookieAdmin() {
  cookies().set(COOKIE_NAME, "", { path: "/", maxAge: 0 });
}

export async function esteAdminAutentificat(): Promise<boolean> {
  const token = cookies().get(COOKIE_NAME)?.value;
  return verificaTokenAdmin(token);
}

export const ADMIN_COOKIE_NAME = COOKIE_NAME;
