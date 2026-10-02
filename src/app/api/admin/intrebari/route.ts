import { NextRequest, NextResponse } from "next/server";
import { esteAdminAutentificat } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { valideazaIntrebareTest } from "@/lib/test";

// GET — toate întrebările de test (active și inactive) + numărul de răspunsuri.
export async function GET() {
  if (!(await esteAdminAutentificat())) {
    return NextResponse.json({ eroare: "Neautorizat." }, { status: 401 });
  }
  const intrebari = await prisma.intrebareTest.findMany({
    orderBy: { numar: "asc" },
    include: { _count: { select: { raspunsuri: true } } },
  });
  return NextResponse.json({
    intrebari: intrebari.map(({ _count, ...i }) => ({ ...i, totalRaspunsuri: _count.raspunsuri })),
  });
}

// POST — adaugă o întrebare nouă.
export async function POST(req: NextRequest) {
  if (!(await esteAdminAutentificat())) {
    return NextResponse.json({ eroare: "Neautorizat." }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const rezultat = valideazaIntrebareTest(body);
  if (!rezultat.ok) {
    return NextResponse.json({ eroare: rezultat.eroare }, { status: 400 });
  }
  const existenta = await prisma.intrebareTest.findUnique({ where: { numar: rezultat.date.numar } });
  if (existenta) {
    return NextResponse.json(
      { eroare: `Există deja o întrebare cu numărul ${rezultat.date.numar}.` },
      { status: 409 }
    );
  }
  const creata = await prisma.intrebareTest.create({ data: rezultat.date });
  return NextResponse.json({ intrebare: creata }, { status: 201 });
}
