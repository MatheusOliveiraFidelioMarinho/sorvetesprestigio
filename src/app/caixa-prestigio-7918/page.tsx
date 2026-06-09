"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
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
  Award
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
  Filler
} from "chart.js";
import { Doughnut } from "react-chartjs-2";

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
}

export default function AdminPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
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

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleToggleStatus = async (voucherCode: string, currentStatus: "Não Utilizado" | "Utilizado") => {
    setUpdatingId(voucherCode);
    const newStatus = currentStatus === "Não Utilizado" ? "Utilizado" : "Não Utilizado";
    
    try {
      const res = await fetch("/api/voucher", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voucherCode, status: newStatus }),
      });
      
      if (res.ok) {
        setLeads(prev => prev.map(lead => {
          if (lead.voucherCode === voucherCode) {
            return { ...lead, status: newStatus };
          }
          return lead;
        }));
      }
    } catch (err) {
      console.error("Erro ao atualizar status:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  // Exportar dados para CSV
  const handleExportCSV = (silent = false) => {
    if (leads.length === 0) return;
    
    const headers = ["Nome", "WhatsApp", "Data Nascimento", "Código do Voucher", "Data Cadastro", "Status", "Origem"];
    const csvRows = [
      headers.join(","),
      ...leads.map(lead => [
        `"${lead.nome}"`,
        `"${lead.whatsapp}"`,
        `"${lead.dataNascimento || ""}"`,
        `"${lead.voucherCode}"`,
        `"${new Date(lead.timestamp).toLocaleString("pt-BR")}"`,
        `"${lead.status}"`,
        `"${lead.origem || "Direto/Orgânico"}"`
      ].join(","))
    ];
    
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `BACKUP_participantes_prestigio_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (silent) {
      setDownloadDone(true);
    }
  };

  // Deletar Tudo
  const handleDeleteAll = async () => {
    if (!downloadDone) return;
    
    setLoading(true);
    try {
      const res = await fetch("/api/voucher", {
        method: "DELETE",
      });
      
      if (res.ok) {
        setLeads([]);
        setShowDeleteModal(false);
        setDownloadDone(false);
        setDeleteInputCode("");
        alert("Todos os dados de cadastro foram excluídos com sucesso do banco de dados!");
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao excluir registros.");
    } finally {
      setLoading(false);
    }
  };

  // Filtragem dos leads baseada no input de pesquisa
  const filteredLeads = leads.filter(lead => 
    lead.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.whatsapp.includes(searchTerm) ||
    lead.voucherCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // =========================================================================
  // PREPARAÇÃO DOS DADOS DO GRÁFICO DE PIZZA (Distribuição de Vouchers)
  // =========================================================================
  const totalUtilizados = leads.filter(l => l.status === "Utilizado").length;
  const totalNaoUtilizados = leads.filter(l => l.status === "Não Utilizado").length;

  const statusChartData = {
    labels: ["Vouchers Utilizados", "Vouchers Não Utilizados"],
    datasets: [
      {
        data: [totalUtilizados, totalNaoUtilizados],
        backgroundColor: ["#10b981", "#facc15"], // Verde e Amarelo
        borderColor: ["#059669", "#eab308"],
        borderWidth: 2,
        hoverOffset: 8
      }
    ]
  };

  // =========================================================================
  // PREPARAÇÃO DOS DADOS DO GRÁFICO DE ORIGEM (Anúncios vs Indicação)
  // =========================================================================
  const totalTrafegoPago = leads.filter(l => l.origem === "Tráfego Pago (Meta/Insta)").length;
  const totalIndicacaoWpp = leads.filter(l => l.origem === "Indicação WhatsApp").length;
  const totalDiretoOrganico = leads.filter(l => !l.origem || l.origem === "Direto/Orgânico").length;

  const origemChartData = {
    labels: ["Tráfego Pago (Ads)", "WhatsApp", "Direto/Orgânico"],
    datasets: [
      {
        data: [totalTrafegoPago, totalIndicacaoWpp, totalDiretoOrganico],
        backgroundColor: ["#0284c7", "#25d366", "#94a3b8"], // Azul, Verde WhatsApp, Cinza
        borderColor: ["#0369a1", "#128c7e", "#64748b"],
        borderWidth: 2,
        hoverOffset: 8
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          font: { family: "Outfit, sans-serif", weight: "bold" as any, size: 11 },
          padding: 15
        }
      },
      tooltip: {
        titleFont: { family: "Outfit, sans-serif", weight: "bold" as any },
        bodyFont: { family: "Outfit, sans-serif" }
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header Admin */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 hover:bg-slate-100 rounded-lg transition text-slate-500">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="relative w-36 h-10">
            <Image
              src="/logo.png"
              alt="Sorvetes Prestígio"
              fill
              className="object-contain"
            />
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
        </div>
      </header>

      {/* Main Admin Area */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 py-8 space-y-6">
        
        {/* Métricas rápidas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Cadastros Realizados</p>
            <p className="text-3xl font-black text-slate-800 mt-1">{leads.length}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider">Vouchers Utilizados</p>
            <p className="text-3xl font-black text-emerald-600 mt-1">
              {leads.filter(l => l.status === "Utilizado").length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <p className="text-xs text-amber-600 font-bold uppercase tracking-wider font-bold">Vouchers Não Utilizados</p>
            <p className="text-3xl font-black text-amber-600 mt-1">
              {leads.filter(l => l.status === "Não Utilizado").length}
            </p>
          </div>
        </div>

        {/* GRÁFICOS DE ACOMPANHAMENTO (Lado a Lado) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              <h3 className="font-extrabold text-brand-dark text-lg">Origem dos Cadastros (Tráfego)</h3>
            </div>
            <div className="h-[260px] w-full max-w-xs relative">
              <Doughnut data={origemChartData} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* Barra de Pesquisa */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3 shadow-xs">
          <Search className="text-slate-400 w-5 h-5 flex-shrink-0" />
          <input
            type="text"
            placeholder="Pesquise por Nome, WhatsApp ou Código do Voucher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent border-0 outline-hidden text-slate-700 placeholder-slate-400 text-sm"
          />
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
                  <th className="px-6 py-4">Código do Voucher</th>
                  <th className="px-6 py-4">Data do Cadastro</th>
                  <th className="px-6 py-4 text-center">Status / Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                {filteredLeads.length > 0 ? (
                  filteredLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-slate-50/50 transition duration-150">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800">{lead.nome}</span>
                          {lead.dataNascimento && (
                            <span className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                              <Calendar className="w-3 h-3" />
                              Nasc.: {new Date(lead.dataNascimento + "T00:00:00").toLocaleDateString("pt-BR")}
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
                        <span className="bg-brand-light text-brand-dark px-3 py-1.5 rounded-lg font-mono font-bold border border-brand-sky/20 flex items-center gap-1.5 w-fit">
                          <Ticket className="w-3.5 h-3.5" />
                          {lead.voucherCode}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-xs">
                        {new Date(lead.timestamp).toLocaleString("pt-BR")}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleToggleStatus(lead.voucherCode, lead.status)}
                          disabled={updatingId === lead.voucherCode}
                          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer ${
                            lead.status === "Utilizado"
                              ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                              : "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"
                          }`}
                        >
                          {lead.status === "Utilizado" ? (
                            <>
                              <CheckCircle className="w-4 h-4 text-emerald-600" />
                              Utilizado
                            </>
                          ) : (
                            <>
                              <XCircle className="w-4 h-4 text-amber-600" />
                              Não Utilizado
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
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
              <h3 className="text-xl font-extrabold text-brand-dark">Atenção! Ação Irreversível</h3>
              <p className="text-sm text-slate-500">
                Você está prestes a excluir **todos os cadastros** de vouchers do banco de dados permanentemente.
              </p>
            </div>

            {/* Passo 1: Download Obrigatório */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">Passo 1: Baixar Backup de Segurança</p>
              <button
                onClick={() => handleExportCSV(true)}
                className={`w-full py-3 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 cursor-pointer ${
                  downloadDone 
                    ? "bg-emerald-500 text-white" 
                    : "bg-slate-800 hover:bg-slate-900 text-white"
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
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">Passo 2: Digite DELETAR para confirmar</p>
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
