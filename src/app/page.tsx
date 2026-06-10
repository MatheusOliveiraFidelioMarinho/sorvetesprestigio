"use client";

import { useState, useEffect, useRef } from "react";
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
  Clock,
  Loader2
} from "lucide-react";
import confetti from "canvas-confetti";

export default function Home() {
  // Configurações e estados
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [voucherCode, setVoucherCode] = useState("");
  
  // Dados do Form
  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsApp] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [concordaPromocoes, setConcordaPromocoes] = useState(false);
  const [errors, setErrors] = useState<{ nome?: string; whatsapp?: string; concorda?: string }>({});
  const [origem, setOrigem] = useState("Direto/Orgânico");

  const formRef = useRef<HTMLDivElement>(null);

  // Detecta a origem pelos parâmetros da URL (UTMs ou ref)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const utmSource = urlParams.get("utm_source");
      const refParam = urlParams.get("ref");

      if (utmSource === "fb_ads" || utmSource === "instagram_ads" || utmSource === "meta_ads" || urlParams.get("fbclid")) {
        setOrigem("Tráfego Pago (Meta/Insta)");
      } else if (refParam === "whatsapp_share") {
        setOrigem("Indicação WhatsApp");
      } else if (utmSource) {
        setOrigem(`Outra Mídia (${utmSource})`);
      }
    }
  }, []);

  // Máscara e formatação do WhatsApp
  const formatWhatsApp = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length <= 2) return cleaned;
    if (cleaned.length <= 7) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`;
  };

  const handleWhatsAppChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatWhatsApp(e.target.value);
    setWhatsApp(formatted);
  };

  // Rolar suavemente para o formulário
  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Validação e Envio
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { nome?: string; whatsapp?: string; concorda?: string } = {};

    if (!nome.trim()) {
      newErrors.nome = "Por favor, digite seu nome completo.";
    }
    
    const cleanWhatsApp = whatsapp.replace(/\D/g, "");
    if (cleanWhatsApp.length < 10) {
      newErrors.whatsapp = "Por favor, digite um número de WhatsApp válido.";
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

    // Gerar código único e aleatório
    const numRandom = Math.floor(10000 + Math.random() * 90000);
    const code = `PRESTIGIO-${numRandom}`;

    try {
      const response = await fetch("/api/voucher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome,
          whatsapp,
          dataNascimento,
          voucherCode: code,
          origem,
        }),
      });

      if (response.ok) {
        setVoucherCode(code);
        setFormSubmitted(true);
        
        // Envia o evento de conversão do Meta Pixel (Lead) de forma segura
        if (typeof window !== "undefined" && (window as any).fbq) {
          (window as any).fbq("track", "Lead");
        }
        
        // Dispara efeito de confetes
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ["#38bdf8", "#0284c7", "#facc15", "#ffffff"]
        });
      } else {
        const errData = await response.json();
        alert(errData.error || "Ocorreu um erro ao gerar seu voucher. Tente novamente.");
      }
    } catch (err) {
      console.error(err);
      alert("Erro de conexão. Verifique sua internet.");
    } finally {
      setLoading(false);
    }
  };

  // Função para simular o download do voucher (print) ou salvar informações
  const handleDownload = () => {
    window.print();
  };

  // Compartilhar no WhatsApp
  const handleShareWhatsApp = () => {
    const currentUrl = typeof window !== "undefined" ? window.location.origin : "";
    const shareLink = `${currentUrl}/?ref=whatsapp_share`;
    const text = `Ganhei um picolé grátis na Sorvetes Prestígio! Garanta o seu também antes que acabe: ${shareLink}`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="w-full flex-grow flex flex-col items-center">
      {/* HEADER / CAPA DO CLIENTE */}
      <header className="w-full bg-white border-b border-brand-light relative z-50 shadow-xs print:hidden">
        {/* Banner/Capa oficial da campanha no topo da página */}
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
            GANHE UM <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-blue to-brand-sky">PICOLÉ GRÁTIS</span>
          </h1>

          <p className="text-lg md:text-xl text-slate-600 font-medium max-w-xl leading-relaxed">
            Cadastre-se gratuitamente e receba seu voucher exclusivo para retirar um picolé promocional na Sorvetes Prestígio.
          </p>

          <div className="w-full flex justify-center pt-4">
            <button
              onClick={scrollToForm}
              className="w-full sm:w-auto px-12 py-6 bg-brand-accent hover:bg-yellow-400 text-brand-dark font-black text-xl rounded-2xl transition duration-300 transform hover:scale-105 active:scale-95 shadow-xl border-4 border-yellow-300 flex items-center justify-center gap-3 cursor-pointer uppercase tracking-wider animate-bounce"
            >
              QUERO MEU VOUCHER
              <ArrowRight className="w-6 h-6 text-brand-dark" />
            </button>
          </div>
        </div>

        {/* Logo oficial pulsando, sem bordas, sombras ou molduras */}
        <div className="relative w-full max-w-[280px] aspect-square flex items-center justify-center">
          <div className="relative w-full h-full transition duration-700 hover:scale-105 animate-pulse">
            <Image
              src="/logo.png"
              alt="Sorvetes Prestígio Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>
      </section>

      {/* SEÇÃO DE ESCASSEZ */}
      <section className="w-full max-w-3xl mx-auto px-4 py-6">
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-3xl p-6 md:p-8 flex items-center gap-6 shadow-sm justify-center">
          <div className="p-4 bg-brand-accent/30 rounded-2xl text-amber-600">
            <AlertTriangle className="w-10 h-10" />
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-xl md:text-2xl font-extrabold text-brand-dark">
              ⚠️ VOUCHERS LIMITADOS
            </h3>
            <p className="text-sm md:text-base text-slate-700 font-semibold">
              Disponibilizamos apenas <span className="font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-md">200 Vouchers promocionais</span> para esta campanha. Quando forem distribuídos, a promoção será encerrada.
            </p>
          </div>
        </div>
      </section>

      {/* SEÇÃO BENEFÍCIOS */}
      <section className="w-full bg-slate-50 py-12 md:py-16">
        <div className="max-w-5xl mx-auto px-4 text-center space-y-10">
          <div className="space-y-2">
            <h2 className="text-3xl md:text-4xl font-extrabold text-brand-dark">
              Por que participar?
            </h2>
            <p className="text-slate-500 text-sm md:text-base max-w-xl mx-auto">
              Retirar o seu picolé gratuito é super simples, rápido e transparente. Veja as vantagens:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { text: "Ganhe um picolé promocional grátis", desc: "Ganhe um picolé participante nas compras acima de R$ 10,00." },
              { text: "Cadastro rápido e gratuito", desc: "Leva menos de 1 minuto e você já garante o seu." },
              { text: "Retirada simples no caixa", desc: "Basta ir à loja, realizar sua compra e apresentar a tela." },
              { text: "Válido em Nossas Unidades", desc: "Unidade 320, Unidade 314, Unidade Santa Maria e Unidade Areal." },
              { text: "Voucher gerado instantaneamente", desc: "Nada de e-mails demorados. Gerou, pegou." },
              { text: "Participação limitada", desc: "Limite de 1 picolé por telefone cadastrado." }
            ].map((beneficio, index) => (
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
        </div>
      </section>

      {/* SEÇÃO DO FORMULÁRIO / TELA DE VOUCHER */}
      <section ref={formRef} className="w-full py-16 md:py-24 px-4 bg-gradient-to-b from-white to-brand-light/30">
        <div className="max-w-xl mx-auto">
          <AnimatePresence mode="wait">
            {!formSubmitted ? (
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
                    Retire seu voucher agora
                  </h2>
                  <p className="text-sm text-slate-500">
                    Preencha os dados abaixo para gerar seu voucher exclusivo.
                  </p>
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
                      className={`w-full px-4 py-3.5 rounded-xl border ${errors.nome ? "border-red-500 focus:ring-red-200" : "border-slate-200 focus:ring-sky-200"} focus:border-brand-sky outline-hidden focus:ring-4 transition`}
                    />
                    {errors.nome && <p className="text-xs text-red-500 font-semibold">{errors.nome}</p>}
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
                      className={`w-full px-4 py-3.5 rounded-xl border ${errors.whatsapp ? "border-red-500 focus:ring-red-200" : "border-slate-200 focus:ring-sky-200"} focus:border-brand-sky outline-hidden focus:ring-4 transition`}
                    />
                    {errors.whatsapp && <p className="text-xs text-red-500 font-semibold">{errors.whatsapp}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-brand-blue" />
                      Data de Nascimento <span className="text-xs text-slate-400 font-normal">(Opcional)</span>
                    </label>
                    <input
                      type="date"
                      value={dataNascimento}
                      onChange={(e) => setDataNascimento(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:ring-4 focus:ring-sky-200 focus:border-brand-sky outline-hidden transition text-slate-600"
                    />
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
                    {errors.concorda && <p className="text-xs text-red-500 font-semibold">{errors.concorda}</p>}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="pulse-soft w-full py-4.5 bg-brand-accent hover:bg-yellow-400 text-brand-dark font-black text-lg rounded-2xl transition duration-300 cursor-pointer shadow-md flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        GERANDO VOUCHER...
                      </>
                    ) : (
                      "GERAR MEU VOUCHER"
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
                  <p className="text-slate-600 font-medium">Seu voucher foi gerado com sucesso.</p>
                </div>

                {/* VOUCHER CARD */}
                <div className="bg-brand-light/40 border-2 border-dashed border-brand-blue rounded-2xl p-6 relative overflow-hidden">
                  <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full border-r border-brand-blue print:hidden"></div>
                  <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full border-l border-brand-blue print:hidden"></div>
                  
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">CÓDIGO EXCLUSIVO</p>
                  <p className="text-2xl md:text-3xl font-mono font-black text-brand-dark bg-white py-3 px-4 rounded-xl border border-brand-light shadow-xs inline-block tracking-wider">
                    {voucherCode}
                  </p>

                  <div className="mt-4 flex items-center justify-center gap-2 text-xs text-brand-blue font-bold">
                    <QrCode className="w-4 h-4" />
                    APRESENTE NO CAIXA DA LOJA
                  </div>
                </div>

                {/* INSTRUÇÕES */}
                <div className="text-left bg-slate-50 rounded-2xl p-6 border border-slate-100 space-y-3">
                  <div className="bg-yellow-50 border border-yellow-200 text-brand-dark p-3.5 rounded-xl font-bold text-xs flex items-center gap-2 mb-2">
                    <span>⏰</span>
                    <span>Apresente seu cupom no caixa em até 7 dias para retirar seu Picolé!</span>
                  </div>
                  <h4 className="font-black text-brand-dark text-sm uppercase tracking-wider">Instruções de Resgate:</h4>
                  <ol className="list-decimal list-inside text-sm text-slate-600 space-y-2.5 font-medium">
                    <li><span className="font-bold text-brand-dark">Tire um print</span> desta tela do voucher.</li>
                    <li>Consuma <span className="font-bold text-brand-dark">acima de R$ 10,00</span> na loja.</li>
                    <li><span className="font-bold text-brand-dark">Apresente o voucher</span> no caixa da Sorvetes Prestígio.</li>
                    <li><span className="font-bold text-brand-dark">Informe o telefone</span> cadastrado para validação.</li>
                    <li><span className="font-bold text-brand-dark">Receba seu benefício</span> promocional grátis!</li>
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
                  Campanha exclusiva Sorvetes Prestígio - Santa Maria, DF.
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
            <li>Válido exclusivamente para a retirada de 1 (um) picolé por número de telefone / CPF cadastrado.</li>
            <li>A verificação no caixa será realizada mediante apresentação de documento oficial com foto ou WhatsApp aberto que comprove o número registrado no cadastro.</li>
            <li>O voucher gerado possui validade de 7 (sete) dias corridos a partir da data de cadastro.</li>
            <li>Necessário apresentar o voucher gerado no momento do atendimento.</li>
            <li>Válido exclusivamente mediante compra acima de R$ 10,00 na loja.</li>
            <li>Promoção sujeita à disponibilidade de estoque dos picolés participantes.</li>
            <li>Não cumulativo com outras promoções e discounts vigentes na loja.</li>
            <li>A empresa poderá encerrar a campanha ao atingir o limite estipulado de vouchers sem aviso prévio.</li>
          </ul>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="w-full bg-white border-t border-brand-light py-8 px-4 text-center space-y-4">
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
