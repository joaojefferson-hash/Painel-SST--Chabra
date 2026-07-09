"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Loader2, Search, ShieldAlert, PackageX } from "lucide-react";
import toast from "react-hot-toast";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EpiModal, { inputCls, labelCls } from "@/components/epi/EpiModal";
import { useEpiCatalogo, useCatalogoMut, useEpiSaldo } from "@/lib/hooks/useEpi";
import type { EpiCatalogoItem } from "@/lib/epi/types";

/** Estado do C.A.: vencido / vencendo (≤30d) / ok / sem. */
function statusCA(validade: string | null): { txt: string; cls: string } | null {
  if (!validade) return null;
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const [y, m, d] = validade.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  const dias = Math.round((dt.getTime() - hoje.getTime()) / 86400000);
  if (dias < 0) return { txt: "C.A. vencido", cls: "bg-red-50 text-red-alert border-red-200" };
  if (dias <= 30) return { txt: `C.A. vence em ${dias}d`, cls: "bg-amber-50 text-amber-700 border-amber-200" };
  return { txt: "C.A. válido", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" };
}
const fmtData = (iso: string | null) => iso ? iso.split("-").reverse().join("/") : "—";

export default function EpiCatalogoTab({ empresaId, canEdit }: { empresaId: string; canEdit: boolean }) {
  const { data: lista = [], isLoading } = useEpiCatalogo(empresaId);
  const { data: saldo } = useEpiSaldo(empresaId);
  const mut = useCatalogoMut();
  const [busca, setBusca] = useState("");
  const [editar, setEditar] = useState<EpiCatalogoItem | null>(null);
  const [novo, setNovo] = useState(false);
  const [excluir, setExcluir] = useState<EpiCatalogoItem | null>(null);

  const filtrados = lista.filter((c) =>
    [c.nome, c.ca_numero, c.fabricante, c.tipo].filter(Boolean).join(" ").toLowerCase().includes(busca.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-gray-400" />
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar EPI/EPC, C.A., fabricante…" className={`${inputCls} pl-8`} />
        </div>
        {canEdit && (
          <button type="button" onClick={() => setNovo(true)} className="inline-flex items-center gap-1.5 rounded-md bg-verde-primary px-3 py-2 text-sm font-semibold text-white hover:bg-verde-accent">
            <Plus className="size-4" /> Novo item
          </button>
        )}
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-500">Carregando…</p>
      ) : filtrados.length === 0 ? (
        <p className="rounded-md border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-500">
          {lista.length === 0 ? "Nenhum item no catálogo desta empresa." : "Nada encontrado para a busca."}
        </p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {filtrados.map((c) => {
            const ca = statusCA(c.ca_validade);
            const s = saldo?.get(c.id) ?? 0;
            const abaixo = s < (c.estoque_minimo ?? 0);
            return (
              <div key={c.id} className={`rounded-xl border p-3 ${c.ativo ? "border-gray-200 bg-white" : "border-gray-200 bg-gray-50 opacity-70"}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold text-gray-900">{c.nome}</div>
                    <div className="text-xs text-gray-500">{c.tipo}{c.fabricante ? ` · ${c.fabricante}` : ""}</div>
                  </div>
                  {canEdit && (
                    <div className="flex gap-1">
                      <button type="button" onClick={() => setEditar(c)} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-verde-primary" title="Editar"><Pencil className="size-3.5" /></button>
                      <button type="button" onClick={() => setExcluir(c)} className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-alert" title="Excluir"><Trash2 className="size-3.5" /></button>
                    </div>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
                  {c.ca_numero && <span className="rounded bg-gray-100 px-1.5 py-0.5 text-gray-600">C.A. {c.ca_numero}</span>}
                  {ca && <span className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 font-medium ${ca.cls}`}><ShieldAlert className="size-3" />{ca.txt} · {fmtData(c.ca_validade)}</span>}
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-2 text-xs">
                  <span className="text-gray-500">Saldo</span>
                  <span className={`inline-flex items-center gap-1 font-semibold ${abaixo ? "text-red-alert" : "text-gray-800"}`}>
                    {abaixo && <PackageX className="size-3.5" />}{s}{c.unidade ? ` ${c.unidade}` : ""}{abaixo ? ` (mín. ${c.estoque_minimo})` : ""}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {(novo || editar) && (
        <CatalogoForm empresaId={empresaId} inicial={editar} mut={mut} onClose={() => { setNovo(false); setEditar(null); }} />
      )}

      <ConfirmDialog
        open={!!excluir}
        title="Excluir item"
        description={`Excluir "${excluir?.nome}"? As movimentações e entregas já registradas com este item são mantidas (histórico), mas o item some do catálogo.`}
        confirmLabel="Excluir"
        variant="danger"
        loading={mut.excluir.isPending}
        onConfirm={() => { if (excluir) mut.excluir.mutate({ id: excluir.id, empresa_id: empresaId }, { onSuccess: () => setExcluir(null) }); }}
        onCancel={() => setExcluir(null)}
      />
    </div>
  );
}

function CatalogoForm({
  empresaId, inicial, mut, onClose,
}: {
  empresaId: string;
  inicial: EpiCatalogoItem | null;
  mut: ReturnType<typeof useCatalogoMut>;
  onClose: () => void;
}) {
  const [nome, setNome] = useState(inicial?.nome ?? "");
  const [tipo, setTipo] = useState<"EPI" | "EPC">(inicial?.tipo ?? "EPI");
  const [ca, setCa] = useState(inicial?.ca_numero ?? "");
  const [caVal, setCaVal] = useState(inicial?.ca_validade ?? "");
  const [fab, setFab] = useState(inicial?.fabricante ?? "");
  const [unidade, setUnidade] = useState(inicial?.unidade ?? "");
  const [minimo, setMinimo] = useState(String(inicial?.estoque_minimo ?? 0));
  const [descricao, setDescricao] = useState(inicial?.descricao ?? "");
  const [ativo, setAtivo] = useState(inicial?.ativo ?? true);
  const pending = mut.criar.isPending || mut.atualizar.isPending;

  function salvar() {
    if (!nome.trim()) { toast.error("Informe o nome do item"); return; }
    const min = Number(minimo) || 0;
    if (inicial) {
      mut.atualizar.mutate({ id: inicial.id, empresa_id: empresaId, patch: { nome: nome.trim(), tipo, ca_numero: ca.trim() || null, ca_validade: caVal || null, fabricante: fab.trim() || null, unidade: unidade.trim() || null, estoque_minimo: min, descricao: descricao.trim() || null, ativo } }, { onSuccess: onClose });
    } else {
      mut.criar.mutate({ empresa_id: empresaId, nome, tipo, ca_numero: ca, ca_validade: caVal, fabricante: fab, unidade, estoque_minimo: min, descricao }, { onSuccess: onClose });
    }
  }

  return (
    <EpiModal
      open
      title={inicial ? "Editar item" : "Novo item do catálogo"}
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">Cancelar</button>
          <button type="button" onClick={salvar} disabled={pending} className="inline-flex items-center gap-1.5 rounded-md bg-verde-primary px-3 py-1.5 text-sm font-semibold text-white hover:bg-verde-accent disabled:opacity-60">
            {pending && <Loader2 className="size-4 animate-spin" />} Salvar
          </button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2"><label className={labelCls}>Nome *</label><input className={inputCls} value={nome} onChange={(e) => setNome(e.target.value)} autoFocus /></div>
        <div><label className={labelCls}>Tipo</label>
          <select className={inputCls} value={tipo} onChange={(e) => setTipo(e.target.value as "EPI" | "EPC")}>
            <option value="EPI">EPI</option><option value="EPC">EPC</option>
          </select>
        </div>
        <div><label className={labelCls}>Fabricante</label><input className={inputCls} value={fab} onChange={(e) => setFab(e.target.value)} /></div>
        <div><label className={labelCls}>Nº do C.A.</label><input className={inputCls} value={ca} onChange={(e) => setCa(e.target.value)} /></div>
        <div><label className={labelCls}>Validade do C.A.</label><input type="date" className={inputCls} value={caVal} onChange={(e) => setCaVal(e.target.value)} /></div>
        <div><label className={labelCls}>Unidade (par, un, cx…)</label><input className={inputCls} value={unidade} onChange={(e) => setUnidade(e.target.value)} /></div>
        <div><label className={labelCls}>Estoque mínimo</label><input type="number" min={0} className={inputCls} value={minimo} onChange={(e) => setMinimo(e.target.value)} /></div>
        <div className="col-span-2"><label className={labelCls}>Descrição</label><textarea className={inputCls} rows={2} value={descricao} onChange={(e) => setDescricao(e.target.value)} /></div>
        {inicial && (
          <label className="col-span-2 inline-flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} className="size-4 rounded border-gray-300 text-verde-primary focus:ring-verde-primary" /> Ativo
          </label>
        )}
      </div>
    </EpiModal>
  );
}
