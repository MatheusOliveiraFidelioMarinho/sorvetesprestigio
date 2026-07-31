import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import {
  CAMPANHA_PADRAO,
  calculaExpiracao,
  getCampanha,
  type CampanhaConfig,
} from "@/lib/campanhas";

/** Tentativas de gerar um código de voucher que não colida com um já existente. */
const MAX_TENTATIVAS_CODIGO = 5;

/**
 * Gera o código NO SERVIDOR. Antes isso era feito no cliente com 5 dígitos
 * (90 mil combinações contra um campo @unique), o que já colidia com
 * frequência e devolvia "Erro interno no servidor" ao usuário.
 */
function geraCodigoVoucher(campanha: CampanhaConfig): string {
  const min = 10 ** (campanha.voucherDigitos - 1);
  const max = 10 ** campanha.voucherDigitos - 1;
  const numero = min + Math.floor(Math.random() * (max - min + 1));
  return `${campanha.voucherPrefixo}-${numero}`;
}

/** Colunas envolvidas em um erro de constraint única (P2002). */
function alvoDaConstraint(error: unknown): string[] {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    const target = error.meta?.target;
    if (Array.isArray(target)) return target as string[];
    if (typeof target === "string") return [target];
  }
  return [];
}

function textoOuNulo(valor: unknown): string | null {
  return typeof valor === "string" && valor.trim() !== "" ? valor.trim() : null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      nome,
      whatsapp,
      dataNascimento,
      origem,
      unidade,
      campanha: campanhaEnviada,
      utmCampaign,
      utmContent,
      utmSource,
    } = body;

    // voucherCode NÃO é mais campo obrigatório de entrada — quem gera é o servidor.
    if (!nome || !whatsapp) {
      return NextResponse.json(
        { error: "Campos obrigatórios ausentes: Nome e WhatsApp são necessários." },
        { status: 400 }
      );
    }

    // Link antigo ainda circulando cai no padrão da campanha do picolé.
    const campanhaId =
      typeof campanhaEnviada === "string" && campanhaEnviada.trim() !== ""
        ? campanhaEnviada.trim()
        : CAMPANHA_PADRAO;
    const config = getCampanha(campanhaId);

    // A oferta é derivada da campanha no servidor, não aceita do cliente.
    const oferta = config.oferta;

    // Trava de duplicidade POR CAMPANHA (antes era global por telefone, o que
    // impedia os 560 participantes do picolé de participarem do cartão fidelidade).
    const leadExistente = await db.lead.findFirst({
      where: { whatsapp, campanha: config.id },
    });

    if (leadExistente) {
      return NextResponse.json(
        { error: "Este WhatsApp já retirou o voucher desta campanha." },
        { status: 400 }
      );
    }

    // Escassez de verdade: se a campanha tem limite e ele foi atingido, recusa
    // aqui no servidor — não só na tela.
    if (config.limite !== null) {
      const emitidos = await db.lead.count({ where: { campanha: config.id } });
      if (emitidos >= config.limite) {
        return NextResponse.json(
          { error: "Campanha encerrada: todos os vouchers já foram distribuídos." },
          { status: 409 }
        );
      }
    }

    const expiraEm = calculaExpiracao(config.id);

    const dadosBase = {
      nome,
      whatsapp,
      dataNascimento: dataNascimento || null,
      status: "Não Utilizado",
      origem: origem || "Direto/Orgânico",
      unidade: unidade || "Unidade Santa Maria",
      campanha: config.id,
      oferta,
      utmCampaign: textoOuNulo(utmCampaign),
      utmContent: textoOuNulo(utmContent),
      utmSource: textoOuNulo(utmSource),
      expiraEm,
    };

    for (let tentativa = 1; tentativa <= MAX_TENTATIVAS_CODIGO; tentativa++) {
      try {
        const newLead = await db.lead.create({
          data: { ...dadosBase, voucherCode: geraCodigoVoucher(config) },
        });

        console.log(
          `Novo lead cadastrado: campanha=${newLead.campanha} criativo=${newLead.utmContent ?? "-"} codigo=${newLead.voucherCode}`
        );

        return NextResponse.json({ success: true, lead: newLead }, { status: 201 });
      } catch (error) {
        const alvo = alvoDaConstraint(error);

        // Corrida: outro cadastro com o mesmo telefone entrou entre a checagem
        // acima e este insert.
        if (alvo.includes("whatsapp")) {
          return NextResponse.json(
            { error: "Este WhatsApp já retirou o voucher desta campanha." },
            { status: 400 }
          );
        }

        // Código sorteado já existe: sorteia outro e tenta de novo.
        if (alvo.includes("voucherCode")) {
          if (tentativa < MAX_TENTATIVAS_CODIGO) continue;
          break;
        }

        throw error;
      }
    }

    // Só chega aqui se as 5 tentativas colidirem no voucherCode.
    return NextResponse.json(
      { error: "Não foi possível gerar um código único. Tente novamente." },
      { status: 503 }
    );
  } catch (error) {
    console.error("Erro ao processar cadastro de voucher:", error);
    return NextResponse.json({ error: "Erro interno no servidor." }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Filtro opcional por campanha. Sem o parâmetro devolve tudo — o painel
    // precisa do histórico completo.
    const campanha = request.nextUrl.searchParams.get("campanha");

    const leads = await db.lead.findMany({
      where: campanha ? { campanha } : undefined,
      orderBy: { timestamp: "desc" },
    });

    return NextResponse.json({ success: true, leads });
  } catch (error) {
    console.error("Erro ao listar leads:", error);
    return NextResponse.json({ error: "Erro ao buscar dados." }, { status: 500 });
  }
}

// Rota para atualizar o status do voucher (ex: para Utilizado na tela admin)
export async function PATCH(request: Request) {
  try {
    const { voucherCode, status } = await request.json();

    const updatedLead = await db.lead.update({
      where: { voucherCode },
      data: { status },
    });

    return NextResponse.json({ success: true, lead: updatedLead });
  } catch (error) {
    console.error("Erro ao atualizar status do voucher:", error);
    return NextResponse.json({ error: "Erro ao atualizar voucher" }, { status: 500 });
  }
}

// Rota para excluir todos os registros (limpeza geral).
// Além do proxy exigir login, o corpo tem que trazer a confirmação exata.
export async function DELETE(request: Request) {
  try {
    let confirmacao: unknown;
    try {
      const body = await request.json();
      confirmacao = body?.confirmacao;
    } catch {
      confirmacao = undefined;
    }

    if (confirmacao !== "EXCLUIR TUDO") {
      return NextResponse.json(
        { error: 'Confirmação ausente. Envie { "confirmacao": "EXCLUIR TUDO" }.' },
        { status: 400 }
      );
    }

    const deleteResult = await db.lead.deleteMany({});
    return NextResponse.json({ success: true, count: deleteResult.count });
  } catch (error) {
    console.error("Erro ao excluir todos os leads:", error);
    return NextResponse.json({ error: "Erro ao deletar registros." }, { status: 500 });
  }
}
