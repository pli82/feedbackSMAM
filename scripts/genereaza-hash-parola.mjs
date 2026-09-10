import bcrypt from "bcryptjs";

const parola = process.argv[2];

if (!parola) {
  console.error("Utilizare: node scripts/genereaza-hash-parola.mjs <parola-admin>");
  process.exit(1);
}

const hash = await bcrypt.hash(parola, 10);
console.log("\nAdaugă în .env / variabilele de mediu Vercel:\n");
console.log(`ADMIN_PASSWORD_HASH="${hash}"\n`);
