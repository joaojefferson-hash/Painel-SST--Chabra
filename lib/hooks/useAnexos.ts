"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { classificarAnexo, type Anexo, type ModuloAnexo } from "@/lib/anexos/types";

const KEY = (m: ModuloAnexo, id: string) => ["anexos", m, id] as const;

/** Lista os anexos de um laudo (ordenados). */
export function useAnexos(modulo: ModuloAnexo, idReferencia: string | null) {
  return useQuery({
    queryKey: KEY(modulo, idReferencia ?? ""),
    enabled: !!idReferencia,
    staleTime: 30 * 1000,
    queryFn: async () => {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("anexos")
        .select("*")
        .eq("modulo", modulo)
        .eq("id_referencia", idReferencia!)
        .order("ordem", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as Anexo[];
    },
  });
}

export function useEnviarAnexo(modulo: ModuloAnexo, idReferencia: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { file: File; descricao?: string; ordem: number }) => {
      const supabase = createSupabaseBrowserClient();
      const { file } = args;
      const ext = file.name.split(".").pop() ?? "bin";
      const path = `${modulo}/${idReferencia}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("anexos")
        .upload(path, file, {
          cacheControl: "31536000",
          upsert: false,
          contentType: file.type || undefined,
        });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("anexos").getPublicUrl(path);
      if (!pub?.publicUrl) throw new Error("URL pública não retornada");

      const { data: { user } } = await supabase.auth.getUser();
      const { error: insErr } = await supabase.from("anexos").insert({
        modulo,
        id_referencia: idReferencia,
        nome: file.name,
        descricao: args.descricao ?? null,
        storage_path: path,
        url: pub.publicUrl,
        mime: file.type || null,
        tamanho_bytes: file.size,
        tipo: classificarAnexo(file.type),
        ordem: args.ordem,
        incluir_no_pdf: true,
        criado_por: user?.email ?? null,
      } as never);
      if (insErr) throw insErr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY(modulo, idReferencia) });
      toast.success("Anexo enviado");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useAtualizarAnexo(modulo: ModuloAnexo, idReferencia: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      id_anexo: string;
      descricao?: string | null;
      incluir_no_pdf?: boolean;
      ordem?: number;
    }) => {
      const supabase = createSupabaseBrowserClient();
      const { id_anexo, ...rest } = args;
      const { error } = await supabase
        .from("anexos")
        .update(rest as never)
        .eq("id_anexo", id_anexo);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY(modulo, idReferencia) }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useExcluirAnexo(modulo: ModuloAnexo, idReferencia: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (anexo: Anexo) => {
      const supabase = createSupabaseBrowserClient();
      // Remove o arquivo do storage (best-effort) e depois a linha.
      await supabase.storage.from("anexos").remove([anexo.storage_path]);
      const { error } = await supabase.from("anexos").delete().eq("id_anexo", anexo.id_anexo);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY(modulo, idReferencia) });
      toast.success("Anexo removido");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
