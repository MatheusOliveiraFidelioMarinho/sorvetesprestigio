"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Search,
  CheckCircle,
  XCircle,
  RefreshCw,
  Download,
  ArrowLeft,
  Calendar,
  Phone,
  Ticket,
  Trash2,
  TrendingUp,
  Award,
  MapPin,
  Clock,
  Megaphone,
  LogOut,
} from "lucide-react";
import Link from "next/link";

// Registro e imports do Chart.js
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import type { ChartOptions, TooltipItem } from "chart.js";
import { Doughnut, Bar } from "react-chartjs-2";
import { CAMPANHA_PADRAO, rotuloCampanha } from "@/lib/campanhas";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface Lead {
  id: string;
  nome: string;
  whatsapp: string;
  dataNascimento?: string;
  voucherCode: string;
  timestamp: string;
  status: "Não Utilizado" | "Utilizado";
  origem?: string;
  unidade?: string;
  campanha?: string;
  oferta?: string;
  utmCampaign?: string;
  utmContent?: string;
  expiraEm?: string;
}

/** Aba de visualização. "Expirado" é derivado na tela, NÃO existe no banco. */
type AbaStatus = "Não Utilizado" | "Utilizado" | "Expirado";

/** Mínimo de cadastros para um criativo entrar no gráfico de taxa de resgate. */
const AMOSTRA_MINIMA_CRIATIVO = 5;

const formataData = (iso?: string) => (iso ? new Date(iso).toLocaleString("pt-BR") : "—");

/** Escapa um valor para célula de CSV. */
const csvCell = (valor: unknown) => `"${String(valor ?? "").replace(/"/g, '""')}"`;

const baixarCSV = (linhas: string[], nomeArquivo: string) => {
  // BOM na frente para o Excel em pt-BR não quebrar os acentos.
  const blob = new Blob(["﻿" + linhas.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", nomeArquivo);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const normalizaUnidade = (unidade?: string) =>
  unidade === "Unidade 320" || unidade === "Unidade 314" || unidade === "Unidade Samambaia"
    ? "Unidade Samambaia"
    : unidade || "Unidade Santa Maria";

/**
 * "Expirado" NÃO é um terceiro valor no banco — é derivado aqui. Um voucher
 * vencido continuava aparecendo como "Não Utilizado", o que distorcia a
 * leitura da taxa real de resgate.
 */
const estaExpirado = (lead: Lead) =>
  lead.status === "Não Utilizado" &&
  !!lead.expiraEm &&
  new Date(lead.expiraEm).getTime() < Date.now();

/** Registros antigos não têm campanha preenchida em memória — caem no padrão. */
const campanhaDoLead = (lead: Lead) => lead.campanha || CAMPANHA_PADRAO;

export default function AdminPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<AbaStatus>("Não Utilizado");
  const [activeSubTab, setActiveSubTab] = useState<
    "todos" | "Unidade Samambaia" | "Unidade Santa Maria" | "Unidade Areal"
  >("todos");
  const [campanhaFiltro, setCampanhaFiltro] = useState<string>("todas");
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Controle de segurança da exclusão
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [downloadDone, setDownloadDone] = useState(false);
  const [deleteInputCode, setDeleteInputCode] = useState("");

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/voucher");
      if (res.status === 401) {
        router.replace("/painel-login");
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads || []);
      }
    } catch (err) {
      console.error("Erro ao carregar leads:", err);
    } finally {
      setLoading(false);
    }
  };

  // Carga inicial, uma única vez.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- o setLeads roda depois do await
    fetchLeads();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchLeads é recriada a cada render; incluí-la refetcharia em loop
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/painel-login", { method: "DELETE" });
    } catch {
      // mesmo com falha de rede, manda para a tela de login
    }
    router.replace("/painel-login");
    router.refresh();
  };

  const handleToggleStatus = async (
    voucherCode: string,
    currentStatus: "Não Utilizado" | "Utilizado"
  ) => {
    setUpdatingId(voucherCode);
    const newStatus = currentStatus === "Não Utilizado" ? "Utilizado" : "Não Utilizado";

    try {
      const res = await fetch("/api/voucher", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voucherCode, status: newStatus }),
      });

      if (res.ok) {
        setLeads((prev) =>
          prev.map((lead) =>
            lead.voucherCode === voucherCode ? { ...lead, status: newStatus } : lead
          )
        );
      }
    } catch (err) {
      console.error("Erro ao atualizar status:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  // =========================================================================
  // DERIVAÇÕES
  // =========================================================================

  // Lista de campanhas derivada dos próprios dados — nunca fixa no código,
  // para não precisar mexer aqui na próxima campanha.
  const campanhasDisponiveis = useMemo(() => {
    const set = new Set(leads.map(campanhaDoLead));
    return Array.from(set).sort();
  }, [leads]);

  // Base de todos os cálculos: os leads da campanha selecionada.
  const leadsDaCampanha = useMemo(
    () =>
      campanhaFiltro === "todas"
        ? leads
        : leads.filter((l) => campanhaDoLead(l) === campanhaFiltro),
    [leads, campanhaFiltro]
  );

  const totalUtilizados = leadsDaCampanha.filter((l) => l.status === "Utilizado").length;
  const totalExpirados = leadsDaCampanha.filter(estaExpirado).length;
  const totalNaoUtilizados = leadsDaCampanha.filter(
    (l) => l.status === "Não Utilizado" && !estaExpirado(l)
  ).length;

  const combinaComAba = (lead: Lead, aba: AbaStatus) => {
    if (aba === "Utilizado") return lead.status === "Utilizado";
    if (aba === "Expirado") return estaExpirado(lead);
    return lead.status === "Não Utilizado" && !estaExpirado(lead);
  };

  const combinaComUnidade = (lead: Lead, sub: typeof activeSubTab) => {
    if (sub === "todos") return true;
    return normalizaUnidade(lead.unidade) === sub;
  };

  const filteredLeads = leadsDaCampanha.filter((lead) => {
    if (!combinaComAba(lead, activeTab)) return false;
    if (!combinaComUnidade(lead, activeSubTab)) return false;

    const termo = searchTerm.toLowerCase();
    return (
      lead.nome.toLowerCase().includes(termo) ||
      lead.whatsapp.includes(searchTerm) ||
      lead.voucherCode.toLowerCase().includes(termo) ||
      (lead.unidade || "").toLowerCase().includes(termo) ||
      (lead.utmContent || "").toLowerCase().includes(termo)
    );
  });

  // =========================================================================
  // EXPORTAÇÕES
  // =========================================================================

  // CSV completo (backup) — sempre a base inteira, sem filtros.
  const handleExportCSV = (silent = false) => {
    if (leads.length === 0) return;

    const headers = [
      "Nome",
      "WhatsApp",
      "Data Nascimento",
      "Código do Voucher",
      "Data Cadastro",
      "Status",
      "Origem",
      "Unidade",
      "Campanha",
      "Oferta",
      "Criativo",
      "Expira em",
      "Expirado",
    ];

    const linhas = [
      headers.join(","),
      ...leads.map((lead) =>
        [
          lead.nome,
          lead.whatsapp,
          lead.dataNascimento || "",
          lead.voucherCode,
          formataData(lead.timestamp),
          lead.status,
          lead.origem || "Direto/Orgânico",
          normalizaUnidade(lead.unidade),
          campanhaDoLead(lead),
          lead.oferta || "Picolé Grátis",
          lead.utmContent || "",
          lead.expiraEm ? formataData(lead.expiraEm) : "",
          estaExpirado(lead) ? "Sim" : "Não",
        ]
          .map(csvCell)
          .join(",")
      ),
    ];

    baixarCSV(
      linhas,
      `BACKUP_participantes_prestigio_${new Date().toISOString().slice(0, 10)}.csv`
    );

    if (silent) setDownloadDone(true);
  };

  // Lista de reativação: quem cadastrou e não resgatou, na campanha filtrada.
  // É este arquivo que alimenta o disparo no WhatsApp.
  const naoResgatados = leadsDaCampanha.filter((l) => l.status === "Não Utilizado");

  const handleExportNaoResgatados = () => {
    if (naoResgatados.length === 0) return;

    const headers = ["Nome", "WhatsApp", "Unidade", "Código", "Expira em"];
    const linhas = [
      headers.join(","),
      ...naoResgatados.map((lead) =>
        [
          lead.nome,
          lead.whatsapp,
          normalizaUnidade(lead.unidade),
          lead.voucherCode,
          lead.expiraEm ? formataData(lead.expiraEm) : "",
        ]
          .map(csvCell)
          .join(",")
      ),
    ];

    const sufixo = campanhaFiltro === "todas" ? "todas-campanhas" : campanhaFiltro;
    baixarCSV(linhas, `REATIVACAO_nao_resgatados_${sufixo}_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  // Deletar Tudo
  const handleDeleteAll = async () => {
    if (!downloadDone) return;

    setLoading(true);
    try {
      const res = await fetch("/api/voucher", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmacao: "EXCLUIR TUDO" }),
      });

      if (res.ok) {
        setLeads([]);
        setShowDeleteModal(false);
        setDownloadDone(false);
        setDeleteInputCode("");
        alert("Todos os dados de cadastro foram excluídos com sucesso do banco de dados!");
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Erro ao excluir registros.");
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao excluir registros.");
    } finally {
      setLoading(false);
    }
  };

  // =========================================================================
  // GRÁFICOS
  // =========================================================================
  const statusChartData = {
    labels: ["Utilizados", "Não Utilizados", "Expirados"],
    datasets: [
      {
        data: [totalUtilizados, totalNaoUtilizados, totalExpirados],
        backgroundColor: ["#10b981", "#facc15", "#94a3b8"],
        borderColor: ["#059669", "#eab308", "#64748b"],
        borderWidth: 2,
        hoverOffset: 8,
      },
    ],
  };

  const totalTrafegoPago = leadsDaCampanha.filter(
    (l) => l.origem === "Tráfego Pago (Meta/Insta)"
  ).length;
  const totalIndicacaoWpp = leadsDaCampanha.filter(
    (l) => l.origem === "Indicação WhatsApp"
  ).length;
  const totalDiretoOrganico = leadsDaCampanha.filter(
    (l) => !l.origem || l.origem === "Direto/Orgânico"
  ).length;

  const origemChartData = {
    labels: ["Tráfego Pago (Ads)", "WhatsApp", "Direto/Orgânico"],
    datasets: [
      {
        data: [totalTrafegoPago, totalIndicacaoWpp, totalDiretoOrganico],
        backgroundColor: ["#0284c7", "#25d366", "#94a3b8"],
        borderColor: ["#0369a1", "#128c7e", "#64748b"],
        borderWidth: 2,
        hoverOffset: 8,
      },
    ],
  };

  const totalUnidadeSamambaia = leadsDaCampanha.filter(
    (l) => normalizaUnidade(l.unidade) === "Unidade Samambaia"
  ).length;
  const totalUnidadeSantaMaria = leadsDaCampanha.filter(
    (l) => normalizaUnidade(l.unidade) === "Unidade Santa Maria"
  ).length;
  const totalUnidadeAreal = leadsDaCampanha.filter(
    (l) => normalizaUnidade(l.unidade) === "Unidade Areal"
  ).length;

  const unidadeChartData = {
    labels: ["Unidade Samambaia", "Unidade Santa Maria", "Unidade Areal"],
    datasets: [
      {
        data: [totalUnidadeSamambaia, totalUnidadeSantaMaria, totalUnidadeAreal],
        backgroundColor: ["#f43f5e", "#06b6d4", "#f59e0b"],
        borderColor: ["#e11d48", "#0891b2", "#d97706"],
        borderWidth: 2,
        hoverOffset: 8,
      },
    ],
  };

  const chartOptions: ChartOptions<"doughnut"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          font: { family: "Outfit, sans-serif", weight: "bold", size: 11 },
          padding: 15,
        },
      },
      tooltip: {
        titleFont: { family: "Outfit, sans-serif", weight: "bold" },
        bodyFont: { family: "Outfit, sans-serif" },
      },
    },
  };

  /**
   * Taxa de resgate por criativo (utilizados ÷ cadastros).
   * É o gráfico mais acionável do painel: diz onde colocar verba no mês seguinte.
   */
  const criativos = useMemo(() => {
    const mapa = new Map<string, { cadastros: number; utilizados: number }>();

    leadsDaCampanha.forEach((lead) => {
      const chave = lead.utmContent || "(sem criativo)";
      const atual = mapa.get(chave) || { cadastros: 0, utilizados: 0 };
      atual.cadastros += 1;
      if (lead.status === "Utilizado") atual.utilizados += 1;
      mapa.set(chave, atual);
    });

    const todos = Array.from(mapa.entries()).map(([nome, dados]) => ({
      nome,
      ...dados,
      taxa: dados.cadastros > 0 ? (dados.utilizados / dados.cadastros) * 100 : 0,
    }));

    const exibidos = todos
      .filter((c) => c.cadastros >= AMOSTRA_MINIMA_CRIATIVO)
      .sort((a, b) => b.taxa - a.taxa);

    return { exibidos, ocultos: todos.length - exibidos.length };
  }, [leadsDaCampanha]);

  const criativoChartData = {
    labels: criativos.exibidos.map((c) => c.nome),
    datasets: [
      {
        label: "Taxa de resgate (%)",
        data: criativos.exibidos.map((c) => Number(c.taxa.toFixed(1))),
        backgroundColor: "#0284c7",
        borderColor: "#0369a1",
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  };

  const criativoChartOptions: ChartOptions<"bar"> = {
    indexAxis: "y",
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        beginAtZero: true,
        max: 100,
        ticks: { callback: (valor) => `${valor}%` },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: TooltipItem<"bar">) => {
            const c = criativos.exibidos[ctx.dataIndex];
            if (!c) return `${ctx.parsed.x}%`;
            return `${ctx.parsed.x}% — ${c.utilizados} de ${c.cadastros} cadastros`;
          },
        },
      },
    },
  };

  const abas: { id: AbaStatus; label: string; count: number; cor: string }[] = [
    {
      id: "Não Utilizado",
      label: "Não Utilizados",
      count: totalNaoUtilizados,
      cor: "border-amber-500 text-amber-600 bg-amber-50/30",
    },
    {
      id: "Utilizado",
      label: "Utilizados",
      count: totalUtilizados,
      cor: "border-emerald-500 text-emerald-600 bg-emerald-50/30",
    },
    {
      id: "Expirado",
      label: "Expirados",
      count: totalExpirados,
      cor: "border-slate-500 text-slate-600 bg-slate-100/60",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header Admin */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 hover:bg-slate-100 rounded-lg transition text-slate-500">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="relative w-36 h-10">
            <Image src="/logo.png" alt="Sorvetes Prestígio" fill className="object-contain" />
          </div>
          <span className="bg-brand-blue/10 text-brand-blue text-xs font-bold px-2.5 py-1 rounded-md">
            Painel do Caixa / Sorvetes Prestígio
          </span>
        </div>

        <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={fetchLeads}
            disabled={loading}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl transition flex items-center justify-center gap-2 text-sm font-semibold text-slate-600 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </button>

          <button
            onClick={() => handleExportCSV(false)}
            disabled={leads.length === 0}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl transition flex items-center justify-center gap-2 text-sm font-semibold disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>

          <button
            onClick={handleExportNaoResgatados}
            disabled={naoResgatados.length === 0}
            className="px-4 py-2 bg-brand-blue hover:bg-brand-dark text-white rounded-xl transition flex items-center justify-center gap-2 text-sm font-semibold disabled:opacity-50 cursor-pointer"
            title="Lista para disparo de reativação no WhatsApp"
          >
            <Download className="w-4 h-4" />
            Exportar não resgatados ({naoResgatados.length})
          </button>

          <button
            onClick={() => {
              setDownloadDone(false);
              setShowDeleteModal(true);
            }}
            disabled={leads.length === 0}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition flex items-center justify-center gap-2 text-sm font-semibold disabled:opacity-50 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            Excluir Tudo
          </button>

          <button
            onClick={handleLogout}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl transition flex items-center justify-center gap-2 text-sm font-semibold text-slate-600 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </header>

      {/* Main Admin Area */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 py-8 space-y-6">
        {/* Filtro por campanha */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <Megaphone className="w-4 h-4 text-brand-blue" />
            Campanha
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { id: "todas", label: "Todas", count: leads.length },
              ...campanhasDisponiveis.map((id) => ({
                id,
                label: rotuloCampanha(id),
                count: leads.filter((l) => campanhaDoLead(l) === id).length,
              })),
            ].map((chip) => (
              <button
                key={chip.id}
                onClick={() => {
                  setCampanhaFiltro(chip.id);
                  setActiveSubTab("todos");
                }}
                className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
                  campanhaFiltro === chip.id
                    ? "bg-brand-blue text-white shadow-sm"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                }`}
              >
                {chip.label} ({chip.count})
              </button>
            ))}
          </div>
        </div>

        {/* Métricas rápidas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
              Cadastros Realizados
            </p>
            <p className="text-3xl font-black text-slate-800 mt-1">{leadsDaCampanha.length}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider">
              Vouchers Utilizados
            </p>
            <p className="text-3xl font-black text-emerald-600 mt-1">{totalUtilizados}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <p className="text-xs text-amber-600 font-bold uppercase tracking-wider">
              Não Utilizados (no prazo)
            </p>
            <p className="text-3xl font-black text-amber-600 mt-1">{totalNaoUtilizados}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
              Vouchers Expirados
            </p>
            <p className="text-3xl font-black text-slate-500 mt-1">{totalExpirados}</p>
          </div>
        </div>

        {/* GRÁFICOS DE ACOMPANHAMENTO (Três Colunas) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col items-center">
            <div className="flex items-center gap-2 mb-4 w-full text-left">
              <Award className="w-5 h-5 text-brand-blue" />
              <h3 className="font-extrabold text-brand-dark text-lg">Status dos Vouchers</h3>
            </div>
            <div className="h-[260px] w-full max-w-xs relative">
              <Doughnut data={statusChartData} options={chartOptions} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col items-center">
            <div className="flex items-center gap-2 mb-4 w-full text-left">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              <h3 className="font-extrabold text-brand-dark text-lg">Origem dos Cadastros</h3>
            </div>
            <div className="h-[260px] w-full max-w-xs relative">
              <Doughnut data={origemChartData} options={chartOptions} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col items-center">
            <div className="flex items-center gap-2 mb-4 w-full text-left">
              <MapPin className="w-5 h-5 text-rose-500" />
              <h3 className="font-extrabold text-brand-dark text-lg">Cadastros por Unidade</h3>
            </div>
            <div className="h-[260px] w-full max-w-xs relative">
              <Doughnut data={unidadeChartData} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* TAXA DE RESGATE POR CRIATIVO */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 mb-1">
            <Megaphone className="w-5 h-5 text-brand-blue" />
            <h3 className="font-extrabold text-brand-dark text-lg">
              Taxa de Resgate por Criativo
            </h3>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Utilizados ÷ cadastros, por criativo (utm_content). Ordenado da maior taxa para a
            menor.
            {criativos.ocultos > 0 && (
              <>
                {" "}
                <span className="font-semibold text-slate-600">
                  {criativos.ocultos} criativo(s) com menos de {AMOSTRA_MINIMA_CRIATIVO}{" "}
                  cadastros foram ocultados (amostra pequena demais).
                </span>
              </>
            )}
          </p>

          {criativos.exibidos.length > 0 ? (
            <div
              className="w-full relative"
              style={{ height: Math.max(200, criativos.exibidos.length * 44 + 40) }}
            >
              <Bar data={criativoChartData} options={criativoChartOptions} />
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 text-sm">
              Ainda não há criativo com {AMOSTRA_MINIMA_CRIATIVO} ou mais cadastros nesta
              campanha.
            </div>
          )}
        </div>

        {/* Barra de Pesquisa */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3 shadow-xs">
          <Search className="text-slate-400 w-5 h-5 flex-shrink-0" />
          <input
            type="text"
            placeholder="Pesquise por Nome, WhatsApp, Código, Unidade ou Criativo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent border-0 outline-hidden text-slate-700 placeholder-slate-400 text-sm"
          />
        </div>

        {/* Abas de Status dos Vouchers */}
        <div className="flex gap-2 border-b border-slate-200">
          {abas.map((aba) => (
            <button
              key={aba.id}
              onClick={() => {
                setActiveTab(aba.id);
                setActiveSubTab("todos");
              }}
              className={`px-6 py-3 font-bold text-sm transition-all border-b-2 rounded-t-xl cursor-pointer ${
                activeTab === aba.id
                  ? aba.cor
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100/50"
              }`}
            >
              {aba.label} ({aba.count})
            </button>
          ))}
        </div>

        {/* Sub-abas de Unidades (Filtro Secundário) */}
        <div className="flex flex-wrap gap-2 mt-3 pb-2 border-b border-slate-100">
          {(
            [
              { id: "todos", label: "Todos" },
              { id: "Unidade Samambaia", label: "Samambaia" },
              { id: "Unidade Santa Maria", label: "Santa Maria" },
              { id: "Unidade Areal", label: "Areal" },
            ] as const
          ).map((subTab) => {
            const count = leadsDaCampanha.filter(
              (l) => combinaComAba(l, activeTab) && combinaComUnidade(l, subTab.id)
            ).length;

            const isSelected = activeSubTab === subTab.id;
            return (
              <button
                key={subTab.id}
                onClick={() => setActiveSubTab(subTab.id)}
                className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
                  isSelected
                    ? "bg-slate-800 text-white shadow-sm"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                }`}
              >
                {subTab.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Tabela de Vouchers */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Cliente</th>
                  <th className="px-6 py-4">WhatsApp</th>
                  <th className="px-6 py-4">Origem</th>
                  <th className="px-6 py-4">Criativo</th>
                  <th className="px-6 py-4">Unidade</th>
                  <th className="px-6 py-4">Código do Voucher</th>
                  <th className="px-6 py-4">Data do Cadastro</th>
                  <th className="px-6 py-4 text-center">Status / Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                {filteredLeads.length > 0 ? (
                  filteredLeads.map((lead) => {
                    const expirado = estaExpirado(lead);
                    return (
                      <tr key={lead.id} className="hover:bg-slate-50/50 transition duration-150">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800">{lead.nome}</span>
                            {lead.dataNascimento && (
                              <span className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                <Calendar className="w-3 h-3" />
                                Nasc.:{" "}
                                {new Date(lead.dataNascimento + "T00:00:00").toLocaleDateString(
                                  "pt-BR"
                                )}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 text-slate-600">
                            <Phone className="w-3.5 h-3.5 text-brand-blue" />
                            {lead.whatsapp}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 text-slate-600 text-xs">
                            {lead.origem || "Direto/Orgânico"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs text-slate-600 font-semibold">
                            {lead.utmContent || "—"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 text-slate-700 text-xs font-bold">
                            {normalizaUnidade(lead.unidade)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="bg-brand-light text-brand-dark px-3 py-1.5 rounded-lg font-mono font-bold border border-brand-sky/20 flex items-center gap-1.5 w-fit">
                            <Ticket className="w-3.5 h-3.5" />
                            {lead.voucherCode}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500 text-xs">
                          {formataData(lead.timestamp)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <button
                              onClick={() => handleToggleStatus(lead.voucherCode, lead.status)}
                              disabled={updatingId === lead.voucherCode}
                              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer ${
                                lead.status === "Utilizado"
                                  ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                                  : expirado
                                    ? "bg-rose-50/60 text-slate-600 hover:bg-rose-100 border border-rose-200"
                                    : "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"
                              }`}
                            >
                              {lead.status === "Utilizado" ? (
                                <>
                                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                                  Utilizado
                                </>
                              ) : expirado ? (
                                <>
                                  <Clock className="w-4 h-4 text-rose-500" />
                                  Expirado
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-4 h-4 text-amber-600" />
                                  Não Utilizado
                                </>
                              )}
                            </button>

                            {expirado && (
                              <span className="text-[10px] text-rose-500 font-semibold leading-tight">
                                Fora do prazo desde {formataData(lead.expiraEm)}
                              </span>
                            )}
                            {!expirado && lead.status === "Não Utilizado" && lead.expiraEm && (
                              <span className="text-[10px] text-slate-400 font-medium leading-tight">
                                Vale até {formataData(lead.expiraEm)}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                      Nenhum participante encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* MODAL DE SEGURANÇA E EXCLUSÃO */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full border border-slate-200 shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-extrabold text-brand-dark">
                Atenção! Ação Irreversível
              </h3>
              <p className="text-sm text-slate-500">
                Você está prestes a excluir <strong>todos os cadastros</strong> de vouchers do
                banco de dados permanentemente — de todas as campanhas.
              </p>
            </div>

            {/* Passo 1: Download Obrigatório */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                Passo 1: Baixar Backup de Segurança
              </p>
              <button
                onClick={() => handleExportCSV(true)}
                className={`w-full py-3 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 cursor-pointer ${
                  downloadDone ? "bg-emerald-500 text-white" : "bg-slate-800 hover:bg-slate-900 text-white"
                }`}
              >
                {downloadDone ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Backup Realizado!
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Baixar Relatório CSV
                  </>
                )}
              </button>
            </div>

            {/* Passo 2: Confirmar por Código */}
            {downloadDone && (
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                  Passo 2: Digite DELETAR para confirmar
                </p>
                <input
                  type="text"
                  placeholder="Digite: DELETAR"
                  value={deleteInputCode}
                  onChange={(e) => setDeleteInputCode(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-rose-100 focus:border-rose-500 outline-hidden transition text-center font-bold tracking-widest text-slate-700"
                />
              </div>
            )}

            {/* Botões de Decisão */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDownloadDone(false);
                  setDeleteInputCode("");
                }}
                className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 font-bold text-sm cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteAll}
                disabled={!downloadDone || deleteInputCode !== "DELETAR" || loading}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-sm transition disabled:opacity-40 cursor-pointer"
              >
                Excluir Tudo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
