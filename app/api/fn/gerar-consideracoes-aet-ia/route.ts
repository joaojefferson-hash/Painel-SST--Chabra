import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Porte fiel da Supabase Edge Function `gerar-consideracoes-aet-ia`.
// Gera as Considerações Finais do Laudo AET consolidando todos os setores
// avaliados, via Groq (Llama 3.1 8B Instant). Mesma lógica/prompt/shape da
// function original.

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.1-8b-instant";

interface RiscoCtx {
  tipo: string;
  risco: string;
  classificacao: string;
}

interface SetorCtx {
  nome: string;
  cargos?: string[];
  riscos?: RiscoCtx[];
  classificacao_max?: string | null;
}

interface FatorPsiCtx {
  codigo: string;
  nome: string;
  zona: string;
}

interface ContextoIA {
  empresa_nome?: string | null;
  setores: SetorCtx[];
  fatores_psi?: FatorPsiCtx[];
  textoAtual?: string | null;
}

const SYSTEM_PROMPT = `Você é um(a) ergonomista / técnico(a) de segurança do trabalho brasileiro(a), especialista em Análise Ergonômica do Trabalho (AET) e NR-17.

Sua tarefa: redigir as Considerações Finais do Laudo AET consolidando todos os setores avaliados.

As considerações devem:
- Apresentar visão geral do escopo da avaliação (empresa, setores, cargos envolvidos)
- Destacar os principais riscos ergonômicos e as classificações mais críticas identificadas
- Mencionar fatores psicossociais em zonas elevadas ou críticas (se fornecidos)
- Propor diretrizes gerais de melhoria e acompanhamento
- Concluir com referência à conformidade com NR-17 e necessidade de reavaliação periódica

Comprimento: 4 a 6 parágrafos (220–380 palavras).
Tom: técnico, formal, 3ª pessoa, sem bullets — apenas parágrafos corridos separados por dois newlines (\\n\\n).

Responda APENAS com JSON válido (sem markdown, sem cercas de código):
{ "texto": "Parágrafo 1.\\n\\nParágrafo 2.\\n\\nParágrafo 3." }`;

function buildUserPrompt(ctx: ContextoIA): string {
  const l: string[] = [];
  if (ctx.empresa_nome) l.push(`Empresa: ${ctx.empresa_nome}`);
  l.push(`Total de setores avaliados: ${ctx.setores.length}`);

  for (const s of ctx.setores) {
    const linha: string[] = [`Setor: ${s.nome}`];
    if (s.cargos?.length) linha.push(`Cargos: ${s.cargos.join(", ")}`);
    if (s.classificacao_max) linha.push(`Classificação máxima: ${s.classificacao_max}`);
    l.push(linha.join(" | "));
    if (s.riscos?.length) {
      const relevantes = s.riscos
        .filter((r) => r.classificacao && r.classificacao !== "Trivial")
        .map((r) => `${r.tipo}: ${r.risco} (${r.classificacao})`)
        .join("; ");
      if (relevantes) l.push(`  Riscos relevantes: ${relevantes}`);
    }
  }

  if (ctx.fatores_psi?.length) {
    l.push("\nFatores psicossociais com atenção (zonas não-verdes):");
    for (const f of ctx.fatores_psi) {
      l.push(`  ${f.codigo} — ${f.nome}: zona ${f.zona}`);
    }
  }

  if (ctx.textoAtual?.trim()) {
    l.push(`\nTexto atual das considerações (refine se necessário, não contradiga):\n${ctx.textoAtual}`);
  }

  l.push("\nGere as Considerações Finais em JSON conforme o formato definido.");
  return l.join("\n");
}

export async function POST(req: NextRequest) {
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) {
    return NextResponse.json({ error: "GROQ_API_KEY não configurada." }, { status: 500 });
  }

  try {
    const body = (await req.json()) as ContextoIA;
    if (!body?.setores?.length) {
      return NextResponse.json(
        { error: "Payload inválido: setores é obrigatório e não pode ser vazio" },
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
        temperature: 0.6,
        max_tokens: 1000,
      }),
    });

    if (!groqRes.ok) {
      const txt = await groqRes.text();
      return NextResponse.json({ error: `Groq ${groqRes.status}: ${txt}` }, { status: 502 });
    }

    const groqData = await groqRes.json();
    const content: string | undefined = groqData?.choices?.[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: "Resposta vazia do modelo" }, { status: 502 });
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(content);
    } catch {
      return NextResponse.json(
        { error: "JSON inválido do modelo", raw: content.slice(0, 400) },
        { status: 502 }
      );
    }

    const texto = (
      typeof parsed?.texto === "string"
        ? parsed.texto
        : typeof parsed?.text === "string"
          ? parsed.text
          : (Object.values(parsed).find((v) => typeof v === "string") as string | undefined) ?? ""
    ).trim();

    if (!texto) {
      return NextResponse.json(
        { error: "Campo 'texto' ausente na resposta", raw: content.slice(0, 400) },
        { status: 502 }
      );
    }

    return NextResponse.json({ data: { texto } }, { status: 200 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erro desconhecido" },
      { status: 500 }
    );
  }
}
