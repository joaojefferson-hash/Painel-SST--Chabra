"use client";

import { useMemo, useState } from "react";
import { Plus, Loader2, ArrowDownCircle, ArrowUpCircle, SlidersHorizontal } from "lucide-react";
import toast from "react-hot-toast";
import { inputCls, labelCls } from "@/components/epi/EpiModal";
import { useEpiCatalogo, useEpiSaldo, useEpiMovimentacoes, useRegistrarMovimentacao } from "@/lib/hooks/useEpi";
import type { EpiMovTipo } from "@/lib/epi/types";

const TIPOS: { v: EpiMovTipo; label: string }[] = [
  { v: "entrada", label: "Entrada" }, { v: "saida", label: "Saída" }, { v: "ajuste", label: "Ajuste" },
];
const iconeTipo = (t: EpiMovTipo) =>
  t === "entrada" ? <ArrowDownCircle className="size-3.5 text-emerald-600" />
  : t === "saida" ? <ArrowUpCircle className="size-3.5 text-red-alert" />
  : <SlidersHorizontal className="size-3.5 text-amber-600" />;
const fmtDataHora = (iso: string) => new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });

export default function EpiEstoqueTab({ empresaId, canEdit }: { empresaId: string; canEdit: boolean }) {
  const { data: catalogo = [] } = useEpiCatalogo(empresaId);
  const { data: saldo } = useEpiSaldo(empresaId);
  const { data: movs = [], isLoading } = useEpiMovimentacoes(empresaId);
  const registrar = useRegistrarMovimentacao();

  const nomeItem = useMemo(() => new Map(catalogo.map((c) => [c.id, c.nome])), [catalogo]);
  const ativos = catalogo.filter((c) => c.ativo);

  const [idCatalogo, setIdCatalogo] = useState("");
  const [tipo, setTipo] = useState<EpiMovTipo>("entrada");
  const [qtd, setQtd] = useState("");
  const [motivo, setMotivo] = useState("");
  const [responsavel, setResponsavel] = useState("");

  function salvar() {
    if (!idCatalogo) { toast.error("Selecione o item"); return; }
    const q = Number(qtd);
    if (!(q > 0)) { toast.error("Quantidade deve ser maior que zero"); return; }
    registrar.mutate(
      { empresa_id: empresaId, id_catalogo: idCatalogo, tipo, quantidade: q, motivo, responsavel },
      { onSuccess: () => { setQtd(""); setMotivo(""); setResponsavel(""); } },
    );
  }

  return (
    <div className="space-y-5">
      {canEdit && (
        ativos.length === 0 ? (
          <p className="rounded-md border border-dashed border-amber-300 bg-amber-50 p-4 text-center text-sm text-amber-800">
            Cadastre itens no <strong>Catálogo</strong> antes de movimentar o estoque.
          </p>
        ) : (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
              <div className="col-span-2"><label className={labelCls}>Item</label>
                <select className={inputCls} value={idCatalogo} onChange={(e) => setIdCatalogo(e.target.value)}>
                  <option value="">Selecione…</option>
                  {ativos.map((c) => <option key={c.id} value={c.id}>{c.nome}{c.ca_numero ? ` (C.A. ${c.ca_numero})` : ""}</option>)}
                </select>
              </div>
              <div><label className={labelCls}>Tipo</label>
                <select className={inputCls} value={tipo} onChange={(e) => setTipo(e.target.value as EpiMovTipo)}>
                  {TIPOS.map((t) => <option key={t.v} value={t.v}>{t.label}</option>)}
                </select>
              </div>
              <div><label className={labelCls}>Qtd.</label><input type="number" min={0} step="any" className={inputCls} value={qtd} onChange={(e) => setQtd(e.target.value)} /></div>
              <div><label className={labelCls}>Responsável</label><input className={inputCls} value={responsavel} onChange={(e) => setResponsavel(e.target.value)} /></div>
              <div className="flex items-end">
                <button type="button" onClick={salvar} disabled={registrar.isPending} className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-verde-primary px-3 py-2 text-sm font-semibold text-white hover:bg-verde-accent disabled:opacity-60">
                  {registrar.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />} Registrar
                </button>
              </div>
              <div className="col-span-2 md:col-span-6"><label className={labelCls}>Motivo (opcional)</label><input className={inputCls} value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="ex.: compra avulsa, descarte, correção de inventário…" /></div>
            </div>
          </div>
        )
      )}

      {/* Saldo atual */}
      <div>
        <h4 className="mb-2 text-sm font-semibold text-gray-900">Saldo atual</h4>
        {catalogo.length === 0 ? (
          <p className="text-sm text-gray-500">Sem itens no catálogo.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {catalogo.map((c) => {
              const s = saldo?.get(c.id) ?? 0;
              const abaixo = s < (c.estoque_minimo ?? 0);
              return (
                <div key={c.id} className={`rounded-lg border px-3 py-2 text-sm ${abaixo ? "border-red-200 bg-red-50" : "border-gray-200 bg-white"}`}>
                  <div className="truncate font-medium text-gray-800" title={c.nome}>{c.nome}</div>
                  <div className={`text-lg font-bold ${abaixo ? "text-red-alert" : "text-gray-900"}`}>{s}<span className="ml-1 text-xs font-normal text-gray-400">{c.unidade ?? ""}</span></div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Histórico */}
      <div>
        <h4 className="mb-2 text-sm font-semibold text-gray-900">Histórico de movimentações</h4>
        {isLoading ? (
          <p className="text-sm text-gray-500">Carregando…</p>
        ) : movs.length === 0 ? (
          <p className="rounded-md border border-dashed border-gray-300 bg-gray-50 p-4 text-center text-sm text-gray-500">Nenhuma movimentação ainda.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-600">
                <tr><th className="px-3 py-2">Data</th><th className="px-3 py-2">Item</th><th className="px-3 py-2">Tipo</th><th className="px-3 py-2 text-right">Qtd.</th><th className="px-3 py-2">Origem</th><th className="px-3 py-2">Motivo</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {movs.map((m) => (
                  <tr key={m.id}>
                    <td className="whitespace-nowrap px-3 py-1.5 text-gray-500">{fmtDataHora(m.criado_em)}</td>
                    <td className="px-3 py-1.5 font-medium text-gray-900">{nomeItem.get(m.id_catalogo) ?? "—"}</td>
                    <td className="px-3 py-1.5"><span className="inline-flex items-center gap-1 capitalize">{iconeTipo(m.tipo)}{m.tipo}</span></td>
                    <td className="px-3 py-1.5 text-right font-semibold">{m.tipo === "saida" ? "−" : "+"}{m.quantidade}</td>
                    <td className="px-3 py-1.5 text-gray-500">{m.origem ?? "—"}</td>
                    <td className="px-3 py-1.5 text-gray-500">{m.motivo ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
