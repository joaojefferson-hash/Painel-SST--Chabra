"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useUserStore } from "@/lib/store";
import { gerarId } from "@/lib/utils";
import type {
  Maquina,
  StatusMaquina,
  GrauRiscoMaquina,
  InspecaoMaquina,
} from "@/lib/supabase/types";

const KEY_LISTA = (vinculos: string[] | null) =>
  ["inventario-maquinas", vinculos] as const;
const KEY_ITEM = (id: string | null | undefined) =>
  ["inventario-maquina", id] as const;

/**
 * Carrega máquinas do inventário respeitando filtro por empresas
 * vinculadas pra perfil Técnico. Máquinas sem `id_empresa` (patrimônio
 * interno da Chabra) aparecem pra todos.
 */
async function fetchLista(empresasVinculadas: string[] | null) {
  const supabase = createSupabaseBrowserClient();
  let q = supabase
    .from("inventario_maquinas")
    .select("*")
    .order("created_at", { ascending: false });
  if (empresasVinculadas && empresasVinculadas.length > 0) {
    q = q.or(
      `id_empresa.in.(${empresasVinculadas.join(",")}),id_empresa.is.null`
    );
  }
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as Maquina[];
}

export function useInventarioMaquinas() {
  const user = useUserStore((s) => s.user);
  const vinculos =
    user?.perfil === "Tecnico" &&
    user.empresas_vinculadas &&
    user.empresas_vinculadas.length > 0
      ? user.empresas_vinculadas
      : null;

  return useQuery({
    queryKey: KEY_LISTA(vinculos),
    queryFn: () => fetchLista(vinculos),
  });
}

export function useMaquina(id: string | null | undefined) {
  return useQuery({
    queryKey: KEY_ITEM(id),
    enabled: !!id,
    queryFn: async () => {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("inventario_maquinas")
        .select("*")
        .eq("id_maquina", id!)
        .single();
      if (error) throw error;
      return data as unknown as Maquina;
    },
  });
}

export interface MaquinaInput {
  id_empresa: string | null;
  // Identificação
  nome: string;
  tipo: string | null;
  categoria: string | null;
  codigo_interno: string | null;
  tag: string | null;
  marca: string | null;
  modelo: string | null;
  numero_serie: string | null;
  ano_fabricacao: number | null;
  numero_patrimonio: string | null;
  status: StatusMaquina;
  // Localização
  unidade: string | null;
  setor: string | null;
  linha_processo: string | null;
  area: string | null;
  responsavel_setor: string | null;
  operacao_executada: string | null;
  localizacao: string | null;
  // Capacidade
  capacidade_operacional: string | null;
  producao_estimada: string | null;
  potencia: string | null;
  tensao: string | null;
  pressao: string | null;
  capacidade_carga: string | null;
  velocidade: string | null;
  dimensoes: string | null;
  finalidade: string | null;
  descricao_tecnica: string | null;
  // Segurança
  protecao_fixa: boolean | null;
  descricao_protecao_fixa: string | null;
  protecao_movel: boolean | null;
  descricao_protecao_movel: string | null;
  dispositivos_seguranca: string | null;
  intertravamento: boolean | null;
  botao_emergencia: boolean | null;
  sistema_bloqueio: boolean | null;
  possui_manual: boolean | null;
  possui_diagrama_eletrico: boolean | null;
  aterramento: boolean | null;
  sinalizacao: boolean | null;
  necessita_adequacao_nr12: boolean | null;
  grau_risco: GrauRiscoMaquina | null;
  observacoes_tecnicas: string | null;
  // Meta
  observacoes: string | null;
  foto_url: string | null;
  foto_storage_path: string | null;
}

export function useCriarMaquina() {
  const qc = useQueryClient();
  const user = useUserStore((s) => s.user);

  return useMutation({
    mutationFn: async (params: {
      input: MaquinaInput;
      /** ID pré-gerado pra alinhar com o storage path da foto já enviada.
       *  Quando omitido, gera um novo. */
      idMaquina?: string;
    }): Promise<Maquina> => {
      const supabase = createSupabaseBrowserClient();
      const id_maquina = params.idMaquina ?? gerarId("MAQ");
      const row: Maquina = {
        id_maquina,
        id_inspecao: null,
        id_maquina_inspecao: null,
        ...params.input,
        usuario_email: user?.email ?? null,
        usuario_nome: user?.nome ?? null,
        created_at: new Date().toISOString(),
        updated_at: null,
      };
      const { error } = await supabase
        .from("inventario_maquinas")
        .insert(row as never);
      if (error) throw error;
      return row;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventario-maquinas"] });
    },
    onError: (e: Error) => toast.error(`Erro ao criar: ${e.message}`),
  });
}

export function useAtualizarMaquina() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (params: { id_maquina: string; patch: Partial<MaquinaInput> }) => {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase
        .from("inventario_maquinas")
        .update({ ...params.patch, updated_at: new Date().toISOString() } as never)
        .eq("id_maquina", params.id_maquina);
      if (error) throw error;
      return params;
    },
    onSuccess: (params) => {
      qc.invalidateQueries({ queryKey: ["inventario-maquinas"] });
      qc.invalidateQueries({ queryKey: KEY_ITEM(params.id_maquina) });
    },
    onError: (e: Error) => toast.error(`Erro ao atualizar: ${e.message}`),
  });
}

export function useExcluirMaquina() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id_maquina: string) => {
      const supabase = createSupabaseBrowserClient();
      // 1) Recupera foto_storage_path pra limpar o storage primeiro
      const { data: atual } = await supabase
        .from("inventario_maquinas")
        .select("foto_storage_path")
        .eq("id_maquina", id_maquina)
        .single();
      const path = (atual as { foto_storage_path: string | null } | null)
        ?.foto_storage_path;
      if (path) {
        await supabase.storage.from("fotos").remove([path]);
      }
      const { error } = await supabase
        .from("inventario_maquinas")
        .delete()
        .eq("id_maquina", id_maquina);
      if (error) throw error;
      return id_maquina;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventario-maquinas"] });
    },
    onError: (e: Error) => toast.error(`Erro ao excluir: ${e.message}`),
  });
}

/**
 * Sobe a foto pro bucket `fotos` em `inventario-maquinas/{id_maquina}.{ext}`.
 * Se já houver uma foto antiga (path diferente), o caller é responsável por
 * remover antes — ou aceitar o overwrite quando o path for igual.
 *
 * Retorna `{ publicUrl, storagePath }` pra salvar na linha da máquina.
 */
export async function uploadFotoMaquina(
  id_maquina: string,
  file: File
): Promise<{ publicUrl: string; storagePath: string }> {
  const supabase = createSupabaseBrowserClient();
  const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase();
  const storagePath = `inventario-maquinas/${id_maquina}.${ext}`;
  const { error: upErr } = await supabase.storage
    .from("fotos")
    .upload(storagePath, file, {
      cacheControl: "3600",
      upsert: true,
      contentType: file.type || undefined,
    });
  if (upErr) throw upErr;
  const { data: pub } = supabase.storage.from("fotos").getPublicUrl(storagePath);
  return { publicUrl: pub.publicUrl, storagePath };
}

/** Remove a foto do storage sem mexer na linha. Útil quando o usuário troca a foto. */
export async function removerFotoMaquinaStorage(storagePath: string) {
  const supabase = createSupabaseBrowserClient();
  await supabase.storage.from("fotos").remove([storagePath]);
}

// ═════════════════════════════════════════════════════════════════════════════
// Importação de máquinas registradas em INSPEÇÕES (v66)
//
// Máquinas da aba "Máquinas/NR-12" de uma inspeção (inspecao_maquinas) podem
// ser importadas pro inventário, ficando disponíveis pra Apreciação NR-12.
// Dedupe: id_maquina_inspecao (marcador de origem) → numero_serie na mesma
// empresa → nome+setor na mesma inspeção (regra NR-12 do prompt).
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Máquinas de inspeções da empresa que ainda NÃO foram importadas pro
 * inventário. Alimenta o banner da nova apreciação e o modal de importação.
 */
export function useMaquinasInspecaoPendentes(idEmpresa: string | null | undefined) {
  return useQuery({
    queryKey: ["inspecao-maquinas-pendentes", idEmpresa],
    enabled: !!idEmpresa,
    queryFn: async () => {
      const supabase = createSupabaseBrowserClient();
      const [maqRes, invRes] = await Promise.all([
        supabase
          .from("inspecao_maquinas")
          .select("*")
          .eq("id_empresa", idEmpresa!)
          .order("created_at", { ascending: false }),
        supabase
          .from("inventario_maquinas")
          .select("id_maquina_inspecao, numero_serie")
          .eq("id_empresa", idEmpresa!),
      ]);
      if (maqRes.error) throw maqRes.error;
      if (invRes.error) throw invRes.error;

      const todas = (maqRes.data ?? []) as unknown as InspecaoMaquina[];
      const inventario = (invRes.data ?? []) as {
        id_maquina_inspecao: string | null;
        numero_serie: string | null;
      }[];
      const importadas = new Set(
        inventario.map((r) => r.id_maquina_inspecao).filter(Boolean) as string[]
      );
      const seriesExistentes = new Set(
        inventario
          .map((r) => r.numero_serie?.trim().toLowerCase())
          .filter(Boolean) as string[]
      );

      const pendentes = todas.filter((m) => {
        if (importadas.has(m.id_maquina_inspecao)) return false;
        const serie = m.numero_serie?.trim().toLowerCase();
        if (serie && seriesExistentes.has(serie)) return false;
        return true;
      });
      return { todas, pendentes, importadas };
    },
  });
}

export interface ResultadoImportacaoMaquinas {
  criadas: number;
  ignoradas: number;
}

/**
 * Importa máquinas de inspeção pro inventário. Idempotente: re-verifica o
 * dedupe no banco na hora do insert (id_maquina_inspecao + numero_serie +
 * nome/setor/inspeção), então pode receber a lista completa sem duplicar.
 * A 1ª foto da máquina é COPIADA no storage (não compartilhada), pra exclusão
 * no inventário nunca apagar a foto original da inspeção.
 */
export function useImportarMaquinasInspecao() {
  const qc = useQueryClient();
  const user = useUserStore((s) => s.user);

  return useMutation({
    mutationFn: async (
      maquinasInspecao: InspecaoMaquina[]
    ): Promise<ResultadoImportacaoMaquinas> => {
      const supabase = createSupabaseBrowserClient();
      if (maquinasInspecao.length === 0) return { criadas: 0, ignoradas: 0 };

      // ── Resolve nomes dos setores (inspecao_maquinas.id_setor → setores) ──
      const idsSetor = Array.from(
        new Set(maquinasInspecao.map((m) => m.id_setor).filter(Boolean))
      ) as string[];
      const setorNome = new Map<string, string>();
      if (idsSetor.length > 0) {
        const { data } = await supabase
          .from("setores")
          .select("id_setor, setor_ghe")
          .in("id_setor", idsSetor);
        (data as { id_setor: string; setor_ghe: string }[] | null)?.forEach((s) =>
          setorNome.set(s.id_setor, s.setor_ghe)
        );
      }

      // ── Dedupe contra o inventário atual das empresas envolvidas ──────────
      const idsEmpresa = Array.from(
        new Set(maquinasInspecao.map((m) => m.id_empresa).filter(Boolean))
      ) as string[];
      let invQ = supabase
        .from("inventario_maquinas")
        .select("id_maquina_inspecao, numero_serie, nome, setor, id_inspecao, id_empresa");
      if (idsEmpresa.length > 0) invQ = invQ.in("id_empresa", idsEmpresa);
      const { data: invData, error: invErr } = await invQ;
      if (invErr) throw invErr;
      const inventario = (invData ?? []) as {
        id_maquina_inspecao: string | null;
        numero_serie: string | null;
        nome: string;
        setor: string | null;
        id_inspecao: string | null;
        id_empresa: string | null;
      }[];

      const jaImportadas = new Set(
        inventario.map((r) => r.id_maquina_inspecao).filter(Boolean) as string[]
      );
      const chaveSerie = (emp: string | null, serie: string | null | undefined) =>
        serie?.trim() ? `${emp ?? ""}::${serie.trim().toLowerCase()}` : null;
      const chaveNome = (
        emp: string | null,
        nome: string,
        setor: string | null,
        insp: string | null
      ) => `${emp ?? ""}::${nome.trim().toLowerCase()}::${(setor ?? "").trim().toLowerCase()}::${insp ?? ""}`;

      const seriesExistentes = new Set(
        inventario
          .map((r) => chaveSerie(r.id_empresa, r.numero_serie))
          .filter(Boolean) as string[]
      );
      const nomesExistentes = new Set(
        inventario.map((r) =>
          chaveNome(r.id_empresa, r.nome, r.setor, r.id_inspecao)
        )
      );

      let criadas = 0;
      let ignoradas = 0;

      for (const m of maquinasInspecao) {
        const setor = m.id_setor ? setorNome.get(m.id_setor) ?? null : null;
        const kSerie = chaveSerie(m.id_empresa, m.numero_serie);
        const kNome = chaveNome(m.id_empresa, m.nome, setor, m.id_inspecao);
        if (
          jaImportadas.has(m.id_maquina_inspecao) ||
          (kSerie && seriesExistentes.has(kSerie)) ||
          nomesExistentes.has(kNome)
        ) {
          ignoradas++;
          continue;
        }

        const id_maquina = gerarId("MAQ");

        // Copia a 1ª foto no storage — best-effort, importação não falha por foto.
        let foto_url: string | null = null;
        let foto_storage_path: string | null = null;
        const srcPath = m.foto_storage_paths?.[0];
        if (srcPath) {
          const ext = (srcPath.split(".").pop() ?? "jpg").toLowerCase();
          const destPath = `inventario-maquinas/${id_maquina}.${ext}`;
          const { error: copyErr } = await supabase.storage
            .from("fotos")
            .copy(srcPath, destPath);
          if (!copyErr) {
            const { data: pub } = supabase.storage
              .from("fotos")
              .getPublicUrl(destPath);
            foto_url = pub.publicUrl;
            foto_storage_path = destPath;
          }
        }

        const row: Maquina = {
          id_maquina,
          id_empresa: m.id_empresa,
          id_inspecao: m.id_inspecao,
          id_maquina_inspecao: m.id_maquina_inspecao,
          nome: m.nome,
          tipo: m.tipo,
          categoria: null,
          codigo_interno: null,
          tag: m.tag,
          marca: m.marca,
          modelo: m.modelo,
          numero_serie: m.numero_serie,
          ano_fabricacao: m.ano_fabricacao,
          numero_patrimonio: null,
          status: "OPERANTE",
          unidade: null,
          setor,
          linha_processo: null,
          area: null,
          responsavel_setor: null,
          operacao_executada: null,
          localizacao: null,
          capacidade_operacional: null,
          producao_estimada: null,
          potencia: m.potencia,
          tensao: m.tensao,
          pressao: null,
          capacidade_carga: null,
          velocidade: null,
          dimensoes: null,
          finalidade: null,
          descricao_tecnica: null,
          protecao_fixa: m.protecao_fixa,
          descricao_protecao_fixa: null,
          protecao_movel: m.protecao_movel,
          descricao_protecao_movel: null,
          dispositivos_seguranca: null,
          intertravamento: m.intertravamento,
          botao_emergencia: m.botao_emergencia,
          sistema_bloqueio: m.sistema_bloqueio,
          possui_manual: m.possui_manual,
          possui_diagrama_eletrico: null,
          aterramento: m.aterramento,
          sinalizacao: m.sinalizacao,
          necessita_adequacao_nr12: m.necessita_adequacao_nr12,
          grau_risco: m.grau_risco,
          observacoes_tecnicas: null,
          observacoes: m.observacoes,
          foto_url,
          foto_storage_path,
          usuario_email: user?.email ?? null,
          usuario_nome: user?.nome ?? null,
          created_at: new Date().toISOString(),
          updated_at: null,
        };

        const { error } = await supabase
          .from("inventario_maquinas")
          .insert(row as never);
        if (error) throw error;

        // marca como existente pra dedupe dentro do próprio lote
        jaImportadas.add(m.id_maquina_inspecao);
        if (kSerie) seriesExistentes.add(kSerie);
        nomesExistentes.add(kNome);
        criadas++;
      }

      return { criadas, ignoradas };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventario-maquinas"] });
      qc.invalidateQueries({ queryKey: ["inspecao-maquinas-pendentes"] });
    },
    onError: (e: Error) => toast.error(`Erro ao importar: ${e.message}`),
  });
}
