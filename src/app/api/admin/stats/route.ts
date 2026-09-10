import { NextRequest, NextResponse } from "next/server";
import { esteAdminAutentificat } from "@/lib/auth";
import {
  calculeazaStatistici,
  calculeazaRezumatPerGrup,
  obtineOptiuniFiltrare,
} from "@/lib/stats";

export async function GET(req: NextRequest) {
  if (!(await esteAdminAutentificat())) {
    return NextResponse.json({ eroare: "Neautorizat." }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const formator = searchParams.get("formator") ?? undefined;
  const grupa = searchParams.get("grupa") ?? undefined;

  const [statistici, optiuniFiltrare, comparatieFormatori, comparatieGrupe] = await Promise.all([
    calculeazaStatistici({ formator, grupa }),
    obtineOptiuniFiltrare(),
    calculeazaRezumatPerGrup("formator"),
    calculeazaRezumatPerGrup("grupa"),
  ]);

  return NextResponse.json({
    ...statistici,
    filtruActiv: { formator: formator ?? null, grupa: grupa ?? null },
    optiuniFiltrare,
    comparatieFormatori,
    comparatieGrupe,
  });
}
