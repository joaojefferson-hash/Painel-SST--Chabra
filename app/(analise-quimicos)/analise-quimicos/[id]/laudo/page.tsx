"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, Download, Loader2, FlaskConical, FileText, Pencil } from "lucide-react";
import { usePdfAssinado } from "@/lib/hooks/usePdfsGerados";
import BotaoAssinarPdf from "@/components/ui/BotaoAssinarPdf";
import BotaoGerarPdf from "@/components/ui/BotaoGerarPdf";
import toast from "react-hot-toast";
import { useEmpresa } from "@/lib/hooks/useEmpresas";
import RelatorioPrintHeader from "@/components/layout/RelatorioPrintHeader";
import TextosPadraoPrint from "@/components/textos-padrao/TextosPadraoPrint";
import { montarValoresEmpresa, formatarDataBR } from "@/lib/textos-padrao/variaveis";
import { useAnaliseQuimico } from "@/lib/hooks/useAnalisesQuimicos";
import ConclusaoRapidaCard from "@/components/quimicos/ConclusaoRapidaCard";
import RelatorioEstruturado from "@/components/quimicos/RelatorioEstruturado";
import AssinaturaRelatorio from "@/components/ui/AssinaturaRelatorio";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LaudoAnaliseQuimicoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: analise, isLoading, error } = useAnaliseQuimico(id);
  const { data: empresa } = useEmpresa(analise?.id_empresa ?? null);

  const { pdfAssinado, recarregar } = usePdfAssinado("analises_quimicos", id);
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
        <Loader2 className="size-5 animate-spin" /> Carregando análise...
      </div>
    );
  }

  if (error || !analise) {
    return (
      <div className="mx-auto max-w-xl rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">
        Análise não encontrada ou erro ao carregar.
        <div className="mt-2">
          <Link href="/analise-quimicos/historico" className="text-red-700 underline hover:text-red-900">
            Voltar ao histórico
          </Link>
        </div>
      </div>
    );
  }

  const valoresTextosPadrao: Record<string, string> = {
    ...montarValoresEmpresa(empresa ?? null),
    titulo: analise.titulo,
    nome_quimico: analise.nome_quimico ?? "",
    numero_cas: analise.numero_cas ?? "",
    responsavel: analise.usuario_nome ?? "",
    carimbo: analise.usuario_nome ?? "",
    importado: formatarDataBR(analise.created_at),
  };

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      {/* Toolbar — não imprime */}
      <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
        <Link
          href={`/analise-quimicos/${id}`}
          className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-verde-primary"
        >
          <ArrowLeft className="size-3.5" /> Editar análise
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
          </>
        ) : (
          <BotaoAssinarPdf tabelaNome="analises_quimicos" docId={id} onAssinado={recarregar} />
        )}
        <BotaoGerarPdf
          tabelaNome="analises_quimicos"
          docId={id}
          className="inline-flex items-center gap-1.5 rounded-md bg-verde-primary px-3 py-1.5 text-sm font-semibold text-white hover:bg-verde-accent"
          registrarPdf={{
            modulo: "analises_quimicos",
            tipoDocumento: "Análise de Agente Químico",
            idRelatorio: id,
            empresaId: analise.id_empresa ?? undefined,
            empresaNome: empresa?.nome_empresa ?? undefined,
            empresaCnpj: empresa?.cnpj ?? undefined,
            responsavelTecnico: analise.usuario_nome ?? undefined,
          }}
        />
      </div>

      {/* Logo Chabra */}
      <RelatorioPrintHeader
        titulo="Análise de Agente Químico"
        subtitulo={analise.titulo}
        terciario={empresa?.nome_empresa ?? null}
      />

      {/* Cabeçalho do relatório */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm print:border-0 print:shadow-none">
        <div className="flex items-center gap-3">
          <div
            className="flex size-12 shrink-0 items-center justify-center rounded-xl text-white"
            style={{ backgroundColor: "#0EA5E9" }}
          >
            <FlaskConical className="size-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-sky-600">
              Análise de Químicos Chabra
            </p>
            <h1 className="truncate text-xl font-bold text-gray-900">{analise.titulo}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600">
              <span className="inline-flex items-center gap-1">
                {analise.modo === "PDF" ? (
                  <FileText className="size-3" />
                ) : (
                  <Pencil className="size-3" />
                )}
                {analise.modo === "PDF"
                  ? `PDF: ${analise.fonte_arquivo ?? ""}`
                  : "Entrada Manual"}
              </span>
              {empresa && <span>Empresa: {empresa.nome_empresa}</span>}
              {analise.usuario_nome && <span>Responsável: {analise.usuario_nome}</span>}
              <span>{new Date(analise.created_at).toLocaleString("pt-BR")}</span>
            </div>
          </div>
        </div>

        {/* Dados do produto */}
        {(analise.nome_quimico ||
          analise.numero_cas ||
          analise.formula_quimica ||
          analise.forma_fisica ||
          analise.concentracao) && (
          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-gray-100 pt-3 text-xs md:grid-cols-3 lg:grid-cols-5">
            {analise.nome_quimico && (
              <div>
                <p className="text-[9px] font-bold uppercase text-gray-500">Nome Químico</p>
                <p className="text-gray-900">{analise.nome_quimico}</p>
              </div>
            )}
            {analise.numero_cas && (
              <div>
                <p className="text-[9px] font-bold uppercase text-gray-500">CAS</p>
                <p className="text-gray-900">{analise.numero_cas}</p>
              </div>
            )}
            {analise.formula_quimica && (
              <div>
                <p className="text-[9px] font-bold uppercase text-gray-500">Fórmula</p>
                <p className="text-gray-900">{analise.formula_quimica}</p>
              </div>
            )}
            {analise.forma_fisica && (
              <div>
                <p className="text-[9px] font-bold uppercase text-gray-500">Forma Física</p>
                <p className="text-gray-900">{analise.forma_fisica}</p>
              </div>
            )}
            {analise.concentracao && (
              <div>
                <p className="text-[9px] font-bold uppercase text-gray-500">Concentração</p>
                <p className="text-gray-900">{analise.concentracao}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Conclusão rápida */}
      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm print:border-0 print:shadow-none print:p-2">
        <h2 className="mb-3 text-base font-bold text-verde-primary">Conclusão Rápida</h2>
        <ConclusaoRapidaCard conclusao={analise.conclusao_rapida} />
      </section>

      {/* Textos Padrão antes */}
      <TextosPadraoPrint modulo="analise_quimicos" valores={valoresTextosPadrao} posicao="inicio" />

      {/* Relatório técnico estruturado */}
      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm print:border-0 print:shadow-none print:p-2">
        <h2 className="mb-3 text-base font-bold text-verde-primary">Relatório Técnico Completo</h2>
        <RelatorioEstruturado analise={analise} empresa={empresa ?? null} />
      </section>

      {/* Textos Padrão fim */}
      <TextosPadraoPrint modulo="analise_quimicos" valores={valoresTextosPadrao} posicao="fim" />

      {/* Assinatura */}
      <AssinaturaRelatorio
        nomeResponsavel={analise.usuario_nome ?? undefined}
        dataRelatorio={formatarDataBR(analise.created_at) || undefined}
        tabelaNome="analises_quimicos"
        docId={id}
        hideAcoes
      />

      {/* Rodapé */}
      <p className="text-center text-[9px] text-gray-500 print:mt-4">
        Análise gerada por IA · Chabra — Segurança e Saúde do Trabalho ·{" "}
        {new Date(analise.created_at).toLocaleString("pt-BR")} · Revisão técnica obrigatória antes de uso oficial.
      </p>

      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 3cm 2cm 2cm 3cm;
          }
          body { font-size: 12pt; line-height: 1.5; }
        }
      `}</style>
    </div>
  );
}
