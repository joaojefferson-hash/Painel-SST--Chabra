"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Eraser, PenLine, FileCheck2, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import EpiModal from "@/components/epi/EpiModal";
import SignatureCanvas, { type SignatureCanvasHandle } from "@/components/epi/SignatureCanvas";
import { useAssinarEntrega } from "@/lib/hooks/useEpi";

async function sha256Hex(buf: ArrayBuffer): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Assinatura eletrônica do recebedor: baixa a ficha PDF exata, calcula o SHA-256,
 * captura o desenho e o consentimento (LGPD) e grava a trilha via RPC.
 */
export default function EpiAssinaturaModal({
  idEntrega, empresaId, colaboradorNome, onClose,
}: {
  idEntrega: string;
  empresaId: string;
  colaboradorNome: string;
  onClose: () => void;
}) {
  const sigRef = useRef<SignatureCanvasHandle>(null);
  const assinar = useAssinarEntrega();
  const [nome, setNome] = useState(colaboradorNome);
  const [consent, setConsent] = useState(false);
  const [carregandoPdf, setCarregandoPdf] = useState(true);
  const [pdfSha, setPdfSha] = useState<string>("");
  const [erroPdf, setErroPdf] = useState<string>("");

  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const resp = await fetch(`/api/pdf/epi-entrega/${idEntrega}`);
        if (!resp.ok) throw new Error("Falha ao carregar a ficha.");
        const buf = await resp.arrayBuffer();
        const sha = await sha256Hex(buf);
        if (vivo) { setPdfSha(sha); setCarregandoPdf(false); }
      } catch (e) {
        if (vivo) { setErroPdf(e instanceof Error ? e.message : "Erro ao carregar a ficha."); setCarregandoPdf(false); }
      }
    })();
    return () => { vivo = false; };
  }, [idEntrega]);

  function salvar() {
    if (sigRef.current?.isEmpty()) { toast.error("Assine no quadro antes de confirmar."); return; }
    if (!consent) { toast.error("Marque o consentimento do recebedor."); return; }
    const png = sigRef.current?.getDataUrl() ?? "";
    assinar.mutate(
      { empresa_id: empresaId, id_entrega: idEntrega, assinante_nome: nome, assinatura_png: png, pdf_sha256: pdfSha, consentimento: consent },
      { onSuccess: onClose },
    );
  }

  return (
    <EpiModal
      open
      title="Assinatura do recebedor"
      onClose={onClose}
      maxWidth="max-w-xl"
      footer={
        <>
          <button type="button" onClick={onClose} className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">Cancelar</button>
          <button type="button" onClick={salvar} disabled={assinar.isPending || carregandoPdf || !!erroPdf} className="inline-flex items-center gap-1.5 rounded-md bg-verde-primary px-3 py-1.5 text-sm font-semibold text-white hover:bg-verde-accent disabled:opacity-60">
            {assinar.isPending ? <Loader2 className="size-4 animate-spin" /> : <PenLine className="size-4" />} Assinar
          </button>
        </>
      }
    >
      <div className="space-y-3">
        {/* status do documento */}
        <div className={`flex items-center gap-2 rounded-md border px-3 py-2 text-xs ${erroPdf ? "border-red-200 bg-red-50 text-red-alert" : carregandoPdf ? "border-gray-200 bg-gray-50 text-gray-500" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
          {carregandoPdf ? <Loader2 className="size-4 animate-spin" /> : <FileCheck2 className="size-4" />}
          {erroPdf ? erroPdf : carregandoPdf ? "Carregando a ficha para assinatura…" : <>Ficha carregada · SHA-256 <span className="font-mono">{pdfSha.slice(0, 16)}…</span></>}
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Nome do recebedor</label>
          <input value={nome} onChange={(e) => setNome(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-verde-primary focus:outline-none focus:ring-1 focus:ring-verde-primary/30" />
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="text-xs font-medium text-gray-600">Assinatura (desenhe no quadro)</label>
            <button type="button" onClick={() => sigRef.current?.clear()} className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-red-alert"><Eraser className="size-3.5" /> Limpar</button>
          </div>
          <SignatureCanvas ref={sigRef} />
        </div>

        <label className="flex items-start gap-2 rounded-md border border-gray-200 bg-gray-50 p-2.5 text-xs text-gray-600">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 size-4 rounded border-gray-300 text-verde-primary focus:ring-verde-primary" />
          <span>
            <ShieldCheck className="mr-1 inline size-3.5 text-verde-primary" />
            O recebedor declara ter recebido os EPIs desta ficha e <strong>consente</strong> com o registro da sua assinatura
            eletrônica e dos dados de evidência (data/hora, hash do documento e IP), nos termos da Lei 14.063/2020 e da
            LGPD (Lei 13.709/2018), para fins de comprovação da entrega.
          </span>
        </label>
      </div>
    </EpiModal>
  );
}
