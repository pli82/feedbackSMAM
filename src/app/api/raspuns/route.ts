import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const COOKIE_COMPLETAT = "chestionar_completat";

type RaspunsLikertInput = { numar: number; valoare: number };
type RaspunsDeschisInput = { numarIntrebare: number; text: string };

export async function POST(req: NextRequest) {
  const cookieCompletat = req.cookies.get(COOKIE_COMPLETAT)?.value === "1";
  if (cookieCompletat) {
    return NextResponse.json(
      { eroare: "Chestionarul a fost deja completat de pe acest dispozitiv." },
      { status: 409 }
    );
  }

  let body: {
    formator?: string;
    grupa?: string;
    raspunsuriLikert?: RaspunsLikertInput[];
    raspunsuriDeschise?: RaspunsDeschisInput[];
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ eroare: "Corp de cerere invalid." }, { status: 400 });
  }

  const formator = typeof body.formator === "string" ? body.formator.trim() : "";
  const grupa = typeof body.grupa === "string" ? body.grupa.trim() : "";

  if (!formator || formator.length > 200) {
    return NextResponse.json({ eroare: "Formatorul este obligatoriu." }, { status: 400 });
  }
  if (!grupa || grupa.length > 200) {
    return NextResponse.json({ eroare: "Grupa/sesiunea este obligatorie." }, { status: 400 });
  }

  const raspunsuriLikert = body.raspunsuriLikert ?? [];
  const raspunsuriDeschise = body.raspunsuriDeschise ?? [];

  const intrebariActive = await prisma.intrebareLikert.findMany({
    where: { activa: true },
    select: { id: true, numar: true },
  });

  if (raspunsuriLikert.length !== intrebariActive.length) {
    return NextResponse.json(
      { eroare: "Trebuie completate toate întrebările cu scală." },
      { status: 400 }
    );
  }

  const hartaIntrebari = new Map(intrebariActive.map((i) => [i.numar, i.id]));

  for (const r of raspunsuriLikert) {
    if (!hartaIntrebari.has(r.numar)) {
      return NextResponse.json({ eroare: `Întrebarea ${r.numar} este necunoscută.` }, { status: 400 });
    }
    if (!Number.isInteger(r.valoare) || r.valoare < 1 || r.valoare > 5) {
      return NextResponse.json(
        { eroare: `Valoarea pentru întrebarea ${r.numar} trebuie să fie între 1 și 5.` },
        { status: 400 }
      );
    }
  }

  for (const r of raspunsuriDeschise) {
    if (![11, 12].includes(r.numarIntrebare)) {
      return NextResponse.json({ eroare: "Număr de întrebare deschisă invalid." }, { status: 400 });
    }
    if (typeof r.text !== "string" || r.text.length > 5000) {
      return NextResponse.json({ eroare: "Text de răspuns invalid." }, { status: 400 });
    }
  }

  const chestionar = await prisma.chestionar.create({
    data: {
      formator,
      grupa,
      raspunsuriLikert: {
        create: raspunsuriLikert.map((r) => ({
          intrebareId: hartaIntrebari.get(r.numar)!,
          valoare: r.valoare,
        })),
      },
      raspunsuriDeschise: {
        create: raspunsuriDeschise
          .filter((r) => r.text.trim().length > 0)
          .map((r) => ({ numarIntrebare: r.numarIntrebare, text: r.text.trim() })),
      },
    },
    select: { id: true },
  });

  const res = NextResponse.json({ id: chestionar.id }, { status: 201 });
  res.cookies.set(COOKIE_COMPLETAT, "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return res;
}
