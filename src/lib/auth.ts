import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Autenticação do painel do caixa.
 *
 * Não há sessão guardada em lugar nenhum: o valor do cookie é um HMAC-SHA256
 * de uma string fixa, assinado com PAINEL_SENHA. O proxy consegue validar
 * recalculando o mesmo HMAC — se a senha mudar, todos os cookies antigos
 * deixam de valer automaticamente.
 */

export const PAINEL_COOKIE = "painel_auth";

/** String fixa assinada com a senha. Trocar o sufixo invalida todas as sessões. */
const PAYLOAD_ASSINADO = "painel-caixa-prestigio-v1";

/** 12 horas, em segundos. */
export const PAINEL_COOKIE_MAX_AGE = 60 * 60 * 12;

/** Senha configurada no ambiente, ou null se ninguém cadastrou a variável. */
export function senhaDoPainel(): string | null {
  const senha = process.env.PAINEL_SENHA;
  return typeof senha === "string" && senha.length > 0 ? senha : null;
}

/**
 * Comparação de tempo constante. Se os tamanhos diferirem, retorna false sem
 * comparar (timingSafeEqual exige buffers do mesmo tamanho).
 */
export function comparaSegura(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/** Valor que vai dentro do cookie painel_auth. */
export function tokenDoPainel(senha: string): string {
  return createHmac("sha256", senha).update(PAYLOAD_ASSINADO).digest("hex");
}

/** Valida o valor lido do cookie. Sem PAINEL_SENHA configurada, nada é válido. */
export function cookieDoPainelValido(valor: string | undefined | null): boolean {
  const senha = senhaDoPainel();
  if (!senha || !valor) return false;
  return comparaSegura(valor, tokenDoPainel(senha));
}
