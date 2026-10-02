import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { esteAdminAutentificat } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { incarcaDateTest, filtreazaRanduri, statisticiPerIntrebare } from "@/lib/statsTest";

const TEXT_INTREBARE_11 = "Ce element al cursului vi s-a părut cel mai util?";
const TEXT_INTREBARE_12 =
  "Ce considerați că ar putea fi îmbunătățit la viitoarele sesiuni de instruire?";

export async function GET(req: NextRequest) {
  if (!(await esteAdminAutentificat())) {
    return NextResponse.json({ eroare: "Neautorizat." }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const formator = searchParams.get("formator");
  const grupa = searchParams.get("grupa");

  const whereChestionar: Prisma.ChestionarWhereInput = {
    ...(formator ? { formator } : {}),
    ...(grupa ? { grupa } : {}),
  };

  const intrebari = await prisma.intrebareLikert.findMany({ orderBy: { numar: "asc" } });

  // Partea 1 — test de cunoștințe (doar întrebările active)
  const { intrebari: intrebariTest, randuri: toateRanduriTest } = await incarcaDateTest();
  const randuriTest = filtreazaRanduri(toateRanduriTest, {
    formator: formator ?? undefined,
    grupa: grupa ?? undefined,
  });
  const cheieTest = new Map(intrebariTest.map((i) => [i.id, i.raspunsCorect]));
  const varianteAlese = new Map<string, Map<number, string>>(); // chestionarId -> (intrebareId -> varianta)
  for (const r of randuriTest) {
    const m = varianteAlese.get(r.chestionarId) ?? new Map<number, string>();
    m.set(r.intrebareId, r.varianta);
    varianteAlese.set(r.chestionarId, m);
  }

  const chestionare = await prisma.chestionar.findMany({
    where: whereChestionar,
    orderBy: { creatLa: "asc" },
    include: { raspunsuriLikert: true, raspunsuriDeschise: true },
  });

  const workbook = new ExcelJS.Workbook();
  const foaie = workbook.addWorksheet("Răspunsuri");

  foaie.columns = [
    { header: "Nr. crt.", key: "nr", width: 8 },
    { header: "Data completării", key: "data", width: 20 },
    { header: "Formator", key: "formator", width: 26 },
    { header: "Județ", key: "judet", width: 24 },
    ...(intrebariTest.length > 0
      ? [
          { header: `Scor test cunoștințe (din ${intrebariTest.length})`, key: "scorTest", width: 18 },
          ...intrebariTest.map((i) => ({
            header: `Test ${i.numar} (corect: ${i.raspunsCorect}): ${i.text}`,
            key: `t${i.numar}`,
            width: 42,
          })),
        ]
      : []),
    ...intrebari.map((i) => ({ header: i.text, key: `q${i.numar}`, width: 42 })),
    { header: TEXT_INTREBARE_11, key: "d11", width: 45 },
    { header: TEXT_INTREBARE_12, key: "d12", width: 45 },
  ];

  chestionare.forEach((chestionar, index) => {
    const valoriPerIntrebare = new Map(
      chestionar.raspunsuriLikert.map((r) => [r.intrebareId, r.valoare])
    );

    const rand: Record<string, string | number> = {
      nr: index + 1,
      data: chestionar.creatLa.toLocaleString("ro-RO"),
      formator: chestionar.formator ?? "",
      judet: chestionar.grupa ?? "",
      d11: chestionar.raspunsuriDeschise.find((r) => r.numarIntrebare === 11)?.text ?? "",
      d12: chestionar.raspunsuriDeschise.find((r) => r.numarIntrebare === 12)?.text ?? "",
    };

    if (intrebariTest.length > 0) {
      const alese = varianteAlese.get(chestionar.id);
      let scor = 0;
      for (const it of intrebariTest) {
        const aleasa = alese?.get(it.id);
        if (aleasa === it.raspunsCorect) scor += 1;
        rand[`t${it.numar}`] = aleasa ?? "";
      }
      rand.scorTest = alese ? scor : "";
    }

    for (const intrebare of intrebari) {
      rand[`q${intrebare.numar}`] = valoriPerIntrebare.get(intrebare.id) ?? "";
    }

    foaie.addRow(rand);
  });

  foaie.getRow(1).font = { bold: true };
  foaie.getRow(1).alignment = { wrapText: true, vertical: "middle" };
  foaie.views = [{ state: "frozen", ySplit: 1 }];

  // ── Foi pentru testul de cunoștințe: statistici pe întrebări + corelații ──
  if (intrebariTest.length > 0 && randuriTest.length > 0) {
    const statTest = statisticiPerIntrebare(intrebariTest, randuriTest);

    const foaieTest = workbook.addWorksheet("Test - pe întrebări");
    foaieTest.columns = [
      { header: "Nr.", key: "nr", width: 6 },
      { header: "Întrebarea", key: "text", width: 60 },
      { header: "Răspuns corect", key: "corect", width: 14 },
      { header: "Răspunsuri", key: "total", width: 12 },
      { header: "Corecte", key: "corecte", width: 10 },
      { header: "Greșite", key: "gresite", width: 10 },
      { header: "% greșit", key: "pg", width: 10 },
      { header: "% corect", key: "pc", width: 10 },
      { header: "Alegeri A", key: "a", width: 10 },
      { header: "Alegeri B", key: "b", width: 10 },
      { header: "Alegeri C", key: "c", width: 10 },
      { header: "Alegeri D", key: "d", width: 10 },
      { header: "Cea mai aleasă greșeală", key: "dis", width: 22 },
    ];
    // Ordonat descrescător după % greșit: primele rânduri = cele mai greu de înțeles.
    [...statTest]
      .sort((x, y) => y.procentGresit - x.procentGresit)
      .forEach((i) => {
        foaieTest.addRow({
          nr: i.numar,
          text: i.text,
          corect: i.raspunsCorect,
          total: i.totalRaspunsuri,
          corecte: i.corecte,
          gresite: i.gresite,
          pg: i.procentGresit,
          pc: i.procentCorect,
          a: i.distributie[0].numar,
          b: i.distributie[1].numar,
          c: i.distributie[2].numar,
          d: i.distributie[3].numar,
          dis: i.distractorFrecvent ? `${i.distractorFrecvent.varianta} (${i.distractorFrecvent.numar})` : "",
        });
      });
    foaieTest.getRow(1).font = { bold: true };
    foaieTest.getRow(1).alignment = { wrapText: true, vertical: "middle" };
    foaieTest.views = [{ state: "frozen", ySplit: 1 }];

    // Matrice: % răspunsuri corecte pentru fiecare întrebare, pe județ / formator.
    const adaugaMatrice = (titluFoaie: string, camp: "grupa" | "formator", etichetaCamp: string) => {
      const grupuri = Array.from(new Set(randuriTest.map((r) => r[camp] ?? "Nespecificat"))).sort((a, b) =>
        a.localeCompare(b, "ro")
      );
      const foaieM = workbook.addWorksheet(titluFoaie);
      foaieM.columns = [
        { header: "Nr.", key: "nr", width: 6 },
        { header: "Întrebarea", key: "text", width: 55 },
        { header: "Total % corect", key: "tot", width: 14 },
        ...grupuri.map((g, idx) => ({ header: g, key: `g${idx}`, width: 16 })),
      ];
      for (const it of intrebariTest) {
        const ale = randuriTest.filter((r) => r.intrebareId === it.id);
        const rand: Record<string, string | number> = {
          nr: it.numar,
          text: it.text,
          tot: ale.length > 0
            ? Math.round((ale.filter((r) => r.varianta === it.raspunsCorect).length / ale.length) * 1000) / 10
            : "",
        };
        grupuri.forEach((g, idx) => {
          const dinGrup = ale.filter((r) => (r[camp] ?? "Nespecificat") === g);
          rand[`g${idx}`] =
            dinGrup.length > 0
              ? Math.round((dinGrup.filter((r) => r.varianta === it.raspunsCorect).length / dinGrup.length) * 1000) / 10
              : "";
        });
        foaieM.addRow(rand);
      }
      // Rând final: scorul mediu al fiecărui grup (în puncte din N).
      const scoruri = new Map<string, Map<string, number>>(); // grup -> (chestionarId -> corecte)
      for (const r of randuriTest) {
        const g = r[camp] ?? "Nespecificat";
        const m = scoruri.get(g) ?? new Map<string, number>();
        m.set(r.chestionarId, (m.get(r.chestionarId) ?? 0) + (cheieTest.get(r.intrebareId) === r.varianta ? 1 : 0));
        scoruri.set(g, m);
      }
      const randScor: Record<string, string | number> = { nr: "", text: `Scor mediu (din ${intrebariTest.length}) — pe ${etichetaCamp}`, tot: "" };
      grupuri.forEach((g, idx) => {
        const m = scoruri.get(g);
        if (!m || m.size === 0) {
          randScor[`g${idx}`] = "";
          return;
        }
        let suma = 0;
        m.forEach((v) => (suma += v));
        randScor[`g${idx}`] = Math.round((suma / m.size) * 100) / 100;
      });
      const adaugat = foaieM.addRow(randScor);
      adaugat.font = { bold: true };
      foaieM.getRow(1).font = { bold: true };
      foaieM.getRow(1).alignment = { wrapText: true, vertical: "middle" };
      foaieM.views = [{ state: "frozen", xSplit: 2, ySplit: 1 }];
    };
    adaugaMatrice("Test - întrebări x județ", "grupa", "județ");
    adaugaMatrice("Test - întrebări x formator", "formator", "formator");
  }

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer as ArrayBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="chestionar-anti-mita-${Date.now()}.xlsx"`,
    },
  });
}