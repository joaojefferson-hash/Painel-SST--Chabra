"use client";

import { useState, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts";
import {
  AlertTriangle, CheckCircle2, ChevronDown, ChevronUp,
  FileText, Globe, Info, MapPin, Save, Users, Wrench,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  useProdUnidades,
  useSalvarProjecao,
} from "@/lib/hooks/useProdutividade";

// ── Helpers ────────────────────────────────────────────────────────────────

function num(v: string | number, fallback = 0) {
  return Math.max(0, Number(v) || fallback);
}

function Field({
  label, sub, value, onChange, small,
}: {
  label: string; sub?: string; value: string;
  onChange: (v: string) => void; small?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-gray-700">{label}</label>
      {sub && <p className="mb-1.5 text-[11px] text-gray-400 leading-tight">{sub}</p>}
      <input
        type="number" min={0} value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`rounded-lg border border-gray-200 px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${small ? "w-28" : "w-full"}`}
      />
    </div>
  );
}

// ── Tipos ──────────────────────────────────────────────────────────────────

interface DadosUnidade {
  totalClientes: string;
  pendInspecao:  string;
  pendDocs:      string;
}

const VAZIO: DadosUnidade = { totalClientes: "0", pendInspecao: "0", pendDocs: "0" };

type Tipo = "geral" | "por_unidade";

// ── Página ─────────────────────────────────────────────────────────────────

export default function ProjecoesPage() {
  const { data: unidades = [] } = useProdUnidades();
  const salvarMutation = useSalvarProjecao();

  // Tipo de projeção
  const [tipo, setTipo]                               = useState<Tipo>("geral");
  const [idUnidadeSel, setIdUnidadeSel]               = useState<string>("");

  // Parâmetros
  const [diasUteis,   setDiasUteis]   = useState("60");
  const [admsAtuais,  setAdmsAtuais]  = useState("15");
  const [tecsAtuais,  setTecsAtuais]  = useState("9");
  const [docsPorAdm,  setDocsPorAdm]  = useState("5");
  const [inspPorTec,  setInspPorTec]  = useState("3");

  // Dados por unidade
  const [dados, setDados] = useState<Record<string, DadosUnidade>>({});

  // Identificação para salvar
  const [titulo,      setTitulo]      = useState("");
  const [observacao,  setObservacao]  = useState("");
  const [comentarios, setComentarios] = useState("");

  // UI
  const [showCalc, setShowCalc] = useState(false);

  function getDados(id: string): DadosUnidade { return dados[id] ?? VAZIO; }
  function setDado(id: string, campo: keyof DadosUnidade, val: string) {
    setDados((prev) => ({ ...prev, [id]: { ...(prev[id] ?? VAZIO), [campo]: val } }));
  }

  // Unidades visíveis conforme o tipo
  const unidadesVisiveis = useMemo(() => {
    if (tipo === "por_unidade" && idUnidadeSel) {
      return unidades.filter((u) => u.id === idUnidadeSel);
    }
    return unidades;
  }, [tipo, idUnidadeSel, unidades]);

  // ── Totais ────────────────────────────────────────────────────────────────
  const totais = useMemo(() => {
    const ids = unidadesVisiveis.length > 0
      ? unidadesVisiveis.map((u) => u.id)
      : Object.keys(dados);
    const totalClientes = ids.reduce((s, id) => s + num(getDados(id).totalClientes), 0);
    const pendInsp      = ids.reduce((s, id) => s + num(getDados(id).pendInspecao),  0);
    const pendDocs      = ids.reduce((s, id) => s + num(getDados(id).pendDocs),      0);
    return {
      totalClientes,
      pendInsp,
      pendDocs,
      totalPend: pendInsp + pendDocs,
      emDia: Math.max(0, totalClientes - pendInsp - pendDocs),
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dados, unidadesVisiveis]);

  // ── Cálculos ──────────────────────────────────────────────────────────────
  const calc = useMemo(() => {
    const dias = num(diasUteis, 60);
    const adms = num(admsAtuais);
    const tecs = num(tecsAtuais);
    const dpa  = num(docsPorAdm, 5);
    const ipa  = num(inspPorTec, 3);

    const capDocs = adms * dpa * dias;
    const capInsp = tecs * ipa * dias;

    const admsNec = dpa * dias > 0 ? Math.ceil(totais.pendDocs / (dpa * dias)) : 0;
    const tecsNec = ipa * dias > 0 ? Math.ceil(totais.pendInsp / (ipa * dias)) : 0;
    const admsAdd = Math.max(0, admsNec - adms);
    const tecsAdd = Math.max(0, tecsNec - tecs);

    const diasNecDocs = dpa > 0 && adms > 0 ? Math.ceil(totais.pendDocs / (adms * dpa)) : Infinity;
    const diasNecInsp = ipa > 0 && tecs > 0 ? Math.ceil(totais.pendInsp / (tecs * ipa)) : Infinity;

    const pctDocs = totais.pendDocs > 0 ? Math.min(100, Math.round((capDocs / totais.pendDocs) * 100)) : 100;
    const pctInsp = totais.pendInsp > 0 ? Math.min(100, Math.round((capInsp / totais.pendInsp) * 100)) : 100;

    const semanas = [1, 2, 3, 4, 6, 8, 10, 12].filter((s) => s * 5 <= dias + 10);
    const graficoDocs = semanas.map((s) => {
      const diasS   = Math.min(s * 5, dias);
      const capAcum = adms * dpa * diasS;
      return {
        semana: `S${s}`,
        restante:    Math.max(0, totais.pendDocs - capAcum),
        processado:  Math.min(capAcum, totais.pendDocs),
      };
    });

    return {
      capDocs, capInsp,
      admsNec, tecsNec,
      admsAdd, tecsAdd,
      diasNecDocs, diasNecInsp,
      pctDocs, pctInsp,
      graficoDocs,
      okDocs: admsAdd === 0,
      okInsp: tecsAdd === 0,
    };
  }, [totais, diasUteis, admsAtuais, tecsAtuais, docsPorAdm, inspPorTec]);

  const dias    = num(diasUteis, 60);
  const semanas = Math.round(dias / 5);

  // ── Salvar ────────────────────────────────────────────────────────────────
  async function handleSalvar() {
    if (!titulo.trim()) {
      toast.error("Informe um título para salvar a projeção.");
      return;
    }
    const unidadeSel = unidades.find((u) => u.id === idUnidadeSel);
    await salvarMutation.mutateAsync({
      titulo:            titulo.trim(),
      tipo,
      id_unidade:        tipo === "por_unidade" ? idUnidadeSel || null : null,
      nome_unidade:      tipo === "por_unidade" ? (unidadeSel?.nome ?? null) : null,
      dias_uteis:        num(diasUteis, 60),
      adms_atuais:       num(admsAtuais),
      tecnicos_atuais:   num(tecsAtuais),
      docs_por_adm_dia:  num(docsPorAdm, 5),
      insp_por_tec_dia:  num(inspPorTec, 3),
      dados_unidades:    dados,
      observacao:        observacao.trim() || null,
      comentarios:       comentarios.trim() || null,
      total_clientes:    totais.totalClientes,
      pend_inspecao:     totais.pendInsp,
      pend_docs:         totais.pendDocs,
      adms_necessarios:  calc.admsNec,
      tecs_necessarios:  calc.tecsNec,
      adms_adicionais:   calc.admsAdd,
      tecs_adicionais:   calc.tecsAdd,
    });
    toast.success("Projeção salva com sucesso!");
    setTitulo("");
    setObservacao("");
    setComentarios("");
  }

  // ── JSX ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8">

      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Projeção de Necessidade de Equipe</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Calcule quantos ADMs e técnicos são necessários para zerar as pendências dentro da janela de trabalho
        </p>
      </div>

      {/* ── Tipo de projeção ─────────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-500">Tipo de Projeção</h2>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setTipo("geral")}
            className={`flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all ${tipo === "geral" ? "bg-teal-600 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            <Globe className="size-4" /> Geral (todas as unidades)
          </button>
          <button
            type="button"
            onClick={() => setTipo("por_unidade")}
            className={`flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all ${tipo === "por_unidade" ? "bg-teal-600 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            <MapPin className="size-4" /> Por Unidade
          </button>
        </div>

        {tipo === "por_unidade" && (
          <div className="mt-4">
            <label className="mb-1 block text-xs font-semibold text-gray-600">Selecione a unidade</label>
            <select
              value={idUnidadeSel}
              onChange={(e) => setIdUnidadeSel(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">— selecione —</option>
              {unidades.map((u) => (
                <option key={u.id} value={u.id}>{u.nome}{u.cidade ? ` (${u.cidade})` : ""}</option>
              ))}
            </select>
            {idUnidadeSel && (
              <p className="mt-1.5 text-xs text-teal-600 font-medium">
                Cálculos filtrados apenas para: {unidades.find((u) => u.id === idUnidadeSel)?.nome}
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── Step 1: Parâmetros ───────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 space-y-5">
        <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500">1. Parâmetros</h2>

        <div>
          <p className="mb-3 text-xs font-semibold text-gray-600">Janela de trabalho</p>
          <div>
            <Field label="Dias úteis disponíveis" value={diasUteis} onChange={setDiasUteis} small />
            <p className="mt-1.5 text-xs text-gray-400">
              ≈ <strong className="text-gray-600">{semanas} semanas</strong> / <strong className="text-gray-600">{Math.round(dias / 22)} meses</strong> — calculado com 5 dias úteis/semana e 22 dias úteis/mês
            </p>
          </div>
        </div>

        <div>
          <p className="mb-3 text-xs font-semibold text-gray-600">Equipe atual</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="ADMs (geradores de docs)"   sub="Fazem documentos SST"          value={admsAtuais} onChange={setAdmsAtuais} />
            <Field label="Técnicos de campo"           sub="Realizam inspeções"             value={tecsAtuais} onChange={setTecsAtuais} />
          </div>
        </div>

        <div>
          <p className="mb-3 text-xs font-semibold text-gray-600">Produtividade diária</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Docs por ADM por dia"         sub="Documentos finalizados em 1 dia útil"    value={docsPorAdm} onChange={setDocsPorAdm} />
            <Field label="Inspeções por técnico por dia" sub="Inspeções realizadas em 1 dia útil"     value={inspPorTec} onChange={setInspPorTec} />
          </div>
        </div>
      </div>

      {/* ── Step 2: Dados por unidade ────────────────────────────────────────── */}
      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 overflow-hidden">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500">2. Clientes por Unidade</h2>
          {tipo === "por_unidade" && idUnidadeSel && (
            <p className="mt-0.5 text-xs text-teal-600 font-medium">
              Exibindo apenas: {unidades.find((u) => u.id === idUnidadeSel)?.nome}
            </p>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-[11px] uppercase text-gray-400">
                <th className="px-5 py-3 text-left">Unidade</th>
                <th className="px-5 py-3 text-center">Total de Clientes</th>
                <th className="px-5 py-3 text-center">
                  <span className="flex items-center justify-center gap-1 text-orange-600">
                    <Wrench className="size-3" /> Pend. Inspeção
                  </span>
                </th>
                <th className="px-5 py-3 text-center">
                  <span className="flex items-center justify-center gap-1 text-blue-600">
                    <FileText className="size-3" /> Pend. Documentos
                  </span>
                </th>
                <th className="px-5 py-3 text-center text-green-600">Em Dia</th>
                <th className="px-5 py-3 text-center">% Concluído</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(unidadesVisiveis.length > 0
                ? unidadesVisiveis
                : [{ id: "__geral__", nome: "Total Geral" }]
              ).map((u) => {
                const d     = getDados(u.id);
                const total = num(d.totalClientes);
                const pInsp = num(d.pendInspecao);
                const pDocs = num(d.pendDocs);
                const emDia = Math.max(0, total - pInsp - pDocs);
                const pct   = total > 0 ? Math.round((emDia / total) * 100) : 0;
                return (
                  <tr key={u.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3 font-semibold text-gray-800">{u.nome}</td>
                    <td className="px-5 py-3 text-center">
                      <input type="number" min={0} value={d.totalClientes}
                        onChange={(e) => setDado(u.id, "totalClientes", e.target.value)}
                        className="w-24 rounded border border-gray-200 px-2 py-1.5 text-center text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </td>
                    <td className="px-5 py-3 text-center">
                      <input type="number" min={0} value={d.pendInspecao}
                        onChange={(e) => setDado(u.id, "pendInspecao", e.target.value)}
                        className="w-24 rounded border border-orange-200 bg-orange-50/50 px-2 py-1.5 text-center text-sm font-mono text-orange-800 focus:outline-none focus:ring-2 focus:ring-orange-400"
                      />
                    </td>
                    <td className="px-5 py-3 text-center">
                      <input type="number" min={0} value={d.pendDocs}
                        onChange={(e) => setDado(u.id, "pendDocs", e.target.value)}
                        className="w-24 rounded border border-blue-200 bg-blue-50/50 px-2 py-1.5 text-center text-sm font-mono text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${emDia > 0 ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {emDia}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-100">
                          <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs font-mono text-gray-500">{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {/* Totais */}
              <tr className="border-t-2 border-gray-200 bg-gray-50 text-xs font-bold">
                <td className="px-5 py-3 uppercase tracking-wide text-gray-500">Total</td>
                <td className="px-5 py-3 text-center text-gray-900">{totais.totalClientes}</td>
                <td className="px-5 py-3 text-center text-orange-700">{totais.pendInsp}</td>
                <td className="px-5 py-3 text-center text-blue-700">{totais.pendDocs}</td>
                <td className="px-5 py-3 text-center text-green-700">{totais.emDia}</td>
                <td className="px-5 py-3 text-center text-gray-600">
                  {totais.totalClientes > 0
                    ? `${Math.round((totais.emDia / totais.totalClientes) * 100)}%`
                    : "—"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Step 3: Resultado ───────────────────────────────────────────────── */}
      <div>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-500">
          3. Resultado — Janela de {diasUteis} dias úteis
          {tipo === "por_unidade" && idUnidadeSel && (
            <span className="ml-2 normal-case font-normal text-teal-600">
              · {unidades.find((u) => u.id === idUnidadeSel)?.nome}
            </span>
          )}
        </h2>

        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Total Clientes",       value: totais.totalClientes, color: "text-gray-900" },
            { label: "Em Dia",               value: totais.emDia,         color: "text-green-600" },
            { label: "Pend. Inspeção",       value: totais.pendInsp,      color: "text-orange-600" },
            { label: "Pend. Documentos",     value: totais.pendDocs,      color: "text-blue-600" },
          ].map((k) => (
            <div key={k.label} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{k.label}</p>
              <p className={`mt-1 text-2xl font-bold ${k.color}`}>{k.value}</p>
            </div>
          ))}
        </div>

        <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Docs */}
          <div className={`rounded-xl p-5 shadow-sm ring-1 ${calc.okDocs ? "bg-green-50 ring-green-200" : "bg-white ring-black/5"}`}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <FileText className="size-3.5 text-blue-600" /> Documentos SST (ADMs)
                </p>
                <p className="mt-3 text-3xl font-bold text-blue-700">{totais.pendDocs}</p>
                <p className="text-xs text-gray-400">pendências de documentos</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Capacidade atual em {diasUteis}d</p>
                <p className="mt-1 text-xl font-bold text-gray-800">{calc.capDocs.toLocaleString()}</p>
                <p className="text-xs text-gray-400">{num(admsAtuais)} ADMs × {num(docsPorAdm, 5)} docs/dia × {diasUteis}d</p>
              </div>
            </div>
            <div className="mt-3">
              <div className="mb-1 flex justify-between text-[11px] text-gray-400">
                <span>Cobertura com equipe atual</span>
                <span className="font-semibold">{calc.pctDocs}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                <div
                  className={`h-full rounded-full transition-all ${calc.pctDocs >= 100 ? "bg-green-500" : calc.pctDocs >= 70 ? "bg-yellow-500" : "bg-red-500"}`}
                  style={{ width: `${Math.min(100, calc.pctDocs)}%` }}
                />
              </div>
            </div>
            <div className="mt-3 border-t border-gray-100 pt-3">
              {calc.okDocs ? (
                <p className="flex items-center gap-1.5 text-sm font-semibold text-green-700">
                  <CheckCircle2 className="size-4" /> Equipe atual suficiente
                </p>
              ) : (
                <p className="text-sm text-red-700">
                  Leva <strong>{calc.diasNecDocs === Infinity ? "∞" : `${calc.diasNecDocs} dias`}</strong> com equipe atual — necessário <strong className="text-red-800">{calc.admsNec} ADMs</strong> (+{calc.admsAdd} a contratar)
                </p>
              )}
            </div>
          </div>

          {/* Inspeções */}
          <div className={`rounded-xl p-5 shadow-sm ring-1 ${calc.okInsp ? "bg-green-50 ring-green-200" : "bg-white ring-black/5"}`}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <Wrench className="size-3.5 text-orange-600" /> Inspeções (Técnicos)
                </p>
                <p className="mt-3 text-3xl font-bold text-orange-700">{totais.pendInsp}</p>
                <p className="text-xs text-gray-400">pendências de inspeção</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Capacidade atual em {diasUteis}d</p>
                <p className="mt-1 text-xl font-bold text-gray-800">{calc.capInsp.toLocaleString()}</p>
                <p className="text-xs text-gray-400">{num(tecsAtuais)} técs × {num(inspPorTec, 3)} insp/dia × {diasUteis}d</p>
              </div>
            </div>
            <div className="mt-3">
              <div className="mb-1 flex justify-between text-[11px] text-gray-400">
                <span>Cobertura com equipe atual</span>
                <span className="font-semibold">{calc.pctInsp}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                <div
                  className={`h-full rounded-full transition-all ${calc.pctInsp >= 100 ? "bg-green-500" : calc.pctInsp >= 70 ? "bg-yellow-500" : "bg-red-500"}`}
                  style={{ width: `${Math.min(100, calc.pctInsp)}%` }}
                />
              </div>
            </div>
            <div className="mt-3 border-t border-gray-100 pt-3">
              {calc.okInsp ? (
                <p className="flex items-center gap-1.5 text-sm font-semibold text-green-700">
                  <CheckCircle2 className="size-4" /> Equipe atual suficiente
                </p>
              ) : (
                <p className="text-sm text-red-700">
                  Leva <strong>{calc.diasNecInsp === Infinity ? "∞" : `${calc.diasNecInsp} dias`}</strong> com equipe atual — necessário <strong className="text-red-800">{calc.tecsNec} técnicos</strong> (+{calc.tecsAdd} a contratar)
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Déficit */}
        {(calc.admsAdd > 0 || calc.tecsAdd > 0) && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 size-5 shrink-0 text-red-600" />
              <div className="flex-1">
                <p className="font-bold text-red-800">Déficit de equipe para zerar em {diasUteis} dias úteis</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {calc.admsAdd > 0 && (
                    <div className="rounded-lg bg-white px-4 py-3 shadow-sm">
                      <p className="text-xs text-gray-500">ADMs necessários</p>
                      <p className="mt-0.5 text-2xl font-bold text-blue-700">{calc.admsNec} <span className="text-sm font-normal text-gray-500">total</span></p>
                      <p className="mt-0.5 text-sm">
                        <span className="font-semibold text-gray-700">{num(admsAtuais)} atual</span>
                        <span className="mx-1 text-gray-400">+</span>
                        <span className="font-bold text-red-700">{calc.admsAdd} a contratar</span>
                      </p>
                    </div>
                  )}
                  {calc.tecsAdd > 0 && (
                    <div className="rounded-lg bg-white px-4 py-3 shadow-sm">
                      <p className="text-xs text-gray-500">Técnicos necessários</p>
                      <p className="mt-0.5 text-2xl font-bold text-orange-700">{calc.tecsNec} <span className="text-sm font-normal text-gray-500">total</span></p>
                      <p className="mt-0.5 text-sm">
                        <span className="font-semibold text-gray-700">{num(tecsAtuais)} atual</span>
                        <span className="mx-1 text-gray-400">+</span>
                        <span className="font-bold text-red-700">{calc.tecsAdd} a contratar</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {calc.admsAdd === 0 && calc.tecsAdd === 0 && totais.totalPend > 0 && (
          <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-5 text-green-600" />
              <p className="font-semibold text-green-800">
                Equipe atual suficiente para zerar todas as pendências em {diasUteis} dias úteis!
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Breakdown por unidade (só em geral) ──────────────────────────────── */}
      {tipo === "geral" && unidades.length > 0 && (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/5">
          <div className="border-b border-gray-100 px-5 py-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Users className="size-4 text-teal-600" /> Necessidade por Unidade
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-[11px] uppercase text-gray-400">
                  <th className="px-5 py-3 text-left">Unidade</th>
                  <th className="px-5 py-3 text-right">Clientes</th>
                  <th className="px-5 py-3 text-right text-orange-600">Pend. Inspeção</th>
                  <th className="px-5 py-3 text-right text-blue-600">Pend. Docs</th>
                  <th className="px-5 py-3 text-right text-blue-700">ADMs Nec.</th>
                  <th className="px-5 py-3 text-right text-orange-700">Técs. Nec.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {unidades.map((u) => {
                  const d     = getDados(u.id);
                  const pInsp = num(d.pendInspecao);
                  const pDocs = num(d.pendDocs);
                  const dpa   = num(docsPorAdm, 5);
                  const ipa   = num(inspPorTec, 3);
                  const diasN = num(diasUteis, 60);
                  return (
                    <tr key={u.id} className="hover:bg-gray-50/50">
                      <td className="px-5 py-3 font-medium text-gray-800">{u.nome}</td>
                      <td className="px-5 py-3 text-right text-gray-600">{num(d.totalClientes)}</td>
                      <td className="px-5 py-3 text-right">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${pInsp > 0 ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-400"}`}>{pInsp}</span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${pDocs > 0 ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-400"}`}>{pDocs}</span>
                      </td>
                      <td className="px-5 py-3 text-right font-semibold text-blue-700">
                        {dpa * diasN > 0 ? Math.ceil(pDocs / (dpa * diasN)) : 0}
                      </td>
                      <td className="px-5 py-3 text-right font-semibold text-orange-700">
                        {ipa * diasN > 0 ? Math.ceil(pInsp / (ipa * diasN)) : 0}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Gráfico burn-down ────────────────────────────────────────────────── */}
      {num(admsAtuais) > 0 && totais.pendDocs > 0 && (
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <h2 className="mb-1 text-sm font-semibold text-gray-700">Progresso semanal — Documentos pendentes</h2>
          <p className="mb-4 text-xs text-gray-400">Com {num(admsAtuais)} ADMs fazendo {num(docsPorAdm, 5)} docs/dia</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={calc.graficoDocs} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
              <XAxis dataKey="semana" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <ReferenceLine y={0} stroke="#22c55e" strokeWidth={2}
                label={{ value: "zerado", position: "insideTopRight", fontSize: 10, fill: "#22c55e" }} />
              <Bar dataKey="processado" name="Processados"     fill="#22c55e" radius={[2, 2, 0, 0]} />
              <Bar dataKey="restante"   name="Ainda Pendentes" fill="#3b82f6" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Como calculamos ─────────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-xl bg-blue-50 ring-1 ring-blue-200">
        <button
          type="button"
          onClick={() => setShowCalc((v) => !v)}
          className="flex w-full items-center justify-between px-5 py-3 text-left"
        >
          <span className="flex items-center gap-2 text-sm font-semibold text-blue-800">
            <Info className="size-4" /> Como os cálculos funcionam
          </span>
          {showCalc ? <ChevronUp className="size-4 text-blue-600" /> : <ChevronDown className="size-4 text-blue-600" />}
        </button>
        {showCalc && (
          <div className="border-t border-blue-200 px-5 py-4 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-white/80 p-3">
                <p className="font-bold text-blue-800 mb-1">📄 ADMs necessários</p>
                <code className="block rounded bg-blue-100 px-3 py-2 text-xs font-mono text-blue-900 whitespace-pre">
{`⌈Pend.docs ÷ (Docs/ADM/dia × Dias úteis)⌉
= ⌈${totais.pendDocs} ÷ (${num(docsPorAdm, 5)} × ${num(diasUteis, 60)})⌉
= ${calc.admsNec} ADMs`}
                </code>
              </div>
              <div className="rounded-lg bg-white/80 p-3">
                <p className="font-bold text-blue-800 mb-1">🔧 Técnicos necessários</p>
                <code className="block rounded bg-blue-100 px-3 py-2 text-xs font-mono text-blue-900 whitespace-pre">
{`⌈Pend.insp ÷ (Insp/téc/dia × Dias úteis)⌉
= ⌈${totais.pendInsp} ÷ (${num(inspPorTec, 3)} × ${num(diasUteis, 60)})⌉
= ${calc.tecsNec} técnicos`}
                </code>
              </div>
              <div className="rounded-lg bg-white/80 p-3">
                <p className="font-bold text-blue-800 mb-1">📊 Capacidade atual</p>
                <code className="block rounded bg-blue-100 px-3 py-2 text-xs font-mono text-blue-900 whitespace-pre">
{`Docs: ${num(admsAtuais)} × ${num(docsPorAdm, 5)} × ${num(diasUteis, 60)} = ${calc.capDocs}
Insp: ${num(tecsAtuais)} × ${num(inspPorTec, 3)} × ${num(diasUteis, 60)} = ${calc.capInsp}`}
                </code>
              </div>
              <div className="rounded-lg bg-white/80 p-3">
                <p className="font-bold text-blue-800 mb-1">➕ A contratar</p>
                <code className="block rounded bg-blue-100 px-3 py-2 text-xs font-mono text-blue-900 whitespace-pre">
{`ADMs: max(0, ${calc.admsNec} − ${num(admsAtuais)}) = ${calc.admsAdd}
Técs: max(0, ${calc.tecsNec} − ${num(tecsAtuais)}) = ${calc.tecsAdd}`}
                </code>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Salvar Projeção ──────────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500">Salvar Projeção</h2>

        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-700">
            Título <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="Ex.: Projeção Jun/2026 — Geral"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-700">Observação</label>
          <textarea
            rows={2}
            placeholder="Contexto, premissas, cenário..."
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-700">Comentários</label>
          <textarea
            rows={3}
            placeholder="Notas internas, decisões tomadas, próximos passos..."
            value={comentarios}
            onChange={(e) => setComentarios(e.target.value)}
            className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-gray-400">
            Será salvo em <strong>Projeções Salvas</strong> com data e hora automáticas
          </p>
          <button
            type="button"
            onClick={handleSalvar}
            disabled={salvarMutation.isPending || !titulo.trim()}
            className="flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:opacity-50"
          >
            <Save className="size-4" />
            {salvarMutation.isPending ? "Salvando..." : "Salvar Projeção"}
          </button>
        </div>
      </div>

    </div>
  );
}
