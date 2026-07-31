import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { PAINEL_COOKIE, cookieDoPainelValido } from "@/lib/auth";

/**
 * ATENÇÃO: no Next.js 16 o arquivo `middleware.ts` foi descontinuado e renomeado
 * para `proxy.ts` (função exportada `proxy`, não `middleware`).
 * Ver node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md
 *
 * Protege:
 *   a) /caixa-prestigio-7918 e tudo abaixo  → redireciona para /painel-login
 *   b) /api/voucher nos métodos GET, PATCH e DELETE → 401 em JSON
 *
 * O POST de /api/voucher CONTINUA PÚBLICO: é ele que o formulário da landing
 * usa para gerar o voucher. Bloquear o POST derruba a campanha inteira.
 * /api/voucher/contagem também é público (só devolve números agregados).
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const autorizado = cookieDoPainelValido(request.cookies.get(PAINEL_COOKIE)?.value);

  if (pathname === "/api/voucher" || pathname.startsWith("/api/voucher/")) {
    // Rotas públicas da API
    if (pathname === "/api/voucher" && request.method === "POST") {
      return NextResponse.next();
    }
    if (pathname === "/api/voucher/contagem") {
      return NextResponse.next();
    }

    if (!autorizado) {
      return NextResponse.json(
        { error: "Não autorizado. Faça login no painel." },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  if (
    pathname === "/caixa-prestigio-7918" ||
    pathname.startsWith("/caixa-prestigio-7918/")
  ) {
    if (!autorizado) {
      const url = request.nextUrl.clone();
      url.pathname = "/painel-login";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/caixa-prestigio-7918",
    "/caixa-prestigio-7918/:path*",
    "/api/voucher",
    "/api/voucher/:path*",
  ],
};
