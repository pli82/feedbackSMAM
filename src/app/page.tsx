import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import FormularChestionar from "@/components/FormularChestionar";

export const dynamic = "force-dynamic";

const COOKIE_COMPLETAT = "chestionar_completat";

export default async function PaginaChestionar() {
  const aCompletatDeja = cookies().get(COOKIE_COMPLETAT)?.value === "1";

  const intrebari = await prisma.intrebareLikert.findMany({
    where: { activa: true },
    orderBy: { numar: "asc" },
    select: { id: true, numar: true, text: true },
  });

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <div className="bg-navy-800 text-white rounded-lg p-6 mb-6">
        <p className="text-sm text-white/70 mb-1">Autoritatea Electorală Permanentă</p>
        <h1 className="text-xl font-serif font-semibold mb-3 leading-snug">
          Chestionar de evaluare a calității cursului de management anti-mită
        </h1>
        <p className="text-sm text-white/85 leading-relaxed mb-3">
          Evaluarea calității instruirii și identificarea unor oportunități de îmbunătățire a
          viitoarelor sesiuni de formare organizate pentru personalul Autorității Electorale
          Permanente.
        </p>
        <p className="text-sm font-medium text-gold-500 mb-1">Chestionarul este anonim.</p>
        <p className="text-xs text-white/60">
          Prezentatori: Loredana-Irina Pop, Octavian-Mircea Chesaru
        </p>
      </div>

      {aCompletatDeja ? (
        <div className="bg-white border border-navy-800/10 rounded-lg p-8 text-center">
          <p className="text-[15px] text-navy-900 mb-1">
            Ați completat deja acest chestionar de pe acest dispozitiv.
          </p>
          <p className="text-sm text-navy-900/60">
            Vă mulțumim pentru contribuția la îmbunătățirea activităților de instruire!
          </p>
        </div>
      ) : intrebari.length === 0 ? (
        <div className="bg-white border border-navy-800/10 rounded-lg p-8 text-center text-sm text-navy-900/60">
          Chestionarul nu este configurat momentan. Reveniți mai târziu.
        </div>
      ) : (
        <FormularChestionar intrebari={intrebari} />
      )}
    </main>
  );
}
