"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

type DistributieValoare = { valoare: number; numar: number; procent: number };
type StatisticaIntrebare = {
  numar: number;
  text: string;
  medie: number;
  totalRaspunsuri: number;
  distributie: DistributieValoare[];
};
type RaspunsDeschis = { numarIntrebare: number; text: string };
type OptiuneFiltrare = { valoare: string; total: number };
type RezumatGrup = {
  valoare: string;
  totalChestionare: number;
  mediaGenerala: number;
  satisfactieGenerala: number | null;
};
type Statistici = {
  totalChestionare: number;
  mediaGenerala: number;
  satisfactieGenerala: StatisticaIntrebare | null;
  intrebari: StatisticaIntrebare[];
  raspunsuriDeschise: RaspunsDeschis[];
  filtruActiv: { formator: string | null; grupa: string | null };
  optiuniFiltrare: { formatori: OptiuneFiltrare[]; grupe: OptiuneFiltrare[] };
  comparatieFormatori: RezumatGrup[];
  comparatieGrupe: RezumatGrup[];
};

function TabelComparatie({ titlu, randuri }: { titlu: string; randuri: RezumatGrup[] }) {
  if (randuri.length <= 1) return null;
  return (
    <div className="bg-white border border-navy-800/10 rounded-lg p-5">
      <p className="text-sm font-medium text-navy-900 mb-3">{titlu}</p>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-navy-900/50 text-xs border-b border-navy-800/10">
            <th className="pb-2 font-normal">Nume</th>
            <th className="pb-2 font-normal text-right">Chestionare</th>
            <th className="pb-2 font-normal text-right">Medie generală</th>
            <th className="pb-2 font-normal text-right">Satisfacție (Q10)</th>
          </tr>
        </thead>
        <tbody>
          {randuri.map((r) => (
            <tr key={r.valoare} className="border-b border-navy-800/5 last:border-0">
              <td className="py-2 text-navy-900">{r.valoare}</td>
              <td className="py-2 text-right text-navy-900/80">{r.totalChestionare}</td>
              <td className="py-2 text-right text-navy-900/80">{r.mediaGenerala.toFixed(2)}</td>
              <td className="py-2 text-right text-navy-900/80">
                {r.satisfactieGenerala !== null ? r.satisfactieGenerala.toFixed(2) : "–"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function PaginaDashboardAdmin() {
  const router = useRouter();
  const [statistici, setStatistici] = useState<Statistici | null>(null);
  const [eroare, setEroare] = useState<string | null>(null);
  const [cautare, setCautare] = useState("");
  const [filtruFormator, setFiltruFormator] = useState("");
  const [filtruGrupa, setFiltruGrupa] = useState("");

  const incarcaStatistici = useCallback((formator: string, grupa: string) => {
    const params = new URLSearchParams();
    if (formator) params.set("formator", formator);
    if (grupa) params.set("grupa", grupa);

    fetch(`/api/admin/stats?${params.toString()}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Nu s-au putut încărca statisticile.");
        return res.json();
      })
      .then(setStatistici)
      .catch((err) => setEroare(err.message));
  }, []);

  useEffect(() => {
    incarcaStatistici(filtruFormator, filtruGrupa);
  }, [filtruFormator, filtruGrupa, incarcaStatistici]);

  const raspunsuriFiltrate = useMemo(() => {
    if (!statistici) return [];
    const termen = cautare.trim().toLowerCase();
    if (!termen) return statistici.raspunsuriDeschise;
    return statistici.raspunsuriDeschise.filter((r) => r.text.toLowerCase().includes(termen));
  }, [statistici, cautare]);

  async function delogheaza() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  function exportUrl() {
    const params = new URLSearchParams();
    if (filtruFormator) params.set("formator", filtruFormator);
    if (filtruGrupa) params.set("grupa", filtruGrupa);
    const query = params.toString();
    return query ? `/api/admin/export?${query}` : "/api/admin/export";
  }

  if (eroare) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-10">
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3">{eroare}</p>
      </main>
    );
  }

  if (!statistici) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-10">
        <p className="text-sm text-navy-900/60">Se încarcă statisticile...</p>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-serif font-semibold text-navy-900">
            Rezultate — curs management anti-mită
          </h1>
          <p className="text-sm text-navy-900/60">Autoritatea Electorală Permanentă</p>
        </div>
        <div className="flex gap-2">
          
            href={exportUrl()}
            className="text-sm border border-navy-800/20 rounded-md px-3 py-2 hover:bg-navy-800/5 transition-colors"
          >
            Exportă CSV
          </a>
          <button
            onClick={delogheaza}
            className="text-sm border border-navy-800/20 rounded-md px-3 py-2 hover:bg-navy-800/5 transition-colors"
          >
            Deconectare
          </button>
        </div>
      </div>

      <div className="bg-white border border-navy-800/10 rounded-lg p-4 mb-6 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs text-navy-900/60 mb-1" htmlFor="filtru-formator">
            Formator
          </label>
          <select
            id="filtru-formator"
            className="border border-navy-800/15 rounded-md px-3 py-1.5 text-sm bg-white"
            value={filtruFormator}
            onChange={(e) => setFiltruFormator(e.target.value)}
          >
            <option value="">Toți formatorii</option>
            {statistici.optiuniFiltrare.formatori.map((f) => (
              <option key={f.valoare} value={f.valoare}>
                {f.valoare} ({f.total})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-navy-900/60 mb-1" htmlFor="filtru-grupa">
            Județ
          </label>
          <select
            id="filtru-grupa"
            className="border border-navy-800/15 rounded-md px-3 py-1.5 text-sm bg-white"
            value={filtruGrupa}
            onChange={(e) => setFiltruGrupa(e.target.value)}
          >
            <option value="">Toate județele</option>
            {statistici.optiuniFiltrare.grupe.map((g) => (
              <option key={g.valoare} value={g.valoare}>
                {g.valoare} ({g.total})
              </option>
            ))}
          </select>
        </div>
        {(filtruFormator || filtruGrupa) && (
          <button
            onClick={() => {
              setFiltruFormator("");
              setFiltruGrupa("");
            }}
            className="text-sm text-navy-900/60 underline"
          >
            Resetează filtrele
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="bg-white border border-navy-800/10 rounded-lg p-4">
          <p className="text-xs text-navy-900/60 mb-1">Chestionare completate</p>
          <p className="text-2xl font-semibold text-navy-900">{statistici.totalChestionare}</p>
        </div>
        <div className="bg-white border border-navy-800/10 rounded-lg p-4">
          <p className="text-xs text-navy-900/60 mb-1">Medie generală (întreb. 1-10)</p>
          <p className="text-2xl font-semibold text-navy-900">
            {statistici.mediaGenerala.toFixed(2)}
          </p>
        </div>
        <div className="bg-navy-800 rounded-lg p-4">
          <p className="text-xs text-gold-500 mb-1">Satisfacție generală (Q10)</p>
          <p className="text-2xl font-semibold text-white">
            {statistici.satisfactieGenerala ? statistici.satisfactieGenerala.medie.toFixed(2) : "–"} / 5
          </p>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <TabelComparatie titlu="Rezultate separate pe formator" randuri={statistici.comparatieFormatori} />
        <TabelComparatie titlu="Rezultate separate pe județ" randuri={statistici.comparatieGrupe} />
      </div>

      <div className="space-y-4 mb-8">
        {statistici.intrebari.map((intrebare) => (
          <div key={intrebare.numar} className="bg-white border border-navy-800/10 rounded-lg p-5">
            <div className="flex items-start justify-between gap-4 mb-3">
              <p className="text-sm text-navy-900 leading-relaxed">
                {intrebare.numar}. {intrebare.text}
              </p>
              <p className="text-sm font-medium text-navy-900 whitespace-nowrap">
                medie {intrebare.medie.toFixed(2)}
              </p>
            </div>
            <div style={{ width: "100%", height: 140 }}>
              <ResponsiveContainer>
                <BarChart data={intrebare.distributie} layout="vertical" margin={{ left: 0, right: 24 }}>
                  <CartesianGrid horizontal={false} stroke="#1B2A4A" strokeOpacity={0.06} />
                  <XAxis type="number" hide domain={[0, 100]} />
                  <YAxis
                    type="category"
                    dataKey="valoare"
                    width={20}
                    tick={{ fontSize: 12, fill: "#1B2A4A99" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(value: number, _name: string, item: any) => [
                      `${value}% (${item.payload.numar} răspunsuri)`,
                      "Procent",
                    ]}
                    labelFormatter={(label) => `Valoare ${label}`}
                  />
                  <Bar dataKey="procent" fill="#1B2A4A" radius={[0, 3, 3, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-navy-800/10 rounded-lg p-5">
        <div className="flex items-center justify-between mb-4 gap-4">
          <p className="text-sm font-medium text-navy-900">
            Răspunsuri deschise ({statistici.raspunsuriDeschise.length})
          </p>
          <input
            type="text"
            placeholder="Caută în răspunsuri"
            value={cautare}
            onChange={(e) => setCautare(e.target.value)}
            className="border border-navy-800/15 rounded-md px-3 py-1.5 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-navy-800/30"
          />
        </div>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {raspunsuriFiltrate.length === 0 && (
            <p className="text-sm text-navy-900/50">Niciun răspuns găsit.</p>
          )}
          {raspunsuriFiltrate.map((r, index) => (
            <div key={index} className="border-b border-navy-800/10 pb-3 last:border-0">
              <p className="text-xs text-navy-900/50 mb-1">
                Întrebarea {r.numarIntrebare}
              </p>
              <p className="text-sm text-navy-900/85">{r.text}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}