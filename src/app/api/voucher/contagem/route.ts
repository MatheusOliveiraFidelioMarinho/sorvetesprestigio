import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { CAMPANHA_PADRAO, getCampanha } from "@/lib/campanhas";

/**
 * Contador de escassez REAL.
 *
 * Devolve só números agregados — nenhum dado pessoal — por isso pode ficar
 * público (o proxy libera esta rota explicitamente).
 */
export async function GET(request: NextRequest) {
  try {
    const campanhaId = request.nextUrl.searchParams.get("campanha") || CAMPANHA_PADRAO;
    const config = getCampanha(campanhaId);

    const emitidos = await db.lead.count({ where: { campanha: config.id } });
    const limite = config.limite;
    const restantes = limite === null ? null : Math.max(0, limite - emitidos);

    return NextResponse.json({
      campanha: config.id,
      emitidos,
      limite,
      restantes,
      encerrada: limite !== null && emitidos >= limite,
    });
  } catch (error) {
    console.error("Erro ao contar vouchers:", error);
    return NextResponse.json({ error: "Erro ao buscar contagem." }, { status: 500 });
  }
}
