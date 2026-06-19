import type { SupabaseClient } from "@supabase/supabase-js";
import { extrairPathStorage } from "@/lib/storage/signed-url";

/**
 * Resolve valores de mídia (URL pública/assinada legada OU path) em URLs ASSINADAS
 * para embutir no HTML do PDF (o Puppeteer baixa as imagens). Usa o client passado
 * (autenticado ou service role — ambos têm SELECT em fotos/anexos).
 *
 * SEGURO POR DESIGN: em qualquer falha (sem path, erro de assinatura), devolve o
 * valor ORIGINAL. Enquanto os buckets seguem públicos, isso degrada para o
 * comportamento atual — não quebra o PDF. Quando privatizar, as assinadas mandam.
 */
export async function assinarMidiaPdf(
  supabase: SupabaseClient,
  valores: (string | null | undefined)[],
  bucket = "fotos",
  expiresIn = 1800, // 30 min — cobre a renderização do PDF
): Promise<string[]> {
  return Promise.all(
    valores.map(async (v) => {
      if (!v) return "";
      const path = extrairPathStorage(v, bucket);
      if (!path) return v; // blob/data/origem externa → devolve como veio
      try {
        const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
        return !error && data?.signedUrl ? data.signedUrl : v;
      } catch {
        return v;
      }
    }),
  );
}

/**
 * Assina o `bg_imagem_url` (imagem de fundo da capa) de cada capítulo de texto
 * padrão. Devolve novo array; capítulos sem bg ficam intactos.
 */
export async function assinarCapitulosBg<T extends { bg_imagem_url?: string | null }>(
  supabase: SupabaseClient,
  capitulos: T[],
  bucket = "fotos",
): Promise<T[]> {
  return Promise.all(
    capitulos.map(async (c) =>
      c.bg_imagem_url
        ? { ...c, bg_imagem_url: await assinarUmaMidiaPdf(supabase, c.bg_imagem_url, bucket) }
        : c,
    ),
  );
}

/** Versão p/ um único valor (ex.: assinatura, bg de capítulo). */
export async function assinarUmaMidiaPdf(
  supabase: SupabaseClient,
  valor: string | null | undefined,
  bucket = "fotos",
  expiresIn = 1800,
): Promise<string> {
  const [out] = await assinarMidiaPdf(supabase, [valor], bucket, expiresIn);
  return out ?? "";
}
