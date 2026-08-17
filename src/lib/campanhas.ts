/**
 * Configuração central das campanhas.
 *
 * Este arquivo é a única fonte de verdade sobre oferta, validade, limite de
 * vouchers e formato do código. É lido tanto pelo servidor (API) quanto pelo
 * cliente (landing), por isso não pode importar nada de Node.
 *
 * Para criar a campanha de setembro: acrescente uma entrada aqui e uma rota
 * nova em src/app/. Nada mais precisa mudar.
 */

export type CampanhaConfig = {
  /** Identificador gravado no banco, na coluna `campanha`. */
  id: string;
  /** Texto gravado na coluna `oferta`. */
  oferta: string;
  /** Rótulo curto usado nos filtros do painel do caixa. */
  rotuloPainel: string;
  /** Validade do voucher, em horas, contadas a partir do cadastro. */
  validadeHoras: number;
  /** Texto curto de validade (ex.: "72 horas"). */
  validadeTextoCurto: string;
  /** Texto por extenso, para o regulamento. */
  validadeTextoExtenso: string;
  /** Limite de vouchers da campanha. `null` = sem limite. */
  limite: number | null;
  /** Prefixo do código do voucher. */
  voucherPrefixo: string;
  /** Quantidade de dígitos aleatórios do código. */
  voucherDigitos: number;
};

export const CAMPANHA_PADRAO = "picole-2026-07";
export const CAMPANHA_SANTA_MARIA = "fidelidade-2026-08";
export const CAMPANHA_SANTA_MARIA_R1 = "picole-1real-2026-08";

export const CAMPANHAS: Record<string, CampanhaConfig> = {
  [CAMPANHA_PADRAO]: {
    id: CAMPANHA_PADRAO,
    oferta: "Picolé Grátis",
    rotuloPainel: "Picolé Grátis (jul)",
    validadeHoras: 168,
    validadeTextoCurto: "7 dias",
    validadeTextoExtenso: "7 (sete) dias corridos",
    limite: null,
    voucherPrefixo: "PRESTIGIO",
    voucherDigitos: 5,
  },
  [CAMPANHA_SANTA_MARIA]: {
    // O `id` continua "fidelidade-2026-08" mesmo com a oferta tendo mudado: ele
    // já está gravado na coluna `campanha` do banco e é o que o filtro do painel
    // usa. Quem aparece na tela é o rotuloPainel.
    id: CAMPANHA_SANTA_MARIA,
    oferta: "Picolé Grátis + 2 Carimbos",
    rotuloPainel: "Picolé + Carimbos (ago)",
    validadeHoras: 72,
    validadeTextoCurto: "72 horas",
    validadeTextoExtenso: "72 (setenta e duas) horas",
    // Sem limite de vouchers em agosto (decisão do cliente, 31/07/2026).
    // A escassez da página passa a ser a validade de 72h — verdadeira e
    // verificável. Para voltar a limitar, basta trocar null por um número:
    // a landing volta a exibir "Restam X de Y" e a API recusa cadastros
    // depois do limite, sem precisar mexer em mais nada.
    limite: null,
    voucherPrefixo: "PRESTIGIO-SM",
    voucherDigitos: 6,
  },
  [CAMPANHA_SANTA_MARIA_R1]: {
    // Fechamento de agosto (18 a 31/08/2026). O cliente pediu para tirar do ar a
    // oferta do cartão fidelidade; a oferta do resto do mês é picolé por R$ 1,
    // sem nenhuma menção a "grátis", carimbo ou cartão.
    //
    // Entrada NOVA em vez de edição da anterior, de propósito: os vouchers de
    // "fidelidade-2026-08" já emitidos continuam válidos por 72h e precisam
    // seguir aparecendo no painel do caixa com a oferta que foi prometida a
    // quem se cadastrou. Sobrescrever aquela entrada reescreveria o passado.
    id: CAMPANHA_SANTA_MARIA_R1,
    oferta: "Picolé por R$ 1",
    rotuloPainel: "Picolé R$ 1 (ago)",
    validadeHoras: 72,
    validadeTextoCurto: "72 horas",
    validadeTextoExtenso: "72 (setenta e duas) horas",
    // Sem limite: a escassez da página é a validade de 72h, que é verdadeira e
    // verificável. Para limitar, trocar null por um número — a landing volta a
    // exibir "Restam X de Y" e a API recusa cadastros depois do limite.
    limite: null,
    // Prefixo próprio para o caixa distinguir de bate-pronto qual oferta o
    // cliente tem na mão: PRESTIGIO-SM é picolé grátis + carimbos,
    // PRESTIGIO-SM1 é picolé por R$ 1.
    voucherPrefixo: "PRESTIGIO-SM1",
    voucherDigitos: 6,
  },
};

/** Devolve a config da campanha; cai no padrão para links antigos ainda circulando. */
export function getCampanha(id?: string | null): CampanhaConfig {
  if (id && CAMPANHAS[id]) return CAMPANHAS[id];
  return CAMPANHAS[CAMPANHA_PADRAO];
}

/** Validade calculada SEMPRE no servidor — nunca confiar em valor vindo do cliente. */
export function calculaExpiracao(campanhaId: string, base: Date = new Date()): Date {
  const { validadeHoras } = getCampanha(campanhaId);
  return new Date(base.getTime() + validadeHoras * 60 * 60 * 1000);
}

/** Rótulo amigável para uma campanha desconhecida (campanhas futuras no painel). */
export function rotuloCampanha(id: string): string {
  return CAMPANHAS[id]?.rotuloPainel ?? id;
}

/** Data/hora de expiração formatada em pt-BR. */
export function formataExpiracao(iso: string | Date): string {
  const data = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(data.getTime())) return "";
  return data.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
