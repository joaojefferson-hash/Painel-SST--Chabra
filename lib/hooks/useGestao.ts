"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { gerarId } from "@/lib/utils";
import { mensagemErro } from "@/lib/errors";
import { useUserStore } from "@/lib/store";

export type StatusTarefa = "A_FAZER" | "EM_ANDAMENTO" | "EM_REVISAO" | "CONCLUIDO";
export type VistaGestao = "quadro" | "lista" | "calendario" | "timeline";
export type AgruparPor = "status" | "responsavel" | "prioridade" | "etiqueta";
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
  data_inicio: string | null;
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

/** Iniciais (1-2 letras) de um nome, para avatar. */
export function iniciais(nome: string): string {
  const p = (nome ?? "").trim().split(/\s+/);
  return ((p[0]?.[0] ?? "") + (p.length > 1 ? p[p.length - 1][0] : "")).toUpperCase();
}

const AVATAR_CORES = ["#0ea5e9", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#ef4444", "#6366f1", "#14b8a6", "#f97316", "#0d9488"];

/** Cor determinística por nome (avatar). */
export function corAvatar(nome: string): string {
  let h = 0;
  for (let i = 0; i < (nome ?? "").length; i++) h = (h * 31 + nome.charCodeAt(i)) >>> 0;
  return AVATAR_CORES[h % AVATAR_CORES.length];
}

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
          data_inicio: t.data_inicio ?? null,
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

export interface GestaoComentario {
  id_comentario: string;
  id_tarefa: string;
  autor: string | null;
  texto: string;
  created_at: string;
}

export function useComentarios(idTarefa: string | null | undefined) {
  return useQuery({
    queryKey: ["gestao-comentarios", idTarefa],
    enabled: !!idTarefa,
    queryFn: async () => {
      const sb = createSupabaseBrowserClient();
      const { data, error } = await sb
        .from("gestao_comentarios")
        .select("*")
        .eq("id_tarefa", idTarefa!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as GestaoComentario[];
    },
  });
}

export function useAddComentario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: { id_tarefa: string; texto: string; autor: string | null }) => {
      const sb = createSupabaseBrowserClient();
      const { error } = await sb.from("gestao_comentarios").insert({
        id_comentario: gerarId("CMT"),
        id_tarefa: p.id_tarefa,
        autor: p.autor,
        texto: p.texto,
        created_at: new Date().toISOString(),
      } as never);
      if (error) throw error;
    },
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ["gestao-comentarios", v.id_tarefa] }),
    onError: (e) => toast.error(mensagemErro(e, "Não foi possível comentar.")),
  });
}

export function useExcluirComentario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: { id_comentario: string; id_tarefa: string }) => {
      const sb = createSupabaseBrowserClient();
      const { error } = await sb.from("gestao_comentarios").delete().eq("id_comentario", p.id_comentario);
      if (error) throw error;
    },
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ["gestao-comentarios", v.id_tarefa] }),
    onError: (e) => toast.error(mensagemErro(e)),
  });
}

export interface PreferenciaVisao {
  vista: VistaGestao;
  agrupar_por: AgruparPor | null;
  config: Record<string, unknown>;
}

/** Preferência de visão (Quadro/Lista/Calendário/Timeline) do usuário para um quadro. */
export function usePreferenciaVisao(idQuadro: string | null | undefined) {
  const email = useUserStore((s) => s.user?.email ?? null);
  return useQuery({
    queryKey: ["gestao-pref-visao", idQuadro, email],
    enabled: !!idQuadro && !!email,
    queryFn: async () => {
      const sb = createSupabaseBrowserClient();
      const { data, error } = await sb
        .from("gestao_preferencias_visao")
        .select("vista,agrupar_por,config")
        .eq("usuario_email", email!)
        .eq("id_quadro", idQuadro!)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as PreferenciaVisao | null;
    },
  });
}

export function useSalvarPreferenciaVisao() {
  const qc = useQueryClient();
  const email = useUserStore((s) => s.user?.email ?? null);
  return useMutation({
    mutationFn: async (p: { id_quadro: string; vista: VistaGestao; agrupar_por?: AgruparPor | null; config?: Record<string, unknown> }) => {
      if (!email) return;
      const sb = createSupabaseBrowserClient();
      const row = {
        usuario_email: email,
        id_quadro: p.id_quadro,
        vista: p.vista,
        agrupar_por: p.agrupar_por ?? null,
        config: p.config ?? {},
        updated_at: new Date().toISOString(),
      };
      // Atualiza a linha existente; se não houver, insere com UUID client-generated.
      const upd = await sb
        .from("gestao_preferencias_visao")
        .update(row as never)
        .eq("usuario_email", email)
        .eq("id_quadro", p.id_quadro)
        .select("id");
      if (upd.error) throw upd.error;
      if (upd.data && upd.data.length > 0) return;
      const ins = await sb.from("gestao_preferencias_visao").insert({ id: crypto.randomUUID(), ...row } as never);
      if (ins.error) throw ins.error;
    },
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ["gestao-pref-visao", v.id_quadro] }),
    onError: () => {
      // Preferência é best-effort; não interrompe o uso se falhar.
    },
  });
}
