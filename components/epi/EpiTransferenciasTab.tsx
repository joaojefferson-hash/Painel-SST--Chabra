"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2, Loader2, ArrowRightLeft, ArrowRight, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import EmpresaSelect from "@/components/empresas/EmpresaSelect";
import { inputCls, labelCls } from "@/components/epi/EpiModal";
import { useEpiCatalogo, useEpiSaldo, useEpiTransferencias, useTransferir } from "@/lib/hooks/useEpi";
import type { EpiTransferItemInput } from "@/lib/epi/types";

const fmtDataHora = (iso: string) => new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
interface Linha { id_catalogo_origem: string; quantidade: string; id_catalogo_destino: string }

export default function EpiTransferenciasTab({ empresaId, canEdit }: { empresaId: string; canEdit: boolean }) {
  const { data: catalogoOrigem = [] } = useEpiCatalogo(empresaId);
  const { data: saldo } = useEpiSaldo(empresaId);
  const { data: transferencias = [], isLoading } = useEpiTransferencias(empresaId);
  const transferir = useTransferir();

  const [destino, setDestino] = useState<string | null>(null);
  const { data: catalogoDestino = [] } = useEpiCatalogo(destino);
  const [obs, setObs] = useState("");
  const [linhas, setLinhas] = useState<Linha[]>([{ id_catalogo_origem: "", quantidade: "", id_catalogo_destino: "" }]);

  const ativosOrigem = useMemo(() => catalogoOrigem.filter((c) => c.ativo && (saldo?.get(c.id) ?? 0) > 0), [catalogoOrigem, saldo]);
  const setLinha = (i: number, patch: Partial<Linha>) => setLinhas((a) => a.map((l, idx) => idx === i ? { ...l, ...patch } : l));
  const addLinha = () => setLinhas((a) => [...a, { id_catalogo_origem: "", quantidade: "", id_catalogo_destino: "" }]);
  const rmLinha = (i: number) => setLinhas((a) => a.length > 1 ? a.filter((_, idx) => idx !== i) : a);

  function salvar() {
    if (!destino) { toast.error("Selecione a empresa de destino"); return; }
    if (destino === empresaId) { toast.error("Origem e destino devem ser diferentes"); return; }
    const itens: EpiTransferItemInput[] = [];
    for (const l of linhas) {
      if (!l.id_catalogo_origem) continue;
      const q = Number(l.quantidade);
      if (!(q > 0)) { toast.error("Quantidade inválida em algum item"); return; }
      const disp = saldo?.get(l.id_catalogo_origem) ?? 0;
      if (q > disp) { toast.error(`Saldo insuficiente para ${catalogoOrigem.find((c) => c.id === l.id_catalogo_origem)?.nome ?? "item"} (disponível ${disp})`); return; }
      itens.push({ id_catalogo_origem: l.id_catalogo_origem, quantidade: q, id_catalogo_destino: l.id_catalogo_destino || null });
    }
    if (itens.length === 0) { toast.error("Adicione ao menos um item"); return; }
    transferir.mutate(
      { empresa_origem: empresaId, empresa_destino: destino, observacao: obs, itens },
      { onSuccess: () => { setLinhas([{ id_catalogo_origem: "", quantidade: "", id_catalogo_destino: "" }]); setObs(""); } },
    );
  }

  return (
    <div className="space-y-5">
      {canEdit && (
        ativosOrigem.length === 0 ? (
          <p className="rounded-md border border-dashed border-amber-300 bg-amber-50 p-4 text-center text-sm text-amber-800">
            Sem itens com saldo nesta empresa para transferir.
          </p>
        ) : (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
            <div className="mb-3">
              <label className={labelCls}>Transferir para (empresa de destino)</label>
              <EmpresaSelect value={destino} onChange={setDestino} placeholder="Selecione a empresa de destino…" />
            </div>

            <label className={labelCls}>Itens</label>
            <div className="space-y-2">
              {linhas.map((l, i) => {
                const disp = l.id_catalogo_origem ? (saldo?.get(l.id_catalogo_origem) ?? 0) : null;
                const excede = disp !== null && Number(l.quantidade) > disp;
                return (
                  <div key={i} className="flex flex-wrap items-center gap-2">
                    <select className={`${inputCls} flex-1 min-w-[160px]`} value={l.id_catalogo_origem} onChange={(e) => setLinha(i, { id_catalogo_origem: e.target.value })}>
                      <option value="">EPI de origem…</option>
                      {ativosOrigem.map((c) => <option key={c.id} value={c.id}>{c.nome} — saldo {saldo?.get(c.id) ?? 0}</option>)}
                    </select>
                    <input type="number" min={0} step="any" placeholder="Qtd." className={`${inputCls} w-20 ${excede ? "border-red-400" : ""}`} value={l.quantidade} onChange={(e) => setLinha(i, { quantidade: e.target.value })} />
                    <select className={`${inputCls} min-w-[150px]`} value={l.id_catalogo_destino} onChange={(e) => setLinha(i, { id_catalogo_destino: e.target.value })} disabled={!destino}>
                      <option value="">Criar novo no destino</option>
                      {catalogoDestino.filter((c) => c.ativo).map((c) => <option key={c.id} value={c.id}>Somar em: {c.nome}</option>)}
                    </select>
                    <button type="button" onClick={() => rmLinha(i)} className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-alert" title="Remover"><Trash2 className="size-3.5" /></button>
                  </div>
                );
              })}
              <button type="button" onClick={addLinha} className="inline-flex items-center gap-1 text-xs font-medium text-verde-primary hover:underline"><Plus className="size-3.5" /> Adicionar item</button>
            </div>

            <div className="mt-3"><label className={labelCls}>Observação</label><input className={inputCls} value={obs} onChange={(e) => setObs(e.target.value)} placeholder="opcional" /></div>

            <div className="mt-3 flex justify-end">
              <button type="button" onClick={salvar} disabled={transferir.isPending} className="inline-flex items-center gap-1.5 rounded-md bg-verde-primary px-3 py-2 text-sm font-semibold text-white hover:bg-verde-accent disabled:opacity-60">
                {transferir.isPending ? <Loader2 className="size-4 animate-spin" /> : <ArrowRightLeft className="size-4" />} Transferir
              </button>
            </div>
          </div>
        )
      )}

      {/* Histórico */}
      <div>
        <h4 className="mb-2 text-sm font-semibold text-gray-900">Transferências</h4>
        {isLoading ? (
          <p className="text-sm text-gray-500">Carregando…</p>
        ) : transferencias.length === 0 ? (
          <p className="rounded-md border border-dashed border-gray-300 bg-gray-50 p-4 text-center text-sm text-gray-500">Nenhuma transferência envolvendo esta empresa.</p>
        ) : (
          <ul className="space-y-2">
            {transferencias.map((t) => {
              const enviada = t.empresa_origem === empresaId;
              const outra = enviada ? t.destino?.nome_empresa : t.origem?.nome_empresa;
              return (
                <li key={t.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm">
                  {enviada ? <ArrowRight className="size-4 text-red-alert" /> : <ArrowLeft className="size-4 text-emerald-600" />}
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${enviada ? "bg-red-50 text-red-alert" : "bg-emerald-50 text-emerald-700"}`}>{enviada ? "Enviada" : "Recebida"}</span>
                  <span className="font-medium text-gray-900">{enviada ? "para" : "de"} {outra ?? "—"}</span>
                  <span className="text-xs text-gray-500">{t.total_itens} {t.total_itens === 1 ? "item" : "itens"}{t.observacao ? ` · ${t.observacao}` : ""}</span>
                  <span className="ml-auto text-xs text-gray-400">{fmtDataHora(t.criado_em)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
