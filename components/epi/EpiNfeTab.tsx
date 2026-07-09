"use client";

import { useMemo, useRef, useState } from "react";
import { Upload, FileText, Loader2, CheckCircle2, X, PackagePlus, Link2, Ban } from "lucide-react";
import toast from "react-hot-toast";
import { inputCls } from "@/components/epi/EpiModal";
import { parseNfe, type EpiNfeParsed } from "@/lib/epi/nfe";
import { useEpiCatalogo, useEpiImportacoes, useImportarNfe } from "@/lib/hooks/useEpi";
import type { EpiNfeItemMap } from "@/lib/epi/types";

type Modo = "novo" | "vinculado" | "ignorado";
interface LinhaMap extends EpiNfeItemMap { status_map: Modo }

const fmtData = (iso: string | null) => iso ? iso.split("-").reverse().join("/") : "—";
const fmtDataHora = (iso: string) => new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });

export default function EpiNfeTab({ empresaId, canEdit }: { empresaId: string; canEdit: boolean }) {
  const { data: catalogo = [] } = useEpiCatalogo(empresaId);
  const { data: historico = [], isLoading } = useEpiImportacoes(empresaId);
  const importar = useImportarNfe();
  const fileRef = useRef<HTMLInputElement>(null);

  const [parsed, setParsed] = useState<EpiNfeParsed | null>(null);
  const [xmlNome, setXmlNome] = useState("");
  const [linhas, setLinhas] = useState<LinhaMap[]>([]);

  const ativos = useMemo(() => catalogo.filter((c) => c.ativo), [catalogo]);

  async function onFile(f: File | null) {
    if (!f) return;
    try {
      const txt = await f.text();
      const p = parseNfe(txt);
      setParsed(p);
      setXmlNome(f.name);
      // auto-mapeia por nome igual (case-insensitive); senão, "novo"
      setLinhas(p.itens.map((it): LinhaMap => {
        const match = ativos.find((c) => c.nome.trim().toLowerCase() === it.xprod.trim().toLowerCase());
        return {
          ...it,
          status_map: match ? "vinculado" : "novo",
          id_catalogo: match?.id ?? null,
          nome_novo: it.xprod,
        };
      }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível ler o XML.");
      setParsed(null); setLinhas([]);
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  function setLinha(i: number, patch: Partial<LinhaMap>) {
    setLinhas((arr) => arr.map((l, idx) => idx === i ? { ...l, ...patch } : l));
  }

  function cancelar() { setParsed(null); setLinhas([]); setXmlNome(""); }

  function confirmar() {
    if (!parsed) return;
    // valida: vinculado precisa de destino
    const semDestino = linhas.some((l) => l.status_map === "vinculado" && !l.id_catalogo);
    if (semDestino) { toast.error("Há itens 'Vincular' sem item do catálogo selecionado."); return; }
    const itens: EpiNfeItemMap[] = linhas.map((l) => ({
      cprod: l.cprod, xprod: l.xprod, ncm: l.ncm, unidade: l.unidade,
      quantidade: l.quantidade, valor_unitario: l.valor_unitario,
      status_map: l.status_map,
      id_catalogo: l.status_map === "vinculado" ? l.id_catalogo : null,
      nome_novo: l.status_map === "novo" ? (l.nome_novo || l.xprod) : undefined,
    }));
    importar.mutate({
      empresa_id: empresaId, chnfe: parsed.chnfe,
      fornecedor_cnpj: parsed.fornecedor_cnpj, fornecedor_nome: parsed.fornecedor_nome,
      numero_nf: parsed.numero_nf, data_emissao: parsed.data_emissao, xml_nome: xmlNome, itens,
    }, { onSuccess: cancelar });
  }

  return (
    <div className="space-y-5">
      {canEdit && !parsed && (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
          <FileText className="mx-auto size-8 text-gray-400" />
          <p className="mt-2 text-sm font-medium text-gray-700">Importar NF-e (XML)</p>
          <p className="mt-1 text-xs text-gray-500">Selecione o XML da nota; conferimos item a item antes de dar entrada no estoque.</p>
          <input ref={fileRef} type="file" accept=".xml,text/xml,application/xml" className="hidden" onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
          <button type="button" onClick={() => fileRef.current?.click()} className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-verde-primary px-3 py-2 text-sm font-semibold text-white hover:bg-verde-accent">
            <Upload className="size-4" /> Escolher XML
          </button>
        </div>
      )}

      {parsed && (
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="mb-3 flex items-start justify-between gap-2">
            <div className="text-sm">
              <div className="font-semibold text-gray-900">{parsed.fornecedor_nome || "Fornecedor não identificado"}</div>
              <div className="text-xs text-gray-500">
                NF {parsed.numero_nf || "—"} · {fmtData(parsed.data_emissao)} · CNPJ {parsed.fornecedor_cnpj || "—"}
              </div>
              <div className="mt-0.5 text-[11px] text-gray-400">chNFe {parsed.chnfe}</div>
            </div>
            <button type="button" onClick={cancelar} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700" title="Descartar"><X className="size-4" /></button>
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-600">
                <tr>
                  <th className="px-2 py-2">Produto (NF-e)</th><th className="px-2 py-2 text-right">Qtd.</th>
                  <th className="px-2 py-2">Ação</th><th className="px-2 py-2">Destino no catálogo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {linhas.map((l, i) => (
                  <tr key={i} className={l.status_map === "ignorado" ? "opacity-50" : ""}>
                    <td className="px-2 py-1.5">
                      <div className="font-medium text-gray-900">{l.xprod || l.cprod}</div>
                      <div className="text-[11px] text-gray-400">cProd {l.cprod || "—"}{l.ncm ? ` · NCM ${l.ncm}` : ""}</div>
                    </td>
                    <td className="px-2 py-1.5 text-right whitespace-nowrap">{l.quantidade} {l.unidade}</td>
                    <td className="px-2 py-1.5">
                      <select value={l.status_map} onChange={(e) => setLinha(i, { status_map: e.target.value as Modo })} className="rounded-md border border-gray-300 px-2 py-1 text-xs focus:border-verde-primary focus:outline-none">
                        <option value="novo">Criar no catálogo</option>
                        <option value="vinculado">Vincular a existente</option>
                        <option value="ignorado">Ignorar</option>
                      </select>
                    </td>
                    <td className="px-2 py-1.5">
                      {l.status_map === "novo" && (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-700"><PackagePlus className="size-3.5" /><input className={`${inputCls} py-1 text-xs`} value={l.nome_novo ?? ""} onChange={(e) => setLinha(i, { nome_novo: e.target.value })} placeholder="Nome do novo item" /></span>
                      )}
                      {l.status_map === "vinculado" && (
                        <span className="inline-flex items-center gap-1"><Link2 className="size-3.5 text-gray-400" />
                          <select value={l.id_catalogo ?? ""} onChange={(e) => setLinha(i, { id_catalogo: e.target.value || null })} className="rounded-md border border-gray-300 px-2 py-1 text-xs focus:border-verde-primary focus:outline-none">
                            <option value="">Selecione…</option>
                            {ativos.map((c) => <option key={c.id} value={c.id}>{c.nome}{c.ca_numero ? ` (C.A. ${c.ca_numero})` : ""}</option>)}
                          </select>
                        </span>
                      )}
                      {l.status_map === "ignorado" && <span className="inline-flex items-center gap-1 text-xs text-gray-400"><Ban className="size-3.5" /> não entra no estoque</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex justify-end gap-2">
            <button type="button" onClick={cancelar} className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">Cancelar</button>
            <button type="button" onClick={confirmar} disabled={importar.isPending} className="inline-flex items-center gap-1.5 rounded-md bg-verde-primary px-3 py-1.5 text-sm font-semibold text-white hover:bg-verde-accent disabled:opacity-60">
              {importar.isPending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />} Confirmar importação
            </button>
          </div>
        </div>
      )}

      {/* Histórico */}
      <div>
        <h4 className="mb-2 text-sm font-semibold text-gray-900">NF-e importadas</h4>
        {isLoading ? (
          <p className="text-sm text-gray-500">Carregando…</p>
        ) : historico.length === 0 ? (
          <p className="rounded-md border border-dashed border-gray-300 bg-gray-50 p-4 text-center text-sm text-gray-500">Nenhuma NF-e importada ainda.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-600">
                <tr><th className="px-3 py-2">Data</th><th className="px-3 py-2">Fornecedor</th><th className="px-3 py-2">NF</th><th className="px-3 py-2 text-right">Itens</th><th className="px-3 py-2">chNFe</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {historico.map((h) => (
                  <tr key={h.id}>
                    <td className="whitespace-nowrap px-3 py-1.5 text-gray-500">{fmtDataHora(h.criado_em)}</td>
                    <td className="px-3 py-1.5 font-medium text-gray-900">{h.fornecedor_nome ?? "—"}</td>
                    <td className="px-3 py-1.5">{h.numero_nf ?? "—"}</td>
                    <td className="px-3 py-1.5 text-right">{h.itens_lancados}/{h.total_itens}</td>
                    <td className="px-3 py-1.5 font-mono text-[11px] text-gray-400">{h.chnfe}</td>
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
