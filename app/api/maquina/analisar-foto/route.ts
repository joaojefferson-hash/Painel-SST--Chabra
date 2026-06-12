import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/client";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

const SYSTEM_PROMPT = `Você é um especialista em máquinas e equipamentos industriais brasileiros.
Sua tarefa: analisar a foto de uma máquina ou de sua plaqueta de identificação (nameplate) e extrair os dados técnicos.

Responda APENAS com JSON válido (sem markdown, sem cercas, sem texto fora do JSON):
{
  "nome": "nome da máquina (ex: Amassadeira, Torno CNC, Prensa Hidráulica) — string ou null",
  "tipo": "tipo genérico (ex: Amassadeira, Torno, Prensa) — string ou null",
  "categoria": "categoria do equipamento (ex: Máquina de Panificação, Máquina-Ferramenta) — string ou null",
  "marca": "fabricante ou marca visível (ex: Prática Technipan, ROMI, WEG) — string ou null",
  "modelo": "modelo específico se visível (ex: AETP80, PH-200T) — string ou null",
  "numero_serie": "número de série se visível na plaqueta — string ou null",
  "ano_fabricacao": "ano de fabricação como número inteiro se visível — number ou null",
  "capacidade_operacional": "capacidade ou produtividade se visível (ex: 80 kg/h, 5 KG/MIN) — string ou null",
  "tensao": "tensão elétrica se visível (ex: 220V, 380V, 220/380V) — string ou null",
  "potencia": "potência se visível (ex: 5 CV, 3.7 kW, 1.5 HP) — string ou null",
  "tag": "TAG ou número de patrimônio se visível em etiqueta/plaqueta — string ou null",
  "descricao_tecnica": "breve descrição técnica da máquina com base no que é visível (1-2 frases) — string ou null",
  "protecao_fixa": "true se proteções fixas (grades, carenagens parafusadas) são claramente visíveis, false se claramente ausentes em zona de risco exposta, null se não dá pra avaliar — boolean ou null",
  "protecao_movel": "true se proteções móveis (portas, tampas articuladas) são claramente visíveis — boolean ou null",
  "intertravamento": "true se dispositivos de intertravamento (chaves de segurança em portas/proteções) são claramente visíveis — boolean ou null",
  "botao_emergencia": "true se botão de emergência (cogumelo vermelho) é claramente visível — boolean ou null",
  "sistema_bloqueio": "true se sistema de bloqueio/LOTO (cadeado, seccionadora bloqueável) é claramente visível — boolean ou null",
  "aterramento": "true se aterramento elétrico (cabo terra, ponto de aterramento) é claramente visível — boolean ou null",
  "sinalizacao": "true se sinalização de segurança (placas, pictogramas, faixas) é claramente visível na máquina ou em volta — boolean ou null"
}

Se não conseguir identificar um campo, use null. Não invente dados que não aparecem na imagem.
Para os campos booleanos de segurança NR-12, seja conservador: só responda true/false com evidência visual clara; na dúvida, null.`;

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) return NextResponse.json({ error: "GROQ_API_KEY não configurada." }, { status: 500 });

  // Aceita 1 imagem (legado: imageBase64/mimeType) ou várias (images[])
  let dataUrls: string[];
  try {
    const body = await req.json();
    const images: { b64: string; mime?: string }[] = Array.isArray(body.images)
      ? body.images
      : body.imageBase64
        ? [{ b64: body.imageBase64, mime: body.mimeType }]
        : [];
    if (images.length === 0) throw new Error("Nenhuma imagem enviada");
    dataUrls = images
      .slice(0, 4)
      .map((i) => `data:${i.mime ?? "image/jpeg"};base64,${i.b64}`);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Payload inválido" }, { status: 400 });
  }

  try {
    const groqRes = await fetch(GROQ_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: VISION_MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              ...dataUrls.map((url) => ({ type: "image_url", image_url: { url } })),
              { type: "text", text: `Analise ${dataUrls.length > 1 ? "estas imagens (mesma máquina, ângulos diferentes)" : "esta imagem"} e retorne os dados técnicos da máquina no formato JSON definido.` },
            ],
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
        max_tokens: 900,
      }),
    });

    if (!groqRes.ok) {
      const txt = await groqRes.text();
      return NextResponse.json({ error: `Groq ${groqRes.status}: ${txt.slice(0, 300)}` }, { status: 502 });
    }

    const groqData = await groqRes.json();
    const content: string | undefined = groqData?.choices?.[0]?.message?.content;
    if (!content) return NextResponse.json({ error: "Resposta vazia do modelo" }, { status: 502 });

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(content);
    } catch {
      return NextResponse.json({ error: "JSON inválido do modelo", raw: content.slice(0, 400) }, { status: 502 });
    }

    return NextResponse.json({ data: parsed });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Erro desconhecido" }, { status: 500 });
  }
}
