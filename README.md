# Chestionar de evaluare — curs management anti-mită (AEP)

Aplicație web pentru chestionarul anonim de evaluare a cursului de management
anti-mită, cu pagină de administrare pentru statistici agregate.

Stack: Next.js 14 (App Router) + TypeScript, Prisma + PostgreSQL (Neon),
Tailwind CSS, deploy pe Vercel.

## 1. Ce include

- **Formular public** (`/`) — 10 întrebări cu scală 1-5, 2 întrebări deschise
  opționale, complet anonim (fără nume, email, IP sau alt identificator).
  Protecție anti-dublă-trimitere printr-un cookie local pe dispozitiv.
- **Administrare** (`/admin/login` → `/admin/dashboard`) — autentificare cu
  cont/parolă, medii și distribuții pe fiecare întrebare, medie generală,
  evidențiere separată a satisfacției generale (întrebarea 10), listă
  căutabilă a răspunsurilor deschise, export CSV.

## 2. Configurare locală

### 2.1 Instalare

```bash
npm install
```

### 2.2 Bază de date (Neon)

1. Creează un proiect nou pe [neon.tech](https://neon.tech) (planul gratuit
   este suficient).
2. Copiază connection string-ul (cu `sslmode=require`).
3. Copiază `.env.example` în `.env` și completează:

```bash
cp .env.example .env
```

```
DATABASE_URL="postgresql://user:parola@ep-xxxx.neon.tech/neondb?sslmode=require"
JWT_SECRET="..."
ADMIN_USER="..."
ADMIN_PASSWORD_HASH="..."
```

- `JWT_SECRET` — un șir lung și aleator, de exemplu generat cu:
  `openssl rand -base64 32`
- `ADMIN_USER` — numele de utilizator ales pentru admin (ex. `admin`).
- `ADMIN_PASSWORD_HASH` — hash bcrypt al parolei de admin (nu se stochează
  parola în clar). Se generează cu:

```bash
node scripts/genereaza-hash-parola.mjs "parola-ta-aleasa"
```

Scriptul afișează linia gata de pus în `.env`.

### 2.3 Migrare și populare bază de date

```bash
npx prisma migrate dev --name init
npx prisma db seed
```

Comanda de seed încarcă cele 10 întrebări cu scală 1-5 în tabela
`IntrebareLikert` (textul lor e ținut în bază de date, nu hardcodat în UI,
ca să poată fi ajustat ulterior fără un nou deploy de cod).

### 2.4 Rulare locală

```bash
npm run dev
```

- Formular: http://localhost:3000
- Admin: http://localhost:3000/admin/login

## 3. Deploy pe Vercel + GitHub

1. Creează un repository nou pe GitHub, de exemplu `pli82/chestionar-anti-mita`,
   și urcă acest cod (deja pregătit pentru workflow-ul obișnuit: editare în
   GitHub Codespace → `git add` → `git commit` → `git push`).
2. În [Vercel](https://vercel.com), importă acel repository.
3. La configurarea proiectului în Vercel, adaugă aceleași variabile de mediu
   din `.env` (`DATABASE_URL`, `JWT_SECRET`, `ADMIN_USER`,
   `ADMIN_PASSWORD_HASH`) în Project Settings → Environment Variables.
4. Rulează migrarea Prisma **împotriva bazei de date de producție** (o
   singură dată, de pe mașina locală, cu `DATABASE_URL`-ul de producție activ
   în `.env`):

```bash
npx prisma migrate deploy
npx prisma db seed
```

5. Declanșează deploy-ul (push pe branch-ul principal pornește automat
   build-ul pe Vercel, conform workflow-ului configurat).

După fiecare `git push`, Vercel redeployază automat. Dacă modifici
`prisma/schema.prisma`, rulează din nou `npx prisma migrate deploy` (și
`db seed` dacă ai adăugat întrebări noi) împotriva bazei de producție înainte
sau după push, după caz.

## 4. Structura proiectului

```
prisma/
  schema.prisma        Chestionar, IntrebareLikert, RaspunsLikert, RaspunsDeschis
  seed.ts               populează cele 10 întrebări
src/
  app/
    page.tsx             formularul public
    admin/login/         autentificare admin
    admin/dashboard/      statistici agregate, grafice, export
    api/raspuns/          POST — trimitere răspuns (public)
    api/admin/login/      POST — autentificare admin
    api/admin/stats/      GET — statistici agregate (protejat)
    api/admin/export/     GET — export CSV (protejat)
  components/
    FormularChestionar.tsx
  lib/
    prisma.ts   auth.ts   stats.ts
  middleware.ts           protejează /admin/dashboard și API-urile admin
scripts/
  genereaza-hash-parola.mjs
```

## 5. Rezultate separate pe formator și pe grupă

Formularul cere acum, înainte de întrebările cu scală, selectarea **formatorului**
(listă cu cei doi formatori, editabilă în `FORMATORI` din
`src/components/FormularChestionar.tsx`) și completarea **grupei/sesiunii**
(text liber — de exemplu „Grupa 1” sau „Seria martie 2026”). Ambele sunt
obligatorii în formular, dar rămân informații despre sesiune, nu despre
persoană — chestionarul e în continuare anonim.

În administrare:
- două filtre (Formator / Grupă) care restrâng toate statisticile de mai jos
  la o singură valoare;
- un tabel „Rezultate separate pe formator” și unul „Rezultate separate pe
  grupă / sesiune”, cu numărul de chestionare, media generală și satisfacția
  (Q10) pentru fiecare valoare găsită în date;
- exportul CSV respectă filtrul activ și include coloanele `formator` și
  `grupa`.

Dacă redeployezi peste o bază de date deja populată, rulează o nouă migrare
Prisma (coloanele sunt opționale la nivel de schemă, deci migrarea nu strică
rândurile vechi, care vor apărea sub eticheta „Nespecificat”):

```bash
npx prisma migrate dev --name adauga_formator_grupa   # local
npx prisma migrate deploy                              # producție
```

## 6. Note de securitate

- Chestionarul nu colectează niciun identificator al respondentului (nume,
  departament, email, IP). Protecția anti-dublă-trimitere folosește un
  cookie local pe dispozitiv, fără legătură cu identitatea persoanei.
- Parola de admin nu e stocată în clar, nici în cod, nici în baza de date —
  doar hash-ul ei bcrypt, ca variabilă de mediu.
- Cookie-ul de sesiune admin e `httpOnly`, deci inaccesibil din JavaScript în
  browser.
- Proiectul pornește de pe Next.js 14.2.35, versiunea patch curentă din seria
  14.2.x la data livrării (există actualizări de securitate periodice —
  rulează din când în când `npm outdated` și actualizează la ultimul patch
  din 14.2.x înainte de un deploy nou).
