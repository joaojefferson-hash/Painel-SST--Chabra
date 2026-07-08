"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { mensagemErro } from "@/lib/errors";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { gerarId } from "@/lib/utils";

// ── Tipos ─────────────────────────────────────────────────────────────────────
export interface GGCategoria { id: string; nome: string; ordem: number; ativo: boolean; id_unidade: string }
export interface GGTurno { id: string; nome: string; ordem: number; ativo: boolean; id_unidade: string }
export interface GGProfissional { id: string; nome: string; ativo: boolean }
export interface GGVinculo {
  id: string; id_profissional: string; id_unidade: string; id_categoria: string | null;
  profissional: { nome: string; ativo: boolean } | null;
  categoria: { nome: string } | null;
}
export interface GGEscala { id: string; id_profissional: string; id_unidade: string; dia_semana: number; id_turno: string }

export const DIAS_SEMANA = [
  { n: 1, label: "Seg" }, { n: 2, label: "Ter" }, { n: 3, label: "Qua" },
  { n: 4, label: "Qui" }, { n: 5, label: "Sex" }, { n: 6, label: "Sáb" }, { n: 7, label: "Dom" },
] as const;

// ── Categorias (por unidade) ─────────────────────────────────────────────────
export function useGGCategorias(idUnidade: string | null | undefined) {
  return useQuery({
    queryKey: ["gg-categorias", idUnidade],
    enabled: !!idUnidade,
    queryFn: async () => {
      const sb = createSupabaseBrowserClient();
      const { data, error } = await sb.from("gg_categorias").select("*").eq("id_unidade", idUnidade!).order("ordem");
      if (error) throw error;
      return (data ?? []) as unknown as GGCategoria[];
    },
  });
}
export function useGGTurnos(idUnidade: string | null | undefined) {
  return useQuery({
    queryKey: ["gg-turnos", idUnidade],
    enabled: !!idUnidade,
    queryFn: async () => {
      const sb = createSupabaseBrowserClient();
      const { data, error } = await sb.from("gg_turnos").select("*").eq("id_unidade", idUnidade!).order("ordem");
      if (error) throw error;
      return (data ?? []) as unknown as GGTurno[];
    },
  });
}

/** CRUD genérico para as tabelas de config (categorias/turnos), ambas com o mesmo shape. */
function useConfigCrud(tabela: "gg_categorias" | "gg_turnos", prefixo: string, chaveQuery: string) {
  const qc = useQueryClient();
  const inval = (idUnidade: string) => qc.invalidateQueries({ queryKey: [chaveQuery, idUnidade] });
  const criar = useMutation({
    mutationFn: async (p: { id_unidade: string; nome: string; ordem: number }) => {
      const sb = createSupabaseBrowserClient();
      const { error } = await sb.from(tabela).insert({ id: gerarId(prefixo), nome: p.nome.trim(), ordem: p.ordem, id_unidade: p.id_unidade } as never);
      if (error) throw error;
    },
    onSuccess: (_d, p) => inval(p.id_unidade),
    onError: (e: Error) => toast.error(mensagemErro(e)),
  });
  const atualizar = useMutation({
    mutationFn: async (p: { id: string; id_unidade: string; nome?: string; ativo?: boolean }) => {
      const sb = createSupabaseBrowserClient();
      const patch: Record<string, unknown> = {};
      if (p.nome !== undefined) patch.nome = p.nome.trim();
      if (p.ativo !== undefined) patch.ativo = p.ativo;
      const { error } = await sb.from(tabela).update(patch as never).eq("id", p.id);
      if (error) throw error;
    },
    onSuccess: (_d, p) => inval(p.id_unidade),
    onError: (e: Error) => toast.error(mensagemErro(e)),
  });
  const excluir = useMutation({
    mutationFn: async (p: { id: string; id_unidade: string }) => {
      const sb = createSupabaseBrowserClient();
      const { error } = await sb.from(tabela).delete().eq("id", p.id);
      if (error) throw error;
    },
    onSuccess: (_d, p) => inval(p.id_unidade),
    onError: (e: Error) => toast.error(mensagemErro(e)),
  });
  return { criar, atualizar, excluir };
}
export const useCategoriaCrud = () => useConfigCrud("gg_categorias", "CAT", "gg-categorias");
export const useTurnoCrud = () => useConfigCrud("gg_turnos", "TRN", "gg-turnos");

// ── Profissionais (compartilhados) + vínculo por unidade ─────────────────────
/** Equipe da unidade: vínculos + nome do profissional + nome da categoria. */
export function useGGEquipe(idUnidade: string | null | undefined) {
  return useQuery({
    queryKey: ["gg-equipe", idUnidade],
    enabled: !!idUnidade,
    queryFn: async () => {
      const sb = createSupabaseBrowserClient();
      const { data, error } = await sb
        .from("gg_profissional_unidades")
        .select("id, id_profissional, id_unidade, id_categoria, profissional:gg_profissionais(nome, ativo), categoria:gg_categorias(nome)")
        .eq("id_unidade", idUnidade!);
      if (error) throw error;
      const rows = (data ?? []) as unknown as GGVinculo[];
      return rows.sort((a, b) => (a.profissional?.nome ?? "").localeCompare(b.profissional?.nome ?? ""));
    },
  });
}

/** Todos os profissionais do sistema (para vincular um existente). */
export function useTodosProfissionais() {
  return useQuery({
    queryKey: ["gg-profissionais-todos"],
    queryFn: async () => {
      const sb = createSupabaseBrowserClient();
      const { data, error } = await sb.from("gg_profissionais").select("*").order("nome");
      if (error) throw error;
      return (data ?? []) as unknown as GGProfissional[];
    },
  });
}

export function useGGProfissionalMut() {
  const qc = useQueryClient();
  const inval = (idUnidade: string) => {
    qc.invalidateQueries({ queryKey: ["gg-equipe", idUnidade] });
    qc.invalidateQueries({ queryKey: ["gg-profissionais-todos"] });
  };
  // cria um profissional novo e já vincula à unidade com a categoria
  const criarEVincular = useMutation({
    mutationFn: async (p: { nome: string; id_unidade: string; id_categoria: string }) => {
      const sb = createSupabaseBrowserClient();
      const idProf = gerarId("PROF");
      const { error: e1 } = await sb.from("gg_profissionais").insert({ id: idProf, nome: p.nome.trim() } as never);
      if (e1) throw e1;
      const { error: e2 } = await sb.from("gg_profissional_unidades").insert({ id: gerarId("PU"), id_profissional: idProf, id_unidade: p.id_unidade, id_categoria: p.id_categoria } as never);
      if (e2) throw e2;
    },
    onSuccess: (_d, p) => inval(p.id_unidade),
    onError: (e: Error) => toast.error(mensagemErro(e)),
  });
  // vincula um profissional existente a esta unidade
  const vincular = useMutation({
    mutationFn: async (p: { id_profissional: string; id_unidade: string; id_categoria: string }) => {
      const sb = createSupabaseBrowserClient();
      const { error } = await sb.from("gg_profissional_unidades").insert({ id: gerarId("PU"), id_profissional: p.id_profissional, id_unidade: p.id_unidade, id_categoria: p.id_categoria } as never);
      if (error) throw error;
    },
    onSuccess: (_d, p) => inval(p.id_unidade),
    onError: (e: Error) => toast.error(mensagemErro(e).includes("duplicate") ? "Profissional já está nesta unidade." : mensagemErro(e)),
  });
  // muda a categoria do profissional NESTA unidade
  const setCategoria = useMutation({
    mutationFn: async (p: { id_vinculo: string; id_unidade: string; id_categoria: string }) => {
      const sb = createSupabaseBrowserClient();
      const { error } = await sb.from("gg_profissional_unidades").update({ id_categoria: p.id_categoria } as never).eq("id", p.id_vinculo);
      if (error) throw error;
    },
    onSuccess: (_d, p) => inval(p.id_unidade),
    onError: (e: Error) => toast.error(mensagemErro(e)),
  });
  // renomeia / ativa-desativa o profissional (global)
  const atualizarProf = useMutation({
    mutationFn: async (p: { id: string; id_unidade: string; nome?: string; ativo?: boolean }) => {
      const sb = createSupabaseBrowserClient();
      const patch: Record<string, unknown> = {};
      if (p.nome !== undefined) patch.nome = p.nome.trim();
      if (p.ativo !== undefined) patch.ativo = p.ativo;
      const { error } = await sb.from("gg_profissionais").update(patch as never).eq("id", p.id);
      if (error) throw error;
    },
    onSuccess: (_d, p) => inval(p.id_unidade),
    onError: (e: Error) => toast.error(mensagemErro(e)),
  });
  // remove o profissional DESTA unidade (desfaz o vínculo)
  const desvincular = useMutation({
    mutationFn: async (p: { id_vinculo: string; id_unidade: string }) => {
      const sb = createSupabaseBrowserClient();
      const { error } = await sb.from("gg_profissional_unidades").delete().eq("id", p.id_vinculo);
      if (error) throw error;
    },
    onSuccess: (_d, p) => inval(p.id_unidade),
    onError: (e: Error) => toast.error(mensagemErro(e)),
  });
  return { criarEVincular, vincular, setCategoria, atualizarProf, desvincular };
}

// ── Escala padrão (por unidade) ──────────────────────────────────────────────
export function useGGEscala(idUnidade: string | null | undefined) {
  return useQuery({
    queryKey: ["gg-escala", idUnidade],
    enabled: !!idUnidade,
    queryFn: async () => {
      const sb = createSupabaseBrowserClient();
      const { data, error } = await sb.from("gg_escala_padrao").select("*").eq("id_unidade", idUnidade!);
      if (error) throw error;
      return (data ?? []) as unknown as GGEscala[];
    },
  });
}

export function useToggleEscala() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: { id_profissional: string; id_unidade: string; dia_semana: number; id_turno: string; marcar: boolean; id_existente?: string }) => {
      const sb = createSupabaseBrowserClient();
      if (p.marcar) {
        const { error } = await sb.from("gg_escala_padrao").insert({ id: gerarId("ESC"), id_profissional: p.id_profissional, id_unidade: p.id_unidade, dia_semana: p.dia_semana, id_turno: p.id_turno } as never);
        if (error) throw error;
      } else if (p.id_existente) {
        const { error } = await sb.from("gg_escala_padrao").delete().eq("id", p.id_existente);
        if (error) throw error;
      }
    },
    onSuccess: (_d, p) => qc.invalidateQueries({ queryKey: ["gg-escala", p.id_unidade] }),
    onError: (e: Error) => toast.error(mensagemErro(e)),
  });
}
