"use client";

import { useState } from "react";
import { BadgeCheck, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import AssinarPdfModal from "@/components/ui/AssinarPdfModal";

interface Props {
  /** Email do profissional responsável pelo documento (pré-seleção no modal). */
  defaultSignatoryEmail?: string;
  /** Tabela do documento. Passado ao modal para salvar o PDF assinado no servidor. */
  tabelaNome?: string;
  /** ID do documento. Passado ao modal para salvar o PDF assinado no servidor. */
  docId?: string;
  /** Callback após assinatura bem-sucedida. */
  onAssinado?: () => void;
  /** Quando true, indica que o documento já foi assinado — exibe como ação secundária "Re-assinar". */
  reAssinatura?: boolean;
}

export default function BotaoAssinarPdf({
  defaultSignatoryEmail,
  tabelaNome,
  docId,
  onAssinado,
  reAssinatura = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [capturando, setCapturando] = useState(false);
  const [pdfBytes, setPdfBytes] = useState<ArrayBuffer | undefined>();

  async function handleClick() {
    // Captura o PDF ANTES de abrir o modal para evitar que o overlay
    // do modal interfira com o html-to-image (toPng usa SVG foreignObject
    // que renderiza o DOM e falha quando há um modal por cima).
    setCapturando(true);
    try {
      const { gerarHtmlParaPdf } = await import("@/lib/gerarHtmlParaPdf");
      const bytes = await gerarHtmlParaPdf({ forSigning: true });
      setPdfBytes(bytes);
      setOpen(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao capturar o documento. Tente novamente.");
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
        title={reAssinatura ? "Substituir a assinatura existente" : "Assinar este PDF com certificado A1 ICP-Brasil"}
      >
        {capturando ? (
          <Loader2 className={reAssinatura ? "size-3.5 animate-spin" : "size-4 animate-spin"} />
        ) : (
          <BadgeCheck className={reAssinatura ? "size-3.5" : "size-4"} />
        )}
        {capturando ? "Capturando..." : reAssinatura ? "Re-assinar" : "Assinar PDF A1"}
      </button>

      <AssinarPdfModal
        open={open}
        onClose={() => { setOpen(false); setPdfBytes(undefined); }}
        defaultSignatoryEmail={defaultSignatoryEmail}
        tabelaNome={tabelaNome}
        docId={docId}
        onAssinado={onAssinado}
        pdfBytes={pdfBytes}
      />
    </>
  );
}
