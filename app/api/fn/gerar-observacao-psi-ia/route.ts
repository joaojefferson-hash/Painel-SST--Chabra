import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Porte fiel da Edge Function `gerar-observacao-psi-ia` (Supabase/Deno → Next.js).
// Gera a Observação/Análise do fator psicossocial AET (13 Fatores) via Groq
// (Llama 3.1 8B Instant). Mesma lógica de negócio.

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.1-8b-instant";

interface ContextoIA {
  empresa?: { nome?: string | null } | null;
  setor: { nome: string };
  fator: { codigo: string; nome: string; descricao?: string | null };
  media: number | null;
  zona: string | null;
  nivel_pgr: string | null;
  pergunta_critica?: string | null;
  textoAtual?: string | null;
}

const SYSTEM_PROMPT = `Você é um(a) engenheiro(a)/técnico(a) de segurança do trabalho brasileiro(a), especialista em Análise Ergonômica do Trabalho (AET) e Fatores Psicossociais Ocupacionais, com domínio da NR-01 (GRO/PGR) e do instrumento QPS (Questionário de Fatores Psicossociais do Trabalho).

Sua tarefa: redigir a OBSERVAÇÃO/ANÁLISE técnica de um fator psicossocial específico para um setor avaliado via AET.

Responda APENAS com JSON válido (sem markdown, sem cercas, sem texto fora do JSON):
{ "observacao": "Texto corrido em português brasileiro, 2 a 3 parágrafos, tom técnico, 3ª pessoa, entre 80 e 200 palavras." }

Diretrizes:
- Mencionar explicitamente o nome do setor e do fator
- Comentar o score (média) e a zona de risco obtida
- Se houver pergunta crítica, citá-la brevemente como achado mais relevante
- Propor 1 ou 2 encaminhamentos genéricos alinhados à zona (sem inventar ações detalhadas)
- NÃO usar listas com bullets — apenas parágrafos corridos
- Não inventar dados ausentes do contexto`;

function buildUserPrompt(ctx: ContextoIA): string {
  const l: string[] = [];
  l.push(`Empresa: ${ctx.empresa?.nome ?? "não informada"}`);
  l.push(`Setor avaliado: ${ctx.setor.nome}`);
  l.push(`Fator psicossocial: ${ctx.fator.codigo} — ${ctx.fator.nome}`);
  if (ctx.fator.descricao) l.push(`Descrição do fator: ${ctx.fator.descricao}`);
  l.push(`Média calculada: ${ctx.media != null ? ctx.media.toFixed(2) : "—"}`);
  l.push(`Zona de risco: ${ctx.zona ?? "—"}`);
  l.push(`Nível PGR: ${ctx.nivel_pgr ?? "—"}`);
  if (ctx.pergunta_critica)
    l.push(`Pergunta crítica (pior score): "${ctx.pergunta_critica}"`);
  if (ctx.textoAtual?.trim()) {
    l.push("");
    l.push(`Texto já redigido (refine, não contradiga):\n${ctx.textoAtual}`);
  }
  l.push("");
  l.push("Gere a observação técnica em JSON conforme o formato definido.");
  return l.join("\n");
}

export async function POST(req: NextRequest) {
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) {
    return NextResponse.json(
      { error: "GROQ_API_KEY não configurada." },
      { status: 500 }
    );
  }

  try {
    const body = (await req.json()) as ContextoIA;
    if (!body?.setor?.nome || !body?.fator?.nome) {
      return NextResponse.json(
        { error: "Payload inválido: setor.nome e fator.nome são obrigatórios" },
        { status: 400 }
      );
    }

    const groqRes = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserPrompt(body) },
        ],
        response_format: { type: "json_object" },
        temperature: 0.55,
        max_tokens: 600,
      }),
    });

    if (!groqRes.ok) {
      const txt = await groqRes.text();
      return NextResponse.json(
        { error: `Groq ${groqRes.status}: ${txt}` },
        { status: 502 }
      );
    }

    const groqData = await groqRes.json();
    const content: string | undefined = groqData?.choices?.[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: "Resposta vazia do modelo" },
        { status: 502 }
      );
    }

    let parsed: { observacao?: unknown };
    try {
      parsed = JSON.parse(content);
    } catch {
      return NextResponse.json(
        { error: "JSON inválido do modelo", raw: content.slice(0, 400) },
        { status: 502 }
      );
    }

    const observacao =
      typeof parsed?.observacao === "string" ? parsed.observacao.trim() : "";
    if (!observacao) {
      return NextResponse.json(
        { error: "Campo 'observacao' ausente", raw: content.slice(0, 400) },
        { status: 502 }
      );
    }

    return NextResponse.json({ data: { observacao } }, { status: 200 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erro desconhecido" },
      { status: 500 }
    );
  }
}
