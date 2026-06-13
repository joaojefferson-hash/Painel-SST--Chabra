"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ArrowLeft, AlertTriangle, BadgeCheck, Download, Loader2, AlertCircle } from "lucide-react";
import { usePdfAssinado } from "@/lib/hooks/usePdfsGerados";
import BotaoAssinarPdf from "@/components/ui/BotaoAssinarPdf";
import BotaoGerarPdf from "@/components/ui/BotaoGerarPdf";
import toast from "react-hot-toast";
import { useEmpresa } from "@/lib/hooks/useEmpresas";
import RelatorioPrintHeader from "@/components/layout/RelatorioPrintHeader";
import TextosPadraoPrint from "@/components/textos-padrao/TextosPadraoPrint";
import { montarValoresEmpresa, formatarDataBR } from "@/lib/textos-padrao/variaveis";
import { useRelatorioNaoConformidade } from "@/lib/hooks/useRelatoriosNaoConformidade";
import AssinaturaRelatorio from "@/components/ui/AssinaturaRelatorio";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type {
  CriticidadeNC,
  RelatorioNaoConformidadeItem,
  StatusTratativaNC,
} from "@/lib/supabase/types";

export default function LaudoNaoConformidadePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data, isLoading, error } = useRelatorioNaoConformidade(id);
  const { data: empresa } = useEmpresa(data?.relatorio.id_empresa ?? null);

  const { pdfAssinado, recarregar } = usePdfAssinado("relatorios_nao_conformidade", id);
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
        <Link href="/relatorio-nao-conformidade" className="mt-4 inline-block text-sm text-red-700 hover:underline">
          Voltar
        </Link>
      </div>
    );
  }

  const { relatorio, itens } = data;
  const finalizado = relatorio.status === "FINALIZADO";

  const ncsAlta = itens.filter((i) => i.criticidade === "ALTA").length;
  const ncsMedia = itens.filter((i) => i.criticidade === "MEDIA").length;
  const ncsBaixa = itens.filter((i) => i.criticidade === "BAIXA").length;

  const valoresTextosPadrao: Record<string, string> = {
    ...montarValoresEmpresa(empresa),
    titulo: relatorio.titulo,
    responsavel: relatorio.responsavel ?? "",
    responsavel_empresa: relatorio.responsavel_empresa ?? "",
    cidade: relatorio.cidade ?? "",
    setor: relatorio.setor ?? "",
    data_inspecao: formatarDataBR(relatorio.data_inspecao),
    total_ncs: String(itens.length),
    total_ncs_alta: String(ncsAlta),
    carimbo: relatorio.responsavel ?? "",
    importado: formatarDataBR(relatorio.created_at),
  };

  return (
    <div className="mx-auto max-w-4xl space-y-4 print:max-w-none print:space-y-2">
      {/* Toolbar — não imprime */}
      <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
        <Link
          href={`/relatorio-nao-conformidade/${id}`}
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
            <BotaoAssinarPdf reAssinatura={true} apiPdfUrl={`/api/pdf/nao-conformidade/${id}`} tabelaNome="relatorios_nao_conformidade" docId={id} onAssinado={recarregar} />
          </>
        ) : (
          <BotaoAssinarPdf apiPdfUrl={`/api/pdf/nao-conformidade/${id}`} tabelaNome="relatorios_nao_conformidade" docId={id} onAssinado={recarregar} />
        )}
        <BotaoGerarPdf
          apiPdfUrl={`/api/pdf/nao-conformidade/${id}`}
          tabelaNome="relatorios_nao_conformidade"
          docId={id}
          className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          registrarPdf={{
            modulo: "nao_conformidade",
            tipoDocumento: "Relatório de Não Conformidade",
            idRelatorio: id,
            empresaId: relatorio.id_empresa ?? undefined,
            empresaNome: empresa?.nome_empresa ?? undefined,
            empresaCnpj: empresa?.cnpj ?? undefined,
            responsavelTecnico: relatorio.responsavel ?? undefined,
          }}
        />
      </div>

      {/* Logo Chabra */}
      <RelatorioPrintHeader
        titulo={`Relatório de Não Conformidade — ${relatorio.titulo}`}
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
            <p className="text-xs font-bold uppercase tracking-wider text-red-700">
              Relatório de Não Conformidade
            </p>
            <h1 className="mt-1 text-2xl font-bold text-gray-900">{relatorio.titulo}</h1>
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
          <DataItem
            label="NR vinculada"
            value={
              relatorio.nr_codigo
                ? `${relatorio.nr_codigo} — ${relatorio.nr_titulo ?? ""}`
                : "—"
            }
          />
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

      {/* Resumo de NCs */}
      <section className="grid grid-cols-2 gap-2 sm:grid-cols-4 print:grid-cols-4">
        <ResumoCard label="Total de NCs" valor={itens.length} cor="red" />
        <ResumoCard label="Criticidade ALTA" valor={ncsAlta} cor="red" />
        <ResumoCard label="Criticidade MÉDIA" valor={ncsMedia} cor="amber" />
        <ResumoCard label="Criticidade BAIXA" valor={ncsBaixa} cor="emerald" />
      </section>

      {/* Textos Padrão inicio */}
      <TextosPadraoPrint modulo="nao_conformidade" valores={valoresTextosPadrao} posicao="inicio" />

      {/* Lista de NCs — somente leitura */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-700 print:text-base">
          Não Conformidades ({itens.length})
        </h2>
        {itens.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhuma NC registrada neste relatório.</p>
        ) : (
          <div className="space-y-3">
            {itens.map((item, idx) => (
              <ItemNCReadOnly key={item.id_item} item={item} ordem={idx + 1} />
            ))}
          </div>
        )}
      </section>

      {/* Observações gerais */}
      {relatorio.observacoes_gerais && (
        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm print:border-0 print:shadow-none print:p-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-600">Observações Gerais</p>
          <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{relatorio.observacoes_gerais}</p>
        </section>
      )}

      {/* Textos Padrão fim */}
      <TextosPadraoPrint modulo="nao_conformidade" valores={valoresTextosPadrao} posicao="fim" />

      {/* Assinatura */}
      <AssinaturaRelatorio
        nomeResponsavel={relatorio.responsavel ?? undefined}
        dataRelatorio={formatarDataBR(relatorio.data_inspecao) || undefined}
        tabelaNome="relatorios_nao_conformidade"
        docId={id}
        hideAcoes
      />

      <p className="text-center text-[9px] text-gray-500 print:mt-4">
        Relatório de Não Conformidade gerado por Chabra — Segurança e Saúde do Trabalho ·{" "}
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
}: {
  label: string;
  valor: string | number;
  cor: "red" | "amber" | "emerald";
}) {
  const cores = {
    red: "border-red-200 bg-red-50 text-red-900",
    amber: "border-amber-200 bg-amber-50 text-amber-900",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-900",
  };
  return (
    <div className={`rounded-lg border p-3 text-center ${cores[cor]}`}>
      <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">{label}</p>
      <p className="text-2xl font-bold">{valor}</p>
    </div>
  );
}

function CriticidadeBadge({ criticidade }: { criticidade: CriticidadeNC }) {
  const cfg = {
    ALTA: { cls: "bg-red-100 text-red-800 border-red-300", label: "ALTA" },
    MEDIA: { cls: "bg-amber-100 text-amber-800 border-amber-300", label: "MÉDIA" },
    BAIXA: { cls: "bg-emerald-100 text-emerald-800 border-emerald-300", label: "BAIXA" },
  }[criticidade];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${cfg.cls}`}>
      <AlertTriangle className="size-3" /> {cfg.label}
    </span>
  );
}

function StatusTratativaBadge({ status }: { status: StatusTratativaNC }) {
  const cfg = {
    ABERTA: { cls: "bg-red-100 text-red-800", label: "Aberta" },
    EM_TRATAMENTO: { cls: "bg-amber-100 text-amber-800", label: "Em tratamento" },
    ENCERRADA: { cls: "bg-emerald-100 text-emerald-800", label: "Encerrada" },
  }[status];
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${cfg.cls}`}>{cfg.label}</span>
  );
}

function ItemNCReadOnly({
  item,
  ordem,
}: {
  item: RelatorioNaoConformidadeItem;
  ordem: number;
}) {
  const corBorda =
    item.criticidade === "ALTA"
      ? "border-red-300 bg-red-50/40"
      : item.criticidade === "MEDIA"
      ? "border-amber-300 bg-amber-50/40"
      : "border-emerald-300 bg-emerald-50/40";

  const fotoUrls = item.foto_urls ?? [];
  const temFotos = fotoUrls.length > 0;

  const labelCls = "block text-[10px] font-semibold uppercase tracking-wider text-gray-600 mb-0.5";

  return (
    <article className={`rounded-lg border p-4 print:break-inside-avoid ${corBorda}`}>
      <div className="flex items-start gap-3">
        <span className="mt-0.5 inline-block min-w-[3rem] rounded bg-red-100 px-1.5 py-0.5 text-center font-mono text-[11px] font-bold text-red-800">
          NC #{ordem}
        </span>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <CriticidadeBadge criticidade={item.criticidade} />
            <StatusTratativaBadge status={item.status_tratativa} />
            {item.prazo && (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-700">
                Prazo: {new Date(item.prazo + "T00:00").toLocaleDateString("pt-BR")}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="md:col-span-2">
          <p className={labelCls}>Descrição da não conformidade</p>
          <p className="text-sm text-gray-900 whitespace-pre-wrap">{item.descricao}</p>
        </div>

        {item.norma_violada && (
          <div>
            <p className={labelCls}>Norma violada</p>
            <p className="text-sm text-gray-900">{item.norma_violada}</p>
          </div>
        )}

        {item.causa_raiz && (
          <div className="md:col-span-2">
            <p className={labelCls}>Causa raiz</p>
            <p className="text-sm text-gray-900 whitespace-pre-wrap">{item.causa_raiz}</p>
          </div>
        )}

        {item.acao_corretiva && (
          <div className="md:col-span-2">
            <p className={labelCls}>Ação corretiva proposta</p>
            <p className="text-sm text-gray-900 whitespace-pre-wrap">{item.acao_corretiva}</p>
          </div>
        )}

        {item.responsavel_tratativa && (
          <div>
            <p className={labelCls}>Responsável pela tratativa</p>
            <p className="text-sm text-gray-900">{item.responsavel_tratativa}</p>
          </div>
        )}
      </div>

      {/* Fotos */}
      {temFotos && (
        <div className="mt-4">
          <p className={labelCls}>Evidência fotográfica</p>
          <div className="mt-2 flex justify-center">
            <div className={fotoUrls.length === 1 ? "flex justify-center" : "grid grid-cols-2 gap-3 print:gap-2"}>
              {fotoUrls.map((url, idx) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={`${url}-${idx}`}
                  src={url}
                  alt={`Evidência NC #${ordem}`}
                  className="h-36 w-44 object-cover rounded-md border border-gray-300 sm:h-40 sm:w-52 print:h-40 print:w-48"
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
