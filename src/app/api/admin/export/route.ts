import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { esteAdminAutentificat } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

const TEXT_INTREBARE_11 = "Ce element al cursului vi s-a părut cel mai util?";
const TEXT_INTREBARE_12 =
  "Ce considerați că ar putea fi îmbunătățit la viitoarele sesiuni de instruire?";

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

  const workbook = new ExcelJS.Workbook();
  const foaie = workbook.addWorksheet("Răspunsuri");

  foaie.columns = [
    { header: "Nr. crt.", key: "nr", width: 8 },
    { header: "Data completării", key: "data", width: 20 },
    { header: "Formator", key: "formator", width: 26 },
    { header: "Județ", key: "judet", width: 24 },
    ...intrebari.map((i) => ({ header: i.text, key: `q${i.numar}`, width: 42 })),
    { header: TEXT_INTREBARE_11, key: "d11", width: 45 },
    { header: TEXT_INTREBARE_12, key: "d12", width: 45 },
  ];

  chestionare.forEach((chestionar, index) => {
    const valoriPerIntrebare = new Map(
      chestionar.raspunsuriLikert.map((r) => [r.intrebareId, r.valoare])
    );

    const rand: Record<string, string | number> = {
      nr: index + 1,
      data: chestionar.creatLa.toLocaleString("ro-RO"),
      formator: chestionar.formator ?? "",
      judet: chestionar.grupa ?? "",
      d11: chestionar.raspunsuriDeschise.find((r) => r.numarIntrebare === 11)?.text ?? "",
      d12: chestionar.raspunsuriDeschise.find((r) => r.numarIntrebare === 12)?.text ?? "",
    };

    for (const intrebare of intrebari) {
      rand[`q${intrebare.numar}`] = valoriPerIntrebare.get(intrebare.id) ?? "";
    }

    foaie.addRow(rand);
  });

  foaie.getRow(1).font = { bold: true };
  foaie.getRow(1).alignment = { wrapText: true, vertical: "middle" };
  foaie.views = [{ state: "frozen", ySplit: 1 }];

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer as ArrayBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="chestionar-anti-mita-${Date.now()}.xlsx"`,
    },
  });
}