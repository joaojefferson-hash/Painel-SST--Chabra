// Captura de digital NO NAVEGADOR via o agente local DpHost (o mesmo do SGG), usando o
// SDK web da DigitalPersona carregado como <script> (evita o webpack — gotcha do WebSdk).
// Ordem obrigatória: WebSdk → dp.core → dp.devices. Captura imagem PNG (p/ o matcher).

export interface CapturaResult { ok: boolean; imagem?: string; qualidade?: string; erro?: string }

const VENDORS = [
  "/vendor/websdk.client.ui.min.js",
  "/vendor/dp.core.min.js",
  "/vendor/dp.devices.min.js",
];

let carregado: Promise<void> | null = null;
function carregarSdk(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("Sem navegador."));
  if (carregado) return carregado;
  carregado = (async () => {
    for (const src of VENDORS) {
      await new Promise<void>((resolve, reject) => {
        if (document.querySelector(`script[data-dp="${src}"]`)) return resolve();
        const s = document.createElement("script");
        s.src = src; s.async = false; s.defer = false; s.dataset.dp = src;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error(`Falha ao carregar ${src}`));
        document.head.appendChild(s);
      });
    }
  })();
  return carregado;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function devicesApi(): any {
  const dp = (window as any).dp;
  if (!dp?.devices?.FingerprintReader) throw new Error("SDK de digital não disponível.");
  return dp.devices;
}

/** Há SDK + (tentativa de) agente? Só confirma que o SDK carregou. */
export async function sdkWebDisponivel(): Promise<boolean> {
  try { await carregarSdk(); return !!(window as any).dp?.devices?.FingerprintReader; } catch { return false; }
}

/** Captura uma digital (imagem PNG base64). Encoste o dedo até ~timeout. */
export async function capturarDigitalWeb(timeoutMs = 20000): Promise<CapturaResult> {
  try {
    await carregarSdk();
    const devices = devicesApi();
    const reader = new devices.FingerprintReader();
    return await new Promise<CapturaResult>((resolve) => {
      let done = false;
      const finish = (r: CapturaResult) => {
        if (done) return; done = true;
        try { reader.stopAcquisition(); } catch { /* noop */ }
        resolve(r);
      };
      const timer = setTimeout(() => finish({ ok: false, erro: "Tempo esgotado — encoste o dedo no leitor." }), timeoutMs);

      reader.on("SamplesAcquired", (ev: any) => {
        clearTimeout(timer);
        let img = "";
        try {
          const raw = ev?.samples ?? ev?.sampleData ?? "";
          const parsed = typeof raw === "string" && raw.trim().startsWith("[") ? JSON.parse(raw) : raw;
          img = Array.isArray(parsed) ? String(parsed[0] ?? "") : String(parsed ?? "");
        } catch { img = String(ev?.samples ?? ev?.sampleData ?? ""); }
        // o SDK usa base64url → normaliza p/ base64 padrão
        img = img.replace(/-/g, "+").replace(/_/g, "/");
        if (!img) return finish({ ok: false, erro: "Amostra vazia." });
        finish({ ok: true, imagem: img });
      });
      reader.on("QualityReported", (ev: any) => { void ev; });
      reader.on("ErrorOccurred", (ev: any) => { clearTimeout(timer); finish({ ok: false, erro: "Erro no leitor: " + (ev?.error ?? "desconhecido") }); });
      reader.on("CommunicationFailed", () => { clearTimeout(timer); finish({ ok: false, erro: "Sem comunicação com o agente (DpHost). Verifique se o leitor e o agente da DigitalPersona estão ativos." }); });

      Promise.resolve(reader.startAcquisition(devices.SampleFormat.PngImage))
        .catch((e: any) => { clearTimeout(timer); finish({ ok: false, erro: "Não foi possível iniciar a captura: " + (e?.message ?? e) }); });
    });
  } catch (e) {
    return { ok: false, erro: e instanceof Error ? e.message : "Falha na captura." };
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */
