import { NextResponse } from "next/server";
import { esteAdminAutentificat } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { genereazaExcelIntrebari } from "@/lib/test";

// GET — descarcă întrebările curente în formatul de import (servește și ca
// șablon: editezi în Excel și reimporți).
export async function GET() {
  if (!(await esteAdminAutentificat())) {
    return NextResponse.json({ eroare: "Neautorizat." }, { status: 401 });
  }
  const intrebari = await prisma.intrebareTest.findMany({ orderBy: { numar: "asc" } });
  const buffer = await genereazaExcelIntrebari(intrebari);

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="intrebari-test-smam-${Date.now()}.xlsx"`,
    },
  });
}
