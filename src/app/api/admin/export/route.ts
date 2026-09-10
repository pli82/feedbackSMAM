import { NextRequest, NextResponse } from "next/server";
import { esteAdminAutentificat } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

function scapaCsv(valoare: string): string {
  if (/[",\n]/.test(valoare)) {
    return `"${valoare.replace(/"/g, '""')}"`;
  }
  return valoare;
}

export async function GET(req: NextRequest) {
  if (!(await esteAdminAutentificat())) {
    return NextResponse.json({ eroare: "Neautorizat." }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const formator = searchParams.get("formator");
  const grupa = searchParams.get("grupa");

  const whereChestionar: Prisma.ChestionarWhereInput = {
    ...(formator ? { formator } : {}),
    ...(grupa ? { grupa } : {}),
  };

  const intrebari = await prisma.intrebareLikert.findMany({ orderBy: { numar: "asc" } });

  const chestionare = await prisma.chestionar.findMany({
    where: whereChestionar,
    orderBy: { creatLa: "asc" },
    include: { raspunsuriLikert: true, raspunsuriDeschise: true },
  });

  const antet = [
    "nr_crt",
    "data_completarii",
    "formator",
    "grupa",
    ...intrebari.map((i) => `intrebare_${i.numar}`),
    "raspuns_deschis_11",
    "raspuns_deschis_12",
  ];

  const linii = chestionare.map((chestionar, index) => {
    const valoriPerIntrebare = new Map(
      chestionar.raspunsuriLikert.map((r) => [r.intrebareId, r.valoare])
    );
    const coloaneLikert = intrebari.map((i) => String(valoriPerIntrebare.get(i.id) ?? ""));

    const raspuns11 =
      chestionar.raspunsuriDeschise.find((r) => r.numarIntrebare === 11)?.text ?? "";
    const raspuns12 =
      chestionar.raspunsuriDeschise.find((r) => r.numarIntrebare === 12)?.text ?? "";

    return [
      String(index + 1),
      chestionar.creatLa.toISOString(),
      chestionar.formator ?? "",
      chestionar.grupa ?? "",
      ...coloaneLikert,
      raspuns11,
      raspuns12,
    ]
      .map(scapaCsv)
      .join(",");
  });

  const csv = [antet.join(","), ...linii].join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="chestionar-anti-mita-${Date.now()}.csv"`,
    },
  });
}
