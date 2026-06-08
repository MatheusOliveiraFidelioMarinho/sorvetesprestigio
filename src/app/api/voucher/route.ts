import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nome, whatsapp, dataNascimento, voucherCode } = body;

    // Validação básica
    if (!nome || !whatsapp || !voucherCode) {
      return NextResponse.json(
        { error: "Campos obrigatórios ausentes: Nome, WhatsApp e Código do Voucher são necessários." },
        { status: 400 }
      );
    }

    // Cria o registro diretamente no Neon DB via Prisma
    const newLead = await db.lead.create({
      data: {
        nome,
        whatsapp,
        dataNascimento: dataNascimento || null,
        voucherCode,
        status: "Não Utilizado",
      },
    });

    console.log("Novo lead cadastrado no Neon DB:", newLead);

    return NextResponse.json({ success: true, lead: newLead }, { status: 201 });
  } catch (error) {
    console.error("Erro ao processar cadastro de voucher:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor." },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Busca todos os leads do banco de dados ordenados por data de cadastro
    const leads = await db.lead.findMany({
      orderBy: {
        timestamp: "desc",
      },
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
    
    // Atualiza o status do voucher diretamente no banco Neon DB
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
