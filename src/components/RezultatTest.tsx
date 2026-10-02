"use client";

import { useEffect, useRef, useState } from "react";

// Ecranul final după trimiterea chestionarului: scorul din Partea 1 (testul de
// cunoștințe), un mesaj în funcție de scor și artificii animate pentru toți.
// Pragul de „rezultat foarte bun” este 70% din punctajul maxim (7 din 10).

const PRAG_PROCENT = 0.7;
const CULORI = ["#C9A227", "#E8C547", "#2E9E68", "#E0634A", "#5B8DEF", "#F2F2F2"];

type Racheta = { x: number; y: number; vx: number; vy: number; tinta: number; culoare: string };
type Particula = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  viata: number;
  scadere: number;
  culoare: string;
  raza: number;
};

function Artificii() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Respectă setarea „reduce motion” a dispozitivului.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = 0;
    let H = 0;
    const redimensioneaza = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    redimensioneaza();
    window.addEventListener("resize", redimensioneaza);

    const rachete: Racheta[] = [];
    const particule: Particula[] = [];
    const timere: number[] = [];
    let animatie: number | null = null;
    let timereRamase = 0;

    const alegeCuloare = () => CULORI[Math.floor(Math.random() * CULORI.length)];

    const lanseaza = () => {
      rachete.push({
        x: W * (0.15 + Math.random() * 0.7),
        y: H + 10,
        vx: (Math.random() - 0.5) * 1.2,
        vy: -(8 + Math.random() * 3),
        tinta: H * (0.16 + Math.random() * 0.3),
        culoare: alegeCuloare(),
      });
      porneste();
    };

    const explodeaza = (r: Racheta) => {
      const n = 70 + Math.floor(Math.random() * 30);
      const culoareB = alegeCuloare();
      for (let i = 0; i < n; i++) {
        const unghi = Math.random() * Math.PI * 2;
        const viteza = Math.random() * 4.6 + 1.2;
        particule.push({
          x: r.x,
          y: r.y,
          vx: Math.cos(unghi) * viteza,
          vy: Math.sin(unghi) * viteza,
          viata: 1,
          scadere: 0.011 + Math.random() * 0.012,
          culoare: i % 3 === 0 ? culoareB : r.culoare,
          raza: 1.4 + Math.random() * 1.4,
        });
      }
    };

    const cadru = () => {
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "rgba(0,0,0,0.2)";
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = "source-over";

      for (let i = rachete.length - 1; i >= 0; i--) {
        const r = rachete[i];
        r.x += r.vx;
        r.y += r.vy;
        r.vy += 0.045;
        ctx.beginPath();
        ctx.arc(r.x, r.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = r.culoare;
        ctx.fill();
        if (r.y <= r.tinta || r.vy >= -1) {
          explodeaza(r);
          rachete.splice(i, 1);
        }
      }
      for (let j = particule.length - 1; j >= 0; j--) {
        const p = particule[j];
        p.vx *= 0.975;
        p.vy = p.vy * 0.975 + 0.05;
        p.x += p.vx;
        p.y += p.vy;
        p.viata -= p.scadere;
        if (p.viata <= 0) {
          particule.splice(j, 1);
          continue;
        }
        ctx.globalAlpha = Math.max(0, p.viata);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.raza, 0, Math.PI * 2);
        ctx.fillStyle = p.culoare;
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      if (rachete.length || particule.length || timereRamase > 0) {
        animatie = requestAnimationFrame(cadru);
      } else {
        animatie = null;
        ctx.clearRect(0, 0, W, H);
      }
    };

    function porneste() {
      if (animatie === null) animatie = requestAnimationFrame(cadru);
    }

    const momente = [250, 700, 1150, 1500, 1950, 2400, 2800, 3300, 3800, 4300];
    timereRamase = momente.length;
    momente.forEach((ms, idx) => {
      timere.push(
        window.setTimeout(() => {
          timereRamase -= 1;
          lanseaza();
          if (idx % 3 === 0) lanseaza();
        }, ms)
      );
    });
    porneste();

    return () => {
      timere.forEach((t) => window.clearTimeout(t));
      if (animatie !== null) cancelAnimationFrame(animatie);
      window.removeEventListener("resize", redimensioneaza);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-10"
    />
  );
}

export default function RezultatTest({ scor, total }: { scor: number; total: number }) {
  const [afisat, setAfisat] = useState(0);

  // Numărul crește de la 0 la scor (direct la scor dacă se preferă mișcare redusă).
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setAfisat(scor);
      return;
    }
    let raf = 0;
    let start: number | null = null;
    const durata = 900;
    const pas = (t: number) => {
      if (start === null) start = t;
      const p = Math.min(1, (t - start) / durata);
      setAfisat(Math.round(p * scor));
      if (p < 1) raf = requestAnimationFrame(pas);
    };
    raf = requestAnimationFrame(pas);
    return () => cancelAnimationFrame(raf);
  }, [scor]);

  const rezultatFoarteBun = scor >= Math.ceil(total * PRAG_PROCENT);

  return (
    <>
      <Artificii />
      <div
        className="relative z-0 bg-white border border-navy-800/10 rounded-lg px-6 py-9 text-center"
        role="status"
        aria-live="polite"
      >
        <h2 className="text-xl font-serif font-semibold text-navy-900 leading-snug mb-6">
          Vă mulțumim pentru completarea chestionarului!
        </h2>

        <p className="text-sm text-navy-900/60 mb-1">Testul de cunoștințe</p>
        <p className="leading-none">
          <span className="text-5xl font-serif font-semibold text-navy-900 tabular-nums">{afisat}</span>
          <span className="text-2xl font-serif text-navy-900/60"> / {total}</span>
        </p>
        <p className="text-[15px] text-navy-900/70 mt-2">
          Ați obținut {scor} {scor === 1 ? "punct" : "puncte"}
        </p>

        <div className="flex justify-center gap-1.5 mt-4 mb-7" aria-hidden="true">
          {Array.from({ length: total }, (_, i) => (
            <span
              key={i}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                i < afisat ? "bg-gold-500 scale-110" : "bg-navy-800/15"
              }`}
            />
          ))}
        </div>

        <div className="max-w-md mx-auto text-left">
          {rezultatFoarteBun ? (
            <p className="text-[15px] leading-relaxed font-medium text-navy-900 mb-4">
              Participarea dumneavoastră contribuie la îmbunătățirea instruirilor SMAM și la
              consolidarea unei culturi a integrității în cadrul AEP.
            </p>
          ) : (
            <>
              <p className="text-[15px] leading-relaxed font-medium text-navy-900 mb-2">
                Este un rezultat bun, dar poate fi perfect!
              </p>
              <p className="text-[15px] leading-relaxed text-navy-900/70 mb-4">
                Chestionarul este un prilej de învățare. Fiecare răspuns clarificat ne ajută să
                acționăm corect și cu încredere.
              </p>
            </>
          )}
          <p className="font-serif text-[17px] leading-snug text-navy-900 border-l-[3px] border-gold-500 pl-3.5">
            Integritatea se construiește prin deciziile fiecăruia dintre noi, în fiecare zi.
          </p>
        </div>

        <p className="text-sm text-navy-900/60 mt-7">
          Răspunsul dumneavoastră a fost înregistrat anonim.
        </p>
      </div>
    </>
  );
}
