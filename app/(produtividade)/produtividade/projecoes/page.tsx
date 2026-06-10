"use client";

import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { AlertTriangle, CheckCircle2, TrendingUp, Users } from "lucide-react";
import {
  useProdUnidades,
  useProdDocumentos,
  useProdColaboradores,
} from "@/lib/hooks/useProdutividade";

// ── Helpers ────────────────────────────────────────────────────────────────

function InputNum({
  label,
  sub,
  value,
  onChange,
}: {
  label: string;
  sub?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-gray-600">{label}</label>
      {sub && <p className="mb-1.5 text-[11px] text-gray-400">{sub}</p>}
      <input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
      />
    </div>
  );
}

function CelulaNum({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <input
      type="number"
      min={0}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-20 rounded border border-teal-200 bg-white px-2 py-1 text-center text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
    />
  );
}

function ResultCard({
  label,
  value,
  sub,
  colorClass = "text-teal-700",
  highlight = false,
}: {
  label: string;
  value: string | number;
  sub?: string;
  colorClass?: string;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-xl p-4 ${highlight ? "bg-teal-50 ring-2 ring-teal-200" : "bg-white ring-1 ring-black/5"} shadow-sm`}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${colorClass}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

// Dados manuais por unidade
interface DadosUnidade {
  clientes:   string;
  totalDocs:  string;
  pendentes:  string;
  visitasPend: string;
}

const DADOS_VAZIOS: DadosUnidade = { clientes: "0", totalDocs: "0", pendentes: "0", visitasPend: "0" };

// ── Página ─────────────────────────────────────────────────────────────────

export default function ProjecoesPage() {
  const { data: unidades = [] } = useProdUnidades();
  const { data: documentos = [] } = useProdDocumentos();
  const { data: colaboradores = [] } = useProdColaboradores();

  // ── Modo manual por unidade ───────────────────────────────────────────────
  const [modoManual, setModoManual] = useState(false);
  // keyed by unidade.id
  const [dadosManuais, setDadosManuais] = useState<Record<string, DadosUnidade>>({});

  function getDados(id: string): DadosUnidade {
    return dadosManuais[id] ?? DADOS_VAZIOS;
  }
  function setDado(id: string, campo: keyof DadosUnidade, val: string) {
    setDadosManuais((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? DADOS_VAZIOS), [campo]: val },
    }));
  }

  // ── Simulação ────────────────────────────────────────────────────────────
  const [colabAtual,    setColabAtual]    = useState("0");
  const [tecnicoAtual,  setTecnicoAtual]  = useState("0");
  const [docsPorColab,  setDocsPorColab]  = useState("50");
  const [visitasPorTec, setVisitasPorTec] = useState("20");
  const [prazoDesejado, setPrazoDesejado] = useState("3");
  const [crescClientes, setCrescClientes] = useState("0");

  const n = (v: string, fallback = 0) => Math.max(0, Number(v) || fallback);

  // Totais — banco ou soma das linhas manuais por unidade
  const totalDocsDB      = documentos.length;
  const docsPendentesDB  = documentos.filter((d) =>
    ["vencido", "a_vencer", "pendente_visita", "pendente_informacao",
     "pendente_ssg", "pendente_revisao", "nao_iniciado"].includes(d.status)
  ).length;
  const visitasPendDB    = documentos.filter((d) => d.status === "pendente_visita").length;
  const clientesUnicosDB = new Set(documentos.map((d) => d.id_empresa)).size;

  const { totalDocs, docsPendentes, visitasPend, clientesUnicos } = useMemo(() => {
    if (!modoManual) {
      return {
        totalDocs:      totalDocsDB,
        docsPendentes:  docsPendentesDB,
        visitasPend:    visitasPendDB,
        clientesUnicos: clientesUnicosDB,
      };
    }
    // Soma de todas as unidades cadastradas
    const ids = unidades.length > 0
      ? unidades.map((u) => u.id)
      : Object.keys(dadosManuais);
    return {
      clientesUnicos: ids.reduce((s, id) => s + n(getDados(id).clientes),    0),
      totalDocs:      ids.reduce((s, id) => s + n(getDados(id).totalDocs),   0),
      docsPendentes:  ids.reduce((s, id) => s + n(getDados(id).pendentes),   0),
      visitasPend:    ids.reduce((s, id) => s + n(getDados(id).visitasPend), 0),
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modoManual, dadosManuais, unidades, totalDocsDB, docsPendentesDB, visitasPendDB, clientesUnicosDB]);

  // Capacidade atual (colaboradores cadastrados)
  const capDocsMes    = colaboradores.reduce((s, c) => s + c.capacidade_docs_mes, 0);
  const capVisitasMes = colaboradores.reduce((s, c) => s + c.capacidade_visitas_mes, 0);

  const calc = useMemo(() => {
    const nColab   = n(colabAtual);
    const nTec     = n(tecnicoAtual);
    const dpC      = n(docsPorColab, 50);
    const vpT      = n(visitasPorTec, 20);
    const prazo    = Math.max(1, n(prazoDesejado, 3));
    const crescMes = n(crescClientes);

    const capDocsEquipe    = nColab * dpC;
    const capVisitasEquipe = nTec * vpT;

    const meses = [1, 2, 3, 6, 12];
    const projecoes = meses.map((m) => {
      const novos       = crescMes * 5;
      const totalPend   = docsPendentes + novos * m;
      const capAcum     = capDocsEquipe * m;
      const saldo       = Math.max(0, totalPend - capAcum);
      return { mes: `${m}m`, pendentes: Math.round(saldo), processados: Math.round(Math.min(capAcum, totalPend)) };
    });

    const prazoAtualMeses = capDocsMes > 0 ? Math.ceil(docsPendentes / capDocsMes) : Infinity;
    const prazoSimMeses   = capDocsEquipe > 0 ? Math.ceil(docsPendentes / capDocsEquipe) : Infinity;

    const docsTotal  = docsPendentes + crescMes * prazo * 5;
    const colabIdeal = dpC > 0 ? Math.ceil(docsTotal / (prazo * dpC)) : 0;
    const tecIdeal   = vpT > 0 ? Math.ceil(visitasPend / (prazo * vpT)) : 0;

    return {
      capDocsEquipe, capVisitasEquipe,
      prazoAtualMeses, prazoSimMeses,
      colabIdeal, tecIdeal,
      deficitColab: Math.max(0, colabIdeal - nColab),
      deficitTec:   Math.max(0, tecIdeal - nTec),
      projecoes,
    };
  }, [colabAtual, tecnicoAtual, docsPorColab, visitasPorTec, prazoDesejado,
      crescClientes, docsPendentes, visitasPend, capDocsMes]);

  const cenarios = [0, 5, 10, 20, 30].map((cresc) => {
    const novos  = cresc * 5 * n(prazoDesejado, 3);
    const total  = docsPendentes + novos;
    const colabN = n(docsPorColab, 50) > 0 ? Math.ceil(total / (n(prazoDesejado, 3) * n(docsPorColab, 50))) : 0;
    const tecN   = n(visitasPorTec, 20) > 0 ? Math.ceil((visitasPend + cresc * 2) / (n(prazoDesejado, 3) * n(visitasPorTec, 20))) : 0;
    return { label: `+${cresc} clientes`, colabNecessario: colabN, tecNecessario: tecN, totalDocs: total };
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Projeções de Produtividade</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Simule capacidade de equipe, prazo de regularização e necessidade de contratações
        </p>
      </div>

      {/* ── Estado atual ─────────────────────────────────────────────────────── */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Estado Atual</h2>
          <button
            type="button"
            onClick={() => setModoManual((v) => !v)}
            className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
              modoManual ? "bg-teal-700 text-white hover:bg-teal-800" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <span className={`size-2 rounded-full ${modoManual ? "bg-teal-300" : "bg-gray-400"}`} />
            {modoManual ? "Entrada manual ativa" : "Inserir manualmente"}
          </button>
        </div>

        {/* Tabela de entrada manual por unidade */}
        {modoManual && (
          <div className="mb-4 overflow-hidden rounded-xl border border-teal-200 bg-teal-50">
            <div className="border-b border-teal-200 px-4 py-2.5">
              <p className="text-xs font-semibold text-teal-800">
                Informe os valores por unidade — os totais são somados automaticamente
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-teal-100 bg-teal-100/60 text-[11px] uppercase text-teal-700">
                    <th className="px-4 py-2.5 text-left">Unidade</th>
                    <th className="px-4 py-2.5 text-center">Clientes</th>
                    <th className="px-4 py-2.5 text-center">Total Docs</th>
                    <th className="px-4 py-2.5 text-center">Docs Pendentes</th>
                    <th className="px-4 py-2.5 text-center">Visitas Pendentes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-teal-100">
                  {(unidades.length > 0 ? unidades : [{ id: "__geral__", nome: "Geral (sem unidades)" }]).map((u) => (
                    <tr key={u.id} className="bg-white/70">
                      <td className="px-4 py-2.5 font-medium text-gray-800">{u.nome}</td>
                      <td className="px-4 py-2.5 text-center">
                        <CelulaNum value={getDados(u.id).clientes}    onChange={(v) => setDado(u.id, "clientes",    v)} />
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <CelulaNum value={getDados(u.id).totalDocs}   onChange={(v) => setDado(u.id, "totalDocs",   v)} />
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <CelulaNum value={getDados(u.id).pendentes}   onChange={(v) => setDado(u.id, "pendentes",   v)} />
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <CelulaNum value={getDados(u.id).visitasPend} onChange={(v) => setDado(u.id, "visitasPend", v)} />
                      </td>
                    </tr>
                  ))}
                  {/* Linha de totais */}
                  <tr className="border-t-2 border-teal-300 bg-teal-100/80 text-xs font-bold text-teal-900">
                    <td className="px-4 py-2 uppercase tracking-wide">Total</td>
                    <td className="px-4 py-2 text-center">{clientesUnicos}</td>
                    <td className="px-4 py-2 text-center">{totalDocs}</td>
                    <td className="px-4 py-2 text-center">{docsPendentes}</td>
                    <td className="px-4 py-2 text-center">{visitasPend}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <ResultCard label="Clientes"          value={clientesUnicos} sub={modoManual ? "entrada manual" : "empresas com docs"} />
          <ResultCard label="Total Docs"         value={totalDocs}      sub={modoManual ? "entrada manual" : "documentos SST"} />
          <ResultCard label="Docs Pendentes"     value={docsPendentes}  sub="requerem regularização" colorClass="text-orange-600" />
          <ResultCard label="Visitas Pendentes"  value={visitasPend}    sub="aguardam técnico"        colorClass="text-blue-600" />
        </div>
        {capDocsMes > 0 && (
          <p className="mt-2 text-sm text-gray-500">
            Capacidade atual (colaboradores cadastrados):{" "}
            <span className="font-semibold text-teal-700">{capDocsMes} docs/mês</span> ·{" "}
            <span className="font-semibold text-teal-700">{capVisitasMes} visitas/mês</span>.
            {calc.prazoAtualMeses !== Infinity && (
              <> Prazo estimado com equipe atual: <span className="font-semibold">{calc.prazoAtualMeses} mês{calc.prazoAtualMeses !== 1 ? "es" : ""}</span>.</>
            )}
          </p>
        )}
      </div>

      {/* ── Simulação ────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-gray-800">
          <TrendingUp className="size-5 text-teal-700" /> Simulação de Equipe
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <InputNum label="Colaboradores disponíveis"         sub="Responsáveis por gerar documentos SST" value={colabAtual}    onChange={setColabAtual} />
          <InputNum label="Técnicos de campo"                 sub="Responsáveis por visitas técnicas"     value={tecnicoAtual}  onChange={setTecnicoAtual} />
          <InputNum label="Docs produzidos / colaborador / mês" sub="Média de documentos por pessoa"      value={docsPorColab}  onChange={setDocsPorColab} />
          <InputNum label="Visitas / técnico / mês"           sub="Média de visitas por técnico"           value={visitasPorTec} onChange={setVisitasPorTec} />
          <InputNum label="Prazo desejado (meses)"            sub="Para zerar todas as pendências"         value={prazoDesejado} onChange={setPrazoDesejado} />
          <InputNum label="Crescimento de clientes / mês"     sub="Novos clientes estimados por mês"       value={crescClientes} onChange={setCrescClientes} />
        </div>
      </div>

      {/* ── Resultados ───────────────────────────────────────────────────────── */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Resultado da Simulação</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <ResultCard label="Capacidade docs/mês"  value={calc.capDocsEquipe}  sub="com a equipe simulada" colorClass="text-teal-700" />
          <ResultCard
            label="Prazo estimado"
            value={calc.prazoSimMeses === Infinity ? "∞" : `${calc.prazoSimMeses}m`}
            sub="com equipe simulada"
            colorClass={calc.prazoSimMeses <= n(prazoDesejado, 3) ? "text-green-600" : "text-orange-600"}
          />
          <ResultCard label="Colaboradores ideais" value={calc.colabIdeal} sub={`para ${prazoDesejado} meses`} highlight />
          <ResultCard label="Técnicos ideais"       value={calc.tecIdeal}   sub={`para ${prazoDesejado} meses`} colorClass="text-teal-700" />
        </div>

        {(calc.deficitColab > 0 || calc.deficitTec > 0) && (
          <div className="mt-4 rounded-xl border border-orange-200 bg-orange-50 p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 size-5 shrink-0 text-orange-600" />
              <div>
                <p className="font-semibold text-orange-800">Déficit de equipe identificado</p>
                <p className="mt-1 text-sm text-orange-700">
                  Para regularizar em <strong>{prazoDesejado} mês{n(prazoDesejado, 3) !== 1 ? "es" : ""}</strong>:
                  {calc.deficitColab > 0 && <> são necessários <strong>+{calc.deficitColab} colaborador{calc.deficitColab !== 1 ? "es" : ""}</strong> adicionais;</>}
                  {calc.deficitTec > 0   && <> <strong>+{calc.deficitTec} técnico{calc.deficitTec !== 1 ? "s" : ""}</strong> adicionais para visitas.</>}
                </p>
              </div>
            </div>
          </div>
        )}

        {calc.deficitColab === 0 && calc.deficitTec === 0 && n(colabAtual) > 0 && (
          <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-5 text-green-600" />
              <p className="font-semibold text-green-800">A equipe atual é suficiente para regularizar em {prazoDesejado} meses!</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Gráfico ──────────────────────────────────────────────────────────── */}
      {n(colabAtual) > 0 && (
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <h2 className="mb-3 text-sm font-semibold text-gray-700">Evolução de Pendências — Projeção Acumulada</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={calc.projecoes} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
              <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <ReferenceLine y={0} stroke="#22c55e" strokeWidth={2} label={{ value: "0 pendências", position: "right", fontSize: 10, fill: "#22c55e" }} />
              <Bar dataKey="processados" name="Processados"    fill="#22c55e" />
              <Bar dataKey="pendentes"   name="Ainda Pendentes" fill="#f97316" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Cenários ─────────────────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/5">
        <div className="border-b border-gray-100 px-5 py-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Users className="size-4 text-teal-600" /> Cenários de Crescimento — Equipe Necessária
          </h2>
          <p className="mt-0.5 text-xs text-gray-400">
            Prazo de {prazoDesejado} meses · {docsPorColab} docs/colab/mês · {visitasPorTec} vis./técnico/mês
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-[11px] uppercase text-gray-400">
                <th className="px-5 py-3 text-left">Cenário</th>
                <th className="px-5 py-3 text-right">Total Docs Pendentes</th>
                <th className="px-5 py-3 text-right">Colaboradores Necessários</th>
                <th className="px-5 py-3 text-right">Técnicos Necessários</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {cenarios.map((c) => (
                <tr key={c.label} className="hover:bg-gray-50/50">
                  <td className="px-5 py-3 font-medium text-gray-800">{c.label}</td>
                  <td className="px-5 py-3 text-right text-gray-600">{c.totalDocs}</td>
                  <td className="px-5 py-3 text-right">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${c.colabNecessario > n(colabAtual) ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                      {c.colabNecessario}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${c.tecNecessario > n(tecnicoAtual) ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                      {c.tecNecessario}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Por unidade ──────────────────────────────────────────────────────── */}
      {unidades.length > 0 && (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/5">
          <div className="border-b border-gray-100 px-5 py-3">
            <h2 className="text-sm font-semibold text-gray-700">Distribuição por Unidade</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-[11px] uppercase text-gray-400">
                  <th className="px-5 py-3 text-left">Unidade</th>
                  <th className="px-5 py-3 text-right">Clientes</th>
                  <th className="px-5 py-3 text-right">Docs Totais</th>
                  <th className="px-5 py-3 text-right">Docs Pendentes</th>
                  <th className="px-5 py-3 text-right">Colaboradores</th>
                  <th className="px-5 py-3 text-right">Cap. docs/mês</th>
                  <th className="px-5 py-3 text-right">Prazo Estimado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {unidades.map((u) => {
                  const uDocs   = documentos.filter((d) => d.id_unidade === u.id);
                  const uPendDB = uDocs.filter((d) =>
                    ["vencido", "a_vencer", "pendente_visita", "pendente_informacao",
                     "pendente_ssg", "pendente_revisao", "nao_iniciado"].includes(d.status)
                  ).length;
                  const uClients = modoManual
                    ? n(getDados(u.id).clientes)
                    : new Set(uDocs.map((d) => d.id_empresa)).size;
                  const uTotalDocs = modoManual ? n(getDados(u.id).totalDocs)  : uDocs.length;
                  const uPend      = modoManual ? n(getDados(u.id).pendentes)  : uPendDB;
                  const uColabs    = colaboradores.filter((c) => c.id_unidade === u.id);
                  const uCapDocs   = uColabs.reduce((s, c) => s + c.capacidade_docs_mes, 0);
                  const uPrazo     = uCapDocs > 0 ? Math.ceil(uPend / uCapDocs) : null;
                  return (
                    <tr key={u.id} className="hover:bg-gray-50/50">
                      <td className="px-5 py-3 font-medium text-gray-800">{u.nome}</td>
                      <td className="px-5 py-3 text-right text-gray-600">{uClients}</td>
                      <td className="px-5 py-3 text-right text-gray-600">{uTotalDocs}</td>
                      <td className="px-5 py-3 text-right">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${uPend > 0 ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"}`}>
                          {uPend}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right text-gray-600">{uColabs.length}</td>
                      <td className="px-5 py-3 text-right text-gray-600">{uCapDocs}</td>
                      <td className="px-5 py-3 text-right text-xs">
                        {uPrazo === null
                          ? <span className="text-gray-400">—</span>
                          : <span className={`font-semibold ${uPrazo <= 3 ? "text-green-600" : uPrazo <= 6 ? "text-yellow-600" : "text-red-600"}`}>{uPrazo}m</span>
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
