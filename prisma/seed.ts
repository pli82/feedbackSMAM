import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const intrebari = [
  { numar: 1, text: "Obiectivele cursului au fost prezentate clar la începutul instruirii." },
  { numar: 2, text: "Conținutul cursului a fost prezentat într-o manieră clară, logică și ușor de urmărit." },
  { numar: 3, text: "Informațiile prezentate au fost relevante pentru activitatea desfășurată în cadrul AEP." },
  { numar: 4, text: "Exemplele și situațiile practice utilizate au facilitat înțelegerea cerințelor privind managementul anti-mită." },
  { numar: 5, text: "Materialele utilizate în cadrul prezentării au fost clare, relevante și adecvate tematicii cursului." },
  { numar: 6, text: "Formatorul a prezentat informațiile într-un mod clar, accesibil și bine structurat." },
  { numar: 7, text: "Formatorul a încurajat participarea, întrebările și schimbul de opinii pe parcursul cursului." },
  { numar: 8, text: "Durata cursului și ritmul prezentării au fost adecvate volumului de informații transmis." },
  { numar: 9, text: "În urma cursului, considerați că înțelegeți mai bine rolul dumneavoastră în prevenirea și gestionarea riscurilor de mită la nivelul AEP." },
  { numar: 10, text: "În ansamblu, cât de mulțumit(ă) sunteți de calitatea acestei sesiuni de instruire?" },
];

async function main() {
  for (const intrebare of intrebari) {
    await prisma.intrebareLikert.upsert({
      where: { numar: intrebare.numar },
      update: { text: intrebare.text },
      create: intrebare,
    });
  }
  console.log(`S-au încărcat ${intrebari.length} întrebări.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
