"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowLeftRight,
  Search,
  Loader2,
  FileDown,
  X,
  Package,
  CheckSquare,
  Square,
} from "lucide-react";
import toast from "react-hot-toast";
import { useInventarioMaquinas } from "@/lib/hooks/useInventarioMaquinas";
import {
  useTransferencias,
  useRegistrarTransferencia,
} from "@/lib/hooks/useTransferencias";
import { useCanCreate } from "@/lib/hooks/useUsuario";
import { categoriaInventario } from "@/lib/inventario/categorias";
import type { Maquina } from "@/lib/supabase/types";

function fmtDataHora(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

const inputCls =
  "w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

export default function TransferenciaPage() {
  const canCreate = useCanCreate();
  const { data: maquinas = [] } = useInventarioMaquinas();
  const { data: transferencias = [], isLoading: loadingHist } = useTransferencias();
  const registrar = useRegistrarTransferencia();

  // Só equipamentos (material interno da Chabra) são transferíveis.
  const equipamentos = useMemo(
    () => maquinas.filter((m) => categoriaInventario(m) === "equipamentos"),
    [maquinas],
  );

  // ── Registro ────────────────────────────────────────────────────────────────
  const [busca, setBusca] = useState("");
  const [sel, setSel] = useState<Maquina | null>(null);
  const [paraUnidade, setParaUnidade] = useState("");
  const [paraLocal, setParaLocal] = useState("");
  const [paraResp, setParaResp] = useState("");
  const [motivo, setMotivo] = useState("");
  const [obs, setObs] = useState("");

  const encontrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return [];
    return equipamentos
      .filter((m) =>
        [m.nome, m.id_maquina, m.codigo_interno, m.tag, m.modelo]
          .filter(Boolean)
          .some((v) => v!.toLowerCase().includes(q)),
      )
      .slice(0, 8);
  }, [equipamentos, busca]);

  function limparForm() {
    setSel(null);
    setBusca("");
    setParaUnidade("");
    setParaLocal("");
    setParaResp("");
    setMotivo("");
    setObs("");
  }

  async function handleRegistrar() {
    if (!sel) {
      toast.error("Selecione o equipamento a transferir.");
      return;
    }
    if (!paraUnidade.trim() && !paraLocal.trim() && !paraResp.trim()) {
      toast.error("Informe ao menos o destino (unidade, local ou responsável).");
      return;
    }
    try {
      await registrar.mutateAsync({
        maquina: sel,
        para_unidade: paraUnidade.trim() || null,
        para_localizacao: paraLocal.trim() || null,
        para_responsavel: paraResp.trim() || null,
        motivo: motivo.trim() || null,
        observacoes: obs.trim() || null,
      });
      toast.success("Transferência registrada");
      limparForm();
    } catch {
      // toast já tratado no hook
    }
  }

  // ── Histórico + PDF ──────────────────────────────────────────────────────────
  const [selecionadas, setSelecionadas] = useState<Set<string>>(new Set());
  const todasMarcadas = transferencias.length > 0 && selecionadas.size === transferencias.length;

  function toggle(id: string) {
    setSelecionadas((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }
  function toggleTodas() {
    setSelecionadas((prev) =>
      prev.size === transferencias.length ? new Set() : new Set(transferencias.map((t) => t.id_transferencia)),
    );
  }

  function gerarPdf() {
    if (selecionadas.size === 0) {
      toast.error("Selecione ao menos uma transferência.");
      return;
    }
    const ids = Array.from(selecionadas).join(",");
    window.open(`/api/pdf/transferencias?ids=${encodeURIComponent(ids)}`, "_blank");
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/inventario-maquinas/equipamentos"
          className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-verde-primary"
        >
          <ArrowLeft className="size-3.5" /> Equipamentos
        </Link>
      </div>

      <div>
        <h1 className="flex items-center gap-2 text-xl font-semibold text-gray-900">
          <ArrowLeftRight className="size-5 text-blue-600" />
          Transferência de Equipamentos
        </h1>
        <p className="text-sm text-gray-600">
          Registre a movimentação de um equipamento interno da Chabra e emita o comprovante em PDF.
        </p>
      </div>

      {/* ── Registrar transferência ── */}
      {canCreate && (
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-600">
            Registrar transferência
          </h2>

          {/* Busca de equipamento */}
          {!sel ? (
            <div>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar equipamento por nome, ID, código interno, tag ou modelo..."
                  className={`${inputCls} pl-9`}
                />
              </div>
              {busca.trim() && (
                <ul className="mt-2 divide-y divide-gray-100 rounded-md border border-gray-200">
                  {encontrados.length === 0 ? (
                    <li className="px-3 py-2 text-sm text-gray-500">Nenhum equipamento encontrado.</li>
                  ) : (
                    encontrados.map((m) => (
                      <li key={m.id_maquina}>
                        <button
                          type="button"
                          onClick={() => setSel(m)}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-blue-50"
                        >
                          <Package className="size-4 shrink-0 text-blue-500" />
                          <span className="font-medium text-gray-900">{m.nome}</span>
                          <span className="text-xs text-gray-500">
                            {[m.codigo_interno, m.tag, m.modelo].filter(Boolean).join(" · ")}
                          </span>
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Equipamento selecionado */}
              <div className="flex items-start justify-between gap-3 rounded-lg border border-blue-200 bg-blue-50/50 p-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{sel.nome}</p>
                  <p className="text-xs text-gray-600">
                    {[sel.codigo_interno && `Cód. ${sel.codigo_interno}`, sel.tag && `TAG ${sel.tag}`, sel.modelo, sel.numero_serie && `Série ${sel.numero_serie}`]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    <strong>Origem atual:</strong>{" "}
                    {[sel.unidade, sel.localizacao, sel.responsavel_setor].filter(Boolean).join(" · ") || "não informada"}
                  </p>
                </div>
                <button type="button" onClick={() => setSel(null)} className="shrink-0 rounded p-1 text-gray-400 hover:bg-white hover:text-gray-600">
                  <X className="size-4" />
                </button>
              </div>

              {/* Destino */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Campo label="Para — Unidade">
                  <input type="text" value={paraUnidade} onChange={(e) => setParaUnidade(e.target.value)} placeholder="Ex: Filial Piabetá" className={inputCls} />
                </Campo>
                <Campo label="Para — Localização">
                  <input type="text" value={paraLocal} onChange={(e) => setParaLocal(e.target.value)} placeholder="Ex: Sala técnica" className={inputCls} />
                </Campo>
                <Campo label="Para — Responsável">
                  <input type="text" value={paraResp} onChange={(e) => setParaResp(e.target.value)} placeholder="Quem passa a responder" className={inputCls} />
                </Campo>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Campo label="Motivo">
                  <input type="text" value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ex: Empréstimo, realocação..." className={inputCls} />
                </Campo>
                <Campo label="Observações">
                  <input type="text" value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Detalhes adicionais" className={inputCls} />
                </Campo>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-3">
                <button type="button" onClick={limparForm} className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleRegistrar}
                  disabled={registrar.isPending}
                  className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {registrar.isPending ? <Loader2 className="size-4 animate-spin" /> : <ArrowLeftRight className="size-4" />}
                  Registrar transferência
                </button>
              </div>
              <p className="text-[11px] text-gray-400">
                Ao registrar, a localização atual do equipamento é atualizada para o destino informado.
              </p>
            </div>
          )}
        </section>
      )}

      {/* ── Registro de transferências (histórico) ── */}
      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-600">
            Registro de transferências
          </h2>
          <button
            type="button"
            onClick={gerarPdf}
            disabled={selecionadas.size === 0}
            className="inline-flex items-center gap-1.5 rounded-md border border-blue-300 bg-white px-3 py-1.5 text-sm font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-40"
          >
            <FileDown className="size-4" /> Gerar PDF{selecionadas.size > 0 ? ` (${selecionadas.size})` : ""}
          </button>
        </div>

        {loadingHist ? (
          <div className="flex items-center justify-center py-8 text-gray-500">
            <Loader2 className="size-4 animate-spin" />
          </div>
        ) : transferencias.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-500">
            Nenhuma transferência registrada ainda.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wider text-gray-500">
                  <th className="w-8 py-2">
                    <button type="button" onClick={toggleTodas} className="text-gray-500 hover:text-blue-600" title="Selecionar tudo">
                      {todasMarcadas ? <CheckSquare className="size-4" /> : <Square className="size-4" />}
                    </button>
                  </th>
                  <th className="py-2 pr-3">Equipamento</th>
                  <th className="py-2 pr-3">De → Para</th>
                  <th className="py-2 pr-3">Responsável</th>
                  <th className="py-2 pr-3">Data / hora</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transferencias.map((t) => {
                  const marcada = selecionadas.has(t.id_transferencia);
                  const de = [t.de_unidade, t.de_localizacao, t.de_responsavel].filter(Boolean).join(" · ") || "—";
                  const para = [t.para_unidade, t.para_localizacao, t.para_responsavel].filter(Boolean).join(" · ") || "—";
                  return (
                    <tr key={t.id_transferencia} className={marcada ? "bg-blue-50/50" : undefined}>
                      <td className="py-2">
                        <button type="button" onClick={() => toggle(t.id_transferencia)} className="text-gray-500 hover:text-blue-600">
                          {marcada ? <CheckSquare className="size-4 text-blue-600" /> : <Square className="size-4" />}
                        </button>
                      </td>
                      <td className="py-2 pr-3">
                        <p className="font-medium text-gray-900">{t.maquina_nome ?? "—"}</p>
                        <p className="text-xs text-gray-500">
                          {[t.maquina_codigo_interno, t.maquina_tag, t.maquina_modelo].filter(Boolean).join(" · ")}
                        </p>
                      </td>
                      <td className="py-2 pr-3 text-xs text-gray-600">
                        <span className="text-gray-400">{de}</span>
                        <span className="mx-1 text-blue-500">→</span>
                        <span className="font-medium text-gray-800">{para}</span>
                      </td>
                      <td className="py-2 pr-3 text-xs text-gray-600">{t.responsavel_nome ?? "—"}</td>
                      <td className="py-2 pr-3 whitespace-nowrap text-xs text-gray-600">{fmtDataHora(t.data_hora)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-gray-600">{label}</span>
      {children}
    </label>
  );
}
