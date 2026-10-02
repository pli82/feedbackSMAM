import { NextRequest, NextResponse } from "next/server";
import { esteAdminAutentificat } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { valideazaIntrebareTest } from "@/lib/test";

function idDinParams(params: { id: string }): number | null {
  const id = Number(params.id);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// PUT — modifică o întrebare (text, variante, răspuns corect, activă).
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await esteAdminAutentificat())) {
    return NextResponse.json({ eroare: "Neautorizat." }, { status: 401 });
  }
  const id = idDinParams(params);
  if (id === null) return NextResponse.json({ eroare: "Identificator invalid." }, { status: 400 });

  const body = await req.json().catch(() => null);
  const rezultat = valideazaIntrebareTest(body);
  if (!rezultat.ok) {
    return NextResponse.json({ eroare: rezultat.eroare }, { status: 400 });
  }

  const conflict = await prisma.intrebareTest.findUnique({ where: { numar: rezultat.date.numar } });
  if (conflict && conflict.id !== id) {
    return NextResponse.json(
      { eroare: `Există deja o întrebare cu numărul ${rezultat.date.numar}.` },
      { status: 409 }
    );
  }

  try {
    const actualizata = await prisma.intrebareTest.update({ where: { id }, data: rezultat.date });
    return NextResponse.json({ intrebare: actualizata });
  } catch {
    return NextResponse.json({ eroare: "Întrebarea nu a fost găsită." }, { status: 404 });
  }
}

// DELETE — șterge o întrebare ȘI răspunsurile date la ea (cascadă).
// Pentru a păstra istoricul, se recomandă dezactivarea în loc de ștergere.
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await esteAdminAutentificat())) {
    return NextResponse.json({ eroare: "Neautorizat." }, { status: 401 });
  }
  const id = idDinParams(params);
  if (id === null) return NextResponse.json({ eroare: "Identificator invalid." }, { status: 400 });

  try {
    await prisma.intrebareTest.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ eroare: "Întrebarea nu a fost găsită." }, { status: 404 });
  }
}
