"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, Download, Loader2, AlertCircle } from "lucide-react";
import { usePdfAssinado, usePdfCongelado } from "@/lib/hooks/usePdfsGerados";
import BotaoAssinarPdf from "@/components/ui/BotaoAssinarPdf";
import BotaoGerarPdf from "@/components/ui/BotaoGerarPdf";
import AnexosManager from "@/components/anexos/AnexosManager";
import PainelCongelamentoPdf from "@/components/ui/PainelCongelamentoPdf";
import EmpresaInfoPanel from "@/components/empresas/EmpresaInfoPanel";
import toast from "react-hot-toast";
import { useEmpresa } from "@/lib/hooks/useEmpresas";
import RelatorioPrintHeader from "@/components/layout/RelatorioPrintHeader";
import LaudoBlocos from "@/components/textos-padrao/LaudoBlocos";
import { montarValoresEmpresa, formatarDataBR } from "@/lib/textos-padrao/variaveis";
import { useRelatorioConformidade } from "@/lib/hooks/useRelatoriosConformidade";
import AssinaturaRelatorio from "@/components/ui/AssinaturaRelatorio";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { RelatorioConformidadeItem } from "@/lib/supabase/types";

export default function LaudoConformidadePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data, isLoading, error } = useRelatorioConformidade(id);
  const { data: empresa } = useEmpresa(data?.relatorio.id_empresa ?? null);

  const { pdfAssinado, recarregar } = usePdfAssinado("relatorios_conformidade", id);
  const { data: pdfCongelado } = usePdfCongelado("conformidade", id);
  const baseCongeladaUrl = pdfCongelado?.pdf_url ?? undefined;
  const [baixando, setBaixando] = useState(false);

  async function handleBaixarPdf() {
    if (!pdfAssinado) return;
    setBaixando(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data: blob, error } = await supabase.storage.from("pdfs-assinados").download(pdfAssinado.pdf_path);
      if (error || !blob) { toast.error("Não foi possível baixar o PDF."); return; }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "relatorio-assinado.pdf"; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch { toast.error("Erro ao baixar o PDF."); }
    finally { setBaixando(false); }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-500">
        <Loader2 className="size-5 animate-spin" /> Carregando...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-3xl py-12 text-center">
        <AlertCircle className="mx-auto size-10 text-red-500" />
        <p className="mt-3 text-sm text-gray-700">Relatório não encontrado.</p>
        <Link href="/relatorio-conformidade" className="mt-4 inline-block text-sm text-teal-700 hover:underline">
          Voltar
        </Link>
      </div>
    );
  }

  const { relatorio, itens } = data;
  const finalizado = relatorio.status === "FINALIZADO";

  const valoresTextosPadrao: Record<string, string> = {
    ...montarValoresEmpresa(empresa),
    responsavel: relatorio.responsavel ?? "",
    responsavel_empresa: relatorio.responsavel_empresa ?? "",
    cidade: relatorio.cidade ?? "",
    nr_codigo: relatorio.nr_codigo,
    nr_titulo: relatorio.nr_titulo,
    setor: relatorio.setor ?? "",
    data_inspecao: formatarDataBR(relatorio.data_inspecao),
    carimbo: relatorio.responsavel ?? "",
    importado: formatarDataBR(relatorio.created_at),
  };

  // Resumo
  const total = itens.length;
  const conformes = itens.filter((i) => i.situacao === "CONFORME").length;
  const naoAplicaveis = itens.filter((i) => i.situacao === "NAO_APLICAVEL").length;
  const pendentes = itens.filter((i) => i.situacao === "PENDENTE").length;
  const avaliados = conformes + naoAplicaveis;
  const pct = total > 0 ? Math.round((avaliados / total) * 100) : 0;

  return (
    <div className="mx-auto max-w-4xl space-y-4 print:max-w-none print:space-y-2">
      {/* Toolbar — não imprime */}
      <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
        <Link
          href={`/relatorio-conformidade/${id}`}
          className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-verde-primary"
        >
          <ArrowLeft className="size-3.5" /> Editar relatório
        </Link>
      </div>

      {/* Botões PDF — sticky, não imprime */}
      <div className="sticky top-0 z-20 flex flex-wrap items-center justify-end gap-2 border-b border-gray-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur print:hidden">
        {pdfAssinado ? (
          <>
            <div className="flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
              <BadgeCheck className="size-3.5 shrink-0" />
              Assinado em {new Date(pdfAssinado.assinado_em).toLocaleDateString("pt-BR")}
            </div>
            <button type="button" onClick={handleBaixarPdf} disabled={baixando}
              className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500 bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">
              {baixando ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
              Baixar PDF Assinado
            </button>
            <BotaoAssinarPdf reAssinatura={true} tabelaNome="relatorios_conformidade" docId={id} onAssinado={recarregar} apiPdfUrl={`/api/pdf/conformidade/${id}`} baseCongeladaUrl={baseCongeladaUrl} />
          </>
        ) : (
          <BotaoAssinarPdf tabelaNome="relatorios_conformidade" docId={id} onAssinado={recarregar} apiPdfUrl={`/api/pdf/conformidade/${id}`} baseCongeladaUrl={baseCongeladaUrl} />
        )}
        <BotaoGerarPdf
          tabelaNome="relatorios_conformidade"
          docId={id}
          apiPdfUrl={`/api/pdf/conformidade/${id}`}
          className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          registrarPdf={{
            modulo: "conformidade",
            tipoDocumento: "Relatório de Conformidade",
            idRelatorio: id,
            empresaId: relatorio.id_empresa ?? undefined,
            empresaNome: empresa?.nome_empresa ?? undefined,
            empresaCnpj: empresa?.cnpj ?? undefined,
            responsavelTecnico: relatorio.responsavel ?? undefined,
          }}
        />
      </div>

      <div className="px-4 pt-3">
        <PainelCongelamentoPdf
          modulo="conformidade"
          idReferencia={id}
          apiPdfUrl={`/api/pdf/conformidade/${id}`}
          opts={{
            tipoDocumento: "Relatório de Conformidade",
            empresaId: relatorio.id_empresa ?? undefined,
            empresaNome: empresa?.nome_empresa ?? undefined,
            empresaCnpj: empresa?.cnpj ?? undefined,
            responsavelTecnico: relatorio.responsavel ?? undefined,
            setor: relatorio.setor ?? undefined,
          }}
        />
      </div>

      <div className="px-4 pt-3">
        <AnexosManager modulo="conformidade" idReferencia={id} />
      </div>

      <div className="px-4 pt-3 print:hidden">
        <EmpresaInfoPanel empresa={empresa ?? null} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm" />
      </div>

      {/* Logo Chabra */}
      <RelatorioPrintHeader
        titulo={`Relatório de Conformidade — ${relatorio.nr_codigo}`}
        subtitulo={empresa?.nome_empresa ?? null}
        terciario={
          relatorio.data_inspecao
            ? new Date(relatorio.data_inspecao + "T00:00").toLocaleDateString("pt-BR")
            : null
        }
      />

      {/* Cabeçalho */}
      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm print:border-0 print:shadow-none print:p-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-teal-700">
              Relatório de Conformidade — {relatorio.nr_codigo}
            </p>
            <h1 className="mt-1 text-2xl font-bold text-gray-900">{relatorio.nr_titulo}</h1>
          </div>
          <span
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
              finalizado ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
            }`}
          >
            {finalizado ? "FINALIZADO" : "RASCUNHO"}
          </span>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          <DataItem label="Empresa" value={empresa?.nome_empresa ?? "—"} />
          <DataItem label="CNPJ" value={empresa?.cnpj ?? "—"} />
          <DataItem label="Setor / Local" value={relatorio.setor ?? "—"} />
          <DataItem label="Responsável técnico (Chabra)" value={relatorio.responsavel ?? "—"} />
          <DataItem label="Responsável da empresa" value={relatorio.responsavel_empresa ?? "—"} />
          <DataItem label="Cidade" value={relatorio.cidade ?? "—"} />
          <DataItem
            label="Data da inspeção"
            value={
              relatorio.data_inspecao
                ? new Date(relatorio.data_inspecao + "T00:00").toLocaleDateString("pt-BR")
                : "—"
            }
          />
          <DataItem label="Criado em" value={new Date(relatorio.created_at).toLocaleString("pt-BR")} />
        </div>
      </section>

      {/* Corpo do laudo — blocos na ordem definida em Texto Padrão (texto
          editável + seções do sistema). Mesma ordem do PDF gerado. */}
      <LaudoBlocos
        modulo="conformidade"
        valores={valoresTextosPadrao}
        secoes={{
          conformidade_resultado: (
            <section className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4 print:grid-cols-4">
              <ResumoCard label="Conformes" valor={conformes} cor="emerald" total={total} />
              <ResumoCard label="Não aplicáveis" valor={naoAplicaveis} cor="gray" total={total} />
              <ResumoCard label="Pendentes" valor={pendentes} cor="amber" total={total} />
              <ResumoCard label="Avaliação" valor={`${pct}%`} cor="teal" />
            </section>
          ),
          conformidade_itens: (
            <>
              <section className="mb-6 space-y-2">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-700 print:text-base">
                  Itens do Checklist ({itens.length})
                </h2>
                <div className="space-y-2">
                  {itens.map((item) => (
                    <ItemRowReadOnly key={item.id_item} item={item} />
                  ))}
                </div>
              </section>
              {relatorio.observacoes_gerais && (
                <section className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm print:border-0 print:shadow-none print:p-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-600">Observações Gerais</p>
                  <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{relatorio.observacoes_gerais}</p>
                </section>
              )}
            </>
          ),
          conformidade_assinatura: (
            <AssinaturaRelatorio
              nomeResponsavel={relatorio.responsavel ?? undefined}
              dataRelatorio={formatarDataBR(relatorio.data_inspecao) || undefined}
              tabelaNome="relatorios_conformidade"
              docId={id}
              hideAcoes
            />
          ),
        }}
      />

      {/* Rodapé */}
      <p className="text-center text-[9px] text-gray-500 print:mt-4">
        Relatório de Conformidade gerado por Chabra — Segurança e Saúde do Trabalho ·{" "}
        {relatorio.finalizado_em
          ? `Finalizado em ${new Date(relatorio.finalizado_em).toLocaleString("pt-BR")}`
          : `Criado em ${new Date(relatorio.created_at).toLocaleString("pt-BR")}`}
        {relatorio.usuario_nome ? ` · ${relatorio.usuario_nome}` : ""}
      </p>

      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 3cm 2cm 2cm 3cm;
          }
        }
      `}</style>
    </div>
  );
}

// ─── Subcomponentes ───────────────────────────────────────────────────────────

function DataItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">{label}</span>
      <span className="text-sm text-gray-900">{value}</span>
    </div>
  );
}

function ResumoCard({
  label,
  valor,
  cor,
  total,
}: {
  label: string;
  valor: string | number;
  cor: "emerald" | "gray" | "amber" | "teal";
  total?: number;
}) {
  const cores = {
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-900",
    gray: "border-gray-200 bg-gray-50 text-gray-900",
    amber: "border-amber-200 bg-amber-50 text-amber-900",
    teal: "border-teal-200 bg-teal-50 text-teal-900",
  };
  return (
    <div className={`rounded-lg border p-3 text-center ${cores[cor]}`}>
      <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">{label}</p>
      <p className="text-2xl font-bold">{valor}</p>
      {total != null && typeof valor === "number" && (
        <p className="text-[10px] opacity-70">de {total}</p>
      )}
    </div>
  );
}

function ItemRowReadOnly({ item }: { item: RelatorioConformidadeItem }) {
  const corBorda =
    item.situacao === "CONFORME"
      ? "border-emerald-300 bg-emerald-50/40"
      : item.situacao === "NAO_APLICAVEL"
      ? "border-gray-300 bg-gray-50/40"
      : "border-amber-200 bg-amber-50/30";

  const ehLivre = item.item_nr_origem === "LIVRE";
  const ehCrossRef = !!item.item_nr_origem && item.item_nr_origem !== "LIVRE";
  const fotoUrls = item.foto_urls ?? [];

  return (
    <div className={`rounded-lg border p-3 print:break-inside-avoid ${corBorda}`}>
      <div className="flex items-start gap-3">
        <span
          className={`mt-0.5 inline-block min-w-[3rem] rounded px-1.5 py-0.5 text-center font-mono text-[11px] font-bold ${
            ehLivre
              ? "bg-purple-100 text-purple-800"
              : ehCrossRef
              ? "bg-sky-100 text-sky-800"
              : "bg-teal-100 text-teal-800"
          }`}
        >
          {item.item_codigo}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="text-sm font-semibold text-gray-900">{item.item_titulo}</p>
            {ehLivre && (
              <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-purple-700">
                Livre
              </span>
            )}
            {ehCrossRef && (
              <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-sky-700">
                {item.item_nr_origem}
              </span>
            )}
          </div>
          {item.item_descricao && (
            <p className="mt-0.5 text-xs text-gray-600">{item.item_descricao}</p>
          )}
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
            item.situacao === "CONFORME"
              ? "bg-emerald-100 text-emerald-700"
              : item.situacao === "NAO_APLICAVEL"
              ? "bg-gray-100 text-gray-700"
              : "bg-amber-100 text-amber-700"
          }`}
        >
          {item.situacao === "CONFORME"
            ? "CONFORME"
            : item.situacao === "NAO_APLICAVEL"
            ? "N/A"
            : "PENDENTE"}
        </span>
      </div>

      {/* Fotos */}
      {fotoUrls.length > 0 && (
        <div className="mt-3 flex justify-center">
          <div className={fotoUrls.length === 1 ? "flex justify-center" : "grid grid-cols-2 gap-3 print:gap-2"}>
            {fotoUrls.map((url, idx) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={`${url}-${idx}`}
                src={url}
                alt={`Foto do item ${item.item_codigo}`}
                className="h-36 w-44 object-cover rounded-md border border-gray-300 sm:h-40 sm:w-52 print:h-40 print:w-48"
              />
            ))}
          </div>
        </div>
      )}

      {/* Observação */}
      {item.observacao && (
        <div className="mt-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Observação</p>
          <p className="mt-0.5 text-xs text-gray-900 whitespace-pre-wrap">{item.observacao}</p>
        </div>
      )}
    </div>
  );
}
