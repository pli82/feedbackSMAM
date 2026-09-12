"use client";

import { useState } from "react";

type Intrebare = { id: number; numar: number; text: string };

const FORMATORI = ["Loredana-Irina Pop", "Octavian-Mircea Chesaru", "Ambii formatori"];
const JUDETE = [
  "Alba", "Arad", "Argeș", "Bacău", "Bihor", "Bistrița-Năsăud", "Botoșani",
  "Brăila", "Brașov", "București", "Buzău", "Caraș-Severin", "Călărași",
  "Cluj", "Constanța", "Covasna", "Dâmbovița", "Dolj", "Galați", "Giurgiu",
  "Gorj", "Harghita", "Hunedoara", "Ialomița", "Iași", "Ilfov", "Maramureș",
  "Mehedinți", "Mureș", "Neamț", "Olt", "Prahova", "Satu Mare", "Sălaj",
  "Sibiu", "Suceava", "Teleorman", "Timiș", "Tulcea", "Vâlcea", "Vaslui",
  "Vrancea",
];

const SCALA = [
  { valoare: 1, eticheta: "în foarte mică măsură" },
  { valoare: 2, eticheta: "în mică măsură" },
  { valoare: 3, eticheta: "în măsură moderată" },
  { valoare: 4, eticheta: "în mare măsură" },
  { valoare: 5, eticheta: "în foarte mare măsură" },
];

export default function FormularChestionar({ intrebari }: { intrebari: Intrebare[] }) {
  const [raspunsuriLikert, setRaspunsuriLikert] = useState<Record<number, number>>({});
  const [formator, setFormator] = useState("");
  const [grupa, setGrupa] = useState("");
  const [raspuns11, setRaspuns11] = useState("");
  const [raspuns12, setRaspuns12] = useState("");
  const [eroare, setEroare] = useState<string | null>(null);
  const [seTrimite, setSeTrimite] = useState(false);
  const [trimis, setTrimis] = useState(false);

  function seteazaRaspuns(numarIntrebare: number, valoare: number) {
    setRaspunsuriLikert((prev) => ({ ...prev, [numarIntrebare]: valoare }));
    setEroare(null);
  }

  async function trimiteFormular(e: React.FormEvent) {
    e.preventDefault();

 if (!formator || !grupa) {
      setEroare("Vă rugăm selectați formatorul și județul înainte de a trimite chestionarul.");
      document.getElementById("context-sesiune")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    const neincompletate = intrebari.filter((i) => !raspunsuriLikert[i.numar]);
    if (neincompletate.length > 0) {
      setEroare(
        `Vă rugăm completați toate cele ${intrebari.length} întrebări cu scală înainte de a trimite chestionarul.`
      );
      const primaNeincompletata = document.getElementById(`intrebare-${neincompletate[0].numar}`);
      primaNeincompletata?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setSeTrimite(true);
    setEroare(null);

    try {
      const raspunsuriDeschise = [
        raspuns11.trim() ? { numarIntrebare: 11, text: raspuns11.trim() } : null,
        raspuns12.trim() ? { numarIntrebare: 12, text: raspuns12.trim() } : null,
      ].filter(Boolean);

      const res = await fetch("/api/raspuns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
                  formator,
          grupa,
          raspunsuriLikert: Object.entries(raspunsuriLikert).map(([numar, valoare]) => ({
            numar: Number(numar),
            valoare,
          })),
          raspunsuriDeschise,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.eroare ?? "A apărut o eroare la trimiterea chestionarului.");
      }

      setTrimis(true);
    } catch (err) {
      setEroare(err instanceof Error ? err.message : "A apărut o eroare neașteptată.");
    } finally {
      setSeTrimite(false);
    }
  }

  if (trimis) {
    return (
      <div className="bg-white border border-navy-800/10 rounded-lg p-8 text-center">
        <p className="text-lg font-medium text-navy-900 mb-2">
          Vă mulțumim pentru timpul acordat și pentru contribuția la îmbunătățirea
          activităților de instruire!
        </p>
        <p className="text-sm text-navy-900/60">Răspunsul dumneavoastră a fost înregistrat anonim.</p>
      </div>
    );
  }

  return (
    <form onSubmit={trimiteFormular}>
      <div id="context-sesiune" className="bg-white border border-navy-800/10 rounded-lg p-5 mb-6">
        <p className="text-sm text-navy-900/70 mb-3">
          Aceste informații ajută la organizarea rezultatelor pe sesiuni și nu vă identifică
          personal.
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-navy-900/70 mb-1" htmlFor="formator">
              Formator
            </label>
            <select
              id="formator"
              className="w-full border border-navy-800/15 rounded-md p-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-navy-800/30"
              value={formator}
              onChange={(e) => {
                setFormator(e.target.value);
                setEroare(null);
              }}
              required
            >
              <option value="" disabled>
                Selectați formatorul
              </option>
              {FORMATORI.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
                   <div>
            <label className="block text-sm text-navy-900/70 mb-1" htmlFor="grupa">
              Județ
            </label>
            <select
              id="grupa"
              className="w-full border border-navy-800/15 rounded-md p-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-navy-800/30"
              value={grupa}
              onChange={(e) => {
                setGrupa(e.target.value);
                setEroare(null);
              }}
              required
            >
              <option value="" disabled>
                Selectați județul
              </option>
              {JUDETE.map((j) => (
                <option key={j} value={j}>
                  {j}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white border border-navy-800/10 rounded-lg p-6 mb-6">
        <p className="text-sm text-navy-900/70 mb-3">Scală de evaluare pentru întrebările 1-10</p>
        <div className="flex flex-wrap gap-2">
          {SCALA.map((s) => (
            <span
              key={s.valoare}
              className="text-xs text-navy-900/70 bg-[#F7F5F1] rounded px-2 py-1"
            >
              {s.valoare} – {s.eticheta}
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-4 mb-6">
        {intrebari.map((intrebare) => (
          <div
            key={intrebare.numar}
            id={`intrebare-${intrebare.numar}`}
            className="bg-white border border-navy-800/10 rounded-lg p-5"
          >
            <p className="text-[15px] leading-relaxed mb-4">
              {intrebare.numar}. {intrebare.text}
            </p>
            <div className="flex gap-4 sm:gap-6 justify-center sm:justify-start">
              {SCALA.map((s) => (
                <label key={s.valoare} className="scala-radio">
                  <input
                    type="radio"
                    name={`intrebare-${intrebare.numar}`}
                    checked={raspunsuriLikert[intrebare.numar] === s.valoare}
                    onChange={() => seteazaRaspuns(intrebare.numar, s.valoare)}
                    required
                  />
                  <span className="text-xs text-navy-900/60">{s.valoare}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-navy-800/10 rounded-lg p-5 mb-4">
        <label className="block text-[15px] leading-relaxed mb-3" htmlFor="q11">
          11. Ce element al cursului vi s-a părut cel mai util? <span className="text-navy-900/40 text-sm">(opțional)</span>
        </label>
        <textarea
          id="q11"
          className="w-full border border-navy-800/15 rounded-md p-3 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-navy-800/30"
          rows={3}
          value={raspuns11}
          onChange={(e) => setRaspuns11(e.target.value)}
        />
      </div>

      <div className="bg-white border border-navy-800/10 rounded-lg p-5 mb-6">
        <label className="block text-[15px] leading-relaxed mb-3" htmlFor="q12">
          12. Ce considerați că ar putea fi îmbunătățit la viitoarele sesiuni de instruire?{" "}
          <span className="text-navy-900/40 text-sm">(opțional)</span>
        </label>
        <textarea
          id="q12"
          className="w-full border border-navy-800/15 rounded-md p-3 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-navy-800/30"
          rows={3}
          value={raspuns12}
          onChange={(e) => setRaspuns12(e.target.value)}
        />
      </div>

      {eroare && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3 mb-4">
          {eroare}
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={seTrimite}
          className="bg-navy-800 text-white rounded-md px-6 py-2.5 text-sm font-medium hover:bg-navy-700 transition-colors disabled:opacity-60"
        >
          {seTrimite ? "Se trimite..." : "Trimite chestionarul"}
        </button>
      </div>
    </form>
  );
}
