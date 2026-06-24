"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { gerarId } from "@/lib/utils";
import { mensagemErro } from "@/lib/errors";

export type StatusTarefa = "A_FAZER" | "EM_ANDAMENTO" | "EM_REVISAO" | "CONCLUIDO";
export type PrioridadeTarefa = "Baixa" | "Media" | "Alta" | "Urgente";

export interface GestaoQuadro {
  id_quadro: string;
  nome: string;
  descricao: string | null;
}

export interface Subtarefa {
  texto: string;
  feito: boolean;
}

export interface GestaoTarefa {
  id_tarefa: string;
  id_quadro: string;
  titulo: string;
  descricao: string | null;
  status: StatusTarefa;
  prioridade: PrioridadeTarefa;
  responsavel: string | null;
  prazo: string | null;
  ordem: number;
  etiquetas: string[];
  subtarefas: Subtarefa[];
  created_by: string | null;
  created_at: string;
  updated_at: string | null;
}

export const STATUS_TAREFA: { value: StatusTarefa; label: string; cor: string }[] = [
  { value: "A_FAZER", label: "A fazer", cor: "#94a3b8" },
  { value: "EM_ANDAMENTO", label: "Em andamento", cor: "#f59e0b" },
  { value: "EM_REVISAO", label: "Em revisão", cor: "#6366f1" },
  { value: "CONCLUIDO", label: "Concluído", cor: "#16a34a" },
];

export const PRIORIDADES: { value: PrioridadeTarefa; label: string; cor: string }[] = [
  { value: "Baixa", label: "Baixa", cor: "#16a34a" },
  { value: "Media", label: "Média", cor: "#f59e0b" },
  { value: "Alta", label: "Alta", cor: "#ea580c" },
  { value: "Urgente", label: "Urgente", cor: "#dc2626" },
];

export function useQuadroPadrao() {
  return useQuery({
    queryKey: ["gestao-quadro-padrao"],
    queryFn: async () => {
      const sb = createSupabaseBrowserClient();
      const { data, error } = await sb
        .from("gestao_quadros")
        .select("id_quadro,nome,descricao")
        .order("created_at", { ascending: true })
        .limit(1);
      if (error) throw error;
      return ((data ?? [])[0] ?? null) as GestaoQuadro | null;
    },
  });
}

export function useQuadros() {
  return useQuery({
    queryKey: ["gestao-quadros"],
    queryFn: async () => {
      const sb = createSupabaseBrowserClient();
      const { data, error } = await sb
        .from("gestao_quadros")
        .select("id_quadro,nome,descricao")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as GestaoQuadro[];
    },
  });
}

export function useCriarQuadro() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (nome: string) => {
      const sb = createSupabaseBrowserClient();
      const id = gerarId("QDR");
      const { error } = await sb.from("gestao_quadros").insert({
        id_quadro: id,
        nome: nome.trim() || "Novo quadro",
        created_at: new Date().toISOString(),
      } as never);
      if (error) throw error;
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gestao-quadros"] }),
    onError: (e) => toast.error(mensagemErro(e, "Não foi possível criar o quadro.")),
  });
}

export function useTarefas(idQuadro: string | null | undefined) {
  return useQuery({
    queryKey: ["gestao-tarefas", idQuadro],
    enabled: !!idQuadro,
    queryFn: async () => {
      const sb = createSupabaseBrowserClient();
      const { data, error } = await sb
        .from("gestao_tarefas")
        .select("*")
        .eq("id_quadro", idQuadro!)
        .order("ordem", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as GestaoTarefa[];
    },
  });
}

/** Lista de usuários internos (para o seletor de responsável). */
export function useUsuariosLista() {
  return useQuery({
    queryKey: ["gestao-usuarios"],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const sb = createSupabaseBrowserClient();
      const { data, error } = await sb
        .from("usuarios")
        .select("nome")
        .neq("perfil", "Cliente")
        .order("nome", { ascending: true });
      if (error) throw error;
      return [...new Set(((data ?? []) as { nome: string | null }[]).map((u) => (u.nome ?? "").trim()).filter(Boolean))];
    },
  });
}

export function useSalvarTarefa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (t: Partial<GestaoTarefa> & { id_quadro: string }) => {
      const sb = createSupabaseBrowserClient();
      const now = new Date().toISOString();
      if (!t.id_tarefa) {
        const id = gerarId("TRF");
        const { error } = await sb.from("gestao_tarefas").insert({
          id_tarefa: id,
          id_quadro: t.id_quadro,
          titulo: (t.titulo ?? "").trim() || "Nova tarefa",
          descricao: t.descricao ?? null,
          status: t.status ?? "A_FAZER",
          prioridade: t.prioridade ?? "Media",
          responsavel: t.responsavel ?? null,
          prazo: t.prazo ?? null,
          ordem: t.ordem ?? 0,
          etiquetas: t.etiquetas ?? [],
          subtarefas: t.subtarefas ?? [],
          created_at: now,
          updated_at: now,
        } as never);
        if (error) throw error;
        return id;
      }
      const { id_tarefa, ...patch } = t;
      const { error } = await sb
        .from("gestao_tarefas")
        .update({ ...patch, updated_at: now } as never)
        .eq("id_tarefa", id_tarefa);
      if (error) throw error;
      return id_tarefa;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gestao-tarefas"] }),
    onError: (e) => toast.error(mensagemErro(e, "Não foi possível salvar a tarefa.")),
  });
}

export function useMoverTarefa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: { id_tarefa: string; status: StatusTarefa }) => {
      const sb = createSupabaseBrowserClient();
      const { error } = await sb
        .from("gestao_tarefas")
        .update({ status: p.status, updated_at: new Date().toISOString() } as never)
        .eq("id_tarefa", p.id_tarefa);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gestao-tarefas"] }),
    onError: (e) => toast.error(mensagemErro(e, "Não foi possível mover a tarefa.")),
  });
}

/** Persiste a nova ordem/status de uma coluna (drag-and-drop). */
export function useReordenar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (updates: { id_tarefa: string; status: StatusTarefa; ordem: number }[]) => {
      const sb = createSupabaseBrowserClient();
      const now = new Date().toISOString();
      await Promise.all(
        updates.map((u) =>
          sb
            .from("gestao_tarefas")
            .update({ status: u.status, ordem: u.ordem, updated_at: now } as never)
            .eq("id_tarefa", u.id_tarefa),
        ),
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gestao-tarefas"] }),
    onError: (e) => toast.error(mensagemErro(e, "Não foi possível reordenar.")),
  });
}

export function useExcluirTarefa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const sb = createSupabaseBrowserClient();
      const { error } = await sb.from("gestao_tarefas").delete().eq("id_tarefa", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gestao-tarefas"] }),
    onError: (e) => toast.error(mensagemErro(e, "Não foi possível excluir.")),
  });
}
