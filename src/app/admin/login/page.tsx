"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PaginaLoginAdmin() {
  const router = useRouter();
  const [utilizator, setUtilizator] = useState("");
  const [parola, setParola] = useState("");
  const [eroare, setEroare] = useState<string | null>(null);
  const [seIncarca, setSeIncarca] = useState(false);

  async function autentifica(e: React.FormEvent) {
    e.preventDefault();
    setSeIncarca(true);
    setEroare(null);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ utilizator, parola }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.eroare ?? "Autentificare eșuată.");
      }

      router.push("/admin/dashboard");
      router.refresh();
    } catch (err) {
      setEroare(err instanceof Error ? err.message : "A apărut o eroare neașteptată.");
    } finally {
      setSeIncarca(false);
    }
  }

  return (
    <main className="max-w-sm mx-auto px-4 py-20">
      <h1 className="text-lg font-serif font-semibold text-navy-900 mb-1">Administrare</h1>
      <p className="text-sm text-navy-900/60 mb-6">
        Chestionar de evaluare — curs management anti-mită
      </p>

      <form onSubmit={autentifica} className="bg-white border border-navy-800/10 rounded-lg p-6">
        <label className="block text-sm text-navy-900/70 mb-1" htmlFor="utilizator">
          Utilizator
        </label>
        <input
          id="utilizator"
          className="w-full border border-navy-800/15 rounded-md p-2.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-navy-800/30"
          value={utilizator}
          onChange={(e) => setUtilizator(e.target.value)}
          autoComplete="username"
          required
        />

        <label className="block text-sm text-navy-900/70 mb-1" htmlFor="parola">
          Parolă
        </label>
        <input
          id="parola"
          type="password"
          className="w-full border border-navy-800/15 rounded-md p-2.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-navy-800/30"
          value={parola}
          onChange={(e) => setParola(e.target.value)}
          autoComplete="current-password"
          required
        />

        {eroare && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-2.5 mb-4">
            {eroare}
          </p>
        )}

        <button
          type="submit"
          disabled={seIncarca}
          className="w-full bg-navy-800 text-white rounded-md py-2.5 text-sm font-medium hover:bg-navy-700 transition-colors disabled:opacity-60"
        >
          {seIncarca ? "Se autentifică..." : "Autentificare"}
        </button>
      </form>
    </main>
  );
}
