"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type IntrebareAdmin = {
  id: number;
  numar: number;
  text: string;
  optiuneA: string;
  optiuneB: string;
  optiuneC: string;
  optiuneD: string;
  raspunsCorect: string;
  activa: boolean;
  totalRaspunsuri: number;
};

type Formular = {
  numar: number;
  text: string;
  optiuneA: string;
  optiuneB: string;
  optiuneC: string;
  optiuneD: string;
  raspunsCorect: string;
  activa: boolean;
};

const VARIANTE = ["A", "B", "C", "D"] as const;
const optiuneKey = (v: string) => `optiune${v}` as "optiuneA" | "optiuneB" | "optiuneC" | "optiuneD";

function EditorIntrebare({
  initial,
  avertizareCheie,
  textButon,
  onSalveaza,
  onAnuleaza,
}: {
  initial: Formular;
  avertizareCheie?: boolean;
  textButon: string;
  onSalveaza: (f: Formular) => Promise<string | null>;
  onAnuleaza: () => void;
}) {
  const [f, setF] = useState<Formular>(initial);
  const [eroare, setEroare] = useState<string | null>(null);
  const [seSalveaza, setSeSalveaza] = useState(false);

  async function salveaza(e: React.FormEvent) {
    e.preventDefault();
    setSeSalveaza(true);
    setEroare(null);
    const rezultat = await onSalveaza(f);
    if (rezultat) setEroare(rezultat);
    setSeSalveaza(false);
  }

  const camp = "w-full border border-navy-800/15 rounded-md p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-800/30";

  return (
    <form onSubmit={salveaza} className="space-y-3">
      <div className="flex gap-3">
        <div className="w-24">
          <label className="block text-xs text-navy-900/60 mb-1">Nr.</label>
          <input
            type="number"
            min={1}
            className={camp}
            value={f.numar}
            onChange={(e) => setF({ ...f, numar: Number(e.target.value) })}
            required
          />
        </div>
        <label className="flex items-end gap-2 text-sm text-navy-900/80 pb-2.5">
          <input
            type="checkbox"
            checked={f.activa}
            onChange={(e) => setF({ ...f, activa: e.target.checked })}
          />
          Activă (apare în chestionar)
        </label>
      </div>
      <div>
        <label className="block text-xs text-navy-900/60 mb-1">Întrebarea</label>
        <textarea
          className={`${camp} resize-y`}
          rows={3}
          value={f.text}
          onChange={(e) => setF({ ...f, text: e.target.value })}
          required
        />
      </div>
      {VARIANTE.map((v) => (
        <div key={v} className="flex items-start gap-3">
          <label className="flex items-center gap-1.5 pt-2.5 text-sm font-medium w-24 shrink-0">
            <input
              type="radio"
              name={`corect-${initial.numar}-${textButon}`}
              checked={f.raspunsCorect === v}
              onChange={() => setF({ ...f, raspunsCorect: v })}
            />
            {v}
            {f.raspunsCorect === v && <span className="text-xs font-normal text-green-800">corect</span>}
          </label>
          <textarea
            className={`${camp} resize-y`}
            rows={2}
            value={f[optiuneKey(v)]}
            onChange={(e) => setF({ ...f, [optiuneKey(v)]: e.target.value })}
            required
          />
        </div>
      ))}
      {avertizareCheie && f.raspunsCorect !== initial.raspunsCorect && (
        <p className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-md p-3">
          Atenție: la această întrebare există deja răspunsuri. Schimbarea răspunsului corect
          recalculează retroactiv toate statisticile ei.
        </p>
      )}
      {eroare && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3">{eroare}</p>
      )}
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onAnuleaza}
          className="text-sm border border-navy-800/20 rounded-md px-4 py-2 hover:bg-navy-800/5"
        >
          Anulează
        </button>
        <button
          type="submit"
          disabled={seSalveaza}
          className="bg-navy-800 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-navy-700 disabled:opacity-60"
        >
          {seSalveaza ? "Se salvează..." : textButon}
        </button>
      </div>
    </form>
  );
}

export default function PaginaIntrebariTest() {
  const [intrebari, setIntrebari] = useState<IntrebareAdmin[] | null>(null);
  const [eroare, setEroare] = useState<string | null>(null);
  const [mesaj, setMesaj] = useState<{ tip: "ok" | "eroare"; text: string; detalii?: string[] } | null>(null);
  const [inEditare, setInEditare] = useState<number | "nou" | null>(null);
  const [seImporta, setSeImporta] = useState(false);
  const inputFisier = useRef<HTMLInputElement>(null);

  const incarca = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/intrebari");
      if (!res.ok) throw new Error("Nu s-au putut încărca întrebările.");
      const data = await res.json();
      setIntrebari(data.intrebari);
    } catch (err) {
      setEroare(err instanceof Error ? err.message : "Eroare neașteptată.");
    }
  }, []);

  useEffect(() => {
    incarca();
  }, [incarca]);

  async function salveaza(id: number | null, f: Formular): Promise<string | null> {
    const res = await fetch(id === null ? "/api/admin/intrebari" : `/api/admin/intrebari/${id}`, {
      method: id === null ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(f),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      return data?.eroare ?? "Salvarea a eșuat.";
    }
    setInEditare(null);
    setMesaj({ tip: "ok", text: id === null ? "Întrebarea a fost adăugată." : "Întrebarea a fost salvată." });
    await incarca();
    return null;
  }

  async function comutaActiva(i: IntrebareAdmin) {
    const res = await fetch(`/api/admin/intrebari/${i.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...i, activa: !i.activa }),
    });
    if (!res.ok) setMesaj({ tip: "eroare", text: "Nu s-a putut modifica starea întrebării." });
    await incarca();
  }

  async function sterge(i: IntrebareAdmin) {
    const avertisment =
      i.totalRaspunsuri > 0
        ? `Ștergeți întrebarea ${i.numar}? Se vor șterge definitiv și cele ${i.totalRaspunsuri} răspunsuri date la ea. Pentru a păstra istoricul, folosiți „Dezactivează”.`
        : `Ștergeți întrebarea ${i.numar}?`;
    if (!window.confirm(avertisment)) return;
    const res = await fetch(`/api/admin/intrebari/${i.id}`, { method: "DELETE" });
    setMesaj(
      res.ok
        ? { tip: "ok", text: `Întrebarea ${i.numar} a fost ștearsă.` }
        : { tip: "eroare", text: "Ștergerea a eșuat." }
    );
    await incarca();
  }

  async function importa(e: React.ChangeEvent<HTMLInputElement>) {
    const fisier = e.target.files?.[0];
    if (!fisier) return;
    setSeImporta(true);
    setMesaj(null);
    try {
      const form = new FormData();
      form.append("fisier", fisier);
      const res = await fetch("/api/admin/intrebari/import", { method: "POST", body: form });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setMesaj({ tip: "eroare", text: data?.eroare ?? "Importul a eșuat.", detalii: data?.detalii });
      } else {
        setMesaj({
          tip: "ok",
          text: `Import reușit: ${data.adaugate} întrebări adăugate, ${data.actualizate} actualizate.`,
        });
        await incarca();
      }
    } catch {
      setMesaj({ tip: "eroare", text: "Importul a eșuat." });
    } finally {
      setSeImporta(false);
      if (inputFisier.current) inputFisier.current.value = "";
    }
  }

  if (eroare) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-10">
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3">{eroare}</p>
      </main>
    );
  }
  if (!intrebari) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-10">
        <p className="text-sm text-navy-900/60">Se încarcă întrebările...</p>
      </main>
    );
  }

  const urmatorulNumar = intrebari.reduce((m, i) => Math.max(m, i.numar), 0) + 1;
  const butonSecundar =
    "text-sm border border-navy-800/20 rounded-md px-3 py-2 hover:bg-navy-800/5 transition-colors";

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-lg font-serif font-semibold text-navy-900">
            Test de cunoștințe SMAM — întrebări
          </h1>
          <p className="text-sm text-navy-900/60">Partea 1 a chestionarului</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href="/" className={butonSecundar}>
            ← Chestionar
          </a>
          <a href="/admin/dashboard" className={butonSecundar}>
            Rezultate
          </a>
        </div>
      </div>

      <div className="bg-white border border-navy-800/10 rounded-lg p-5 mb-6">
        <p className="text-sm font-medium text-navy-900 mb-1">Import / export în bloc (Excel)</p>
        <p className="text-sm text-navy-900/60 mb-4">
          Descărcați fișierul cu întrebările curente (sau șablonul, dacă nu există încă), editați-l în
          Excel și importați-l. Întrebările cu același număr se actualizează, cele noi se adaugă; nimic
          nu se șterge.
        </p>
        <div className="flex flex-wrap gap-2">
          <a href="/api/admin/intrebari/export" className={butonSecundar}>
            Descarcă Excel (șablon / întrebări curente)
          </a>
          <button
            type="button"
            onClick={() => inputFisier.current?.click()}
            disabled={seImporta}
            className="bg-navy-800 text-white rounded-md px-3 py-2 text-sm font-medium hover:bg-navy-700 disabled:opacity-60"
          >
            {seImporta ? "Se importă..." : "Importă din Excel"}
          </button>
          <input
            ref={inputFisier}
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="hidden"
            onChange={importa}
          />
        </div>
      </div>

      {mesaj && (
        <div
          role="status"
          className={`text-sm rounded-md p-3 mb-6 border ${
            mesaj.tip === "ok"
              ? "text-green-900 bg-green-50 border-green-200"
              : "text-red-700 bg-red-50 border-red-200"
          }`}
        >
          <p>{mesaj.text}</p>
          {mesaj.detalii && (
            <ul className="list-disc pl-5 mt-2 space-y-0.5">
              {mesaj.detalii.slice(0, 20).map((d, idx) => (
                <li key={idx}>{d}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="space-y-4 mb-6">
        {intrebari.length === 0 && (
          <p className="text-sm text-navy-900/60 bg-white border border-navy-800/10 rounded-lg p-5">
            Nu există încă nicio întrebare. Importați un fișier Excel sau adăugați manual.
          </p>
        )}
        {intrebari.map((i) => (
          <div
            key={i.id}
            className={`bg-white border border-navy-800/10 rounded-lg p-5 ${i.activa ? "" : "opacity-60"}`}
          >
            {inEditare === i.id ? (
              <EditorIntrebare
                initial={i}
                avertizareCheie={i.totalRaspunsuri > 0}
                textButon="Salvează"
                onSalveaza={(f) => salveaza(i.id, f)}
                onAnuleaza={() => setInEditare(null)}
              />
            ) : (
              <>
                <div className="flex items-start justify-between gap-4 mb-3">
                  <p className="text-sm text-navy-900 leading-relaxed">
                    <span className="font-medium">{i.numar}.</span> {i.text}
                  </p>
                  <span className="text-xs text-navy-900/50 whitespace-nowrap">
                    {i.activa ? "activă" : "inactivă"} · {i.totalRaspunsuri} răspunsuri
                  </span>
                </div>
                <ul className="space-y-1.5 mb-4">
                  {VARIANTE.map((v) => (
                    <li
                      key={v}
                      className={`text-sm rounded-md px-3 py-1.5 border ${
                        i.raspunsCorect === v
                          ? "border-green-600 bg-green-50 text-green-900"
                          : "border-navy-800/10 text-navy-900/80"
                      }`}
                    >
                      <span className="font-semibold mr-2">{v}.</span>
                      {i[optiuneKey(v)]}
                      {i.raspunsCorect === v && <span className="ml-2 text-xs font-medium">✓ corect</span>}
                    </li>
                  ))}
                </ul>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => setInEditare(i.id)} className={butonSecundar}>
                    Editează
                  </button>
                  <button type="button" onClick={() => comutaActiva(i)} className={butonSecundar}>
                    {i.activa ? "Dezactivează" : "Activează"}
                  </button>
                  <button
                    type="button"
                    onClick={() => sterge(i)}
                    className="text-sm border border-red-300 text-red-700 rounded-md px-3 py-2 hover:bg-red-50 transition-colors"
                  >
                    Șterge
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {inEditare === "nou" ? (
        <div className="bg-white border border-navy-800/10 rounded-lg p-5">
          <p className="text-sm font-medium text-navy-900 mb-3">Întrebare nouă</p>
          <EditorIntrebare
            initial={{
              numar: urmatorulNumar,
              text: "",
              optiuneA: "",
              optiuneB: "",
              optiuneC: "",
              optiuneD: "",
              raspunsCorect: "A",
              activa: true,
            }}
            textButon="Adaugă întrebarea"
            onSalveaza={(f) => salveaza(null, f)}
            onAnuleaza={() => setInEditare(null)}
          />
        </div>
      ) : (
        <button type="button" onClick={() => setInEditare("nou")} className={butonSecundar}>
          + Adaugă o întrebare
        </button>
      )}
    </main>
  );
}
