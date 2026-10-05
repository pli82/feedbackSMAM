"use client";

import { useMemo } from "react";
import type { StatisticaTest, RezumatTestGrup } from "@/lib/statsTest";

type ItemBara = { eticheta: string; valoare: number; detaliu: string };

function BareProcent({
  titlu,
  items,
  culoare,
}: {
  titlu: string;
  items: ItemBara[];
  culoare: string;
}) {
  if (items.length === 0) return null;
  return (
    <div className="bg-white border border-navy-800/10 rounded-lg p-5">
      <p className="text-sm font-medium text-navy-900 mb-4">{titlu}</p>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.eticheta}>
            <div className="flex justify-between gap-3 text-xs text-navy-900/70 mb-1">
              <span>{item.eticheta}</span>
              <span className="whitespace-nowrap font-medium text-navy-900">{item.detaliu}</span>
            </div>
            <div className="h-2 bg-[#F7F5F1] rounded-full overflow-hidden">
              <div
                className="h-2 rounded-full"
                style={{ width: `${Math.min(100, item.valoare)}%`, backgroundColor: culoare }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TabelGrup({
  titlu,
  randuri,
  nrIntrebari,
}: {
  titlu: string;
  randuri: RezumatTestGrup[];
  nrIntrebari: number;
}) {
  if (randuri.length === 0) return null;
  const sortate = [...randuri].sort((a, b) => b.procentCorect - a.procentCorect);
  return (
    <div className="bg-white border border-navy-800/10 rounded-lg p-5">
      <p className="text-sm font-medium text-navy-900 mb-3">{titlu}</p>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-navy-900/50 text-xs border-b border-navy-800/10">
            <th className="pb-2 font-normal">Nume</th>
            <th className="pb-2 font-normal text-right">Completări</th>
            <th className="pb-2 font-normal text-right">Scor mediu</th>
            <th className="pb-2 font-normal text-right">% corecte</th>
          </tr>
        </thead>
        <tbody>
          {sortate.map((r) => (
            <tr key={r.valoare} className="border-b border-navy-800/5 last:border-0">
              <td className="py-2 text-navy-900">{r.valoare}</td>
              <td className="py-2 text-right text-navy-900/80">{r.totalChestionare}</td>
              <td className="py-2 text-right text-navy-900/80">
                {r.scorMediu.toFixed(1)} / {nrIntrebari}
              </td>
              <td className="py-2 text-right text-navy-900/80">{r.procentCorect.toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function SectiuneTest({ test }: { test: StatisticaTest }) {
  const cuRaspunsuri = useMemo(() => test.intrebari.filter((i) => i.totalRaspunsuri > 0), [test]);

  const celeMaiGresite = useMemo(
    () =>
      [...cuRaspunsuri]
        .sort((a, b) => b.procentGresit - a.procentGresit || b.totalRaspunsuri - a.totalRaspunsuri)
        .slice(0, 5)
        .map((i) => ({
          eticheta: `${i.numar}. ${i.text}`,
          valoare: i.procentGresit,
          detaliu: `${i.procentGresit.toFixed(1)}% greșit (${i.gresite}/${i.totalRaspunsuri})`,
        })),
    [cuRaspunsuri]
  );

  const celeMaiBineInteles = useMemo(
    () =>
      [...cuRaspunsuri]
        .sort((a, b) => b.procentCorect - a.procentCorect || b.totalRaspunsuri - a.totalRaspunsuri)
        .slice(0, 5)
        .map((i) => ({
          eticheta: `${i.numar}. ${i.text}`,
          valoare: i.procentCorect,
          detaliu: `${i.procentCorect.toFixed(1)}% corect (${i.corecte}/${i.totalRaspunsuri})`,
        })),
    [cuRaspunsuri]
  );

  if (test.nrIntrebari === 0) {
    return (
      <div className="bg-white border border-navy-800/10 rounded-lg p-6 text-sm text-navy-900/70">
        Nu există întrebări active în testul de cunoștințe. Adăugați sau importați întrebări din{" "}
        <a href="/admin/intrebari" className="underline">
          pagina de gestionare a întrebărilor
        </a>
        .
      </div>
    );
  }

  const scorProcent = test.nrIntrebari > 0 ? Math.round((test.scorMediu / test.nrIntrebari) * 100) : 0;

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-white border border-navy-800/10 rounded-lg p-4">
          <p className="text-xs text-navy-900/60 mb-1">Teste completate</p>
          <p className="text-2xl font-semibold text-navy-900">{test.totalChestionare}</p>
        </div>
        <div className="bg-white border border-navy-800/10 rounded-lg p-4">
          <p className="text-xs text-navy-900/60 mb-1">Scor mediu</p>
          <p className="text-2xl font-semibold text-navy-900">
            {test.scorMediu.toFixed(1)} / {test.nrIntrebari}
          </p>
        </div>
        <div className="bg-navy-800 rounded-lg p-4">
          <p className="text-xs text-gold-500 mb-1">Răspunsuri corecte</p>
          <p className="text-2xl font-semibold text-white">{test.procentCorect.toFixed(1)}%</p>
        </div>
        <div className="bg-gold-500 rounded-lg p-4">
          <p className="text-xs text-navy-900/70 mb-1">Nivel de cunoaștere</p>
          <p className="text-2xl font-semibold text-navy-900">{scorProcent}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <BareProcent
          titlu="Întrebări cu cele mai multe răspunsuri greșite"
          items={celeMaiGresite}
          culoare="#B3402A"
        />
        <BareProcent
          titlu="Întrebări cel mai bine înțelese"
          items={celeMaiBineInteles}
          culoare="#1B7A4A"
        />
      </div>

      <div className="space-y-4 mb-6">
        <TabelGrup titlu="Rezultate test pe județ" randuri={test.comparatieGrupe} nrIntrebari={test.nrIntrebari} />
      </div>

      <p className="text-sm font-medium text-navy-900 mb-3">Detaliu pe întrebări</p>
      <div className="space-y-4">
        {test.intrebari.map((i) => (
          <div key={i.numar} className="bg-white border border-navy-800/10 rounded-lg p-5">
            <div className="flex items-start justify-between gap-4 mb-3">
              <p className="text-sm text-navy-900 leading-relaxed">
                {i.numar}. {i.text}
              </p>
              <p className="text-sm font-medium text-navy-900 whitespace-nowrap">
                {i.totalRaspunsuri > 0 ? `${i.procentCorect.toFixed(1)}% corect` : "fără răspunsuri"}
              </p>
            </div>
            <div className="space-y-2">
              {i.distributie.map((d) => {
                const eDistractorFrecvent = i.distractorFrecvent?.varianta === d.varianta;
                return (
                  <div key={d.varianta}>
                    <div className="flex justify-between gap-3 text-xs mb-1">
                      <span className={d.corect ? "text-green-800 font-medium" : "text-navy-900/70"}>
                        {d.varianta}. {d.text}
                        {d.corect && " ✓ (corect)"}
                        {eDistractorFrecvent && " — cea mai aleasă greșeală"}
                      </span>
                      <span className="whitespace-nowrap text-navy-900/80">
                        {d.procent.toFixed(1)}% ({d.numar})
                      </span>
                    </div>
                    <div className="h-2 bg-[#F7F5F1] rounded-full overflow-hidden">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${d.procent}%`,
                          backgroundColor: d.corect ? "#1B7A4A" : eDistractorFrecvent ? "#B3402A" : "#9AA3B5",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
