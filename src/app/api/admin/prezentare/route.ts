import { NextRequest, NextResponse } from "next/server";
import { esteAdminAutentificat } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CHEIE_LINK_PREZENTARE, valideazaLinkYoutube } from "@/lib/setari";

export async function GET() {
  if (!(await esteAdminAutentificat())) {
    return NextResponse.json({ eroare: "Neautorizat." }, { status: 401 });
  }
  const setare = await prisma.setare.findUnique({ where: { cheie: CHEIE_LINK_PREZENTARE } });
  return NextResponse.json({ link: setare?.valoare ?? null });
}

// PUT — salvează linkul YouTube.
export async function PUT(req: NextRequest) {
  if (!(await esteAdminAutentificat())) {
    return NextResponse.json({ eroare: "Neautorizat." }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const rezultat = valideazaLinkYoutube(body?.link);
  if (!rezultat.ok) {
    return NextResponse.json({ eroare: rezultat.eroare }, { status: 400 });
  }
  await prisma.setare.upsert({
    where: { cheie: CHEIE_LINK_PREZENTARE },
    update: { valoare: rezultat.link },
    create: { cheie: CHEIE_LINK_PREZENTARE, valoare: rezultat.link },
  });
  return NextResponse.json({ link: rezultat.link });
}

// DELETE — elimină linkul (secțiunea dispare din chestionar).
export async function DELETE() {
  if (!(await esteAdminAutentificat())) {
    return NextResponse.json({ eroare: "Neautorizat." }, { status: 401 });
  }
  await prisma.setare.deleteMany({ where: { cheie: CHEIE_LINK_PREZENTARE } });
  return NextResponse.json({ ok: true });
}
