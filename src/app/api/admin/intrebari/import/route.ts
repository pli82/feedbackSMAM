import { NextRequest, NextResponse } from "next/server";
import { esteAdminAutentificat } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { citesteExcelIntrebari } from "@/lib/test";

const MAX_BYTES = 2 * 1024 * 1024; // 2 MB

// POST (multipart, câmpul "fisier") — importă dintr-o singură mișcare toate
// întrebările din Excel. Întrebările cu același număr sunt actualizate, cele
// noi sunt adăugate; nimic nu se șterge. Totul sau nimic: la prima eroare de
// validare nu se scrie nimic.
export async function POST(req: NextRequest) {
  if (!(await esteAdminAutentificat())) {
    return NextResponse.json({ eroare: "Neautorizat." }, { status: 401 });
  }

  let fisier: File | null = null;
  try {
    const form = await req.formData();
    const f = form.get("fisier");
    if (f instanceof File) fisier = f;
  } catch {
    return NextResponse.json({ eroare: "Cerere invalidă." }, { status: 400 });
  }
  if (!fisier) {
    return NextResponse.json({ eroare: "Nu a fost trimis niciun fișier." }, { status: 400 });
  }
  if (!fisier.name.toLowerCase().endsWith(".xlsx")) {
    return NextResponse.json({ eroare: "Fișierul trebuie să fie în format .xlsx." }, { status: 400 });
  }
  if (fisier.size > MAX_BYTES) {
    return NextResponse.json({ eroare: "Fișierul este prea mare (maximum 2 MB)." }, { status: 400 });
  }

  let rezultat;
  try {
    rezultat = await citesteExcelIntrebari(Buffer.from(await fisier.arrayBuffer()));
  } catch {
    return NextResponse.json(
      { eroare: "Fișierul nu a putut fi citit. Verificați că este un Excel (.xlsx) valid." },
      { status: 400 }
    );
  }

  if (rezultat.erori.length > 0) {
    return NextResponse.json(
      { eroare: "Importul nu a fost efectuat. Corectați problemele și încercați din nou.", detalii: rezultat.erori },
      { status: 400 }
    );
  }

  const existente = await prisma.intrebareTest.findMany({
    where: { numar: { in: rezultat.intrebari.map((i) => i.numar) } },
    select: { numar: true },
  });
  const numereExistente = new Set(existente.map((e) => e.numar));

  await prisma.$transaction(
    rezultat.intrebari.map((i) => {
      const { activa: _activa, ...camp } = i;
      return prisma.intrebareTest.upsert({
        where: { numar: i.numar },
        update: camp, // nu schimbă starea activ/inactiv a unei întrebări existente
        create: i,
      });
    })
  );

  return NextResponse.json({
    ok: true,
    adaugate: rezultat.intrebari.filter((i) => !numereExistente.has(i.numar)).length,
    actualizate: rezultat.intrebari.filter((i) => numereExistente.has(i.numar)).length,
  });
}
