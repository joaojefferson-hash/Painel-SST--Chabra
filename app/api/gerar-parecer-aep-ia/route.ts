import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/client";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.1-8b-instant";

type CampoAep = "parecer_tecnico" | "recomendacoes";

interface ContextoAepIA {
  campo: CampoAep;
  empresa_nome?: string | null;
  setor_nome: string;
  cargos?: { cargo: string; descricao: string }[];
  jornada?: string | null;
  qtd_expostos?: number | null;
  checklist_fisica?: Record<string, string>;
  checklist_cognitiva?: Record<string, string>;
  checklist_organizacional?: Record<string, string>;
  observacoes?: Record<string, string>;
  textoAtual?: string | null;
}

const TITULO: Record<CampoAep, string> = {
  parecer_tecnico: "Parecer Técnico Preliminar",
  recomendacoes: "Recomendações Ergonômicas",
};

const SYSTEM_PROMPT = `Você é um(a) ergonomista / técnico(a) de segurança do trabalho brasileiro(a), especialista em Análise Ergonômica Preliminar (AEP), NR-01 GRO/PGR e NR-17.

Sua tarefa: redigir texto técnico para o laudo AEP de um setor específico, com base no checklist ergonômico fornecido.

Responda APENAS com JSON válido (sem markdown, sem cercas, sem texto fora do JSON):
{ "texto": "Texto em português brasileiro, tom técnico, 3ª pessoa, sem bullets — apenas parágrafos corridos." }

Comprimento esperado:
- parecer_tecnico: 2 a 3 parágrafos (120–220 palavras). Descreva os fatores de risco identificados (itens Sim), categorias ergonômicas afetadas, nível de urgência e condições observadas. Se houver ≥ 3 alertas organizacionais, mencione a recomendação de questionário psicossocial (DRPS/Copsoq) conforme NR-01.
- recomendacoes: 1 a 2 parágrafos com ações práticas priorizadas (80–160 palavras). Classifique como imediatas (<30 dias), preventivas (30–90 dias) ou estruturais (>90 dias) quando pertinente.

Diretrizes:
- Citar setor, cargos e jornada quando relevante
- Basear-se apenas nos itens marcados como Sim e nas observações fornecidas — não inventar dados
- Referenciar NR-17, NR-01 e normas pertinentes
- Sem bullets, apenas parágrafos corridos`;

function buildPrompt(ctx: ContextoAepIA): string {
  const l: string[] = [];
  if (ctx.empresa_nome) l.push(`Empresa: ${ctx.empresa_nome}`);
  l.push(`Setor: ${ctx.setor_nome}`);
  if (ctx.cargos?.length) {
    const lista = ctx.cargos.map((c) => c.descricao ? `${c.cargo} (${c.descricao})` : c.cargo).filter(Boolean);
    if (lista.length) l.push(`Cargos: ${lista.join("; ")}`);
  }
  if (ctx.jornada) l.push(`Jornada: ${ctx.jornada}`);
  if (ctx.qtd_expostos) l.push(`Trabalhadores expostos: ${ctx.qtd_expostos}`);

  const addChecklist = (nome: string, cl?: Record<string, string>) => {
    if (!cl) return;
    const sims = Object.entries(cl)
      .filter(([, v]) => v === "sim")
      .map(([k]) => k.replace(/_/g, " "));
    if (sims.length) l.push(`${nome} — alertas: ${sims.join(", ")}`);
  };
  addChecklist("Ergonomia Física", ctx.checklist_fisica);
  addChecklist("Ergonomia Cognitiva", ctx.checklist_cognitiva);
  addChecklist("Ergonomia Organizacional", ctx.checklist_organizacional);

  if (ctx.observacoes) {
    const obs = Object.entries(ctx.observacoes)
      .filter(([, v]) => v?.trim())
      .map(([k, v]) => `${k.replace(/_/g, " ")}: ${v}`);
    if (obs.length) l.push(`Observações de campo:\n${obs.map((o) => `  - ${o}`).join("\n")}`);
  }

  l.push(`\nCampo a redigir: ${TITULO[ctx.campo]}`);
  if (ctx.textoAtual?.trim()) l.push(`\nTexto já redigido (refine se necessário):\n${ctx.textoAtual}`);
  l.push("\nGere o texto em JSON conforme o formato definido.");
  return l.join("\n");
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) return NextResponse.json({ error: "GROQ_API_KEY não configurada." }, { status: 500 });

  let body: ContextoAepIA;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  if (!body?.setor_nome || !body?.campo) {
    return NextResponse.json({ error: "setor_nome e campo são obrigatórios" }, { status: 400 });
  }

  try {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildPrompt(body) },
        ],
        response_format: { type: "json_object" },
        temperature: 0.55,
        max_tokens: 700,
      }),
    });
    if (!res.ok) return NextResponse.json({ error: `Groq ${res.status}` }, { status: 502 });

    const groqData = await res.json();
    const content: string | undefined = groqData?.choices?.[0]?.message?.content;
    if (!content) return NextResponse.json({ error: "Resposta vazia" }, { status: 502 });

    let parsed: { texto?: unknown };
    try { parsed = JSON.parse(content); } catch {
      return NextResponse.json({ error: "JSON inválido do modelo" }, { status: 502 });
    }
    const texto = typeof parsed?.texto === "string" ? parsed.texto.trim() : "";
    if (!texto) return NextResponse.json({ error: "Campo texto ausente" }, { status: 502 });

    return NextResponse.json({ data: { texto } });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Erro" }, { status: 500 });
  }
}
