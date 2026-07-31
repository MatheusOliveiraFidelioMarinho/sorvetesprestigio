/**
 * Backfill pontual: preenche `expiraEm` dos leads antigos.
 *
 * Regra aplicada: expiraEm = timestamp + 7 dias — que é exatamente o que estava
 * publicado no regulamento da campanha do picolé. Depois de rodar, o painel
 * consegue separar quem ainda podia resgatar de quem já tinha perdido o prazo
 * (hoje os dois estão no mesmo balde de "Não Utilizado").
 *
 * Só toca em registros com expiraEm == null. Não apaga nem sobrescreve nada.
 * Rodar UMA vez:
 *
 *   npm run backfill:expiracao
 *
 * Equivalente em SQL puro, se preferir rodar direto no console do Neon:
 *   UPDATE "Lead"
 *      SET "expiraEm" = "timestamp" + INTERVAL '7 days'
 *    WHERE "expiraEm" IS NULL;
 */
import { PrismaClient } from "@prisma/client";

const VALIDADE_HISTORICA_MS = 7 * 24 * 60 * 60 * 1000;
const LOTE = 200;

const prisma = new PrismaClient();

async function main() {
  const pendentes = await prisma.lead.count({ where: { expiraEm: null } });
  console.log(`Leads sem expiraEm: ${pendentes}`);

  if (pendentes === 0) {
    console.log("Nada a fazer — backfill já foi aplicado.");
    return;
  }

  let processados = 0;

  for (;;) {
    const leads = await prisma.lead.findMany({
      where: { expiraEm: null },
      select: { id: true, timestamp: true },
      take: LOTE,
    });

    if (leads.length === 0) break;

    for (const lead of leads) {
      await prisma.lead.update({
        where: { id: lead.id },
        data: { expiraEm: new Date(lead.timestamp.getTime() + VALIDADE_HISTORICA_MS) },
      });
    }

    processados += leads.length;
    console.log(`  ${processados}/${pendentes} atualizados...`);
  }

  console.log(`Backfill concluído: ${processados} registros receberam expiraEm.`);
}

main()
  .catch((err) => {
    console.error("Falha no backfill:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
