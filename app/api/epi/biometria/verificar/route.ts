import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/client";

export const runtime = "nodejs";
export const maxDuration = 30;

type Rpc = { rpc<T = unknown>(fn: string, args?: Record<string, unknown>): Promise<{ data: T; error: { message: string } | null }> };

/**
 * Verificação biométrica 1:1 na assinatura: recebe a digital ao vivo, busca as amostras
 * cadastradas (decifradas), compara no serviço matcher (SourceAFIS no .107) e, se bater,
 * grava a assinatura como DIGITAL verificada (no servidor, p/ não dar pra forjar).
 * Sem matcher configurado/disponível → { fallback: true } (a UI cai p/ desenho).
 */
export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.json({ ok: false, erro: "Não autorizado" }, { status: 401 });

  const matcherUrl = process.env.EPI_MATCHER_URL;
  if (!matcherUrl) return NextResponse.json({ ok: false, fallback: true, erro: "Serviço de biometria não configurado." });

  let body: { id_entrega?: string; pdf_sha256?: string; sonda?: string; consentimento?: boolean };
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, erro: "Requisição inválida" }, { status: 400 }); }
  const { id_entrega, pdf_sha256, sonda, consentimento } = body;
  if (!id_entrega || !sonda) return NextResponse.json({ ok: false, erro: "Dados incompletos" }, { status: 400 });
  if (!consentimento) return NextResponse.json({ ok: false, erro: "Consentimento necessário" }, { status: 400 });

  const ip = (req.headers.get("x-forwarded-for")?.split(",")[0].trim()) || req.headers.get("x-real-ip") || null;

  try {
    // colaborador da entrega
    const { data: ent, error: eErr } = await supabase.from("epi_entregas").select("id_colaborador").eq("id", id_entrega).single();
    if (eErr || !ent) return NextResponse.json({ ok: false, erro: "Entrega não encontrada" }, { status: 404 });
    const idColab = (ent as { id_colaborador: string }).id_colaborador;

    // amostras cadastradas (decifradas)
    const rpc = supabase as unknown as Rpc;
    const { data: template, error: bErr } = await rpc.rpc<string | null>("epi_obter_biometria", { p_id_colaborador: idColab });
    if (bErr) return NextResponse.json({ ok: false, erro: bErr.message }, { status: 400 });
    if (!template) return NextResponse.json({ ok: false, erro: "Colaborador sem biometria cadastrada." });
    let amostras: string[];
    try { const p = JSON.parse(template); amostras = Array.isArray(p) ? p : [template]; } catch { amostras = [template]; }

    // compara no matcher
    let cmp: { ok: boolean; match?: boolean; score?: number; erro?: string };
    try {
      const r = await fetch(`${matcherUrl.replace(/\/$/, "")}/comparar`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sonda, amostras }), signal: AbortSignal.timeout(15000),
      });
      cmp = await r.json();
    } catch (e) {
      return NextResponse.json({ ok: false, fallback: true, erro: "Serviço de biometria indisponível: " + (e instanceof Error ? e.message : "") });
    }
    if (!cmp.ok) return NextResponse.json({ ok: false, erro: cmp.erro || "Falha na comparação." });
    if (!cmp.match) return NextResponse.json({ ok: true, match: false, score: cmp.score ?? null });

    // deu match → grava a assinatura digital (no servidor)
    const { data: idAssin, error: aErr } = await rpc.rpc<string>("epi_assinar_entrega", {
      p_id_entrega: id_entrega, p_assinante_nome: null, p_assinatura_png: null,
      p_pdf_sha256: pdf_sha256 || null, p_user_agent: req.headers.get("user-agent"),
      p_consentimento: true, p_metodo: "digital", p_match_score: cmp.score ?? null,
      p_finger_verificado: true, p_ip: ip,
    });
    if (aErr) return NextResponse.json({ ok: false, erro: aErr.message }, { status: 400 });
    return NextResponse.json({ ok: true, match: true, score: cmp.score ?? null, id_assinatura: idAssin });
  } catch (e) {
    return NextResponse.json({ ok: false, erro: e instanceof Error ? e.message : "Erro na verificação" }, { status: 500 });
  }
}
