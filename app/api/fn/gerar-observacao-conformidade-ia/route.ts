import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Porte fiel da Edge Function `gerar-observacao-conformidade-ia` (Groq / Llama 3.1 8B Instant).
// Gera a Observação técnica de um item do checklist de conformidade NR.
// Mesma chamada, mesmo modelo, mesmo prompt, mesmo JSON mode, mesma camada
// determinística de parsing e mesmos shapes/status de resposta.

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.1-8b-instant";

interface Payload {
  empresa_nome?: string | null;
  setor?: string | null;
  nr_codigo: string;
  nr_titulo: string;
  item_codigo: string;
  item_titulo: string;
  item_descricao?: string | null;
  situacao: "CONFORME" | "NAO_APLICAVEL" | "PENDENTE";
  obs_atual?: string | null;
}

const SYSTEM_PROMPT = `Você é um(a) técnico(a)/engenheiro(a) de segurança do trabalho brasileiro(a), especialista em auditorias de conformidade com Normas Regulamentadoras (NRs) do MTE.

Sua tarefa: redigir a OBSERVAÇÃO TÉCNICA de um item específico do checklist de uma NR, com base na situação auditada.

Responda APENAS com JSON válido (sem markdown, sem cercas, sem texto fora do JSON):
{ "observacao": "Texto corrido em português brasileiro, 1 a 2 parágrafos, tom técnico, 3ª pessoa, entre 40 e 120 palavras." }

Diretrizes:
- Mencionar o item auditado e a situação constatada (conforme, pendente ou não aplicável)
- Se CONFORME: descrever brevemente o que foi verificado positivamente
- Se PENDENTE: indicar a irregularidade encontrada e sugerir medida corretiva objetiva
- Se NÃO APLICÁVEL: justificar brevemente por que o item não se aplica ao contexto
- Ser objetivo e técnico, sem repetir o título do item na íntegra
- NÃO usar listas com bullets — apenas parágrafos corridos
- Não inventar dados que não estejam no contexto fornecido`;

function buildUserPrompt(p: Payload): string {
  const l: string[] = [];
  l.push(`Empresa: ${p.empresa_nome ?? "não informada"}`);
  if (p.setor) l.push(`Setor/Local: ${p.setor}`);
  l.push(`Norma: ${p.nr_codigo} — ${p.nr_titulo}`);
  l.push(`Item do checklist: ${p.item_codigo} — ${p.item_titulo}`);
  if (p.item_descricao) l.push(`Detalhamento: ${p.item_descricao}`);
  const situacaoLabel =
    p.situacao === "CONFORME"
      ? "CONFORME"
      : p.situacao === "NAO_APLICAVEL"
      ? "NÃO APLICÁVEL"
      : "PENDENTE";
  l.push(`Situação auditada: ${situacaoLabel}`);
  if (p.obs_atual?.trim()) {
    l.push("");
    l.push(`Texto já redigido (refine, não contradiga):\n${p.obs_atual}`);
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
    const body = (await req.json()) as Payload;
    if (!body?.item_codigo || !body?.item_titulo || !body?.situacao) {
      return NextResponse.json(
        {
          error:
            "Payload inválido: item_codigo, item_titulo e situacao são obrigatórios",
        },
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
        temperature: 0.5,
        max_tokens: 400,
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
    const content: string | undefined =
      groqData?.choices?.[0]?.message?.content;
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
        {
          error: "JSON inválido do modelo",
          raw: content.slice(0, 400),
        },
        { status: 502 }
      );
    }

    const observacao =
      typeof parsed?.observacao === "string" ? parsed.observacao.trim() : "";
    if (!observacao) {
      return NextResponse.json(
        {
          error: "Campo 'observacao' ausente",
          raw: content.slice(0, 400),
        },
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
