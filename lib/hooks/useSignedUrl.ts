"use client";

import { useQuery, useQueries } from "@tanstack/react-query";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { extrairPathStorage } from "@/lib/storage/signed-url";

const TTL = 3600; // 1h

async function assinar(bucket: string, path: string): Promise<string> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, TTL);
  if (error || !data?.signedUrl) throw error ?? new Error("Falha ao assinar URL");
  return data.signedUrl;
}

/**
 * Resolve um valor armazenado (path ou URL legada) numa URL assinada de curta
 * duração. Cacheado por (bucket, path). Mantém-se válido enquanto o bucket é
 * público e continua funcionando quando privatizar.
 */
export function useSignedUrl(stored: string | null | undefined, bucket = "fotos") {
  const path = extrairPathStorage(stored, bucket);
  return useQuery({
    queryKey: ["signed-url", bucket, path],
    enabled: !!path,
    staleTime: (TTL - 300) * 1000,
    gcTime: TTL * 1000,
    retry: 1,
    queryFn: () => assinar(bucket, path!),
  });
}

/** Versão em lote (galerias: arrays de fotos). Mantém a ordem dos itens. */
export function useSignedUrls(stored: (string | null | undefined)[], bucket = "fotos") {
  const paths = stored.map((s) => extrairPathStorage(s, bucket));
  return useQueries({
    queries: paths.map((path) => ({
      queryKey: ["signed-url", bucket, path],
      enabled: !!path,
      staleTime: (TTL - 300) * 1000,
      gcTime: TTL * 1000,
      retry: 1,
      queryFn: () => assinar(bucket, path!),
    })),
  });
}
