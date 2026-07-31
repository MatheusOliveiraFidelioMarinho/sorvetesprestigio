-- Migration ADITIVA. Não apaga, não sobrescreve e não invalida nenhum dos
-- registros existentes: as colunas novas nascem com DEFAULT ou como NULL.
--
-- Os registros antigos passam a pertencer à campanha "picole-2026-07" com
-- oferta "Picolé Grátis" automaticamente, via DEFAULT.

-- AlterTable
ALTER TABLE "Lead"
    ADD COLUMN "campanha"    TEXT NOT NULL DEFAULT 'picole-2026-07',
    ADD COLUMN "oferta"      TEXT NOT NULL DEFAULT 'Picolé Grátis',
    ADD COLUMN "utmCampaign" TEXT,
    ADD COLUMN "utmContent"  TEXT,
    ADD COLUMN "utmSource"   TEXT,
    ADD COLUMN "expiraEm"    TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Lead_campanha_idx" ON "Lead"("campanha");

-- CreateIndex
CREATE INDEX "Lead_status_idx" ON "Lead"("status");

-- CreateIndex
-- ATENÇÃO: se existirem hoje dois registros com o mesmo whatsapp, ESTE comando
-- falha e a migration inteira sofre rollback (nada é alterado — é seguro).
-- Nesse caso, rodar o diagnóstico abaixo ANTES de tentar de novo:
--
--   SELECT whatsapp, COUNT(*) FROM "Lead" GROUP BY whatsapp HAVING COUNT(*) > 1;
--
-- e NÃO forçar nada sem antes decidir o que fazer com os duplicados.
CREATE UNIQUE INDEX "Lead_whatsapp_campanha_key" ON "Lead"("whatsapp", "campanha");
