"use client";

import { useSignedUrl } from "@/lib/hooks/useSignedUrl";

/**
 * <img> que resolve mídia do Storage por path/URL legada → URL assinada.
 * Use em telas AUTENTICADAS (não em templates de PDF — o Puppeteer não autentica;
 * o PDF recebe URL assinada do servidor). Enquanto o bucket é público funciona
 * igual; quando privatizar, continua exibindo para o usuário logado.
 */
export default function StorageImg({
  stored,
  bucket = "fotos",
  alt = "",
  className,
  fallback,
}: {
  stored: string | null | undefined;
  bucket?: string;
  alt?: string;
  className?: string;
  fallback?: React.ReactNode;
}) {
  const { data: url, isLoading, isError } = useSignedUrl(stored, bucket);

  if (!stored || isError) return <>{fallback ?? null}</>;
  if (isLoading || !url) {
    return <div className={`animate-pulse rounded bg-gray-100 ${className ?? ""}`} aria-hidden />;
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={alt} className={className} referrerPolicy="no-referrer" />;
}
