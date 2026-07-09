"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { mensagemErro } from "@/lib/errors";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { gerarId } from "@/lib/utils";
import { useUserStore } from "@/lib/store";
import type {
  EpiColaborador, EpiCatalogoItem, EpiMovimentacao, EpiSaldo, EpiMovTipo,
  EpiImportacaoNfe, EpiNfeItemMap, EpiEntrega, EpiEntregaItem, EpiEntregaItemInput,
} from "@/lib/epi/types";

/** Email do usuário logado (autor das escritas). */
const emailAtual = () => useUserStore.getState().user?.email ?? null;

// RPCs do EPI ainda não estão nos tipos gerados → cast tipado.
type EpiRpc = {
  rpc<T = unknown>(fn: string, args?: Record<string, unknown>): Promise<{ data: T; error: { message: string } | null }>;
};

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

// ── Importação de NF-e ────────────────────────────────────────────────────────
export function useEpiImportacoes(empresaId: string | null | undefined) {
  return useQuery({
    queryKey: ["epi-importacoes", empresaId],
    enabled: !!empresaId,
    queryFn: async () => {
      const sb = createSupabaseBrowserClient();
      const { data, error } = await sb.from("epi_importacoes_nfe").select("*").eq("empresa_id", empresaId!).order("criado_em", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as EpiImportacaoNfe[];
    },
  });
}

export function useImportarNfe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: {
      empresa_id: string; chnfe: string; fornecedor_cnpj: string; fornecedor_nome: string;
      numero_nf: string; data_emissao: string; xml_nome: string; itens: EpiNfeItemMap[];
    }) => {
      const sb = createSupabaseBrowserClient() as unknown as EpiRpc;
      const { data, error } = await sb.rpc<string>("epi_importar_nfe", {
        p_empresa_id: p.empresa_id, p_chnfe: p.chnfe,
        p_fornecedor_cnpj: p.fornecedor_cnpj || null, p_fornecedor_nome: p.fornecedor_nome || null,
        p_numero_nf: p.numero_nf || null, p_data_emissao: p.data_emissao || null,
        p_xml_nome: p.xml_nome || null, p_itens: p.itens,
      });
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (_d, p) => {
      qc.invalidateQueries({ queryKey: ["epi-importacoes", p.empresa_id] });
      qc.invalidateQueries({ queryKey: ["epi-catalogo", p.empresa_id] });
      qc.invalidateQueries({ queryKey: ["epi-movimentacoes", p.empresa_id] });
      qc.invalidateQueries({ queryKey: ["epi-saldo", p.empresa_id] });
      toast.success("NF-e importada");
    },
    onError: (e: Error) => toast.error(mensagemErro(e)),
  });
}

// ── Entregas ──────────────────────────────────────────────────────────────────
export function useEpiEntregas(empresaId: string | null | undefined) {
  return useQuery({
    queryKey: ["epi-entregas", empresaId],
    enabled: !!empresaId,
    queryFn: async () => {
      const sb = createSupabaseBrowserClient();
      const { data, error } = await sb
        .from("epi_entregas")
        .select("*, colaborador:epi_colaboradores(nome)")
        .eq("empresa_id", empresaId!)
        .order("criado_em", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as EpiEntrega[];
    },
  });
}

export function useEpiEntregaItens(idEntrega: string | null | undefined) {
  return useQuery({
    queryKey: ["epi-entrega-itens", idEntrega],
    enabled: !!idEntrega,
    queryFn: async () => {
      const sb = createSupabaseBrowserClient();
      const { data, error } = await sb.from("epi_entregas_itens").select("*").eq("id_entrega", idEntrega!);
      if (error) throw error;
      return (data ?? []) as unknown as EpiEntregaItem[];
    },
  });
}

export function useRegistrarEntrega() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: {
      empresa_id: string; id_colaborador: string; data_entrega: string;
      responsavel?: string; observacao?: string; itens: EpiEntregaItemInput[];
    }) => {
      const sb = createSupabaseBrowserClient() as unknown as EpiRpc;
      const { data, error } = await sb.rpc<string>("epi_registrar_entrega", {
        p_empresa_id: p.empresa_id, p_id_colaborador: p.id_colaborador,
        p_data_entrega: p.data_entrega || null, p_responsavel: p.responsavel || null,
        p_observacao: p.observacao || null, p_itens: p.itens,
      });
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (_d, p) => {
      qc.invalidateQueries({ queryKey: ["epi-entregas", p.empresa_id] });
      qc.invalidateQueries({ queryKey: ["epi-movimentacoes", p.empresa_id] });
      qc.invalidateQueries({ queryKey: ["epi-saldo", p.empresa_id] });
      toast.success("Entrega registrada");
    },
    onError: (e: Error) => toast.error(mensagemErro(e)),
  });
}
