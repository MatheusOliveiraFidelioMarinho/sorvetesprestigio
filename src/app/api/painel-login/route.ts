import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  PAINEL_COOKIE,
  PAINEL_COOKIE_MAX_AGE,
  comparaSegura,
  senhaDoPainel,
  tokenDoPainel,
} from "@/lib/auth";

export async function POST(request: Request) {
  let senhaEnviada: unknown;

  try {
    const body = await request.json();
    senhaEnviada = body?.senha;
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const senhaEsperada = senhaDoPainel();

  if (!senhaEsperada) {
    console.error("PAINEL_SENHA não configurada — login do painel indisponível.");
    return NextResponse.json(
      { error: "Painel indisponível no momento." },
      { status: 503 }
    );
  }

  if (typeof senhaEnviada !== "string" || !comparaSegura(senhaEnviada, senhaEsperada)) {
    // Mensagem genérica de propósito: não revela se a senha existe, o tamanho, nada.
    return NextResponse.json({ error: "Senha incorreta" }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set({
    name: PAINEL_COOKIE,
    value: tokenDoPainel(senhaEsperada),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: PAINEL_COOKIE_MAX_AGE,
  });

  return NextResponse.json({ success: true });
}

/** Logout: derruba o cookie. */
export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.set({
    name: PAINEL_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return NextResponse.json({ success: true });
}
