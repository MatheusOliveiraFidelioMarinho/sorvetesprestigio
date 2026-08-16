"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Calendar,
  Phone,
  User,
  ArrowRight,
  QrCode,
  Download,
  Share2,
  FileText,
  Loader2,
} from "lucide-react";
import confetti from "canvas-confetti";
import { formataExpiracao, getCampanha } from "@/lib/campanhas";

/** Um item da lista de instruções de resgate, com um trecho em destaque. */
export type Instrucao = {
  antes?: string;
  destaque: string;
  depois?: string;
};

export type Beneficio = {
  text: string;
  desc: string;
};

export type LandingConfig = {
  /** Id da campanha, gravado no banco. */
  campanha: string;
  /** Se definida, a unidade fica travada e o dropdown some. */
  unidadeFixa?: string;

  tituloPrefixo: string;
  tituloDestaque: string;
  subtitulo: string;

  ctaHero: string;
  ctaFormulario: string;
  ctaCarregando: string;

  tituloBeneficios: string;
  subtituloBeneficios: string;
  beneficios: Beneficio[];

  tituloFormulario: string;
  subtituloFormulario: string;
  labelUnidade: string;
  erroUnidade: string;

  instrucoes: Instrucao[];
  regulamento: string[];

  textoCompartilhar: string;
  rodapeVoucher: string;
};

type Contagem = {
  emitidos: number;
  limite: number | null;
  restantes: number | null;
  encerrada: boolean;
};

type Atribuicao = {
  utmSource?: string;
  utmCampaign?: string;
  utmContent?: string;
  ref?: string;
  fbclid?: string;
};

const STORAGE_ATRIBUICAO = "prestigio_atribuicao";

/** O Meta Pixel injeta `fbq` no window; o layout raiz carrega o script. */
type JanelaComPixel = Window & {
  fbq?: (evento: string, nome: string, parametros?: Record<string, string>) => void;
};

/** Mantém a classificação de origem que o painel já usa — não mexer. */
function classificaOrigem(atribuicao: Atribuicao): string {
  const { utmSource, ref, fbclid } = atribuicao;

  if (
    utmSource === "fb_ads" ||
    utmSource === "instagram_ads" ||
    utmSource === "meta_ads" ||
    fbclid
  ) {
    return "Tráfego Pago (Meta/Insta)";
  }
  if (ref === "whatsapp_share") return "Indicação WhatsApp";
  if (utmSource) return `Outra Mídia (${utmSource})`;
  return "Direto/Orgânico";
}

function limpaVazios(atribuicao: Atribuicao): Atribuicao {
  const saida: Atribuicao = {};
  (Object.keys(atribuicao) as (keyof Atribuicao)[]).forEach((chave) => {
    const valor = atribuicao[chave];
    if (valor) saida[chave] = valor;
  });
  return saida;
}

/** Lê os parâmetros de atribuição da URL atual. */
function atribuicaoDaUrl(): Atribuicao {
  const p = new URLSearchParams(window.location.search);
  return limpaVazios({
    utmSource: p.get("utm_source") ?? undefined,
    utmCampaign: p.get("utm_campaign") ?? undefined,
    utmContent: p.get("utm_content") ?? undefined,
    ref: p.get("ref") ?? undefined,
    fbclid: p.get("fbclid") ?? undefined,
  });
}

/**
 * Atribuição efetiva do cadastro: URL primeiro, sessionStorage como reserva.
 *
 * Se a pessoa navegar dentro do site ou recarregar, os parâmetros somem da URL
 * — sem a reserva o cadastro perderia a atribuição e ninguém saberia qual
 * anúncio trouxe o cliente.
 */
function leAtribuicao(): Atribuicao {
  if (typeof window === "undefined") return {};

  const daUrl = atribuicaoDaUrl();
  if (Object.keys(daUrl).length > 0) return daUrl;

  try {
    const salvo = window.sessionStorage.getItem(STORAGE_ATRIBUICAO);
    if (salvo) return limpaVazios(JSON.parse(salvo) as Atribuicao);
  } catch {
    // storage indisponível ou corrompido — segue como Direto/Orgânico
  }
  return {};
}

/** Unidade derivada do parâmetro ?unidade= / ?unit= da URL, se houver. */
function unidadeDaUrl(): string | null {
  const p = new URLSearchParams(window.location.search);
  const unitParam = p.get("unidade") || p.get("unit");
  if (!unitParam) return null;

  const limpo = unitParam.toLowerCase().trim();
  if (limpo === "320" || limpo === "314" || limpo.includes("samambaia")) {
    return "Unidade Samambaia";
  }
  if (limpo.includes("santa") || limpo.includes("maria")) return "Unidade Santa Maria";
  if (limpo.includes("areal")) return "Unidade Areal";
  return null;
}

export default function LandingVoucher({ config }: { config: LandingConfig }) {
  const campanhaConfig = getCampanha(config.campanha);

  const [formSubmitted, setFormSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [voucherCode, setVoucherCode] = useState("");
  const [expiraEm, setExpiraEm] = useState("");

  // Dados do Form
  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsApp] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [unidade, setUnidade] = useState(config.unidadeFixa ?? "");
  const [concordaPromocoes, setConcordaPromocoes] = useState(false);
  const [errors, setErrors] = useState<{
    nome?: string;
    whatsapp?: string;
    concorda?: string;
    unidade?: string;
  }>({});

  const [contagem, setContagem] = useState<Contagem | null>(null);

  const formRef = useRef<HTMLDivElement>(null);

  // Assim que a página carrega com UTMs na URL, guarda a atribuição na sessão.
  // A leitura acontece só na hora do envio (leAtribuicao), por isso aqui não há
  // estado nenhum a atualizar.
  useEffect(() => {
    const daUrl = atribuicaoDaUrl();
    if (Object.keys(daUrl).length === 0) return;
    try {
      window.sessionStorage.setItem(STORAGE_ATRIBUICAO, JSON.stringify(daUrl));
    } catch {
      // sessionStorage indisponível (navegação privada em alguns browsers)
    }
  }, []);

  // Unidade pela URL só vale quando a rota não trava a unidade.
  useEffect(() => {
    if (config.unidadeFixa) return;
    const daUrl = unidadeDaUrl();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- a URL só existe no cliente
    if (daUrl) setUnidade(daUrl);
  }, [config.unidadeFixa]);

  // Contador de escassez real (só para campanhas com limite definido).
  const carregaContagem = useCallback(async () => {
    if (campanhaConfig.limite === null) return;
    try {
      const res = await fetch(
        `/api/voucher/contagem?campanha=${encodeURIComponent(config.campanha)}`
      );
      if (res.ok) setContagem(await res.json());
    } catch {
      // Sem contagem a seção de escassez simplesmente não aparece.
    }
  }, [campanhaConfig.limite, config.campanha]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- o setContagem roda depois do await, não é cascata síncrona
    carregaContagem();
  }, [carregaContagem]);

  const formatWhatsApp = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length <= 2) return cleaned;
    if (cleaned.length <= 7) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`;
  };

  const handleWhatsAppChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWhatsApp(formatWhatsApp(e.target.value));
  };

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: typeof errors = {};

    if (!nome.trim()) {
      newErrors.nome = "Por favor, digite seu nome completo.";
    }

    const cleanWhatsApp = whatsapp.replace(/\D/g, "");
    if (cleanWhatsApp.length < 10) {
      newErrors.whatsapp = "Por favor, digite um número de WhatsApp válido.";
    }

    if (!unidade) {
      newErrors.unidade = config.erroUnidade;
    }

    if (!concordaPromocoes) {
      newErrors.concorda = "Você precisa concordar para receber seu voucher.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    // URL primeiro, sessionStorage como reserva.
    const atribuicao = leAtribuicao();

    try {
      // O código do voucher e a validade são gerados NO SERVIDOR.
      const response = await fetch("/api/voucher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome,
          whatsapp,
          dataNascimento,
          origem: classificaOrigem(atribuicao),
          unidade,
          campanha: config.campanha,
          utmCampaign: atribuicao.utmCampaign,
          utmContent: atribuicao.utmContent,
          utmSource: atribuicao.utmSource,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok && data?.lead?.voucherCode) {
        setVoucherCode(data.lead.voucherCode);
        setExpiraEm(data.lead.expiraEm || "");
        setFormSubmitted(true);
        carregaContagem();

        // Separa as campanhas no Meta.
        if (typeof window !== "undefined") {
          const janela = window as unknown as JanelaComPixel;
          janela.fbq?.("track", "Lead", {
            content_name: campanhaConfig.oferta,
            content_category: config.campanha,
          });
        }

        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ["#38bdf8", "#0284c7", "#facc15", "#ffffff"],
        });
      } else {
        if (response.status === 409) carregaContagem();
        alert(data?.error || "Ocorreu um erro ao gerar seu voucher. Tente novamente.");
      }
    } catch (err) {
      console.error(err);
      alert("Erro de conexão. Verifique sua internet.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const path = typeof window !== "undefined" ? window.location.pathname : "/";
    const shareLink = `${origin}${path}?ref=whatsapp_share`;
    const text = `${config.textoCompartilhar} ${shareLink}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  };

  const campanhaEncerrada = contagem?.encerrada === true;
  const validadeCurta = campanhaConfig.validadeTextoCurto;
  const expiraFormatado = expiraEm ? formataExpiracao(expiraEm) : "";

  return (
    <div className="w-full flex-grow flex flex-col items-center">
      {/* HEADER / CAPA DO CLIENTE */}
      <header className="w-full bg-white border-b border-brand-light relative z-50 shadow-xs print:hidden">
        <div className="relative w-full h-[150px] sm:h-[220px] md:h-[280px]">
          <Image
            src="/capa.png"
            alt="Campanha Sorvetes Prestígio Banner"
            fill
            className="object-cover"
            priority
          />
        </div>
      </header>

      {/* SEÇÃO HERO */}
      <section className="w-full max-w-5xl mx-auto px-4 py-8 md:py-16 flex flex-col items-center justify-center text-center gap-8">
        <div className="flex flex-col items-center space-y-6 max-w-3xl">
          <h1 className="text-4xl md:text-6xl font-black text-brand-dark leading-tight">
            {config.tituloPrefixo}{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-blue to-brand-sky">
              {config.tituloDestaque}
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-600 font-medium max-w-xl leading-relaxed">
            {config.subtitulo}
          </p>

          <div className="w-full flex justify-center pt-4">
            <button
              onClick={scrollToForm}
              className="w-full sm:w-auto px-12 py-6 bg-brand-accent hover:bg-yellow-400 text-brand-dark font-black text-xl rounded-2xl transition duration-300 transform hover:scale-105 active:scale-95 shadow-xl border-4 border-yellow-300 flex items-center justify-center gap-3 cursor-pointer uppercase tracking-wider animate-bounce"
            >
              {config.ctaHero}
              <ArrowRight className="w-6 h-6 text-brand-dark" />
            </button>
          </div>
        </div>

      </section>

      {/* SEÇÃO DE ESCASSEZ — número real, vindo do banco. Sem limite definido,
          a escassez vira a validade do voucher (verdadeira e verificável). */}
      <section className="w-full max-w-3xl mx-auto px-4 py-6">
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-3xl p-6 md:p-8 flex items-center gap-6 shadow-sm justify-center">
          <div className="p-4 bg-brand-accent/30 rounded-2xl text-amber-600">
            <AlertTriangle className="w-10 h-10" />
          </div>
          <div className="text-center space-y-2">
            {contagem && contagem.limite !== null ? (
              <>
                <h3 className="text-xl md:text-2xl font-extrabold text-brand-dark">
                  {contagem.encerrada ? "⚠️ VOUCHERS ESGOTADOS" : "⚠️ VOUCHERS LIMITADOS"}
                </h3>
                <p className="text-sm md:text-base text-slate-700 font-semibold">
                  {contagem.encerrada ? (
                    <>
                      Todos os{" "}
                      <span className="font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-md">
                        {contagem.limite} vouchers
                      </span>{" "}
                      desta campanha já foram distribuídos.
                    </>
                  ) : (
                    <>
                      Restam{" "}
                      <span className="font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-md">
                        {contagem.restantes} de {contagem.limite} vouchers
                      </span>{" "}
                      desta campanha. Quando acabarem, a promoção será encerrada.
                    </>
                  )}
                </p>
              </>
            ) : (
              <>
                <h3 className="text-xl md:text-2xl font-extrabold text-brand-dark">
                  ⚠️ PROMOÇÃO POR TEMPO LIMITADO
                </h3>
                <p className="text-sm md:text-base text-slate-700 font-semibold">
                  Seu voucher vale por{" "}
                  <span className="font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-md">
                    {validadeCurta}
                  </span>{" "}
                  após o cadastro. Depois disso ele expira automaticamente.
                </p>
              </>
            )}
          </div>
        </div>
      </section>

      {/* SEÇÃO DO FORMULÁRIO / TELA DE VOUCHER
          Fica logo abaixo do herói de propósito: com os benefícios na frente, o
          formulário começava a 2.170px de uma página de 3.418px — cerca de três
          telas de rolagem no celular antes de existir qualquer campo. Os
          benefícios agora vêm depois, como reforço para quem não converteu. */}
      <section
        ref={formRef}
        className="w-full pt-6 pb-16 md:pt-10 md:pb-24 px-4 bg-gradient-to-b from-white to-brand-light/30"
      >
        <div className="max-w-xl mx-auto">
          <AnimatePresence mode="wait">
            {campanhaEncerrada && !formSubmitted ? (
              <motion.div
                key="campanha-encerrada"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="bg-white rounded-3xl p-8 md:p-10 border border-amber-200 shadow-xl text-center space-y-4"
              >
                <div className="mx-auto w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                  <AlertTriangle className="w-9 h-9" />
                </div>
                <h2 className="text-2xl md:text-3xl font-extrabold text-brand-dark">
                  Campanha encerrada
                </h2>
                <p className="text-sm text-slate-500">
                  Todos os vouchers desta campanha já foram distribuídos. Siga a Sorvetes
                  Prestígio no Instagram para não perder a próxima.
                </p>
                <a
                  href="https://www.instagram.com/sorvetes_prestigiofc/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 hover:opacity-95 text-white font-bold rounded-xl transition duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <span className="text-lg">📸</span>
                  SEGUIR NO INSTAGRAM
                </a>
              </motion.div>
            ) : !formSubmitted ? (
              <motion.div
                key="register-form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="bg-white rounded-3xl p-8 md:p-10 border border-brand-light shadow-xl space-y-6"
              >
                <div className="text-center space-y-2">
                  <h2 className="text-2xl md:text-3xl font-extrabold text-brand-dark">
                    {config.tituloFormulario}
                  </h2>
                  <p className="text-sm text-slate-500">{config.subtituloFormulario}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                      <User className="w-4 h-4 text-brand-blue" />
                      Nome Completo *
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: João da Silva"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      className={`w-full px-4 py-3.5 rounded-xl border ${
                        errors.nome
                          ? "border-red-500 focus:ring-red-200"
                          : "border-slate-200 focus:ring-sky-200"
                      } focus:border-brand-sky outline-hidden focus:ring-4 transition`}
                    />
                    {errors.nome && (
                      <p className="text-xs text-red-500 font-semibold">{errors.nome}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                      <Phone className="w-4 h-4 text-brand-blue" />
                      WhatsApp *
                    </label>
                    <input
                      type="tel"
                      placeholder="Ex: (61) 99999-9999"
                      value={whatsapp}
                      onChange={handleWhatsAppChange}
                      className={`w-full px-4 py-3.5 rounded-xl border ${
                        errors.whatsapp
                          ? "border-red-500 focus:ring-red-200"
                          : "border-slate-200 focus:ring-sky-200"
                      } focus:border-brand-sky outline-hidden focus:ring-4 transition`}
                    />
                    {errors.whatsapp && (
                      <p className="text-xs text-red-500 font-semibold">{errors.whatsapp}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-brand-blue" />
                      Data de Nascimento{" "}
                      <span className="text-xs text-slate-400 font-normal">(Opcional)</span>
                    </label>
                    <input
                      type="date"
                      value={dataNascimento}
                      onChange={(e) => setDataNascimento(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:ring-4 focus:ring-sky-200 focus:border-brand-sky outline-hidden transition text-slate-600"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-brand-blue" />
                      {config.labelUnidade}
                    </label>

                    {config.unidadeFixa ? (
                      // Unidade travada: bloco estático, no mesmo estilo visual do
                      // campo. A pessoa vê onde retira, mas não consegue trocar.
                      <div className="w-full px-4 py-3.5 rounded-xl border border-brand-sky/40 bg-brand-light/40 text-brand-dark font-bold flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-brand-blue shrink-0" />
                        Retirada: {config.unidadeFixa}
                      </div>
                    ) : (
                      <>
                        <select
                          value={unidade}
                          onChange={(e) => setUnidade(e.target.value)}
                          className={`w-full px-4 py-3.5 rounded-xl border ${
                            errors.unidade
                              ? "border-red-500 focus:ring-red-200"
                              : "border-slate-200 focus:ring-sky-200"
                          } focus:border-brand-sky outline-hidden focus:ring-4 transition text-slate-600 bg-white`}
                        >
                          <option value="">Selecione uma unidade...</option>
                          <option value="Unidade Samambaia">
                            Unidade Samambaia (QN 320 / QR 314)
                          </option>
                          <option value="Unidade Santa Maria">
                            Unidade Santa Maria (Santa Maria)
                          </option>
                          <option value="Unidade Areal">Unidade Areal (Areal)</option>
                        </select>
                        {errors.unidade && (
                          <p className="text-xs text-red-500 font-semibold">{errors.unidade}</p>
                        )}
                      </>
                    )}
                  </div>

                  <div className="space-y-3 pt-2">
                    <label className="flex items-start gap-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={concordaPromocoes}
                        onChange={(e) => setConcordaPromocoes(e.target.checked)}
                        className="mt-1 w-5 h-5 rounded-sm border-slate-300 text-brand-blue focus:ring-brand-sky focus:ring-offset-0 focus:ring-2 cursor-pointer"
                      />
                      <span className="text-sm text-slate-600 font-medium leading-relaxed">
                        Concordo em receber novidades e promoções da Sorvetes Prestígio. *
                      </span>
                    </label>
                    {errors.concorda && (
                      <p className="text-xs text-red-500 font-semibold">{errors.concorda}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="pulse-soft w-full py-4.5 bg-brand-accent hover:bg-yellow-400 text-brand-dark font-black text-lg rounded-2xl transition duration-300 cursor-pointer shadow-md flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {config.ctaCarregando}
                      </>
                    ) : (
                      config.ctaFormulario
                    )}
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="voucher-success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, type: "spring" }}
                className="bg-white rounded-3xl p-8 md:p-10 border-4 border-brand-sky shadow-2xl text-center space-y-6 print:border-0 print:shadow-none"
              >
                <div className="space-y-1">
                  <div className="mx-auto w-16 h-16 rounded-full bg-brand-light text-brand-blue flex items-center justify-center mb-3">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h2 className="text-3xl font-black text-brand-dark">🎉 Parabéns!</h2>
                  <p className="text-slate-600 font-medium">
                    Seu voucher foi gerado com sucesso.
                  </p>
                </div>

                {/* VOUCHER CARD */}
                <div className="bg-brand-light/40 border-2 border-dashed border-brand-blue rounded-2xl p-6 relative overflow-hidden">
                  <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full border-r border-brand-blue print:hidden"></div>
                  <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full border-l border-brand-blue print:hidden"></div>

                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">
                    CÓDIGO EXCLUSIVO
                  </p>
                  <p className="text-2xl md:text-3xl font-mono font-black text-brand-dark bg-white py-3 px-4 rounded-xl border border-brand-light shadow-xs inline-block tracking-wider">
                    {voucherCode}
                  </p>

                  <div className="mt-4 flex flex-col items-center justify-center gap-1.5 text-xs text-brand-blue font-bold">
                    <div className="flex items-center gap-2">
                      <QrCode className="w-4 h-4" />
                      APRESENTE NO CAIXA DA LOJA
                    </div>
                    {unidade && (
                      <div className="mt-2 bg-brand-blue text-white px-3.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase">
                        Retirada: {unidade}
                      </div>
                    )}
                  </div>
                </div>

                {/* INSTRUÇÕES */}
                <div className="text-left bg-slate-50 rounded-2xl p-6 border border-slate-100 space-y-3">
                  <div className="bg-yellow-50 border border-yellow-200 text-brand-dark p-3.5 rounded-xl font-bold text-xs flex items-center gap-2 mb-2">
                    <span>⏰</span>
                    <span>
                      {expiraFormatado
                        ? `Válido até ${expiraFormatado}. Apresente no caixa antes disso!`
                        : `Apresente seu cupom no caixa em até ${validadeCurta}!`}
                    </span>
                  </div>
                  <h4 className="font-black text-brand-dark text-sm uppercase tracking-wider">
                    Instruções de Resgate:
                  </h4>
                  <ol className="list-decimal list-inside text-sm text-slate-600 space-y-2.5 font-medium">
                    {config.instrucoes.map((instrucao, index) => (
                      <li key={index}>
                        {instrucao.antes ? `${instrucao.antes} ` : ""}
                        <span className="font-bold text-brand-dark">{instrucao.destaque}</span>
                        {instrucao.depois ? ` ${instrucao.depois}` : ""}
                      </li>
                    ))}
                  </ol>
                </div>

                {/* BOTÕES DE AÇÃO */}
                <div className="flex flex-col gap-3 pt-2 print:hidden">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handleDownload}
                      className="flex-1 py-4 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                    >
                      <Download className="w-5 h-5" />
                      BAIXAR VOUCHER
                    </button>
                    <button
                      onClick={handleShareWhatsApp}
                      className="flex-1 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                    >
                      <Share2 className="w-5 h-5" />
                      COMPARTILHAR NO WHATSAPP
                    </button>
                  </div>

                  <a
                    href="https://www.instagram.com/sorvetes_prestigiofc/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 hover:opacity-95 text-white font-bold rounded-xl transition duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    <span className="text-lg">📸</span>
                    SEGUIR NO INSTAGRAM
                  </a>
                </div>

                <div className="pt-2 text-xs text-slate-400 font-medium">
                  {config.rodapeVoucher}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* SEÇÃO BENEFÍCIOS — reforço para quem rolou sem preencher. O botão do
          fim traz a pessoa de volta ao formulário sem precisar rolar de volta. */}
      <section className="w-full bg-slate-50 py-12 md:py-16">
        <div className="max-w-5xl mx-auto px-4 text-center space-y-10">
          <div className="space-y-2">
            <h2 className="text-3xl md:text-4xl font-extrabold text-brand-dark">
              {config.tituloBeneficios}
            </h2>
            <p className="text-slate-500 text-sm md:text-base max-w-xl mx-auto">
              {config.subtituloBeneficios}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {config.beneficios.map((beneficio, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-2xl shadow-xs border border-slate-100 flex flex-col items-center md:items-start text-center md:text-left space-y-3 hover:-translate-y-1 transition duration-300"
              >
                <div className="w-10 h-10 rounded-full bg-brand-light flex items-center justify-center text-brand-blue">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-brand-dark text-base">{beneficio.text}</h4>
                <p className="text-sm text-slate-500">{beneficio.desc}</p>
              </div>
            ))}
          </div>

          {!formSubmitted && !campanhaEncerrada && (
            <div className="flex justify-center pt-2 print:hidden">
              <button
                onClick={scrollToForm}
                className="w-full sm:w-auto px-12 py-5 bg-brand-accent hover:bg-yellow-400 text-brand-dark font-black text-lg rounded-2xl transition duration-300 transform hover:scale-105 active:scale-95 shadow-xl border-4 border-yellow-300 flex items-center justify-center gap-3 cursor-pointer uppercase tracking-wider"
              >
                {config.ctaHero}
                <ArrowRight className="w-5 h-5 text-brand-dark" />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* SEÇÃO REGULAMENTO */}
      <section className="w-full bg-slate-50 py-12 px-4 border-t border-slate-200">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-2 text-brand-dark font-extrabold text-lg">
            <FileText className="w-5 h-5 text-brand-blue" />
            <h3>Regulamento da Promoção</h3>
          </div>

          <ul className="text-sm text-slate-600 space-y-3 list-disc list-inside font-medium leading-relaxed">
            {config.regulamento.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="w-full bg-white border-t border-brand-light py-8 px-4 text-center space-y-4">
        {/* A marca saiu do herói para o formulário subir; fecha aqui embaixo. */}
        <div className="relative w-full max-w-[150px] aspect-square mx-auto">
          <Image
            src="/logo.png"
            alt="Sorvetes Prestígio Logo"
            fill
            className="object-contain"
          />
        </div>
        <p className="text-xs text-slate-500 font-medium">
          © {new Date().getFullYear()} Sorvetes Prestígio. Todos os direitos reservados.
        </p>
        <a
          href="https://maps.app.goo.gl/xPfad5z4Mr2QsMG97"
          target="_blank"
          rel="noopener noreferrer"
          className="flex justify-center items-center gap-2 text-xs text-brand-blue hover:text-brand-dark transition font-semibold"
        >
          <MapPin className="w-4 h-4" />
          <span>Santa Maria - DF</span>
        </a>
      </footer>
    </div>
  );
}
