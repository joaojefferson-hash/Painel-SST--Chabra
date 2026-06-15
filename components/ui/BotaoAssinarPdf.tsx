"use client";

import { useState } from "react";
import { BadgeCheck, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import AssinarPdfModal from "@/components/ui/AssinarPdfModal";

interface Props {
  /** Email do profissional responsável pelo documento (pré-seleção no modal). */
  defaultSignatoryEmail?: string;
  /** Nome do profissional responsável cadastrado no documento (pré-seleção por
   *  nome quando não há email — útil para laudos que guardam só o nome). */
  defaultSignatoryName?: string;
  /** Tabela do documento. Passado ao modal para salvar o PDF assinado no servidor. */
  tabelaNome?: string;
  /** ID do documento. Passado ao modal para salvar o PDF assinado no servidor. */
  docId?: string;
  /** Callback após assinatura bem-sucedida. */
  onAssinado?: () => void;
  /** Quando true, indica que o documento já foi assinado — exibe como ação secundária "Re-assinar". */
  reAssinatura?: boolean;
  /**
   * URL de API que retorna o PDF pronto (Content-Type: application/pdf).
   * Quando fornecida, substitui gerarHtmlParaPdf() pela chamada fetch à API.
   * Ideal para laudos com template Puppeteer (ex: /api/pdf/aep/[id]).
   */
  apiPdfUrl?: string;
  /**
   * URL do PDF BASE já congelado (arquivo imutável, Fase 4). Quando presente,
   * a assinatura opera sobre ESTE arquivo (não regenera) — garante que o
   * assinado é byte-a-byte o aprovado. Tem prioridade sobre apiPdfUrl.
   */
  baseCongeladaUrl?: string;
}

export default function BotaoAssinarPdf({
  defaultSignatoryEmail,
  defaultSignatoryName,
  tabelaNome,
  docId,
  onAssinado,
  reAssinatura = false,
  apiPdfUrl,
  baseCongeladaUrl,
}: Props) {
  const [open, setOpen] = useState(false);
  const [capturando, setCapturando] = useState(false);
  const [pdfBytes, setPdfBytes] = useState<ArrayBuffer | undefined>();

  async function handleClick() {
    setCapturando(true);
    try {
      let bytes: ArrayBuffer;
      if (baseCongeladaUrl) {
        // Fase 4: assina sobre a base congelada (arquivo imutável), sem regenerar.
        const res = await fetch(baseCongeladaUrl);
        if (!res.ok) throw new Error("Falha ao baixar o PDF base congelado");
        bytes = await res.arrayBuffer();
      } else if (apiPdfUrl) {
        // Template Puppeteer: a API gera o PDF server-side e retorna o buffer.
        const res = await fetch(apiPdfUrl);
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Erro ao gerar PDF" }));
          throw new Error((err as { error?: string }).error ?? "Erro ao gerar PDF");
        }
        bytes = await res.arrayBuffer();
      } else {
        // Legado: captura o DOM via html-to-image (executa antes de abrir o
        // modal para evitar que o overlay interfira com o SVG foreignObject).
        const { gerarHtmlParaPdf } = await import("@/lib/gerarHtmlParaPdf");
        bytes = await gerarHtmlParaPdf({ forSigning: true });
      }
      setPdfBytes(bytes);
      setOpen(true);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao capturar o documento. Tente novamente.",
      );
    } finally {
      setCapturando(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={capturando}
        className={
          reAssinatura
            ? "inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-60 print:hidden"
            : "inline-flex items-center gap-1.5 rounded-md border border-blue-300 bg-white px-3 py-1.5 text-sm font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-60 print:hidden"
        }
        title={
          reAssinatura
            ? "Substituir a assinatura existente"
            : "Assinar este PDF com certificado A1 ICP-Brasil"
        }
      >
        {capturando ? (
          <Loader2 className={reAssinatura ? "size-3.5 animate-spin" : "size-4 animate-spin"} />
        ) : (
          <BadgeCheck className={reAssinatura ? "size-3.5" : "size-4"} />
        )}
        {capturando ? "Gerando PDF..." : reAssinatura ? "Re-assinar" : "Assinar PDF A1"}
      </button>

      <AssinarPdfModal
        open={open}
        onClose={() => {
          setOpen(false);
          setPdfBytes(undefined);
        }}
        defaultSignatoryEmail={defaultSignatoryEmail}
        defaultSignatoryName={defaultSignatoryName}
        tabelaNome={tabelaNome}
        docId={docId}
        onAssinado={onAssinado}
        pdfBytes={pdfBytes}
      />
    </>
  );
}
