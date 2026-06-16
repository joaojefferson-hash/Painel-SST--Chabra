"use client";

import React, { use, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, Download, Loader2, FlaskConical, FileText, Pencil } from "lucide-react";
import { usePdfAssinado, usePdfCongelado } from "@/lib/hooks/usePdfsGerados";
import BotaoAssinarPdf from "@/components/ui/BotaoAssinarPdf";
import BotaoGerarPdf from "@/components/ui/BotaoGerarPdf";
import AnexosManager from "@/components/anexos/AnexosManager";
import PainelCongelamentoPdf from "@/components/ui/PainelCongelamentoPdf";
import EmpresaInfoPanel from "@/components/empresas/EmpresaInfoPanel";
import toast from "react-hot-toast";
import { useEmpresa } from "@/lib/hooks/useEmpresas";
import RelatorioPrintHeader from "@/components/layout/RelatorioPrintHeader";
import TextosPadraoPrint from "@/components/textos-padrao/TextosPadraoPrint";
import { useTextosPadrao } from "@/lib/hooks/useTextosPadrao";
import { montarValoresEmpresa, formatarDataBR, substituirVariaveisTexto } from "@/lib/textos-padrao/variaveis";
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
  const { data: pdfCongelado } = usePdfCongelado("analises_quimicos", id);
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

  const { data: capitulosQ = [] } = useTextosPadrao("analise_quimicos");

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

  // Corpo da análise (seção do sistema "quimicos_analise"): relatório técnico
  // estruturado gerado automaticamente.
  const analiseBodyScreenNode = (
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm print:border-0 print:shadow-none print:p-2">
      <h2 className="mb-3 text-base font-bold text-verde-primary">Relatório Técnico Completo</h2>
      <RelatorioEstruturado analise={analise} empresa={empresa ?? null} />
    </section>
  );

  // Blocos ordenados (mesma regra do corpoScreen) p/ montar o sumário.
  const blocosQ = [...capitulosQ]
    .filter((c) => c.ativo !== false)
    .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
  const sumarioTitulos = blocosQ
    .filter((c) => c.slug_fixo !== "sumario")
    .map((c) =>
      c.tipo === "fixo" ? c.titulo : substituirVariaveisTexto(c.titulo, valoresTextosPadrao),
    )
    .filter((t) => t && t.trim());

  function renderSecaoQScreen(slug: string): React.ReactNode {
    switch (slug) {
      case "identificacao_empresa":
        return (
          <div className="mb-6 break-inside-avoid">
            <h2 className="mb-2 border-b-2 border-emerald-700 pb-1 text-sm font-bold text-emerald-900">
              Identificação da Empresa
            </h2>
            <EmpresaInfoPanel empresa={empresa ?? null} />
          </div>
        );
      case "sumario":
        return (
          <div className="mb-6 break-inside-avoid">
            <h2 className="mb-2 border-b-2 border-emerald-700 pb-1 text-sm font-bold text-emerald-900">
              Sumário
            </h2>
            <ol className="space-y-1">
              {sumarioTitulos.map((t, i) => (
                <li key={i} className="flex items-baseline gap-2 border-b border-dotted border-gray-300 py-0.5 text-xs text-gray-700">
                  <span className="min-w-5 font-bold text-emerald-800">{i + 1}.</span>
                  <span>{t}</span>
                </li>
              ))}
            </ol>
          </div>
        );
      case "quimicos_analise":
        return analiseBodyScreenNode;
      default:
        return null;
    }
  }

  const temFixosQ = capitulosQ.some((c) => c.tipo === "fixo");
  const corpoScreen = temFixosQ ? (
    blocosQ.map((c) =>
      c.tipo === "fixo" ? (
        <React.Fragment key={c.id_capitulo}>{renderSecaoQScreen(c.slug_fixo ?? "")}</React.Fragment>
      ) : (
        <TextosPadraoPrint key={c.id_capitulo} modulo="analise_quimicos" capituloId={c.id_capitulo} valores={valoresTextosPadrao} />
      ),
    )
  ) : (
    <>
      <TextosPadraoPrint modulo="analise_quimicos" valores={valoresTextosPadrao} posicao="inicio" />
      {analiseBodyScreenNode}
      <TextosPadraoPrint modulo="analise_quimicos" valores={valoresTextosPadrao} posicao="fim" />
    </>
  );

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
            <BotaoAssinarPdf reAssinatura={true} defaultSignatoryName={analise.usuario_nome ?? undefined} apiPdfUrl={`/api/pdf/analise-quimicos/${id}`} baseCongeladaUrl={baseCongeladaUrl} tabelaNome="analises_quimicos" docId={id} onAssinado={recarregar} />
          </>
        ) : (
          <BotaoAssinarPdf apiPdfUrl={`/api/pdf/analise-quimicos/${id}`} baseCongeladaUrl={baseCongeladaUrl} tabelaNome="analises_quimicos" docId={id} onAssinado={recarregar} />
        )}
        <BotaoGerarPdf
          apiPdfUrl={`/api/pdf/analise-quimicos/${id}`}
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

      <div className="px-4 pt-3">
        <PainelCongelamentoPdf
          modulo="analises_quimicos"
          idReferencia={id}
          apiPdfUrl={`/api/pdf/analise-quimicos/${id}`}
          opts={{
            tipoDocumento: "Análise de Agente Químico",
            empresaId: analise.id_empresa ?? undefined,
            empresaNome: empresa?.nome_empresa ?? undefined,
            empresaCnpj: empresa?.cnpj ?? undefined,
            responsavelTecnico: analise.usuario_nome ?? undefined,
          }}
        />
      </div>

      <div className="px-4 pt-3">
        <AnexosManager modulo="analise_quimicos" idReferencia={id} />
      </div>

      <div className="px-4 pt-3 print:hidden">
        <EmpresaInfoPanel empresa={empresa ?? null} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm" />
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

      {/* Corpo do laudo — ordem unificada (sistema + editáveis) ou layout legado */}
      {corpoScreen}

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
