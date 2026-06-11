"use client";

import { useState, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts";
import {
  AlertTriangle, CheckCircle2, ChevronDown, ChevronUp,
  FileText, Info, Users, Wrench,
} from "lucide-react";
import { useProdUnidades } from "@/lib/hooks/useProdutividade";

// ── Helpers ────────────────────────────────────────────────────────────────

function num(v: string, fallback = 0) {
  return Math.max(0, Number(v) || fallback);
}

function Field({
  label, sub, value, onChange, prefix, suffix, small,
}: {
  label: string; sub?: string; value: string;
  onChange: (v: string) => void;
  prefix?: string; suffix?: string; small?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-gray-700">{label}</label>
      {sub && <p className="mb-1.5 text-[11px] text-gray-400 leading-tight">{sub}</p>}
      <div className="flex items-center gap-1">
        {prefix && <span className="text-xs text-gray-400">{prefix}</span>}
        <input
          type="number" min={0} value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`rounded-lg border border-gray-200 px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${small ? "w-24" : "w-full"}`}
        />
        {suffix && <span className="text-xs text-gray-500">{suffix}</span>}
      </div>
    </div>
  );
}

function KpiCard({
  label, value, sub, color = "text-gray-900", highlight = false,
}: {
  label: string; value: string | number; sub?: string;
  color?: string; highlight?: boolean;
}) {
  return (
    <div className={`rounded-xl p-4 shadow-sm ${highlight ? "ring-2 ring-teal-300 bg-teal-50" : "bg-white ring-1 ring-black/5"}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-gray-400">{sub}</p>}
    </div>
  );
}

// ── Tipos ──────────────────────────────────────────────────────────────────

interface DadosUnidade {
  totalClientes:  string;
  pendInspecao:   string;
  pendDocs:       string;
}

const VAZIO: DadosUnidade = { totalClientes: "0", pendInspecao: "0", pendDocs: "0" };

// ── Página ─────────────────────────────────────────────────────────────────

export default function ProjecoesPage() {
  const { data: unidades = [] } = useProdUnidades();

  // ── Parâmetros da janela ──────────────────────────────────────────────────
  const [diasUteis,   setDiasUteis]   = useState("60");
  // ── Equipe atual ─────────────────────────────────────────────────────────
  const [admsAtuais,  setAdmsAtuais]  = useState("15");
  const [tecsAtuais,  setTecsAtuais]  = useState("9");
  // ── Produtividade diária ──────────────────────────────────────────────────
  const [docsPorAdm,  setDocsPorAdm]  = useState("5");
  const [inspPorTec,  setInspPorTec]  = useState("3");
  // ── Dados por unidade ─────────────────────────────────────────────────────
  const [dados, setDados] = useState<Record<string, DadosUnidade>>({});
  // ── UI ────────────────────────────────────────────────────────────────────
  const [showCalc, setShowCalc] = useState(false);

  function get(id: string): DadosUnidade { return dados[id] ?? VAZIO; }
  function set(id: string, campo: keyof DadosUnidade, val: string) {
    setDados((prev) => ({ ...prev, [id]: { ...(prev[id] ?? VAZIO), [campo]: val } }));
  }

  // ── Totais ────────────────────────────────────────────────────────────────
  const totais = useMemo(() => {
    const ids = unidades.length > 0 ? unidades.map((u) => u.id) : Object.keys(dados);
    const totalClientes = ids.reduce((s, id) => s + num(get(id).totalClientes), 0);
    const pendInsp      = ids.reduce((s, id) => s + num(get(id).pendInspecao),  0);
    const pendDocs      = ids.reduce((s, id) => s + num(get(id).pendDocs),      0);
    return {
      totalClientes,
      pendInsp,
      pendDocs,
      totalPend: pendInsp + pendDocs,
      emDia: Math.max(0, totalClientes - pendInsp - pendDocs),
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dados, unidades]);

  // ── Cálculos ──────────────────────────────────────────────────────────────
  const calc = useMemo(() => {
    const dias = num(diasUteis, 60);
    const adms = num(admsAtuais);
    const tecs = num(tecsAtuais);
    const dpa  = num(docsPorAdm, 5);
    const ipa  = num(inspPorTec, 3);

    // Capacidade da equipe atual na janela
    const capDocs = adms * dpa * dias;
    const capInsp = tecs * ipa * dias;

    // Quantos são necessários para zerar no prazo
    const admsNec = dpa * dias > 0 ? Math.ceil(totais.pendDocs / (dpa * dias)) : 0;
    const tecsNec = ipa * dias > 0 ? Math.ceil(totais.pendInsp / (ipa * dias)) : 0;

    // Quanto falta contratar
    const admsAdd = Math.max(0, admsNec - adms);
    const tecsAdd = Math.max(0, tecsNec - tecs);

    // Dias necessários com a equipe atual (sem contratar ninguém)
    const diasNecDocs = dpa > 0 && adms > 0 ? Math.ceil(totais.pendDocs / (adms * dpa)) : Infinity;
    const diasNecInsp = ipa > 0 && tecs > 0 ? Math.ceil(totais.pendInsp / (tecs * ipa)) : Infinity;

    // % cobertura com equipe atual
    const pctDocs = totais.pendDocs > 0 ? Math.min(100, Math.round((capDocs / totais.pendDocs) * 100)) : 100;
    const pctInsp = totais.pendInsp > 0 ? Math.min(100, Math.round((capInsp / totais.pendInsp) * 100)) : 100;

    // Gráfico: carga semanal acumulada
    const semanas = [1, 2, 3, 4, 6, 8, 10, 12].filter((s) => s * 5 <= dias + 10);
    const graficoDocs = semanas.map((s) => {
      const diasS    = Math.min(s * 5, dias);
      const capAcum  = adms * dpa * diasS;
      const restante = Math.max(0, totais.pendDocs - capAcum);
      return { semana: `S${s}`, restante, processado: Math.min(capAcum, totais.pendDocs) };
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

  const dias  = num(diasUteis, 60);
  const semanas = Math.round(dias / 5);

  return (
    <div className="space-y-8">

      {/* ── Cabeçalho ──────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Projeção de Necessidade de Equipe</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Calcule quantos ADMs e técnicos são necessários para zerar as pendências dentro da janela de trabalho
        </p>
      </div>

      {/* ── STEP 1: Janela + equipe atual + produtividade ───────────────────── */}
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 space-y-5">
        <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500">1. Parâmetros</h2>

        {/* Janela */}
        <div>
          <p className="mb-3 text-xs font-semibold text-gray-600">Janela de trabalho</p>
          <div className="flex flex-wrap items-end gap-4">
            <Field label="Dias úteis disponíveis" sub="Padrão: 60 dias úteis ≈ 3 meses" value={diasUteis} onChange={setDiasUteis} small />
            <div className="rounded-lg bg-gray-50 px-4 py-2 text-xs text-gray-500 ring-1 ring-black/5">
              ≈ <strong>{semanas} semanas</strong> / <strong>{Math.round(dias / 22)} meses</strong>
            </div>
          </div>
        </div>

        {/* Equipe atual */}
        <div>
          <p className="mb-3 text-xs font-semibold text-gray-600">Equipe atual</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="ADMs (geradores de docs)" sub="Fazem documentos SST" value={admsAtuais} onChange={setAdmsAtuais} />
            <Field label="Técnicos de campo" sub="Realizam inspeções" value={tecsAtuais} onChange={setTecsAtuais} />
          </div>
        </div>

        {/* Produtividade */}
        <div>
          <p className="mb-3 text-xs font-semibold text-gray-600">Produtividade diária (dias úteis)</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Docs por ADM por dia" sub="Documentos que um ADM finaliza em 1 dia útil" value={docsPorAdm} onChange={setDocsPorAdm} suffix="docs/dia" />
            <Field label="Inspeções por técnico por dia" sub="Inspeções que um técnico faz em 1 dia útil" value={inspPorTec} onChange={setInspPorTec} suffix="insp./dia" />
          </div>
        </div>
      </div>

      {/* ── STEP 2: Dados por unidade ────────────────────────────────────────── */}
      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 overflow-hidden">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500">2. Clientes por Unidade</h2>
          <p className="mt-0.5 text-xs text-gray-400">
            Informe o total de clientes e quantos estão pendentes de cada tipo em cada unidade
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-[11px] uppercase text-gray-400">
                <th className="px-5 py-3 text-left">Unidade</th>
                <th className="px-5 py-3 text-center">
                  <span className="text-gray-600">Total de Clientes</span>
                </th>
                <th className="px-5 py-3 text-center">
                  <span className="flex items-center justify-center gap-1 text-orange-600">
                    <Wrench className="size-3" /> Pendentes Inspeção
                  </span>
                </th>
                <th className="px-5 py-3 text-center">
                  <span className="flex items-center justify-center gap-1 text-blue-600">
                    <FileText className="size-3" /> Pendentes Documentos
                  </span>
                </th>
                <th className="px-5 py-3 text-center text-green-600">Em Dia</th>
                <th className="px-5 py-3 text-center text-gray-400">% Concluído</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(unidades.length > 0
                ? unidades
                : [{ id: "__geral__", nome: "Total (sem unidades)" }]
              ).map((u) => {
                const d       = get(u.id);
                const total   = num(d.totalClientes);
                const pInsp   = num(d.pendInspecao);
                const pDocs   = num(d.pendDocs);
                const emDia   = Math.max(0, total - pInsp - pDocs);
                const pct     = total > 0 ? Math.round(((emDia) / total) * 100) : 0;
                return (
                  <tr key={u.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3 font-semibold text-gray-800">{u.nome}</td>
                    <td className="px-5 py-3 text-center">
                      <input
                        type="number" min={0} value={d.totalClientes}
                        onChange={(e) => set(u.id, "totalClientes", e.target.value)}
                        className="w-24 rounded border border-gray-200 px-2 py-1.5 text-center text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </td>
                    <td className="px-5 py-3 text-center">
                      <input
                        type="number" min={0} value={d.pendInspecao}
                        onChange={(e) => set(u.id, "pendInspecao", e.target.value)}
                        className="w-24 rounded border border-orange-200 bg-orange-50/50 px-2 py-1.5 text-center text-sm font-mono text-orange-800 focus:outline-none focus:ring-2 focus:ring-orange-400"
                      />
                    </td>
                    <td className="px-5 py-3 text-center">
                      <input
                        type="number" min={0} value={d.pendDocs}
                        onChange={(e) => set(u.id, "pendDocs", e.target.value)}
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

              {/* Linha de totais */}
              <tr className="border-t-2 border-gray-200 bg-gray-50 text-xs font-bold">
                <td className="px-5 py-3 uppercase tracking-wide text-gray-500">Total Geral</td>
                <td className="px-5 py-3 text-center text-gray-900">{totais.totalClientes}</td>
                <td className="px-5 py-3 text-center text-orange-700">{totais.pendInsp}</td>
                <td className="px-5 py-3 text-center text-blue-700">{totais.pendDocs}</td>
                <td className="px-5 py-3 text-center text-green-700">{totais.emDia}</td>
                <td className="px-5 py-3 text-center text-gray-600">
                  {totais.totalClientes > 0 ? `${Math.round((totais.emDia / totais.totalClientes) * 100)}%` : "—"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ── STEP 3: Resultado ───────────────────────────────────────────────── */}
      <div>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-500">3. Resultado — Janela de {diasUteis} dias úteis</h2>

        {/* Situação atual da equipe */}
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <KpiCard label="Total Clientes"       value={totais.totalClientes} sub="carteira total" />
          <KpiCard label="Em Dia"               value={totais.emDia}         sub="documentos regularizados" color="text-green-600" />
          <KpiCard label="Pendentes Inspeção"   value={totais.pendInsp}      sub="aguardam técnico"          color="text-orange-600" />
          <KpiCard label="Pendentes Documentos" value={totais.pendDocs}      sub="aguardam ADM"              color="text-blue-600" />
        </div>

        {/* Capacidade vs Necessidade */}
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
                <p className="text-xs text-gray-400">docs ({num(admsAtuais)} ADMs × {num(docsPorAdm,5)} docs/dia × {diasUteis}d)</p>
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
                  Equipe atual leva <strong>{calc.diasNecDocs === Infinity ? "∞" : `${calc.diasNecDocs} dias`}</strong> — são necessários <strong className="text-red-800">{calc.admsNec} ADMs</strong> (+{calc.admsAdd} a contratar)
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
                <p className="text-xs text-gray-400">inspeções ({num(tecsAtuais)} técs. × {num(inspPorTec,3)} insp./dia × {diasUteis}d)</p>
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
                  Equipe atual leva <strong>{calc.diasNecInsp === Infinity ? "∞" : `${calc.diasNecInsp} dias`}</strong> — são necessários <strong className="text-red-800">{calc.tecsNec} técnicos</strong> (+{calc.tecsAdd} a contratar)
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Cards de contratação necessária */}
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
                      <p className="mt-0.5 text-2xl font-bold text-blue-700">{calc.admsNec} <span className="text-sm text-gray-500 font-normal">total</span></p>
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
                      <p className="mt-0.5 text-2xl font-bold text-orange-700">{calc.tecsNec} <span className="text-sm text-gray-500 font-normal">total</span></p>
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

      {/* ── Gráfico de progresso semanal ────────────────────────────────────── */}
      {num(admsAtuais) > 0 && totais.pendDocs > 0 && (
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <h2 className="mb-1 text-sm font-semibold text-gray-700">Progresso semanal — Documentos pendentes</h2>
          <p className="mb-4 text-xs text-gray-400">Com {num(admsAtuais)} ADMs fazendo {num(docsPorAdm,5)} docs/dia</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={calc.graficoDocs} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
              <XAxis dataKey="semana" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <ReferenceLine y={0} stroke="#22c55e" strokeWidth={2}
                label={{ value: "0 pendências", position: "insideTopRight", fontSize: 10, fill: "#22c55e" }} />
              <Bar dataKey="processado" name="Processados"    fill="#22c55e" radius={[2, 2, 0, 0]} />
              <Bar dataKey="restante"   name="Ainda Pendentes" fill="#3b82f6" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Por unidade: detalhado ───────────────────────────────────────────── */}
      {unidades.length > 0 && (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/5">
          <div className="border-b border-gray-100 px-5 py-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Users className="size-4 text-teal-600" /> Necessidade por Unidade
            </h2>
            <p className="mt-0.5 text-xs text-gray-400">
              ADMs e técnicos necessários por unidade para cobrir em {diasUteis} dias úteis
            </p>
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
                  <th className="px-5 py-3 text-right">Concluído</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {unidades.map((u) => {
                  const d       = get(u.id);
                  const total   = num(d.totalClientes);
                  const pInsp   = num(d.pendInspecao);
                  const pDocs   = num(d.pendDocs);
                  const emDia   = Math.max(0, total - pInsp - pDocs);
                  const pct     = total > 0 ? Math.round((emDia / total) * 100) : 0;
                  const dpa     = num(docsPorAdm, 5);
                  const ipa     = num(inspPorTec, 3);
                  const diasN   = num(diasUteis, 60);
                  const admsU   = dpa * diasN > 0 ? Math.ceil(pDocs / (dpa * diasN)) : 0;
                  const tecsU   = ipa * diasN > 0 ? Math.ceil(pInsp / (ipa * diasN)) : 0;
                  return (
                    <tr key={u.id} className="hover:bg-gray-50/50">
                      <td className="px-5 py-3 font-medium text-gray-800">{u.nome}</td>
                      <td className="px-5 py-3 text-right text-gray-600">{total}</td>
                      <td className="px-5 py-3 text-right">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${pInsp > 0 ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-400"}`}>{pInsp}</span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${pDocs > 0 ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-400"}`}>{pDocs}</span>
                      </td>
                      <td className="px-5 py-3 text-right font-semibold text-blue-700">{admsU}</td>
                      <td className="px-5 py-3 text-right font-semibold text-orange-700">{tecsU}</td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <div className="h-1.5 w-14 overflow-hidden rounded-full bg-gray-100">
                            <div className="h-full rounded-full bg-green-500" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs font-mono text-gray-500">{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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
          <div className="border-t border-blue-200 px-5 py-4 text-sm text-blue-900 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">

              <div className="rounded-lg bg-white/80 p-3">
                <p className="font-bold text-blue-800 mb-1">📄 ADMs necessários</p>
                <p className="text-xs text-gray-500 mb-1.5">Mínimo de ADMs para zerar os documentos pendentes no prazo.</p>
                <code className="block rounded bg-blue-100 px-3 py-2 text-xs font-mono text-blue-900 whitespace-pre">
{`⌈Pendentes docs ÷ (Docs/ADM/dia × Dias úteis)⌉
= ⌈${totais.pendDocs} ÷ (${num(docsPorAdm,5)} × ${num(diasUteis,60)})⌉
= ${calc.admsNec} ADMs`}
                </code>
              </div>

              <div className="rounded-lg bg-white/80 p-3">
                <p className="font-bold text-blue-800 mb-1">🔧 Técnicos necessários</p>
                <p className="text-xs text-gray-500 mb-1.5">Mínimo de técnicos para cobrir todas as inspeções pendentes.</p>
                <code className="block rounded bg-blue-100 px-3 py-2 text-xs font-mono text-blue-900 whitespace-pre">
{`⌈Pendentes inspeção ÷ (Insp/téc/dia × Dias úteis)⌉
= ⌈${totais.pendInsp} ÷ (${num(inspPorTec,3)} × ${num(diasUteis,60)})⌉
= ${calc.tecsNec} técnicos`}
                </code>
              </div>

              <div className="rounded-lg bg-white/80 p-3">
                <p className="font-bold text-blue-800 mb-1">📊 Capacidade da equipe atual</p>
                <code className="block rounded bg-blue-100 px-3 py-2 text-xs font-mono text-blue-900 whitespace-pre">
{`Docs: ${num(admsAtuais)} ADMs × ${num(docsPorAdm,5)} docs/dia × ${num(diasUteis,60)} dias = ${calc.capDocs}
Insp: ${num(tecsAtuais)} técs × ${num(inspPorTec,3)} insp/dia × ${num(diasUteis,60)} dias = ${calc.capInsp}`}
                </code>
              </div>

              <div className="rounded-lg bg-white/80 p-3">
                <p className="font-bold text-blue-800 mb-1">➕ Contratações necessárias</p>
                <code className="block rounded bg-blue-100 px-3 py-2 text-xs font-mono text-blue-900 whitespace-pre">
{`ADMs a contratar = max(0, ${calc.admsNec} − ${num(admsAtuais)}) = ${calc.admsAdd}
Técs a contratar = max(0, ${calc.tecsNec} − ${num(tecsAtuais)}) = ${calc.tecsAdd}`}
                </code>
              </div>

            </div>
          </div>
        )}
      </div>

    </div>
  );
}
