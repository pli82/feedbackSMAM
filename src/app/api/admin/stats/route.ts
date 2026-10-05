import { NextRequest, NextResponse } from "next/server";
import { esteAdminAutentificat } from "@/lib/auth";
import {
  calculeazaStatistici,
  calculeazaRezumatPerGrup,
  obtineOptiuniFiltrare,
} from "@/lib/stats";
import { calculeazaStatisticiTest } from "@/lib/statsTest";

export async function GET(req: NextRequest) {
  if (!(await esteAdminAutentificat())) {
    return NextResponse.json({ eroare: "Neautorizat." }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const grupa = searchParams.get("grupa") ?? undefined;

  const [statistici, optiuniFiltrare, comparatieGrupe, test] = await Promise.all([
    calculeazaStatistici({ grupa }),
    obtineOptiuniFiltrare(),
    calculeazaRezumatPerGrup("grupa"),
    calculeazaStatisticiTest({ grupa }),
  ]);

  return NextResponse.json({
    ...statistici,
    filtruActiv: { grupa: grupa ?? null },
    optiuniFiltrare,
    comparatieGrupe,
    test,
  });
}
