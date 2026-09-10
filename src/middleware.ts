import { NextRequest, NextResponse } from "next/server";
import { verificaTokenAdmin, ADMIN_COOKIE_NAME } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const autentificat = await verificaTokenAdmin(token);

  const esteRutaProtejataPagina = pathname.startsWith("/admin/dashboard");
  const esteRutaProtejataApi =
    pathname.startsWith("/api/admin/stats") || pathname.startsWith("/api/admin/export");

  if (esteRutaProtejataApi && !autentificat) {
    return NextResponse.json({ eroare: "Neautorizat." }, { status: 401 });
  }

  if (esteRutaProtejataPagina && !autentificat) {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  if (pathname === "/admin/login" && autentificat) {
    return NextResponse.redirect(new URL("/admin/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/dashboard", "/admin/login", "/api/admin/stats", "/api/admin/export"],
};
