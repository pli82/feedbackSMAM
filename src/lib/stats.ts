import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export type DistributieValoare = { valoare: number; numar: number; procent: number };
export type StatisticaIntrebare = {
  numar: number;
  text: string;
  medie: number;
  totalRaspunsuri: number;
  distributie: DistributieValoare[];
};
export type FiltruChestionar = { formator?: string; grupa?: string };
export type OptiuneFiltrare = { valoare: string; total: number };
export type RezumatGrup = {
  valoare: string;
  totalChestionare: number;
  mediaGenerala: number;
  satisfactieGenerala: number | null;
};

const NESPECIFICAT = "Nespecificat";

function construiesteWhereChestionar(filtru: FiltruChestionar): Prisma.ChestionarWhereInput {
  const where: Prisma.ChestionarWhereInput = {};
  if (filtru.formator) where.formator = filtru.formator;
  if (filtru.grupa) where.grupa = filtru.grupa;
  return where;
}

export async function calculeazaStatistici(filtru: FiltruChestionar = {}) {
  const whereChestionar = construiesteWhereChestionar(filtru);

  const intrebari = await prisma.intrebareLikert.findMany({
    orderBy: { numar: "asc" },
  });

  const statisticiIntrebari: StatisticaIntrebare[] = [];

  for (const intrebare of intrebari) {
    const raspunsuri = await prisma.raspunsLikert.findMany({
      where: { intrebareId: intrebare.id, chestionar: whereChestionar },
      select: { valoare: true },
    });

    const total = raspunsuri.length;
    const suma = raspunsuri.reduce((acc, r) => acc + r.valoare, 0);
    const medie = total > 0 ? suma / total : 0;

    const distributie: DistributieValoare[] = [1, 2, 3, 4, 5].map((valoare) => {
      const numar = raspunsuri.filter((r) => r.valoare === valoare).length;
      return {
        valoare,
        numar,
        procent: total > 0 ? Math.round((numar / total) * 1000) / 10 : 0,
      };
    });

    statisticiIntrebari.push({
      numar: intrebare.numar,
      text: intrebare.text,
      medie: Math.round(medie * 100) / 100,
      totalRaspunsuri: total,
      distributie,
    });
  }

  const totalChestionare = await prisma.chestionar.count({ where: whereChestionar });

  const mediiValide = statisticiIntrebari.filter((s) => s.totalRaspunsuri > 0);
  const mediaGenerala =
    mediiValide.length > 0
      ? Math.round(
          (mediiValide.reduce((acc, s) => acc + s.medie, 0) / mediiValide.length) * 100
        ) / 100
      : 0;

  const satisfactieGenerala = statisticiIntrebari.find((s) => s.numar === 10) ?? null;

  const raspunsuriDeschise = await prisma.raspunsDeschis.findMany({
    where: { chestionar: whereChestionar },
    orderBy: { id: "desc" },
    select: { numarIntrebare: true, text: true },
  });

  return {
    totalChestionare,
    mediaGenerala,
    satisfactieGenerala,
    intrebari: statisticiIntrebari,
    raspunsuriDeschise,
  };
}

// Valorile distincte de formator/grupă existente în date, pentru dropdown-urile
// de filtrare din administrare. Chestionarele mai vechi fără valoare completată
// (dacă există) sunt grupate sub "Nespecificat".
export async function obtineOptiuniFiltrare(): Promise<{
  formatori: OptiuneFiltrare[];
  grupe: OptiuneFiltrare[];
}> {
  const [dupaFormator, dupaGrupa] = await Promise.all([
    prisma.chestionar.groupBy({ by: ["formator"], _count: { _all: true } }),
    prisma.chestionar.groupBy({ by: ["grupa"], _count: { _all: true } }),
  ]);

  const normalizeaza = (randuri: any[], camp: "formator" | "grupa"): OptiuneFiltrare[] =>
    randuri
      .map((r) => ({
        valoare: (r[camp] as string | null) ?? NESPECIFICAT,
        total: r._count._all as number,
      }))
      .sort((a, b) => a.valoare.localeCompare(b.valoare, "ro"));

  return {
    formatori: normalizeaza(dupaFormator, "formator"),
    grupe: normalizeaza(dupaGrupa, "grupa"),
  };
}

// Rezultate separate pentru fiecare formator sau fiecare grupă — un rând de
// rezumat (nr. chestionare, medie generală, satisfacție Q10) per valoare
// distinctă găsită în date.
export async function calculeazaRezumatPerGrup(camp: "formator" | "grupa"): Promise<RezumatGrup[]> {
  let optiuni: any;
  if (camp === "formator") {
    optiuni = await prisma.chestionar.groupBy({ by: ["formator"], _count: { _all: true } });
  } else {
    optiuni = await prisma.chestionar.groupBy({ by: ["grupa"], _count: { _all: true } });
  }
  const rezultate: RezumatGrup[] = [];
  for (const optiune of optiuni) {
    const valoare = (optiune[camp] as string | null) ?? NESPECIFICAT;
    // "Nespecificat" nu e o valoare reală în coloană — înseamnă NULL — deci
    // se filtrează diferit față de o valoare completată.
    const whereChestionar: Prisma.ChestionarWhereInput =
      camp === "formator"
        ? { formator: valoare === NESPECIFICAT ? null : valoare }
        : { grupa: valoare === NESPECIFICAT ? null : valoare };

    const totalChestionare = await prisma.chestionar.count({ where: whereChestionar });

    const intrebariRelevante = await prisma.intrebareLikert.findMany({ orderBy: { numar: "asc" } });
    const medii: number[] = [];
    let medieQ10: number | null = null;

    for (const intrebare of intrebariRelevante) {
      const raspunsuri = await prisma.raspunsLikert.findMany({
        where: { intrebareId: intrebare.id, chestionar: whereChestionar },
        select: { valoare: true },
      });
      if (raspunsuri.length === 0) continue;
      const medie =
        raspunsuri.reduce((acc, r) => acc + r.valoare, 0) / raspunsuri.length;
      medii.push(medie);
      if (intrebare.numar === 10) medieQ10 = Math.round(medie * 100) / 100;
    }

    const mediaGenerala =
      medii.length > 0 ? Math.round((medii.reduce((a, b) => a + b, 0) / medii.length) * 100) / 100 : 0;

    rezultate.push({ valoare, totalChestionare, mediaGenerala, satisfactieGenerala: medieQ10 });
  }

  return rezultate.sort((a, b) => a.valoare.localeCompare(b.valoare, "ro"));
}
