import ExcelJS from "exceljs";

// ─────────────────────────────────────────────────────────────────────────────
// Partea 1 a chestionarului — test de cunoștințe SMAM.
// Validare + import/export Excel pentru întrebările de test.
// ─────────────────────────────────────────────────────────────────────────────

export const VARIANTE = ["A", "B", "C", "D"] as const;
export type Varianta = (typeof VARIANTE)[number];

export type IntrebareTestInput = {
  numar: number;
  text: string;
  optiuneA: string;
  optiuneB: string;
  optiuneC: string;
  optiuneD: string;
  raspunsCorect: Varianta;
  activa: boolean;
};

export function esteVarianta(v: unknown): v is Varianta {
  return typeof v === "string" && (VARIANTE as readonly string[]).includes(v);
}

export function textOptiune(
  i: { optiuneA: string; optiuneB: string; optiuneC: string; optiuneD: string },
  varianta: string
): string {
  switch (varianta) {
    case "A":
      return i.optiuneA;
    case "B":
      return i.optiuneB;
    case "C":
      return i.optiuneC;
    case "D":
      return i.optiuneD;
    default:
      return "";
  }
}

const MAX_TEXT = 1000;
const MAX_OPTIUNE = 600;
const MAX_NUMAR = 9999;

// Validează o întrebare venită din formularul de administrare sau dintr-un
// rând de Excel. Returnează fie datele curățate, fie un mesaj de eroare.
export function valideazaIntrebareTest(
  body: any
): { ok: true; date: IntrebareTestInput } | { ok: false; eroare: string } {
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  const optiuni = {
    optiuneA: typeof body?.optiuneA === "string" ? body.optiuneA.trim() : "",
    optiuneB: typeof body?.optiuneB === "string" ? body.optiuneB.trim() : "",
    optiuneC: typeof body?.optiuneC === "string" ? body.optiuneC.trim() : "",
    optiuneD: typeof body?.optiuneD === "string" ? body.optiuneD.trim() : "",
  };
  const corect = typeof body?.raspunsCorect === "string" ? body.raspunsCorect.trim().toUpperCase() : "";
  const numar = Number(body?.numar);

  if (!text) return { ok: false, eroare: "Textul întrebării este obligatoriu." };
  if (text.length > MAX_TEXT) return { ok: false, eroare: `Textul întrebării depășește ${MAX_TEXT} de caractere.` };

  for (const v of VARIANTE) {
    const val = optiuni[`optiune${v}` as keyof typeof optiuni];
    if (!val) return { ok: false, eroare: `Varianta ${v} este obligatorie.` };
    if (val.length > MAX_OPTIUNE) return { ok: false, eroare: `Varianta ${v} depășește ${MAX_OPTIUNE} de caractere.` };
  }

  if (!esteVarianta(corect)) {
    return { ok: false, eroare: "Răspunsul corect trebuie să fie A, B, C sau D." };
  }
  if (!Number.isInteger(numar) || numar < 1 || numar > MAX_NUMAR) {
    return { ok: false, eroare: `Numărul întrebării trebuie să fie un întreg între 1 și ${MAX_NUMAR}.` };
  }

  return {
    ok: true,
    date: {
      numar,
      text,
      ...optiuni,
      raspunsCorect: corect,
      activa: body?.activa === undefined ? true : Boolean(body.activa),
    },
  };
}

// ── Excel ────────────────────────────────────────────────────────────────────
// Format: rândul 1 = antet; de la rândul 2: Nr | Întrebarea | A | B | C | D | Răspuns corect

const ANTET = ["Nr.", "Întrebarea", "Varianta A", "Varianta B", "Varianta C", "Varianta D", "Răspuns corect (A/B/C/D)"];

type IntrebareDb = {
  numar: number;
  text: string;
  optiuneA: string;
  optiuneB: string;
  optiuneC: string;
  optiuneD: string;
  raspunsCorect: string;
};

export async function genereazaExcelIntrebari(intrebari: IntrebareDb[]): Promise<ArrayBuffer> {
  const wb = new ExcelJS.Workbook();
  const foaie = wb.addWorksheet("Întrebări");
  foaie.columns = [
    { header: ANTET[0], key: "numar", width: 7 },
    { header: ANTET[1], key: "text", width: 60 },
    { header: ANTET[2], key: "a", width: 45 },
    { header: ANTET[3], key: "b", width: 45 },
    { header: ANTET[4], key: "c", width: 45 },
    { header: ANTET[5], key: "d", width: 45 },
    { header: ANTET[6], key: "corect", width: 18 },
  ];
  for (const i of intrebari) {
    foaie.addRow({
      numar: i.numar,
      text: i.text,
      a: i.optiuneA,
      b: i.optiuneB,
      c: i.optiuneC,
      d: i.optiuneD,
      corect: i.raspunsCorect,
    });
  }
  foaie.getRow(1).font = { bold: true };
  foaie.getRow(1).alignment = { wrapText: true, vertical: "middle" };
  foaie.eachRow((row, index) => {
    if (index > 1) row.alignment = { wrapText: true, vertical: "top" };
  });
  foaie.views = [{ state: "frozen", ySplit: 1 }];

  const info = wb.addWorksheet("Instrucțiuni");
  info.getColumn(1).width = 110;
  [
    "Cum se folosește fișierul la import (Administrare → Test de cunoștințe → Importă din Excel):",
    "• Prima foaie („Întrebări”) este cea citită. Rândul 1 este antetul și nu se modifică.",
    "• O întrebare pe rând: Nr., textul întrebării, variantele A-D și litera răspunsului corect.",
    "• Întrebările cu un Nr. deja existent în aplicație sunt actualizate; cele cu Nr. nou sunt adăugate.",
    "• Importul nu șterge nimic: întrebările care lipsesc din fișier rămân neschimbate.",
    "• Dacă există o singură greșeală într-un rând, nu se importă nimic și se afișează rândul cu problema.",
  ].forEach((linie) => info.addRow([linie]));
  info.getRow(1).font = { bold: true };

  return (await wb.xlsx.writeBuffer()) as ArrayBuffer;
}

export async function citesteExcelIntrebari(
  buffer: Buffer
): Promise<{ intrebari: IntrebareTestInput[]; erori: string[] }> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer as any);
  const foaie = wb.worksheets[0];
  if (!foaie) return { intrebari: [], erori: ["Fișierul nu conține nicio foaie de calcul."] };

  const intrebari: IntrebareTestInput[] = [];
  const erori: string[] = [];
  const numereVazute = new Set<number>();
  let ordine = 0;

  foaie.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return; // antet
    const celule = [1, 2, 3, 4, 5, 6, 7].map((c) => (row.getCell(c).text ?? "").toString().trim());
    if (celule.every((c) => c === "")) return; // rând gol

    ordine += 1;
    const [nr, text, a, b, c, d, corectBrut] = celule;
    // Acceptă "B", "b", "B." sau "B (răspuns corect)" — se ia prima literă.
    const corect = corectBrut.replace(/[^A-Za-z]/g, "").charAt(0).toUpperCase();
    const numar = nr === "" ? ordine : Number(nr);

    const rezultat = valideazaIntrebareTest({
      numar,
      text,
      optiuneA: a,
      optiuneB: b,
      optiuneC: c,
      optiuneD: d,
      raspunsCorect: corect,
      activa: true,
    });

    if (!rezultat.ok) {
      erori.push(`Rândul ${rowNumber}: ${rezultat.eroare}`);
      return;
    }
    if (numereVazute.has(rezultat.date.numar)) {
      erori.push(`Rândul ${rowNumber}: numărul ${rezultat.date.numar} apare de mai multe ori în fișier.`);
      return;
    }
    numereVazute.add(rezultat.date.numar);
    intrebari.push(rezultat.date);
  });

  if (intrebari.length === 0 && erori.length === 0) {
    erori.push("Nu am găsit nicio întrebare în fișier (datele încep de pe rândul 2).");
  }
  if (intrebari.length + erori.length > 200) {
    erori.push("Fișierul conține prea multe rânduri (maximum 200 de întrebări per import).");
  }
  return { intrebari, erori };
}
