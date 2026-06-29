// Rota Next.js (App Router) — port da Supabase Edge Function `extrair-campos-fispq`.
//
// Fallback de extração de campos de FISPQ via Groq. Quando o parser regex local
// (lib/fispq/parser.ts) NÃO conseguiu extrair um ou mais campos-chave
// (nome_produto, fabricante, forma_fisica) e a base Chabra também não tem o CAS
// pra inferir, o front chama essa rota passando só a Seção 1 (e/ou snippet
// relevante) + a lista dos campos faltantes. A IA devolve um JSON minimal só
// com esses campos.
//
// MODELO: llama-3.1-8b-instant (mesmo da análise principal). JSON mode.
//
// Lógica replicada fielmente da Edge Function original (sem CORS — same-origin;
// chave lida de process.env). O corpo de resposta é o objeto `parsed` direto,
// para casar com o shape esperado por supabase.functions.invoke.

import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.1-8b-instant";

type Campo = "nome_produto" | "fabricante" | "forma_fisica";

interface ComponenteExtraido {
  cas: string;
  nome?: string | null;
  concentracao?: string | null;
}

interface ExtrairCamposBody {
  /** Trecho relevante da FISPQ — tipicamente seção 1 + 3 + 9 do parser, max ~4kb. */
  snippet: string;
  /** Campos top-level que faltam (pelo menos um deve estar preenchido). */
  campos_faltantes?: Campo[];
  /** CAS de componentes da Seção 3 que ficaram sem nome ou sem concentração;
   *  a IA tenta encontrar nome + concentração na tabela de composição. */
  componentes_pendentes?: string[];
}

interface ExtrairCamposResponse {
  nome_produto?: string | null;
  fabricante?: string | null;
  forma_fisica?: string | null;
  componentes?: ComponenteExtraido[];
}

const SNIPPET_MAX = 4500;

const SYSTEM_PROMPT = `Você extrai dados estruturados de FISPQs (Fichas de Informações de Segurança de Produto Químico, formato ABNT NBR 14725).

Regras:
- Responda APENAS com JSON. Sem prosa, sem markdown, sem explicação.
- Use exatamente as chaves solicitadas. Se não conseguir extrair um campo com certeza, devolva null pra aquele campo.
- NUNCA invente. Se não está claramente no texto, devolva null.
- "nome_produto": o nome comercial/identificador do produto (Seção 1.1). Tipicamente uma string curta como "Solvente XYZ", "Tinta Acrílica Branca", "MC-2BK106". Não é uma descrição de uso — frases como "Principais usos recomendados para a..." NÃO são nome de produto.
- "fabricante": razão social da empresa fabricante/fornecedora (Seção 1.3). Não inclua endereço, telefone, CNPJ — só o nome da empresa.
- "forma_fisica": uma das opções: "Líquido", "Sólido", "Gás", "Vapor", "Aerossol", "Pó", "Pasta", "Granulado", "Cristalino". Vem da Seção 9 (Propriedades físico-químicas, campo Estado físico/Forma física/Aspecto). Normalize pra essas opções.
- "componentes": pra cada CAS solicitado, encontre o nome do componente e a faixa de concentração na Seção 3 (Composição/Informações dos Ingredientes). Devolva array no formato: [{"cas": "64-17-5", "nome": "Álcool etílico", "concentracao": "21,750-36,250%"}]. Concentração: inclua o % no final mesmo se a tabela do PDF não tiver (o cabeçalho da coluna costuma indicar "(%)"). Se não achar o componente, devolva null nos campos nome/concentracao mas mantenha o cas.`;

function buildUserPrompt(body: ExtrairCamposBody): string {
  const partes: string[] = [];
  const campos = body.campos_faltantes ?? [];
  const componentes = body.componentes_pendentes ?? [];

  if (campos.length > 0) {
    partes.push(`Extraia os seguintes campos top-level da FISPQ:`);
    for (const c of campos) partes.push(`- "${c}"`);
    partes.push("");
  }

  if (componentes.length > 0) {
    partes.push(
      `Pra cada um dos seguintes CAS (Seção 3 da FISPQ), encontre o NOME do componente e a CONCENTRAÇÃO (faixa em %, formato "X,XX-Y,YY%"):`
    );
    for (const cas of componentes) partes.push(`- ${cas}`);
    partes.push(
      `Devolva no array "componentes" com o formato: [{"cas": "...", "nome": "...", "concentracao": "..."}]`
    );
    partes.push("");
  }

  partes.push(
    `Devolva JSON com as chaves solicitadas (null nos campos que não conseguir extrair).`
  );
  partes.push("");
  partes.push(`=== TRECHO DA FISPQ ===`);
  partes.push(body.snippet.slice(0, SNIPPET_MAX));
  partes.push(`=== FIM ===`);

  return partes.join("\n");
}

function parsearResposta(content: string): ExtrairCamposResponse {
  // Tenta parsear JSON direto; se falhar, procura bloco ```json ... ```
  let raw = content.trim();
  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) raw = fence[1].trim();
  let obj: Record<string, unknown> = {};
  try {
    obj = JSON.parse(raw);
  } catch {
    return {};
  }
  const limpar = (v: unknown): string | null | undefined => {
    if (v === null) return null;
    if (typeof v !== "string") return undefined;
    const s = v.trim();
    if (!s || s.toLowerCase() === "null" || s.toLowerCase() === "none")
      return null;
    return s;
  };
  const componentes: ComponenteExtraido[] = [];
  if (Array.isArray(obj.componentes)) {
    for (const item of obj.componentes) {
      if (!item || typeof item !== "object") continue;
      const rec = item as Record<string, unknown>;
      const cas = typeof rec.cas === "string" ? rec.cas.trim() : "";
      if (!cas) continue;
      componentes.push({
        cas,
        nome: limpar(rec.nome),
        concentracao: limpar(rec.concentracao),
      });
    }
  }
  return {
    nome_produto: limpar(obj.nome_produto),
    fabricante: limpar(obj.fabricante),
    forma_fisica: limpar(obj.forma_fisica),
    componentes: componentes.length > 0 ? componentes : undefined,
  };
}

export async function POST(req: NextRequest) {
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) {
    return NextResponse.json(
      { error: "GROQ_API_KEY não configurada no ambiente." },
      { status: 500 }
    );
  }

  try {
    const body = (await req.json()) as ExtrairCamposBody;

    if (!body?.snippet || typeof body.snippet !== "string") {
      return NextResponse.json(
        { error: "Payload inválido: 'snippet' obrigatório." },
        { status: 400 }
      );
    }
    const temCampos =
      Array.isArray(body.campos_faltantes) &&
      body.campos_faltantes.length > 0;
    const temComponentes =
      Array.isArray(body.componentes_pendentes) &&
      body.componentes_pendentes.length > 0;
    if (!temCampos && !temComponentes) {
      return NextResponse.json(
        {
          error:
            "Payload inválido: 'campos_faltantes' ou 'componentes_pendentes' obrigatório.",
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
        temperature: 0.1,
        max_tokens: 600,
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
    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: "Resposta vazia do modelo" },
        { status: 502 }
      );
    }

    const parsed = parsearResposta(content);

    return NextResponse.json(parsed, { status: 200 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
