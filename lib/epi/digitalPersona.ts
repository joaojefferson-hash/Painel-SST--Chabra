// Wrapper da biometria digital (DigitalPersona). O MATCH real acontece no helper
// nativo do app DESKTOP (Electron), exposto em window.electronAPI. No navegador puro
// (ou sem leitor), tudo degrada — a UI cai para a assinatura por desenho.

export interface EnrollResult { ok: boolean; template?: string; qualidade?: number; erro?: string }
export interface VerifyResult { ok: boolean; match?: boolean; score?: number; erro?: string }

interface ElectronEpiApi {
  epiLeitorDisponivel?: () => Promise<boolean>;
  epiEnrollDigital?: () => Promise<EnrollResult>;
  epiVerifyDigital?: (templateBase64: string) => Promise<VerifyResult>;
}

function api(): ElectronEpiApi | null {
  if (typeof window === "undefined") return null;
  const a = (window as unknown as { electronAPI?: ElectronEpiApi }).electronAPI;
  return a && typeof a.epiEnrollDigital === "function" ? a : null;
}

/** Estamos no app desktop com o helper de biometria disponível? */
export function biometriaSuportada(): boolean {
  return !!api();
}

/** O leitor está conectado/pronto agora? */
export async function leitorDisponivel(): Promise<boolean> {
  const a = api();
  if (!a?.epiLeitorDisponivel) return false;
  try { return await a.epiLeitorDisponivel(); } catch { return false; }
}

/** Captura a 1ª digital (enroll) e devolve o template (base64). */
export async function enrollDigital(): Promise<EnrollResult> {
  const a = api();
  if (!a?.epiEnrollDigital) return { ok: false, erro: "Biometria disponível apenas no aplicativo desktop com leitor." };
  try { return await a.epiEnrollDigital(); } catch (e) { return { ok: false, erro: e instanceof Error ? e.message : "Falha na captura." }; }
}

/** Captura a digital e compara com o template cadastrado (verificação 1:1). */
export async function verifyDigital(templateBase64: string): Promise<VerifyResult> {
  const a = api();
  if (!a?.epiVerifyDigital) return { ok: false, erro: "Biometria disponível apenas no aplicativo desktop com leitor." };
  try { return await a.epiVerifyDigital(templateBase64); } catch (e) { return { ok: false, erro: e instanceof Error ? e.message : "Falha na verificação." }; }
}
