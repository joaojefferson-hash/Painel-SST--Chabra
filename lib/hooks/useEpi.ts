"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { mensagemErro } from "@/lib/errors";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { gerarId } from "@/lib/utils";
import { useUserStore } from "@/lib/store";
import type {
  EpiColaborador, EpiCatalogoItem, EpiMovimentacao, EpiSaldo, EpiMovTipo,
} from "@/lib/epi/types";

/** Email do usuário logado (autor das escritas). */
const emailAtual = () => useUserStore.getState().user?.email ?? null;

// ── Colaboradores ─────────────────────────────────────────────────────────────
export function useEpiColaboradores(empresaId: string | null | undefined) {
  return useQuery({
    queryKey: ["epi-colaboradores", empresaId],
    enabled: !!empresaId,
    queryFn: async () => {
      const sb = createSupabaseBrowserClient();
      const { data, error } = await sb.from("epi_colaboradores").select("*").eq("empresa_id", empresaId!).order("nome");
      if (error) throw error;
      return (data ?? []) as unknown as EpiColaborador[];
    },
  });
}

export function useColaboradorMut() {
  const qc = useQueryClient();
  const inval = (empresaId: string) => qc.invalidateQueries({ queryKey: ["epi-colaboradores", empresaId] });
  const criar = useMutation({
    mutationFn: async (p: { empresa_id: string; nome: string; cpf?: string; matricula?: string; cargo?: string; setor?: string }) => {
      const sb = createSupabaseBrowserClient();
      const { error } = await sb.from("epi_colaboradores").insert({
        id: gerarId("COL"), empresa_id: p.empresa_id, nome: p.nome.trim(),
        cpf: p.cpf?.trim() || null, matricula: p.matricula?.trim() || null,
        cargo: p.cargo?.trim() || null, setor: p.setor?.trim() || null,
        criado_por: emailAtual(),
      } as never);
      if (error) throw error;
    },
    onSuccess: (_d, p) => { inval(p.empresa_id); toast.success("Colaborador cadastrado"); },
    onError: (e: Error) => toast.error(mensagemErro(e)),
  });
  const atualizar = useMutation({
    mutationFn: async (p: { id: string; empresa_id: string; patch: Partial<EpiColaborador> }) => {
      const sb = createSupabaseBrowserClient();
      const { error } = await sb.from("epi_colaboradores").update({ ...p.patch, updated_at: new Date().toISOString() } as never).eq("id", p.id);
      if (error) throw error;
    },
    onSuccess: (_d, p) => inval(p.empresa_id),
    onError: (e: Error) => toast.error(mensagemErro(e)),
  });
  const excluir = useMutation({
    mutationFn: async (p: { id: string; empresa_id: string }) => {
      const sb = createSupabaseBrowserClient();
      const { error } = await sb.from("epi_colaboradores").delete().eq("id", p.id);
      if (error) throw error;
    },
    onSuccess: (_d, p) => { inval(p.empresa_id); toast.success("Colaborador excluído"); },
    onError: (e: Error) => toast.error(mensagemErro(e)),
  });
  return { criar, atualizar, excluir };
}

// ── Catálogo ──────────────────────────────────────────────────────────────────
export function useEpiCatalogo(empresaId: string | null | undefined) {
  return useQuery({
    queryKey: ["epi-catalogo", empresaId],
    enabled: !!empresaId,
    queryFn: async () => {
      const sb = createSupabaseBrowserClient();
      const { data, error } = await sb.from("epi_catalogo").select("*").eq("empresa_id", empresaId!).order("nome");
      if (error) throw error;
      return (data ?? []) as unknown as EpiCatalogoItem[];
    },
  });
}

export function useCatalogoMut() {
  const qc = useQueryClient();
  const inval = (empresaId: string) => qc.invalidateQueries({ queryKey: ["epi-catalogo", empresaId] });
  const criar = useMutation({
    mutationFn: async (p: { empresa_id: string; nome: string; tipo: "EPI" | "EPC"; ca_numero?: string; ca_validade?: string; fabricante?: string; descricao?: string; unidade?: string; estoque_minimo?: number }) => {
      const sb = createSupabaseBrowserClient();
      const { error } = await sb.from("epi_catalogo").insert({
        id: gerarId("EPI"), empresa_id: p.empresa_id, nome: p.nome.trim(), tipo: p.tipo,
        ca_numero: p.ca_numero?.trim() || null, ca_validade: p.ca_validade || null,
        fabricante: p.fabricante?.trim() || null, descricao: p.descricao?.trim() || null,
        unidade: p.unidade?.trim() || null, estoque_minimo: p.estoque_minimo ?? 0,
        criado_por: emailAtual(),
      } as never);
      if (error) throw error;
    },
    onSuccess: (_d, p) => { inval(p.empresa_id); toast.success("Item cadastrado"); },
    onError: (e: Error) => toast.error(mensagemErro(e)),
  });
  const atualizar = useMutation({
    mutationFn: async (p: { id: string; empresa_id: string; patch: Partial<EpiCatalogoItem> }) => {
      const sb = createSupabaseBrowserClient();
      const { error } = await sb.from("epi_catalogo").update({ ...p.patch, updated_at: new Date().toISOString() } as never).eq("id", p.id);
      if (error) throw error;
    },
    onSuccess: (_d, p) => inval(p.empresa_id),
    onError: (e: Error) => toast.error(mensagemErro(e)),
  });
  const excluir = useMutation({
    mutationFn: async (p: { id: string; empresa_id: string }) => {
      const sb = createSupabaseBrowserClient();
      const { error } = await sb.from("epi_catalogo").delete().eq("id", p.id);
      if (error) throw error;
    },
    onSuccess: (_d, p) => { inval(p.empresa_id); toast.success("Item excluído"); },
    onError: (e: Error) => toast.error(mensagemErro(e)),
  });
  return { criar, atualizar, excluir };
}

// ── Movimentações (append-only) + saldo derivado ─────────────────────────────
export function useEpiMovimentacoes(empresaId: string | null | undefined, idCatalogo?: string) {
  return useQuery({
    queryKey: ["epi-movimentacoes", empresaId, idCatalogo ?? "all"],
    enabled: !!empresaId,
    queryFn: async () => {
      const sb = createSupabaseBrowserClient();
      let q = sb.from("epi_movimentacoes").select("*").eq("empresa_id", empresaId!);
      if (idCatalogo) q = q.eq("id_catalogo", idCatalogo);
      const { data, error } = await q.order("criado_em", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as EpiMovimentacao[];
    },
  });
}

/** Saldo por item (Map id_catalogo → saldo). */
export function useEpiSaldo(empresaId: string | null | undefined) {
  return useQuery({
    queryKey: ["epi-saldo", empresaId],
    enabled: !!empresaId,
    queryFn: async () => {
      const sb = createSupabaseBrowserClient();
      const { data, error } = await sb.from("v_epi_saldo").select("*").eq("empresa_id", empresaId!);
      if (error) throw error;
      const map = new Map<string, number>();
      for (const r of (data ?? []) as unknown as EpiSaldo[]) map.set(r.id_catalogo, Number(r.saldo) || 0);
      return map;
    },
  });
}

export function useRegistrarMovimentacao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: { empresa_id: string; id_catalogo: string; tipo: EpiMovTipo; quantidade: number; motivo?: string; responsavel?: string }) => {
      if (!(p.quantidade > 0)) throw new Error("Quantidade deve ser maior que zero.");
      const sb = createSupabaseBrowserClient();
      const { error } = await sb.from("epi_movimentacoes").insert({
        id: gerarId("MOV"), empresa_id: p.empresa_id, id_catalogo: p.id_catalogo,
        tipo: p.tipo, quantidade: p.quantidade, origem: "manual",
        motivo: p.motivo?.trim() || null, responsavel: p.responsavel?.trim() || null,
        criado_por: emailAtual(),
      } as never);
      if (error) throw error;
    },
    onSuccess: (_d, p) => {
      qc.invalidateQueries({ queryKey: ["epi-movimentacoes", p.empresa_id] });
      qc.invalidateQueries({ queryKey: ["epi-saldo", p.empresa_id] });
      toast.success("Movimentação registrada");
    },
    onError: (e: Error) => toast.error(mensagemErro(e)),
  });
}
