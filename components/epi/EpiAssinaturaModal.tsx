"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Eraser, PenLine, FileCheck2, ShieldCheck, Fingerprint, CheckCircle2, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import EpiModal from "@/components/epi/EpiModal";
import SignatureCanvas, { type SignatureCanvasHandle } from "@/components/epi/SignatureCanvas";
import { useAssinarEntrega, obterBiometria } from "@/lib/hooks/useEpi";
import { biometriaSuportada, verifyDigital } from "@/lib/epi/digitalPersona";

async function sha256Hex(buf: ArrayBuffer): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

type Modo = "digital" | "canvas";

/**
 * Assinatura do recebedor: baixa a ficha PDF exata (SHA-256), captura o consentimento e:
 *  - digital: verifica a digital contra a cadastrada (1:1) e assina como 'digital';
 *  - desenho: canvas (fallback quando não há leitor/biometria ou a verificação falha).
 */
export default function EpiAssinaturaModal({
  idEntrega, empresaId, idColaborador, colaboradorNome, onClose,
}: {
  idEntrega: string;
  empresaId: string;
  idColaborador: string;
  colaboradorNome: string;
  onClose: () => void;
}) {
  const sigRef = useRef<SignatureCanvasHandle>(null);
  const assinar = useAssinarEntrega();
  const [nome, setNome] = useState(colaboradorNome);
  const [consent, setConsent] = useState(false);
  const [carregandoPdf, setCarregandoPdf] = useState(true);
  const [pdfSha, setPdfSha] = useState("");
  const [erroPdf, setErroPdf] = useState("");

  // biometria
  const [template, setTemplate] = useState<string | null>(null);
  const [modo, setModo] = useState<Modo>("canvas");
  const [verificando, setVerificando] = useState(false);
  const [verificado, setVerificado] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const resp = await fetch(`/api/pdf/epi-entrega/${idEntrega}`);
        if (!resp.ok) throw new Error("Falha ao carregar a ficha.");
        const sha = await sha256Hex(await resp.arrayBuffer());
        if (vivo) { setPdfSha(sha); setCarregandoPdf(false); }
      } catch (e) {
        if (vivo) { setErroPdf(e instanceof Error ? e.message : "Erro ao carregar a ficha."); setCarregandoPdf(false); }
      }
    })();
    // biometria cadastrada + leitor disponível → oferece modo digital
    (async () => {
      if (!biometriaSuportada()) return;
      try {
        const t = await obterBiometria(idColaborador);
        if (vivo && t) { setTemplate(t); setModo("digital"); }
      } catch { /* segue no desenho */ }
    })();
    return () => { vivo = false; };
  }, [idEntrega, idColaborador]);

  async function verificarDigital() {
    if (!template) return;
    setVerificando(true);
    try {
      const r = await verifyDigital(template);
      if (!r.ok) { toast.error(r.erro || "Falha na verificação."); return; }
      if (!r.match) { toast.error("A digital não confere com a cadastrada."); setVerificado(false); return; }
      setVerificado(true);
      setScore(r.score ?? null);
      toast.success("Digital verificada");
    } finally {
      setVerificando(false);
    }
  }

  function salvar() {
    if (!consent) { toast.error("Marque o consentimento do recebedor."); return; }
    if (modo === "digital") {
      if (!verificado) { toast.error("Verifique a digital antes de assinar."); return; }
      assinar.mutate(
        { empresa_id: empresaId, id_entrega: idEntrega, assinante_nome: nome, assinatura_png: "", pdf_sha256: pdfSha, consentimento: consent, metodo: "digital", finger_verificado: true, match_score: score },
        { onSuccess: onClose },
      );
    } else {
      if (sigRef.current?.isEmpty()) { toast.error("Assine no quadro antes de confirmar."); return; }
      assinar.mutate(
        { empresa_id: empresaId, id_entrega: idEntrega, assinante_nome: nome, assinatura_png: sigRef.current?.getDataUrl() ?? "", pdf_sha256: pdfSha, consentimento: consent, metodo: "canvas" },
        { onSuccess: onClose },
      );
    }
  }

  const temDigital = !!template;

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
        <div className={`flex items-center gap-2 rounded-md border px-3 py-2 text-xs ${erroPdf ? "border-red-200 bg-red-50 text-red-alert" : carregandoPdf ? "border-gray-200 bg-gray-50 text-gray-500" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
          {carregandoPdf ? <Loader2 className="size-4 animate-spin" /> : <FileCheck2 className="size-4" />}
          {erroPdf ? erroPdf : carregandoPdf ? "Carregando a ficha…" : <>Ficha carregada · SHA-256 <span className="font-mono">{pdfSha.slice(0, 16)}…</span></>}
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Nome do recebedor</label>
          <input value={nome} onChange={(e) => setNome(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-verde-primary focus:outline-none focus:ring-1 focus:ring-verde-primary/30" />
        </div>

        {/* Alternador de método (quando há digital cadastrada) */}
        {temDigital && (
          <div className="inline-flex rounded-md border border-gray-200 bg-white p-0.5 text-xs">
            <button type="button" onClick={() => setModo("digital")} className={`inline-flex items-center gap-1 rounded px-2.5 py-1 font-medium ${modo === "digital" ? "bg-verde-primary text-white" : "text-gray-600 hover:bg-gray-100"}`}><Fingerprint className="size-3.5" /> Digital</button>
            <button type="button" onClick={() => setModo("canvas")} className={`inline-flex items-center gap-1 rounded px-2.5 py-1 font-medium ${modo === "canvas" ? "bg-verde-primary text-white" : "text-gray-600 hover:bg-gray-100"}`}><PenLine className="size-3.5" /> Desenho</button>
          </div>
        )}

        {modo === "digital" && temDigital ? (
          <div className="rounded-md border border-gray-200 p-3 text-center">
            {verificado ? (
              <div className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700"><CheckCircle2 className="size-5" /> Digital verificada{score != null ? ` (score ${score})` : ""}</div>
            ) : (
              <>
                <Fingerprint className="mx-auto size-8 text-gray-400" />
                <p className="mt-1 text-xs text-gray-500">Posicione o dedo do colaborador no leitor e verifique.</p>
                <button type="button" onClick={verificarDigital} disabled={verificando} className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-verde-primary/40 px-3 py-1.5 text-xs font-semibold text-verde-primary hover:bg-verde-primary/5 disabled:opacity-60">
                  {verificando ? <Loader2 className="size-4 animate-spin" /> : <Fingerprint className="size-4" />} Verificar digital
                </button>
              </>
            )}
          </div>
        ) : (
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-xs font-medium text-gray-600">Assinatura (desenhe no quadro)</label>
              <button type="button" onClick={() => sigRef.current?.clear()} className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-red-alert"><Eraser className="size-3.5" /> Limpar</button>
            </div>
            <SignatureCanvas ref={sigRef} />
            {temDigital && <p className="mt-1 flex items-center gap-1 text-[11px] text-amber-600"><AlertTriangle className="size-3" /> Assinatura por desenho não é verificada por biometria.</p>}
          </div>
        )}

        <label className="flex items-start gap-2 rounded-md border border-gray-200 bg-gray-50 p-2.5 text-xs text-gray-600">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 size-4 rounded border-gray-300 text-verde-primary focus:ring-verde-primary" />
          <span>
            <ShieldCheck className="mr-1 inline size-3.5 text-verde-primary" />
            O recebedor declara ter recebido os EPIs desta ficha e <strong>consente</strong> com o registro da sua assinatura
            eletrônica e dos dados de evidência (data/hora, hash do documento, IP e — quando por digital — o resultado da
            verificação biométrica), nos termos da Lei 14.063/2020 e da LGPD (Lei 13.709/2018).
          </span>
        </label>
      </div>
    </EpiModal>
  );
}
