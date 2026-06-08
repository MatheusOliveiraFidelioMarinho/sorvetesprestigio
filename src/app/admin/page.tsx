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
  User,
  Ticket
} from "lucide-react";
import Link from "next/link";

interface Lead {
  id: string;
  nome: string;
  whatsapp: string;
  dataNascimento?: string;
  voucherCode: string;
  timestamp: string;
  status: "Não Utilizado" | "Utilizado";
}

export default function AdminPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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

  // Filtragem dos leads baseada no input de pesquisa
  const filteredLeads = leads.filter(lead => 
    lead.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.whatsapp.includes(searchTerm) ||
    lead.voucherCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Exportar dados para CSV
  const handleExportCSV = () => {
    if (leads.length === 0) return;
    
    const headers = ["Nome", "WhatsApp", "Data Nascimento", "Código do Voucher", "Data Cadastro", "Status"];
    const csvRows = [
      headers.join(","),
      ...leads.map(lead => [
        `"${lead.nome}"`,
        `"${lead.whatsapp}"`,
        `"${lead.dataNascimento || ""}"`,
        `"${lead.voucherCode}"`,
        `"${new Date(lead.timestamp).toLocaleString("pt-BR")}"`,
        `"${lead.status}"`
      ].join(","))
    ];
    
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `participantes_campanha_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
            Painel do Caixa / Admin
          </span>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            onClick={fetchLeads} 
            disabled={loading}
            className="flex-1 sm:flex-initial px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl transition flex items-center justify-center gap-2 text-sm font-semibold text-slate-600 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </button>
          <button 
            onClick={handleExportCSV}
            disabled={leads.length === 0}
            className="flex-1 sm:flex-initial px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl transition flex items-center justify-center gap-2 text-sm font-semibold disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
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
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                      Nenhum participante encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
