# Runbook — Campanha Agosto/2026 (Santa Maria · Cartão Fidelidade)

Status em 31/07/2026: código aplicado, build e lint limpos, **migration e backfill
já rodados no banco de produção** e fluxo testado de ponta a ponta.

| Etapa | Situação |
|---|---|
| Código (etapas 1 a 5) | ✅ aplicado, `npm run build` passa, lint sem erros |
| Migration no Neon | ✅ aplicada (560 registros preservados) |
| Backfill de `expiraEm` | ✅ 560 registros preenchidos |
| Testes de ponta a ponta | ✅ segurança, duplicidade por campanha, UTM, 20 vouchers sem colisão |
| `PAINEL_SENHA` na Vercel | ✅ cadastrada e login testado |
| Deploy em produção | ✅ no ar (`main` @ 10902d2) |

Registros de teste criados durante a validação foram removidos: a base voltou a
560 cadastros / 134 utilizados / 0 na campanha nova.
Backup pré-migration em `backups/leads-antes-migration.json` (fora do git — tem
dados pessoais).

---

## 1. Variável de ambiente

A senha do painel vive em `PAINEL_SENHA`, em dois lugares:

- **local**: no arquivo `.env` (que não vai para o git)
- **produção**: nas Environment Variables do projeto na Vercel, ambientes
  Produção e Pré-visualização (igual ao `DATABASE_URL`)

Sem ela cadastrada na Vercel, o `/api/painel-login` responde 503 e o painel fica
inacessível para todo mundo.

**Este repositório é público — nunca escreva a senha em nenhum arquivo
versionado.** Ela só existe no `.env` local e no painel da Vercel.

Trocar a senha invalida todos os cookies em uso automaticamente, porque o valor
do cookie é um HMAC assinado com ela. É só atualizar nos dois lugares.

> Vale usar uma senha longa e aleatória: o painel expõe nome, WhatsApp e data de
> nascimento de 560 pessoas.

---

## 2. Banco de dados — migration aditiva ✅ JÁ APLICADA

O banco de produção **não tinha histórico de migrations** (foi criado por
`db push`). Rodar `prisma migrate dev` direto sobre ele faria o Prisma pedir um
reset — que apagaria os 560 cadastros. Por isso a migration foi escrita à mão e
o histórico foi baselineado antes. Comandos executados, nesta ordem:

```bash
# 2.1 — diagnóstico antes de tudo. Resultado: 0 duplicados, seguro prosseguir.
SELECT whatsapp, COUNT(*) FROM "Lead" GROUP BY whatsapp HAVING COUNT(*) > 1;

# 2.2 — marca o schema atual como já aplicado (NÃO executa SQL no banco)
npx prisma migrate resolve --applied 0_init

# 2.3 — aplica só a migration nova, aditiva
npx prisma migrate deploy

# 2.4 — regenera o client com os campos novos
npx prisma generate
```

Não precisa rodar de novo. Só refaça o passo 2.4 se trocar de máquina.

O que a migration faz (`prisma/migrations/20260731120000_campanha_utm_validade/`):

- `ADD COLUMN campanha DEFAULT 'picole-2026-07'` → os 560 registros existentes
  passam a pertencer à campanha do picolé automaticamente
- `ADD COLUMN oferta DEFAULT 'Picolé Grátis'`
- `ADD COLUMN utmCampaign / utmContent / utmSource` (nullable)
- `ADD COLUMN expiraEm` (nullable)
- índices em `campanha` e `status`
- `UNIQUE (whatsapp, campanha)`

Nada é apagado, sobrescrito ou invalidado. Se o índice único falhar por
duplicidade, a transação inteira sofre rollback — o banco fica intacto.

---

## 3. Backfill da validade dos registros antigos ✅ JÁ RODADO

```bash
npm run backfill:expiracao   # 560/560 registros atualizados
```

Preencheu `expiraEm = timestamp + 7 dias` em todo lead com `expiraEm IS NULL`
(a regra publicada no regulamento do picolé). Rodar **uma vez** — o script é
idempotente, se rodar de novo não faz nada.

**Descoberta:** o último cadastro do picolé foi em 13/07, então os 426 não
resgatados já estavam todos vencidos em 31/07. O painel agora mostra isso
corretamente: "Não Utilizados (no prazo) = 0" e "Expirados = 426". A lista de
reativação são vouchers vencidos — vale decidir se o caixa vai honrar ou se o
disparo será um convite para a campanha nova.

Alternativa em SQL puro, se preferir o console do Neon:

```sql
UPDATE "Lead" SET "expiraEm" = "timestamp" + INTERVAL '7 days' WHERE "expiraEm" IS NULL;
```

---

## 4. Build e verificação ✅

```bash
npm run build     # roda prisma generate + next build (typecheck incluso)
npm run lint      # 0 erros; 1 aviso pré-existente do <img> do Meta Pixel
npm run dev       # teste local
```

Observação de ambiente: o `node_modules` que veio no projeto tinha sido instalado
no Windows (binários `.exe`/`.dll` do Prisma). Foi feito um `rm -rf node_modules`
+ `npm install` limpo no macOS. O npm 11 também passou a bloquear scripts de
instalação — os pacotes necessários foram liberados no campo `allowScripts` do
`package.json`, que agora está versionado.

---

## 5. Deploy

O projeto na Vercel (`villa-master-performance/sorvetesprestigio`) está plugado
no GitHub e faz deploy automático a partir da `main`.

O trabalho está commitado na branch **`campanha-agosto-2026`**, não na `main`.
Ao dar push nessa branch a Vercel gera um **preview** sem tocar em produção.

> ⚠️ O `DATABASE_URL` na Vercel está configurado para **Produção e
> Pré-visualização** — ou seja, o preview escreve no MESMO banco real. Cadastros
> feitos no preview entram na base de verdade.

Etapas 3, 4 e 5 precisam subir juntas: a landing nova depende do POST novo e o
painel novo depende dos campos novos. Como está tudo num commit só, isso já está
garantido.

---

## Checklist de aceite — validado localmente em 31/07/2026

| | Teste | Resultado |
|---|---|---|
| ✅ | `/api/voucher` sem login no GET, PATCH e DELETE | 401 nos três |
| ✅ | `/api/voucher` aceita POST sem login | 201, voucher gerado |
| ✅ | `/api/voucher/contagem` responde sem login | só agregados |
| ✅ | `/santamaria` mostra escassez por tempo, sem contador | "válido por 72 horas" |
| ✅ | `/caixa-prestigio-7918` sem cookie | 307 → `/painel-login` |
| ✅ | Depois de logar, painel carrega os 560 registros | 560 |
| ✅ | Os 560 antigos mantêm unidade, origem e status | 211 SM / 296 Samambaia / 53 Areal; 134 utilizados |
| ✅ | Antigos aparecem com campanha `picole-2026-07` | 560/560 |
| ✅ | Backfill preencheu `expiraEm`; aba Expirados | 426 expirados, 0 sem `expiraEm` |
| ✅ | `/santamaria` com unidade travada, sem dropdown | bloco estático com MapPin |
| ✅ | Cadastro em `/santamaria` grava `fidelidade-2026-08` | + oferta "Cartão Fidelidade" |
| ✅ | **Telefone já existente no picolé se cadastra em `/santamaria`** | permitido |
| ✅ | Mesmo telefone duas vezes em `/santamaria` | bloqueado |
| ✅ | Link com `?utm_campaign=x&utm_content=y` | os dois gravados |
| ✅ | Recarregar sem parâmetros mantém a atribuição | sessionStorage funcionou |
| ✅ | Voucher exibe data/hora exata de expiração | 31/07 16:07 → 03/08 16:07 |
| ✅ | Painel filtra por campanha e mostra coluna Criativo | filtro derivado dos dados |
| ✅ | CSV com colunas novas + "Exportar não resgatados" | botão mostra a contagem |
| ✅ | 20 vouchers seguidos sem código duplicado | 20/20, zero colisões |

### Reverificado em produção (www.sorvetesprestigio.com.br) após o deploy

| | Teste | Resultado |
|---|---|---|
| ✅ | `GET /api/voucher` sem login | 401 (antes devolvia os 560 leads a qualquer um) |
| ✅ | `PATCH` e `DELETE` sem login | 401 nos dois |
| ✅ | `/caixa-prestigio-7918` sem cookie | 307 → `/painel-login` |
| ✅ | Login do painel com a `PAINEL_SENHA` da Vercel | entra e carrega os 560 |
| ✅ | **`POST /api/voucher` sem login** | 201 — a campanha funciona |
| ✅ | `/santamaria`, `/`, `/painel-login` | 200 |
| ✅ | `/api/voucher/contagem` | público, só agregados |

O registro criado no teste do POST em produção foi apagado: base em 560 / 134
utilizados / 0 na campanha nova.

---

## Links dos anúncios (configurar no Meta após o deploy)

```
https://www.sorvetesprestigio.com.br/santamaria
  ?utm_source=meta_ads
  &utm_medium=paid_social
  &utm_campaign=fidelidade-santamaria-ago26
  &utm_content=<nome-do-criativo>
```

`utm_content` por criativo: `cartao-fidelidade-v2`, `20-sabores-1-real`,
`como-funciona`, `prova-local`.

`utm_source` precisa ser exatamente `meta_ads`, `fb_ads` ou `instagram_ads` —
qualquer outro valor cai em "Outra Mídia" na classificação de origem.

---

## Decisões do cliente (31/07/2026)

1. ✅ Valor mínimo do programa de fidelidade: **R$ 15,00** — confirmado, já está
   no regulamento de `/santamaria`.
2. ⚠️ **A casquinha da retirada EXIGE consumo mínimo — falta o valor.**
   Enquanto não vier, a página não menciona nenhuma condição, o que gera
   discussão no caixa. É a última pendência bloqueante da copy.
3. ✅ Campanha de agosto **sem limite** de vouchers. `limite: null` em
   `src/lib/campanhas.ts` — a escassez da página passou a ser a validade de 72h.
4. ☐ Definir quem fica com a senha do painel.

---

## Onde mexer na próxima campanha

`src/lib/campanhas.ts` é a fonte única de verdade: oferta, validade, limite e
formato do código do voucher. Adicionar uma entrada nova lá + uma rota nova em
`src/app/` cobre a campanha inteira. Os filtros do painel se atualizam sozinhos
(são derivados dos dados, não fixos no código).
