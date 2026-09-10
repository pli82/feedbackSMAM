import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { semneazaTokenAdmin, setaCookieAdmin } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { utilizator, parola } = (await req.json().catch(() => ({}))) as {
    utilizator?: string;
    parola?: string;
  };

  const adminUser = process.env.ADMIN_USER;
  const adminHash = process.env.ADMIN_PASSWORD_HASH;

  if (!adminUser || !adminHash) {
    return NextResponse.json(
      { eroare: "Autentificarea admin nu este configurată pe server." },
      { status: 500 }
    );
  }

  if (!utilizator || !parola || utilizator !== adminUser) {
    return NextResponse.json({ eroare: "Utilizator sau parolă incorecte." }, { status: 401 });
  }

  const parolaCorecta = await bcrypt.compare(parola, adminHash);
  if (!parolaCorecta) {
    return NextResponse.json({ eroare: "Utilizator sau parolă incorecte." }, { status: 401 });
  }

  const token = await semneazaTokenAdmin();
  setaCookieAdmin(token);

  return NextResponse.json({ ok: true });
}
