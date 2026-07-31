-- BASELINE — descreve o schema que JÁ EXISTE em produção (os 560 cadastros).
-- Este arquivo NÃO deve ser executado no banco de produção. Ele só serve para
-- dar um ponto de partida ao histórico de migrations do Prisma, através de:
--
--   npx prisma migrate resolve --applied 0_init
--
-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "dataNascimento" TEXT,
    "voucherCode" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'Não Utilizado',
    "origem" TEXT NOT NULL DEFAULT 'Direto/Orgânico',
    "unidade" TEXT NOT NULL DEFAULT 'Unidade Santa Maria',

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Lead_voucherCode_key" ON "Lead"("voucherCode");
