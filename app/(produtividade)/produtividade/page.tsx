"use client";

import { useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { AlertTriangle, BarChart2, Download, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";
import {
  useProdUnidades,
  useProdDocumentos,
  useProdColaboradores,
  STATUS_LABEL,
  STATUS_PIE_COLOR,
  type StatusDocumentoSST,
} from "@/lib/hooks/useProdutividade";

function KpiCard({
  label,
  value,
  sub,
  colorClass,
}: {
  label: string;
  value: number | string;
  sub?: string;
  colorClass: string;
}) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${colorClass}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

export default function ProdutividadeDashboard() {
  const [unidadeFilter, setUnidadeFilter] = useState("");

  const { data: unidades = [], isLoading: loadingU } = useProdUnidades();
  const { data: documentos = [], isLoading: loadingD } = useProdDocumentos(
    unidadeFilter ? { idUnidade: unidadeFilter } : undefined
  );
  const { data: colaboradores = [] } = useProdColaboradores();

  const isLoading = loadingU || loadingD;

  // Contagens por status
  const total       = documentos.length;
  const emDia       = documentos.filter((d) => d.status === "em_dia").length;
  const vencidos    = documentos.filter((d) => d.status === "vencido").length;
  const aVencer     = documentos.filter((d) => d.status === "a_vencer").length;
  const pendentes   = documentos.filter((d) =>
    ["pendente_visita", "pendente_informacao", "pendente_ssg", "pendente_revisao", "nao_iniciado"].includes(d.status)
  ).length;
  const clientesUnicos = new Set(documentos.map((d) => d.id_empresa)).size;

  // Alertas: vencendo em 30 e 60 dias
  const hoje  = new Date().toISOString().slice(0, 10);
  const em30d = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);
  const em60d = new Date(Date.now() + 60 * 86_400_000).toISOString().slice(0, 10);
  const vencendo30 = documentos.filter(
    (d) => d.data_vencimento && d.data_vencimento >= hoje && d.data_vencimento <= em30d
  );
  const vencendo60 = documentos.filter(
    (d) => d.data_vencimento && d.data_vencimento > em30d && d.data_vencimento <= em60d
  );

  // Pie data
  const statusCount: Partial<Record<StatusDocumentoSST, number>> = {};
  for (const d of documentos) {
    statusCount[d.status] = (statusCount[d.status] ?? 0) + 1;
  }
  const pieData = (Object.entries(statusCount) as [StatusDocumentoSST, number][])
    .map(([status, value]) => ({ name: STATUS_LABEL[status], value, status }))
    .sort((a, b) => b.value - a.value);

  // Bar data por unidade
  const barData = unidades.map((u) => {
    const uDocs = documentos.filter((d) => d.id_unidade === u.id);
    return {
      name: u.nome.length > 10 ? u.nome.slice(0, 10) + "…" : u.nome,
      "Em Dia":    uDocs.filter((d) => d.status === "em_dia").length,
      "A Vencer":  uDocs.filter((d) => d.status === "a_vencer").length,
      "Pendentes": uDocs.filter((d) =>
        ["pendente_visita", "pendente_informacao", "pendente_ssg", "pendente_revisao", "nao_iniciado"].includes(d.status)
      ).length,
      "Vencidos":  uDocs.filter((d) => d.status === "vencido").length,
    };
  }).filter((u) => Object.values(u).some((v) => typeof v === "number" && v > 0));

  // Ranking unidades por pendências
  const ranking = unidades
    .map((u) => {
      const uDocs = documentos.filter((d) => d.id_unidade === u.id);
      const pend = uDocs.filter((d) =>
        ["vencido", "a_vencer", "pendente_visita", "pendente_informacao", "pendente_ssg", "pendente_revisao", "nao_iniciado"].includes(d.status)
      ).length;
      return {
        ...u,
        totalDocs: uDocs.length,
        colaboradores: colaboradores.filter((c) => c.id_unidade === u.id).length,
        pendentes: pend,
      };
    })
    .sort((a, b) => b.pendentes - a.pendentes);

  function exportExcel() {
    const rows = documentos.map((d) => ({
      Empresa:        d.nome_empresa ?? d.id_empresa,
      Unidade:        unidades.find((u) => u.id === d.id_unidade)?.nome ?? d.id_unidade,
      "Tipo":         d.tipo_documento,
      Status:         STATUS_LABEL[d.status],
      Emissão:        d.data_emissao ?? "",
      Vencimento:     d.data_vencimento ?? "",
      Responsável:    d.responsavel_nome ?? "",
      Observações:    d.observacoes ?? "",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Documentos SST");
    XLSX.writeFile(wb, "produtividade-documentos.xlsx");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard de Produtividade</h1>
          <p className="mt-0.5 text-sm text-gray-500">Visão geral das unidades, documentos SST e equipe</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={unidadeFilter}
            onChange={(e) => setUnidadeFilter(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">Todas as unidades</option>
            {unidades.map((u) => (
              <option key={u.id} value={u.id}>{u.nome}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={exportExcel}
            className="flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800"
          >
            <Download className="size-4" /> Excel
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Loader2 className="size-4 animate-spin" /> Carregando dados…
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <KpiCard label="Clientes" value={clientesUnicos} sub="empresas com docs" colorClass="text-gray-900" />
        <KpiCard label="Total Docs" value={total} sub="documentos SST" colorClass="text-gray-900" />
        <KpiCard label="Em Dia" value={emDia} sub={total > 0 ? `${Math.round((emDia / total) * 100)}%` : "0%"} colorClass="text-green-600" />
        <KpiCard label="Vencidos" value={vencidos} sub="requer ação imediata" colorClass="text-red-600" />
        <KpiCard label="A Vencer" value={aVencer} sub="atenção nos próximos dias" colorClass="text-yellow-600" />
        <KpiCard label="Pendentes" value={pendentes} sub="diversas situações" colorClass="text-orange-600" />
      </div>

      {/* Alertas */}
      {(vencidos > 0 || vencendo30.length > 0) && (
        <div className="space-y-3">
          {vencidos > 0 && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="size-5 text-red-600" />
                <span className="font-semibold text-red-800">
                  {vencidos} documento{vencidos !== 1 ? "s" : ""} vencido{vencidos !== 1 ? "s" : ""}
                </span>
                <span className="text-sm text-red-600">— requer renovação imediata</span>
              </div>
            </div>
          )}
          {vencendo30.length > 0 && (
            <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4">
              <div className="mb-2 flex items-center gap-2">
                <AlertTriangle className="size-4 text-yellow-600" />
                <span className="font-semibold text-yellow-800">
                  {vencendo30.length} documento{vencendo30.length !== 1 ? "s" : ""} vencendo nos próximos 30 dias
                </span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {vencendo30.slice(0, 6).map((d) => (
                  <div key={d.id} className="rounded-lg bg-white px-3 py-2 text-xs shadow-sm ring-1 ring-yellow-200">
                    <p className="font-semibold text-gray-800 truncate">{d.nome_empresa ?? d.id_empresa}</p>
                    <p className="text-gray-500">{d.tipo_documento} · {d.data_vencimento}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {vencendo60.length > 0 && (
            <p className="text-sm text-gray-500">
              + <span className="font-semibold">{vencendo60.length}</span> documento{vencendo60.length !== 1 ? "s" : ""} vencendo entre 30 e 60 dias.
            </p>
          )}
        </div>
      )}

      {/* Charts */}
      {!isLoading && total > 0 && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Pie */}
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <h2 className="mb-3 text-sm font-semibold text-gray-700">Distribuição por Status</h2>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="45%"
                  outerRadius={85}
                  dataKey="value"
                  label={({ percent }) => `${((percent ?? 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.status} fill={STATUS_PIE_COLOR[entry.status] ?? "#ccc"} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [`${v} docs`, ""]} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Bar por unidade */}
          {barData.length > 0 && (
            <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-black/5">
              <h2 className="mb-3 text-sm font-semibold text-gray-700">Documentos por Unidade</h2>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="Em Dia"    stackId="a" fill="#22c55e" />
                  <Bar dataKey="A Vencer"  stackId="a" fill="#eab308" />
                  <Bar dataKey="Pendentes" stackId="a" fill="#f97316" />
                  <Bar dataKey="Vencidos"  stackId="a" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Ranking */}
      {ranking.length > 0 && (
        <div className="rounded-xl bg-white shadow-sm ring-1 ring-black/5">
          <div className="border-b border-gray-100 px-5 py-3">
            <h2 className="text-sm font-semibold text-gray-700">Ranking de Unidades — Pendências</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-[11px] uppercase text-gray-400">
                  <th className="px-5 py-3 text-left">#</th>
                  <th className="px-5 py-3 text-left">Unidade</th>
                  <th className="px-5 py-3 text-left">Responsável</th>
                  <th className="px-5 py-3 text-right">Total Docs</th>
                  <th className="px-5 py-3 text-right">Colaboradores</th>
                  <th className="px-5 py-3 text-right">Pendências</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {ranking.map((u, idx) => (
                  <tr key={u.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3 text-gray-400 font-mono text-xs">#{idx + 1}</td>
                    <td className="px-5 py-3 font-medium text-gray-800">{u.nome}</td>
                    <td className="px-5 py-3 text-gray-500 text-xs">{u.responsavel ?? "—"}</td>
                    <td className="px-5 py-3 text-right text-gray-600">{u.totalDocs}</td>
                    <td className="px-5 py-3 text-right text-gray-600">{u.colaboradores}</td>
                    <td className="px-5 py-3 text-right">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          u.pendentes > 0 ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                        }`}
                      >
                        {u.pendentes}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && total === 0 && unidades.length === 0 && (
        <div className="rounded-xl bg-white p-16 text-center shadow-sm ring-1 ring-black/5">
          <BarChart2 className="mx-auto size-14 text-gray-200" />
          <h3 className="mt-4 text-lg font-semibold text-gray-600">Nenhum dado cadastrado ainda</h3>
          <p className="mt-2 text-sm text-gray-400 max-w-sm mx-auto">
            Comece em <strong>Unidades e Equipe</strong> para cadastrar as 6 unidades da Chabra e os
            colaboradores, depois acesse <strong>Documentos SST</strong> para registrar os documentos
            por cliente.
          </p>
        </div>
      )}
    </div>
  );
}
