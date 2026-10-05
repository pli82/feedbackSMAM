"use client";

import { useEffect, useState } from "react";

export default function PaginaPrezentareAdmin() {
  const [salvat, setSalvat] = useState<string | null | undefined>(undefined);
  const [text, setText] = useState("");
  const [mesaj, setMesaj] = useState<{ tip: "ok" | "eroare"; text: string } | null>(null);
  const [seSalveaza, setSeSalveaza] = useState(false);

  useEffect(() => {
    fetch("/api/admin/prezentare")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        setSalvat(d.link);
        setText(d.link ?? "");
      })
      .catch(() => {
        setSalvat(null);
        setMesaj({ tip: "eroare", text: "Nu s-a putut citi linkul curent." });
      });
  }, []);

  async function salveaza(e: React.FormEvent) {
    e.preventDefault();
    setSeSalveaza(true);
    setMesaj(null);
    const res = await fetch("/api/admin/prezentare", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ link: text }),
    });
    const data = await res.json().catch(() => null);
    if (res.ok) {
      setSalvat(data.link);
      setText(data.link);
      setMesaj({ tip: "ok", text: "Linkul a fost salvat. „Vezi prezentarea” apare acum deasupra întrebărilor." });
    } else {
      setMesaj({ tip: "eroare", text: data?.eroare ?? "Salvarea a eșuat." });
    }
    setSeSalveaza(false);
  }

  async function sterge() {
    if (!window.confirm("Ștergeți linkul? Secțiunea „Vezi prezentarea” va dispărea din chestionar.")) return;
    const res = await fetch("/api/admin/prezentare", { method: "DELETE" });
    if (res.ok) {
      setSalvat(null);
      setText("");
      setMesaj({ tip: "ok", text: "Linkul a fost șters." });
    } else {
      setMesaj({ tip: "eroare", text: "Ștergerea a eșuat." });
    }
  }

  const butonSecundar = "text-sm border border-navy-800/20 rounded-md px-3 py-2 hover:bg-navy-800/5 transition-colors";

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-lg font-serif font-semibold text-navy-900">Prezentarea (link YouTube)</h1>
          <p className="text-sm text-navy-900/60">Apare în chestionar, deasupra întrebărilor</p>
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

      {mesaj && (
        <div
          role="status"
          className={`text-sm rounded-md p-3 mb-6 border ${
            mesaj.tip === "ok" ? "text-green-900 bg-green-50 border-green-200" : "text-red-700 bg-red-50 border-red-200"
          }`}
        >
          {mesaj.text}
        </div>
      )}

      <form onSubmit={salveaza} className="bg-white border border-navy-800/10 rounded-lg p-5">
        <label className="block text-sm text-navy-900/70 mb-1" htmlFor="link">
          Link YouTube
        </label>
        <input
          id="link"
          type="url"
          className="w-full border border-navy-800/15 rounded-md p-2.5 text-sm mb-1 focus:outline-none focus:ring-2 focus:ring-navy-800/30"
          placeholder="https://www.youtube.com/watch?v=..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={salvat === undefined}
          required
        />
        <p className="text-xs text-navy-900/60 mb-4">
          Acceptăm linkuri youtube.com sau youtu.be. Videoclipul poate fi „Public” sau „Nelistat”; un videoclip „Privat”
          nu se poate vedea de colegi.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={seSalveaza || salvat === undefined}
            className="bg-navy-800 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-navy-700 disabled:opacity-60"
          >
            {seSalveaza ? "Se salvează..." : "Salvează"}
          </button>
          {salvat && (
            <>
              <a href={salvat} target="_blank" rel="noopener noreferrer" className={butonSecundar}>
                Testează linkul
              </a>
              <button
                type="button"
                onClick={sterge}
                className="text-sm border border-red-300 text-red-700 rounded-md px-3 py-2 hover:bg-red-50 transition-colors"
              >
                Șterge linkul
              </button>
            </>
          )}
        </div>
      </form>
    </main>
  );
}
