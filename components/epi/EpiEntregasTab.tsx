"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2, Loader2, Package, AlertTriangle, PenLine, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import BotaoGerarPdf from "@/components/ui/BotaoGerarPdf";
import { inputCls, labelCls } from "@/components/epi/EpiModal";
import EpiAssinaturaModal from "@/components/epi/EpiAssinaturaModal";
import { useEpiColaboradores, useEpiCatalogo, useEpiSaldo, useEpiEntregas, useRegistrarEntrega } from "@/lib/hooks/useEpi";
import type { EpiEntregaItemInput, EpiEntrega } from "@/lib/epi/types";

const hoje = () => {
  const d = new Date(); const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
};
const fmtData = (iso: string) => iso ? iso.split("T")[0].split("-").reverse().join("/") : "—";

interface Linha { id_catalogo: string; quantidade: string }

export default function EpiEntregasTab({ empresaId, canEdit }: { empresaId: string; canEdit: boolean }) {
  const { data: colaboradores = [] } = useEpiColaboradores(empresaId);
  const { data: catalogo = [] } = useEpiCatalogo(empresaId);
  const { data: saldo } = useEpiSaldo(empresaId);
  const { data: entregas = [], isLoading } = useEpiEntregas(empresaId);
  const registrar = useRegistrarEntrega();

  const ativos = useMemo(() => catalogo.filter((c) => c.ativo), [catalogo]);
  const colabAtivos = useMemo(() => colaboradores.filter((c) => c.ativo), [colaboradores]);

  const [idColab, setIdColab] = useState("");
  const [data, setData] = useState(hoje());
  const [resp, setResp] = useState("");
  const [obs, setObs] = useState("");
  const [linhas, setLinhas] = useState<Linha[]>([{ id_catalogo: "", quantidade: "" }]);
  const [assinar, setAssinar] = useState<EpiEntrega | null>(null);

  const setLinha = (i: number, patch: Partial<Linha>) => setLinhas((a) => a.map((l, idx) => idx === i ? { ...l, ...patch } : l));
  const addLinha = () => setLinhas((a) => [...a, { id_catalogo: "", quantidade: "" }]);
  const rmLinha = (i: number) => setLinhas((a) => a.length > 1 ? a.filter((_, idx) => idx !== i) : a);

  function salvar() {
    if (!idColab) { toast.error("Selecione o colaborador"); return; }
    const itens: EpiEntregaItemInput[] = [];
    for (const l of linhas) {
      if (!l.id_catalogo) continue;
      const q = Number(l.quantidade);
      if (!(q > 0)) { toast.error("Quantidade inválida em algum item"); return; }
      const disp = saldo?.get(l.id_catalogo) ?? 0;
      if (q > disp) { toast.error(`Saldo insuficiente para ${catalogo.find((c) => c.id === l.id_catalogo)?.nome ?? "item"} (disponível ${disp})`); return; }
      itens.push({ id_catalogo: l.id_catalogo, quantidade: q });
    }
    if (itens.length === 0) { toast.error("Adicione ao menos um item"); return; }
    registrar.mutate(
      { empresa_id: empresaId, id_colaborador: idColab, data_entrega: data, responsavel: resp, observacao: obs, itens },
      { onSuccess: () => { setIdColab(""); setResp(""); setObs(""); setLinhas([{ id_catalogo: "", quantidade: "" }]); } },
    );
  }

  return (
    <div className="space-y-5">
      {canEdit && (
        colabAtivos.length === 0 || ativos.length === 0 ? (
          <p className="rounded-md border border-dashed border-amber-300 bg-amber-50 p-4 text-center text-sm text-amber-800">
            Cadastre <strong>colaboradores</strong> e itens no <strong>catálogo</strong> (com estoque) para registrar entregas.
          </p>
        ) : (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="col-span-2"><label className={labelCls}>Colaborador</label>
                <select className={inputCls} value={idColab} onChange={(e) => setIdColab(e.target.value)}>
                  <option value="">Selecione…</option>
                  {colabAtivos.map((c) => <option key={c.id} value={c.id}>{c.nome}{c.cargo ? ` · ${c.cargo}` : ""}</option>)}
                </select>
              </div>
              <div><label className={labelCls}>Data</label><input type="date" className={inputCls} value={data} onChange={(e) => setData(e.target.value)} /></div>
              <div><label className={labelCls}>Responsável</label><input className={inputCls} value={resp} onChange={(e) => setResp(e.target.value)} /></div>
            </div>

            <div className="mt-3 space-y-2">
              <label className={labelCls}>Itens</label>
              {linhas.map((l, i) => {
                const disp = l.id_catalogo ? (saldo?.get(l.id_catalogo) ?? 0) : null;
                const q = Number(l.quantidade);
                const excede = disp !== null && q > disp;
                return (
                  <div key={i} className="flex flex-wrap items-center gap-2">
                    <select className={`${inputCls} flex-1 min-w-[180px]`} value={l.id_catalogo} onChange={(e) => setLinha(i, { id_catalogo: e.target.value })}>
                      <option value="">Selecione o EPI…</option>
                      {ativos.map((c) => <option key={c.id} value={c.id}>{c.nome} — saldo {saldo?.get(c.id) ?? 0}{c.unidade ? ` ${c.unidade}` : ""}</option>)}
                    </select>
                    <input type="number" min={0} step="any" placeholder="Qtd." className={`${inputCls} w-24 ${excede ? "border-red-400" : ""}`} value={l.quantidade} onChange={(e) => setLinha(i, { quantidade: e.target.value })} />
                    {disp !== null && <span className={`text-xs ${excede ? "text-red-alert" : "text-gray-400"}`}>{excede ? `> saldo ${disp}` : `saldo ${disp}`}</span>}
                    <button type="button" onClick={() => rmLinha(i)} className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-alert" title="Remover linha"><Trash2 className="size-3.5" /></button>
                  </div>
                );
              })}
              <button type="button" onClick={addLinha} className="inline-flex items-center gap-1 text-xs font-medium text-verde-primary hover:underline"><Plus className="size-3.5" /> Adicionar item</button>
            </div>

            <div className="mt-3"><label className={labelCls}>Observação</label><input className={inputCls} value={obs} onChange={(e) => setObs(e.target.value)} placeholder="opcional" /></div>

            <div className="mt-3 flex justify-end">
              <button type="button" onClick={salvar} disabled={registrar.isPending} className="inline-flex items-center gap-1.5 rounded-md bg-verde-primary px-3 py-2 text-sm font-semibold text-white hover:bg-verde-accent disabled:opacity-60">
                {registrar.isPending ? <Loader2 className="size-4 animate-spin" /> : <Package className="size-4" />} Registrar entrega
              </button>
            </div>
          </div>
        )
      )}

      {/* Histórico */}
      <div>
        <h4 className="mb-2 text-sm font-semibold text-gray-900">Entregas registradas</h4>
        {isLoading ? (
          <p className="text-sm text-gray-500">Carregando…</p>
        ) : entregas.length === 0 ? (
          <p className="rounded-md border border-dashed border-gray-300 bg-gray-50 p-4 text-center text-sm text-gray-500">Nenhuma entrega registrada.</p>
        ) : (
          <ul className="space-y-2">
            {entregas.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{e.colaborador?.nome ?? "—"}</div>
                  <div className="text-xs text-gray-500">{fmtData(e.data_entrega)} · {e.total_itens} {e.total_itens === 1 ? "item" : "itens"}{e.responsavel_entrega ? ` · por ${e.responsavel_entrega}` : ""}</div>
                </div>
                {(e.assinaturas?.length ?? 0) > 0 ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700"><CheckCircle2 className="size-3" /> Assinada</span>
                ) : (
                  <>
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700"><AlertTriangle className="size-3" /> Sem assinatura</span>
                    {canEdit && (
                      <button type="button" onClick={() => setAssinar(e)} className="inline-flex items-center gap-1 rounded-md border border-verde-primary/40 px-2 py-1 text-xs font-medium text-verde-primary hover:bg-verde-primary/5">
                        <PenLine className="size-3.5" /> Assinar
                      </button>
                    )}
                  </>
                )}
                <BotaoGerarPdf
                  apiPdfUrl={`/api/pdf/epi-entrega/${e.id}`}
                  tabelaNome="epi_entregas"
                  docId={e.id}
                  label="Ficha"
                  className="text-xs"
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      {assinar && (
        <EpiAssinaturaModal
          idEntrega={assinar.id}
          empresaId={empresaId}
          colaboradorNome={assinar.colaborador?.nome ?? ""}
          onClose={() => setAssinar(null)}
        />
      )}
    </div>
  );
}
