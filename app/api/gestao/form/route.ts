import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

/**
 * Formulário público da Gestão (porta a Edge Function gestao-form-submit p/ a .107).
 * PÚBLICO, guardado por token do formulário. Usa service_role (PostgREST .107).
 * Precisa de CF Access "Bypass" no path /api/gestao/* p/ ser alcançável de fora.
 *   GET  ?token=...  -> definição pública do formulário
 *   POST { token, titulo, descricao?, prazo?, prioridade?, respostas[] } -> cria tarefa
 */
interface Pergunta { label: string; obrigatorio: boolean }

function gerarIdTarefa(): string {
  const hex = Array.from(crypto.getRandomValues(new Uint8Array(4)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
  return `TRF-${hex}`;
}

export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Token ausente." }, { status: 400 });
  const sb = createSupabaseServiceClient();
  const { data } = await sb.from("gestao_formularios").select("*").eq("token", token).maybeSingle();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const f = data as any;
  if (!f || !f.ativo) return NextResponse.json({ error: "Formulário indisponível." }, { status: 404 });
  return NextResponse.json({
    titulo: f.titulo,
    descricao: f.descricao,
    mostra_descricao: f.mostra_descricao,
    mostra_prazo: f.mostra_prazo,
    mostra_prioridade: f.mostra_prioridade,
    prioridade_padrao: f.prioridade_padrao,
    perguntas: f.perguntas ?? [],
  });
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as
    | { token?: string; titulo?: string; descricao?: string; prazo?: string; prioridade?: string; respostas?: string[] }
    | null;
  if (!body?.token) return NextResponse.json({ error: "Token ausente." }, { status: 400 });

  const sb = createSupabaseServiceClient();
  const { data } = await sb.from("gestao_formularios").select("*").eq("token", body.token).maybeSingle();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const f = data as any;
  if (!f || !f.ativo) return NextResponse.json({ error: "Formulário indisponível." }, { status: 404 });

  const titulo = (body.titulo ?? "").trim();
  if (!titulo) return NextResponse.json({ error: "Informe o título da solicitação." }, { status: 400 });

  const perguntas = (f.perguntas ?? []) as Pergunta[];
  const respostas = Array.isArray(body.respostas) ? body.respostas : [];
  for (let i = 0; i < perguntas.length; i++) {
    if (perguntas[i].obrigatorio && !(respostas[i] ?? "").trim()) {
      return NextResponse.json({ error: `Responda: ${perguntas[i].label}` }, { status: 400 });
    }
  }

  let status = f.status_inicial as string | null;
  if (!status) {
    const { data: st } = await sb
      .from("gestao_status")
      .select("slug")
      .eq("id_quadro", f.id_quadro)
      .order("ordem", { ascending: true })
      .limit(1)
      .maybeSingle();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    status = (st as any)?.slug ?? "A_FAZER";
  }

  const partes: string[] = [];
  if (f.mostra_descricao && (body.descricao ?? "").trim()) partes.push((body.descricao ?? "").trim());
  const linhas = perguntas
    .map((p, i) => ({ p, r: (respostas[i] ?? "").trim() }))
    .filter((x) => x.r)
    .map((x) => `${x.p.label}: ${x.r}`);
  if (linhas.length) partes.push(linhas.join("\n"));
  const descricao = partes.join("\n\n") || null;

  const prioridade = f.mostra_prioridade && body.prioridade ? body.prioridade : f.prioridade_padrao;
  const prazo = f.mostra_prazo && body.prazo ? body.prazo : null;
  const now = new Date().toISOString();

  const { error } = await sb.from("gestao_tarefas").insert({
    id_tarefa: gerarIdTarefa(),
    id_quadro: f.id_quadro,
    titulo,
    descricao,
    status,
    prioridade,
    responsavel: f.responsavel_padrao,
    prazo,
    data_inicio: null,
    ordem: 0,
    etiquetas: f.etiquetas_padrao ?? [],
    subtarefas: [],
    campos: {},
    recorrencia: null,
    pontos: null,
    created_by: "Formulário",
    created_at: now,
    updated_at: now,
  } as never);
  if (error) return NextResponse.json({ error: "Não foi possível registrar a solicitação." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
