import { prisma } from "@/lib/prisma";
import { VARIANTE, textOptiune } from "@/lib/test";

// ─────────────────────────────────────────────────────────────────────────────
// Statistici pentru Partea 1 (testul de cunoștințe SMAM).
// Se iau în calcul doar întrebările ACTIVE. Corectitudinea unui răspuns se
// calculează din cheia curentă a întrebării (nu e stocată în răspuns).
// ─────────────────────────────────────────────────────────────────────────────

const NESPECIFICAT = "Nespecificat";

export type FiltruTest = { formator?: string; grupa?: string };

export type DistributieVarianta = {
  varianta: string;
  text: string;
  numar: number;
  procent: number;
  corect: boolean;
};

export type StatisticaIntrebareTest = {
  numar: number;
  text: string;
  raspunsCorect: string;
  totalRaspunsuri: number;
  corecte: number;
  gresite: number;
  procentCorect: number;
  procentGresit: number;
  distributie: DistributieVarianta[];
  // Varianta greșită aleasă cel mai des (null dacă nu există răspunsuri greșite).
  distractorFrecvent: { varianta: string; numar: number } | null;
};

export type RezumatTestGrup = {
  valoare: string;
  totalChestionare: number;
  scorMediu: number; // media răspunsurilor corecte per chestionar
  procentCorect: number;
};

export type StatisticaTest = {
  nrIntrebari: number;
  totalChestionare: number;
  scorMediu: number;
  procentCorect: number;
  intrebari: StatisticaIntrebareTest[];
  comparatieFormatori: RezumatTestGrup[];
  comparatieGrupe: RezumatTestGrup[];
};

export type IntrebareTestDb = {
  id: number;
  numar: number;
  text: string;
  optiuneA: string;
  optiuneB: string;
  optiuneC: string;
  optiuneD: string;
  raspunsCorect: string;
};

export type RandTest = {
  chestionarId: string;
  formator: string | null;
  grupa: string | null;
  intrebareId: number;
  varianta: string;
};

const rotunjeste1 = (x: number) => Math.round(x * 10) / 10;
const rotunjeste2 = (x: number) => Math.round(x * 100) / 100;

// Încarcă toate întrebările active și toate răspunsurile lor, o singură dată.
// Filtrarea pe formator/județ se face apoi în memorie, ca tabelele comparative
// să poată arăta toate grupurile chiar și când un filtru e activ.
export async function incarcaDateTest(): Promise<{ intrebari: IntrebareTestDb[]; randuri: RandTest[] }> {
  const intrebari = await prisma.intrebareTest.findMany({
    where: { activa: true },
    orderBy: { numar: "asc" },
  });

  const brute = await prisma.raspunsTest.findMany({
    where: { intrebare: { activa: true } },
    select: {
      chestionarId: true,
      intrebareId: true,
      varianta: true,
      chestionar: { select: { formator: true, grupa: true } },
    },
  });

  return {
    intrebari,
    randuri: brute.map((r) => ({
      chestionarId: r.chestionarId,
      formator: r.chestionar.formator,
      grupa: r.chestionar.grupa,
      intrebareId: r.intrebareId,
      varianta: r.varianta,
    })),
  };
}

function potriveste(valoareDb: string | null, filtru: string | undefined): boolean {
  if (!filtru) return true;
  return filtru === NESPECIFICAT ? valoareDb === null : valoareDb === filtru;
}

export function filtreazaRanduri(randuri: RandTest[], filtru: FiltruTest): RandTest[] {
  return randuri.filter((r) => potriveste(r.formator, filtru.formator) && potriveste(r.grupa, filtru.grupa));
}

type Scor = { corecte: number; total: number };

function scorPerChestionar(randuri: RandTest[], cheie: Map<number, string>): Map<string, Scor> {
  const harta = new Map<string, Scor>();
  for (const r of randuri) {
    const corect = cheie.get(r.intrebareId);
    if (corect === undefined) continue;
    const s = harta.get(r.chestionarId) ?? { corecte: 0, total: 0 };
    s.total += 1;
    if (r.varianta === corect) s.corecte += 1;
    harta.set(r.chestionarId, s);
  }
  return harta;
}

function rezumat(randuri: RandTest[], cheie: Map<number, string>) {
  const scoruri = scorPerChestionar(randuri, cheie);
  let corecteTotal = 0;
  let total = 0;
  scoruri.forEach((s) => {
    corecteTotal += s.corecte;
    total += s.total;
  });
  const totalChestionare = scoruri.size;
  return {
    totalChestionare,
    scorMediu: totalChestionare > 0 ? rotunjeste2(corecteTotal / totalChestionare) : 0,
    procentCorect: total > 0 ? rotunjeste1((corecteTotal / total) * 100) : 0,
  };
}

export function grupeaza(
  randuri: RandTest[],
  cheie: Map<number, string>,
  camp: "formator" | "grupa"
): RezumatTestGrup[] {
  const grupuri = new Map<string, RandTest[]>();
  for (const r of randuri) {
    const valoare = r[camp] ?? NESPECIFICAT;
    const lista = grupuri.get(valoare);
    if (lista) lista.push(r);
    else grupuri.set(valoare, [r]);
  }
  const rezultate: RezumatTestGrup[] = [];
  grupuri.forEach((lista, valoare) => {
    rezultate.push({ valoare, ...rezumat(lista, cheie) });
  });
  return rezultate.sort((a, b) => a.valoare.localeCompare(b.valoare, "ro"));
}

export function statisticiPerIntrebare(
  intrebari: IntrebareTestDb[],
  randuri: RandTest[]
): StatisticaIntrebareTest[] {
  return intrebari.map((i) => {
    const ale = randuri.filter((r) => r.intrebareId === i.id);
    const total = ale.length;
    const numarPe = (v: string) => ale.filter((r) => r.varianta === v).length;
    const corecte = numarPe(i.raspunsCorect);

    const distributie: DistributieVarianta[] = VARIANTE.map((v) => ({
      varianta: v,
      text: textOptiune(i, v),
      numar: numarPe(v),
      procent: total > 0 ? rotunjeste1((numarPe(v) / total) * 100) : 0,
      corect: v === i.raspunsCorect,
    }));

    const greseli = distributie.filter((d) => !d.corect && d.numar > 0).sort((a, b) => b.numar - a.numar);

    return {
      numar: i.numar,
      text: i.text,
      raspunsCorect: i.raspunsCorect,
      totalRaspunsuri: total,
      corecte,
      gresite: total - corecte,
      procentCorect: total > 0 ? rotunjeste1((corecte / total) * 100) : 0,
      procentGresit: total > 0 ? rotunjeste1(((total - corecte) / total) * 100) : 0,
      distributie,
      distractorFrecvent: greseli.length > 0 ? { varianta: greseli[0].varianta, numar: greseli[0].numar } : null,
    };
  });
}

export async function calculeazaStatisticiTest(filtru: FiltruTest = {}): Promise<StatisticaTest> {
  const { intrebari, randuri } = await incarcaDateTest();
  const cheie = new Map(intrebari.map((i) => [i.id, i.raspunsCorect]));
  const filtrate = filtreazaRanduri(randuri, filtru);

  return {
    nrIntrebari: intrebari.length,
    ...rezumat(filtrate, cheie),
    intrebari: statisticiPerIntrebare(intrebari, filtrate),
    // Comparațiile arată toate grupurile (necesită datele nefiltrate).
    comparatieFormatori: grupeaza(randuri, cheie, "formator"),
    comparatieGrupe: grupeaza(randuri, cheie, "grupa"),
  };
}
