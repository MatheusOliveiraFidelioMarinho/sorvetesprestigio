"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Lock, Loader2 } from "lucide-react";

export default function PainelLoginPage() {
  const router = useRouter();
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senha) {
      setErro("Digite a senha do painel.");
      return;
    }

    setErro("");
    setLoading(true);

    try {
      const res = await fetch("/api/painel-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senha }),
      });

      if (res.ok) {
        router.replace("/caixa-prestigio-7918");
        router.refresh();
        return;
      }

      const data = await res.json().catch(() => ({}));
      setErro(data.error || "Senha incorreta");
    } catch {
      setErro("Erro de conexão. Verifique sua internet.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-white px-4 py-12">
      <div className="w-full max-w-sm bg-white rounded-3xl p-8 border border-brand-light shadow-xl space-y-6">
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="relative w-36 h-12">
            <Image src="/logo.png" alt="Sorvetes Prestígio" fill className="object-contain" />
          </div>
          <div className="w-11 h-11 rounded-full bg-brand-light text-brand-blue flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-extrabold text-brand-dark">Painel do Caixa</h1>
            <p className="text-sm text-slate-500">Acesso restrito à equipe da loja.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700">Senha</label>
            <input
              type="password"
              autoFocus
              autoComplete="current-password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Digite a senha"
              className={`w-full px-4 py-3.5 rounded-xl border ${
                erro ? "border-red-500 focus:ring-red-200" : "border-slate-200 focus:ring-sky-200"
              } focus:border-brand-sky outline-hidden focus:ring-4 transition`}
            />
            {erro && <p className="text-xs text-red-500 font-semibold">{erro}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-brand-accent hover:bg-yellow-400 text-brand-dark font-black text-base rounded-2xl transition duration-300 cursor-pointer shadow-md flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                ENTRANDO...
              </>
            ) : (
              "ENTRAR"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
