"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

// ── Types ────────────────────────────────────────────────────────────────────

export type TipoColaborador = "padronizacao" | "documentos" | "tecnico_campo" | "gestao";

export const TIPO_COLABORADOR_LABEL: Record<TipoColaborador, string> = {
  padronizacao:  "Padronização do sistema",
  documentos:    "Geração de documentos SST",
  tecnico_campo: "Técnico de campo (visitas)",
  gestao:        "Gestão / Coordenação",
};

export const TIPOS_DOCUMENTO_SST = [
  "PGR",
  "PCMSO",
  "LTCAT",
  "Laudo de Insalubridade",
  "Laudo de Periculosidade",
  "AET",
  "AEP",
  "PAE",
  "Ordem de Serviço",
  "Treinamentos",
  "PPP",
  "CAT",
  "Outros",
] as const;

export type TipoDocumentoSST = (typeof TIPOS_DOCUMENTO_SST)[number];

export type StatusDocumentoSST =
  | "em_dia"
  | "a_vencer"
  | "vencido"
  | "pendente_visita"
  | "pendente_informacao"
  | "pendente_ssg"
  | "pendente_revisao"
  | "concluido"
  | "nao_iniciado";

export const STATUS_LABEL: Record<StatusDocumentoSST, string> = {
  em_dia:              "Em Dia",
  a_vencer:            "A Vencer",
  vencido:             "Vencido",
  pendente_visita:     "Pendente de Visita",
  pendente_informacao: "Pendente de Informação",
  pendente_ssg:        "Pendente SSG",
  pendente_revisao:    "Pendente Revisão",
  concluido:           "Concluído",
  nao_iniciado:        "Não Iniciado",
};

export const STATUS_COR: Record<StatusDocumentoSST, { bg: string; text: string }> = {
  em_dia:              { bg: "bg-green-100",   text: "text-green-800"   },
  a_vencer:            { bg: "bg-yellow-100",  text: "text-yellow-800"  },
  vencido:             { bg: "bg-red-100",     text: "text-red-800"     },
  pendente_visita:     { bg: "bg-orange-100",  text: "text-orange-800"  },
  pendente_informacao: { bg: "bg-blue-100",    text: "text-blue-800"    },
  pendente_ssg:        { bg: "bg-purple-100",  text: "text-purple-800"  },
  pendente_revisao:    { bg: "bg-indigo-100",  text: "text-indigo-800"  },
  concluido:           { bg: "bg-teal-100",    text: "text-teal-800"    },
  nao_iniciado:        { bg: "bg-gray-100",    text: "text-gray-700"    },
};

export const STATUS_PIE_COLOR: Record<StatusDocumentoSST, string> = {
  em_dia:              "#22c55e",
  a_vencer:            "#eab308",
  vencido:             "#ef4444",
  pendente_visita:     "#f97316",
  pendente_informacao: "#3b82f6",
  pendente_ssg:        "#a855f7",
  pendente_revisao:    "#6366f1",
  concluido:           "#14b8a6",
  nao_iniciado:        "#9ca3af",
};

export interface ProdUnidade {
  id: string;
  nome: string;
  cidade: string | null;
  responsavel: string | null;
  ativo: boolean;
  criado_em: string;
}

export interface ProdColaborador {
  id: string;
  id_unidade: string;
  nome: string;
  tipo: TipoColaborador;
  capacidade_docs_mes: number;
  capacidade_visitas_mes: number;
  ativo: boolean;
  criado_em: string;
}

export interface ProdDocumentoSST {
  id: string;
  id_empresa: string;
  nome_empresa: string | null;
  id_unidade: string;
  tipo_documento: string;
  status: StatusDocumentoSST;
  data_emissao: string | null;
  data_vencimento: string | null;
  responsavel_nome: string | null;
  observacoes: string | null;
  criado_em: string;
  atualizado_em: string;
}

export interface ProdRegistroMensal {
  id: string;
  id_unidade: string;
  id_colaborador: string;
  mes: number;
  ano: number;
  docs_gerados: number;
  visitas_realizadas: number;
  levantamentos_enviados: number;
  docs_ssg: number;
  criado_em: string;
}

// ── Queries ──────────────────────────────────────────────────────────────────

export function useProdUnidades() {
  return useQuery({
    queryKey: ["prod", "unidades"],
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<ProdUnidade[]> => {
      const sb = createSupabaseBrowserClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (sb as any)
        .from("prod_unidades")
        .select("*")
        .order("nome");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useProdColaboradores(idUnidade?: string) {
  return useQuery({
    queryKey: ["prod", "colaboradores", idUnidade ?? "all"],
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<ProdColaborador[]> => {
      const sb = createSupabaseBrowserClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let q = (sb as any)
        .from("prod_colaboradores")
        .select("*")
        .order("nome");
      if (idUnidade) q = q.eq("id_unidade", idUnidade);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export interface DocFilters {
  idUnidade?: string;
  status?: StatusDocumentoSST;
  tipoDocumento?: string;
  idEmpresa?: string;
  search?: string;
}

export function useProdDocumentos(filters?: DocFilters) {
  return useQuery({
    queryKey: ["prod", "documentos", filters],
    staleTime: 2 * 60_000,
    queryFn: async (): Promise<ProdDocumentoSST[]> => {
      const sb = createSupabaseBrowserClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let q = (sb as any)
        .from("prod_documentos_sst")
        .select("*")
        .order("data_vencimento", { ascending: true, nullsFirst: false });
      if (filters?.idUnidade)     q = q.eq("id_unidade", filters.idUnidade);
      if (filters?.status)        q = q.eq("status", filters.status);
      if (filters?.tipoDocumento) q = q.eq("tipo_documento", filters.tipoDocumento);
      if (filters?.idEmpresa)     q = q.eq("id_empresa", filters.idEmpresa);
      if (filters?.search)        q = q.ilike("nome_empresa", `%${filters.search}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useProdRegistros(idUnidade?: string) {
  return useQuery({
    queryKey: ["prod", "registros", idUnidade ?? "all"],
    staleTime: 2 * 60_000,
    queryFn: async (): Promise<ProdRegistroMensal[]> => {
      const sb = createSupabaseBrowserClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let q = (sb as any)
        .from("prod_registros_mensais")
        .select("*")
        .order("ano", { ascending: false })
        .order("mes", { ascending: false });
      if (idUnidade) q = q.eq("id_unidade", idUnidade);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

// ── Mutations ────────────────────────────────────────────────────────────────

export function useSaveUnidade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<ProdUnidade> & { nome: string }) => {
      const sb = createSupabaseBrowserClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const any = sb as any;
      if (payload.id) {
        const { error } = await any.from("prod_unidades").update(payload).eq("id", payload.id);
        if (error) throw error;
      } else {
        const { error } = await any.from("prod_unidades").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["prod", "unidades"] }),
  });
}

export function useDeleteUnidade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const sb = createSupabaseBrowserClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (sb as any).from("prod_unidades").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["prod", "unidades"] }),
  });
}

export function useSaveColaborador() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<ProdColaborador> & { nome: string; id_unidade: string }) => {
      const sb = createSupabaseBrowserClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const any = sb as any;
      if (payload.id) {
        const { error } = await any.from("prod_colaboradores").update(payload).eq("id", payload.id);
        if (error) throw error;
      } else {
        const { error } = await any.from("prod_colaboradores").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["prod", "colaboradores"] }),
  });
}

export function useDeleteColaborador() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const sb = createSupabaseBrowserClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (sb as any).from("prod_colaboradores").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["prod", "colaboradores"] }),
  });
}

export function useSaveDocumento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      payload: Partial<ProdDocumentoSST> & { id_empresa: string; id_unidade: string; tipo_documento: string }
    ) => {
      const sb = createSupabaseBrowserClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const any = sb as any;
      if (payload.id) {
        const { error } = await any.from("prod_documentos_sst").update(payload).eq("id", payload.id);
        if (error) throw error;
      } else {
        const { error } = await any.from("prod_documentos_sst").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["prod", "documentos"] }),
  });
}

export function useDeleteDocumento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const sb = createSupabaseBrowserClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (sb as any).from("prod_documentos_sst").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["prod", "documentos"] }),
  });
}

export function useSaveRegistro() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Omit<ProdRegistroMensal, "id" | "criado_em"> & { id?: string }) => {
      const sb = createSupabaseBrowserClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (sb as any)
        .from("prod_registros_mensais")
        .upsert(payload, { onConflict: "id_colaborador,mes,ano" });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["prod", "registros"] }),
  });
}
