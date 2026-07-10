"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Eraser, PenLine, FileCheck2, ShieldCheck, Fingerprint, CheckCircle2, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import EpiModal from "@/components/epi/EpiModal";
import SignatureCanvas, { type SignatureCanvasHandle } from "@/components/epi/SignatureCanvas";
import { useAssinarEntrega } from "@/lib/hooks/useEpi";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { capturarDigitalWeb, sdkWebDisponivel } from "@/lib/epi/digitalPersonaWeb";

async function sha256Hex(buf: ArrayBuffer): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

type Modo = "digital" | "canvas";

/**
 * Assinatura do recebedor. Se o colaborador tem digital cadastrada e há leitor, verifica
 * a digital ao vivo contra a cadastrada (match no servidor) e assina como 'digital'.
 * Senão / se falhar, cai para o desenho (canvas).
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
  const qc = useQueryClient();
  const assinar = useAssinarEntrega();
  const [nome, setNome] = useState(colaboradorNome);
  const [consent, setConsent] = useState(false);
  const [carregandoPdf, setCarregandoPdf] = useState(true);
  const [pdfSha, setPdfSha] = useState("");
  const [erroPdf, setErroPdf] = useState("");

  const [temDigital, setTemDigital] = useState(false);
  const [dedo, setDedo] = useState<string | null>(null);
  const [modo, setModo] = useState<Modo>("canvas");
  const [verificando, setVerificando] = useState(false);
  const [erroDigital, setErroDigital] = useState<string | null>(null);

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
    (async () => {
      if (!(await sdkWebDisponivel())) return; // sem leitor/SDK → só desenho
      const sb = createSupabaseBrowserClient();
      const { data } = await sb.from("epi_colaboradores").select("biometria_em, biometria_dedo").eq("id", idColaborador).maybeSingle();
      const row = data as { biometria_em: string | null; biometria_dedo: string | null } | null;
      if (vivo && row?.biometria_em) { setTemDigital(true); setDedo(row.biometria_dedo); setModo("digital"); }
    })();
    return () => { vivo = false; };
  }, [idEntrega, idColaborador]);

  async function verificarEAssinar() {
    if (!consent) { toast.error("Marque o consentimento do recebedor."); return; }
    setVerificando(true); setErroDigital(null);
    try {
      const cap = await capturarDigitalWeb();
      if (!cap.ok || !cap.imagem) { setErroDigital(cap.erro || "Não foi possível capturar a digital."); return; }
      const resp = await fetch("/api/epi/biometria/verificar", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_entrega: idEntrega, pdf_sha256: pdfSha, sonda: cap.imagem, consentimento: true }),
      });
      const j = await resp.json();
      if (j.fallback) { toast.error("Serviço de biometria indisponível — assine por desenho."); setModo("canvas"); return; }
      if (!j.ok) { setErroDigital(j.erro || "Falha na verificação."); return; }
      if (!j.match) { setErroDigital(`A digital não confere com a cadastrada${j.score != null ? ` (score ${Number(j.score).toFixed(1)})` : ""}.`); return; }
      qc.invalidateQueries({ queryKey: ["epi-entregas", empresaId] });
      toast.success("Assinado por biometria");
      onClose();
    } catch (e) {
      setErroDigital(e instanceof Error ? e.message : "Erro na verificação.");
    } finally {
      setVerificando(false);
    }
  }

  function assinarDesenho() {
    if (!consent) { toast.error("Marque o consentimento do recebedor."); return; }
    if (sigRef.current?.isEmpty()) { toast.error("Assine no quadro antes de confirmar."); return; }
    assinar.mutate(
      { empresa_id: empresaId, id_entrega: idEntrega, assinante_nome: nome, assinatura_png: sigRef.current?.getDataUrl() ?? "", pdf_sha256: pdfSha, consentimento: consent, metodo: "canvas" },
      { onSuccess: onClose },
    );
  }

  const ocupado = assinar.isPending || verificando;

  return (
    <EpiModal
      open
      title="Assinatura do recebedor"
      onClose={onClose}
      maxWidth="max-w-xl"
      footer={
        <>
          <button type="button" onClick={onClose} className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">Cancelar</button>
          {modo === "digital" ? (
            <button type="button" onClick={verificarEAssinar} disabled={ocupado || carregandoPdf || !!erroPdf} className="inline-flex items-center gap-1.5 rounded-md bg-verde-primary px-3 py-1.5 text-sm font-semibold text-white hover:bg-verde-accent disabled:opacity-60">
              {verificando ? <Loader2 className="size-4 animate-spin" /> : <Fingerprint className="size-4" />} Verificar e assinar
            </button>
          ) : (
            <button type="button" onClick={assinarDesenho} disabled={ocupado || carregandoPdf || !!erroPdf} className="inline-flex items-center gap-1.5 rounded-md bg-verde-primary px-3 py-1.5 text-sm font-semibold text-white hover:bg-verde-accent disabled:opacity-60">
              {assinar.isPending ? <Loader2 className="size-4 animate-spin" /> : <PenLine className="size-4" />} Assinar
            </button>
          )}
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

        {temDigital && (
          <div className="inline-flex rounded-md border border-gray-200 bg-white p-0.5 text-xs">
            <button type="button" onClick={() => setModo("digital")} className={`inline-flex items-center gap-1 rounded px-2.5 py-1 font-medium ${modo === "digital" ? "bg-verde-primary text-white" : "text-gray-600 hover:bg-gray-100"}`}><Fingerprint className="size-3.5" /> Digital</button>
            <button type="button" onClick={() => setModo("canvas")} className={`inline-flex items-center gap-1 rounded px-2.5 py-1 font-medium ${modo === "canvas" ? "bg-verde-primary text-white" : "text-gray-600 hover:bg-gray-100"}`}><PenLine className="size-3.5" /> Desenho</button>
          </div>
        )}

        {modo === "digital" && temDigital ? (
          <div className="rounded-md border border-gray-200 p-3 text-center">
            <Fingerprint className="mx-auto size-8 text-gray-400" />
            <p className="mt-1 text-xs text-gray-500">Posicione o <strong>{dedo ?? "dedo cadastrado"}</strong> do colaborador no leitor e clique em <em>Verificar e assinar</em>.</p>
            {verificando && <p className="mt-1 text-xs text-verde-primary">Encoste o dedo…</p>}
            {erroDigital && <p className="mt-1 text-xs text-red-alert">{erroDigital}</p>}
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
