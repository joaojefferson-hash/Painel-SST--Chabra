import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Porte fiel da Edge Function `gerar-acao-ia` (Groq / Llama).
// Gera Plano de Ação 5W2H. Mesma chamada, mesmo modelo, mesmo prompt,
// mesmo JSON mode, mesma camada de parsing e mesmos shapes/status de resposta.

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.1-8b-instant";

interface ContextoIA {
  empresa?: { nome?: string | null; cnpj?: string | null };
  setor?: { nome?: string | null; descricao?: string | null } | null;
  risco?: {
    tipo?: string | null;
    agente?: string | null;
    fonte?: string | null;
    severidade?: string | null;
    probabilidade?: string | null;
    nivel?: string | null;
    medidasRecomendadas?: string | null;
  } | null;
  /** Campos já preenchidos pelo usuário — IA refina sem contradizer */
  parcial?: Record<string, string | null>;
}

const SYSTEM_PROMPT = `Você é um especialista em SST (Segurança e Saúde do Trabalho) brasileiro, com conhecimento profundo das Normas Regulamentadoras (NR-01, NR-06, NR-07, NR-09, NR-15, NR-17, NR-35) e da metodologia 5W2H aplicada a Programas de Gerenciamento de Riscos (PGR).

Sua tarefa: gerar uma proposta de Plano de Ação 5W2H baseada no contexto fornecido (empresa, setor, risco identificado).

Responda APENAS com um JSON válido (sem markdown, sem explicações fora do JSON) no formato:

{
  "what_acao": "Descrição clara e imperativa da ação a ser executada (1-2 frases)",
  "why_justificativa": "Justificativa técnica citando a NR aplicável quando relevante",
  "where_local": "Local específico onde a ação deve ser implementada",
  "when_prazo_dias": 30,
  "who_responsavel": "Cargo/função do responsável típico para essa ação (ex: 'Gerente de Manutenção', 'Técnico de Segurança')",
  "how_metodo": "Método/procedimento detalhado em 1-2 frases técnicas",
  "how_much_custo": "Faixa estimada de custo em R$ (ex: 'R$ 5.000 a R$ 15.000') ou 'Sem custo direto'",
  "prioridade": "Media"
}

Diretrizes:
- Sempre em português brasileiro
- Tom profissional, técnico, aderente às NRs
- Prazo em dias inteiros entre 7 e 180, proporcional à severidade
- Prioridade: "Baixa" (Trivial/Baixo), "Media" (Moderado), "Alta" (Alto) ou "Critica" (Muito Alto / risco fatal)
- Não invente dados específicos não fornecidos (não invente nome de pessoa, telefones, endereços)
- Se o usuário já preencheu campos em "parcial", REFINE sem contradizer — só preencha o que estiver vazio`;

function buildUserPrompt(ctx: ContextoIA): string {
  const linhas: string[] = ["Contexto da ação a ser planejada:", ""];
  linhas.push(`Empresa: ${ctx.empresa?.nome ?? "—"}`);
  if (ctx.setor) {
    linhas.push(`Setor: ${ctx.setor.nome ?? "—"}`);
    if (ctx.setor.descricao) linhas.push(`  Descrição: ${ctx.setor.descricao}`);
  }
  if (ctx.risco) {
    linhas.push("");
    linhas.push("Risco identificado:");
    linhas.push(`  Tipo: ${ctx.risco.tipo ?? "—"}`);
    linhas.push(`  Agente: ${ctx.risco.agente ?? "—"}`);
    if (ctx.risco.fonte) linhas.push(`  Fonte geradora: ${ctx.risco.fonte}`);
    if (ctx.risco.severidade)
      linhas.push(`  Severidade: ${ctx.risco.severidade}`);
    if (ctx.risco.probabilidade)
      linhas.push(`  Probabilidade: ${ctx.risco.probabilidade}`);
    if (ctx.risco.nivel) linhas.push(`  Nível de risco: ${ctx.risco.nivel}`);
    if (ctx.risco.medidasRecomendadas)
      linhas.push(`  Medidas já recomendadas: ${ctx.risco.medidasRecomendadas}`);
  }
  // Campos parciais (pra IA não sobrescrever o que já foi digitado)
  if (ctx.parcial) {
    const preenchidos = Object.entries(ctx.parcial).filter(
      ([, v]) => v && String(v).trim().length > 0
    );
    if (preenchidos.length > 0) {
      linhas.push("");
      linhas.push("Campos já preenchidos pelo usuário (NÃO contradiga):");
      for (const [k, v] of preenchidos) linhas.push(`  ${k}: ${v}`);
    }
  }
  linhas.push("");
  linhas.push("Gere o plano de ação 5W2H apropriado em JSON.");
  return linhas.join("\n");
}

export async function POST(req: NextRequest) {
  const GROQ_API_KEY = process.env.GROQ_API_KEY;

  if (!GROQ_API_KEY) {
    return NextResponse.json(
      {
        error:
          "GROQ_API_KEY não configurada. Defina via `supabase secrets set GROQ_API_KEY=...`",
      },
      { status: 500 }
    );
  }

  try {
    const body = (await req.json()) as ContextoIA;

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
        temperature: 0.6,
        max_tokens: 1024,
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      return NextResponse.json(
        { error: `Groq retornou ${groqRes.status}: ${errText}` },
        { status: 502 }
      );
    }

    const groqData = await groqRes.json();
    const content: string | undefined =
      groqData?.choices?.[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: "Resposta vazia do modelo" },
        { status: 502 }
      );
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(content);
    } catch {
      return NextResponse.json(
        {
          error: "Modelo retornou JSON inválido",
          raw: content.slice(0, 500),
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ data: parsed }, { status: 200 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erro desconhecido" },
      { status: 500 }
    );
  }
}
