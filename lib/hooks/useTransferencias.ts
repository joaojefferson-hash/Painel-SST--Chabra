"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useUserStore } from "@/lib/store";
import { gerarId } from "@/lib/utils";
import type { Maquina } from "@/lib/supabase/types";

/**
 * Registro de transferência de um equipamento do inventário. Guarda um snapshot
 * dos dados da máquina para o histórico/PDF ficar íntegro mesmo que a máquina
 * seja editada ou removida depois. Tabela `transferencias` (migration v115).
 */
export interface Transferencia {
  id_transferencia: string;
  id_maquina: string | null;
  de_unidade: string | null;
  de_localizacao: string | null;
  de_responsavel: string | null;
  para_unidade: string | null;
  para_localizacao: string | null;
  para_responsavel: string | null;
  motivo: string | null;
  observacoes: string | null;
  maquina_nome: string | null;
  maquina_tipo: string | null;
  maquina_categoria: string | null;
  maquina_codigo_interno: string | null;
  maquina_tag: string | null;
  maquina_marca: string | null;
  maquina_modelo: string | null;
  maquina_numero_serie: string | null;
  maquina_numero_patrimonio: string | null;
  maquina_foto_url: string | null;
  responsavel_nome: string | null;
  responsavel_email: string | null;
  data_hora: string;
  created_at: string;
}

const KEY = ["transferencias"] as const;

export function useTransferencias() {
  return useQuery({
    queryKey: KEY,
    queryFn: async (): Promise<Transferencia[]> => {
      const sb = createSupabaseBrowserClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (sb as any)
        .from("transferencias")
        .select("*")
        .order("data_hora", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Transferencia[];
    },
  });
}

export interface RegistrarTransferenciaInput {
  maquina: Maquina;
  para_unidade: string | null;
  para_localizacao: string | null;
  para_responsavel: string | null;
  motivo: string | null;
  observacoes: string | null;
  /** Atualiza os campos atuais da máquina (unidade/localização/responsável) para o destino. */
  atualizarMaquina?: boolean;
}

export function useRegistrarTransferencia() {
  const qc = useQueryClient();
  const user = useUserStore((s) => s.user);

  return useMutation({
    mutationFn: async (input: RegistrarTransferenciaInput): Promise<Transferencia> => {
      const sb = createSupabaseBrowserClient();
      const m = input.maquina;
      const id_transferencia = gerarId("TRF");

      const row: Transferencia = {
        id_transferencia,
        id_maquina: m.id_maquina,
        // Origem = situação atual da máquina.
        de_unidade: m.unidade,
        de_localizacao: m.localizacao,
        de_responsavel: m.responsavel_setor,
        // Destino.
        para_unidade: input.para_unidade,
        para_localizacao: input.para_localizacao,
        para_responsavel: input.para_responsavel,
        motivo: input.motivo,
        observacoes: input.observacoes,
        // Snapshot de identificação da máquina.
        maquina_nome: m.nome,
        maquina_tipo: m.tipo,
        maquina_categoria: m.categoria,
        maquina_codigo_interno: m.codigo_interno,
        maquina_tag: m.tag,
        maquina_marca: m.marca,
        maquina_modelo: m.modelo,
        maquina_numero_serie: m.numero_serie,
        maquina_numero_patrimonio: m.numero_patrimonio,
        maquina_foto_url: m.foto_url,
        // Quem registrou.
        responsavel_nome: user?.nome ?? null,
        responsavel_email: user?.email ?? null,
        data_hora: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (sb as any).from("transferencias").insert(row);
      if (error) throw error;

      // Atualiza a localização atual da máquina para o destino (só os campos
      // informados). Usa os mesmos campos já existentes na tabela de máquinas.
      if (input.atualizarMaquina !== false) {
        const patch: Record<string, string | null> = { updated_at: new Date().toISOString() };
        if (input.para_unidade !== null) patch.unidade = input.para_unidade;
        if (input.para_localizacao !== null) patch.localizacao = input.para_localizacao;
        if (input.para_responsavel !== null) patch.responsavel_setor = input.para_responsavel;
        const { error: upErr } = await sb
          .from("inventario_maquinas")
          .update(patch as never)
          .eq("id_maquina", m.id_maquina);
        if (upErr) throw upErr;
      }

      return row;
    },
    onSuccess: (_row, vars) => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ["inventario-maquinas"] });
      qc.invalidateQueries({ queryKey: ["inventario-maquina", vars.maquina.id_maquina] });
    },
    onError: (e: Error) => toast.error(`Erro ao registrar transferência: ${e.message}`),
  });
}
