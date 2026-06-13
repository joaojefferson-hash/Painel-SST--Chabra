// Anexos genéricos por (modulo, id_referencia) — Fase 3 expansão SGG.
// Tabela public.anexos; bucket de storage público 'anexos'.

export type ModuloAnexo =
  | "conformidade"
  | "nao_conformidade"
  | "analise_quimicos"
  | "apreciacao_maquinas"
  | "aep"
  | "psicossocial";

export type TipoAnexo = "pdf" | "imagem" | "arquivo";

export interface Anexo {
  id_anexo: string;
  modulo: ModuloAnexo;
  id_referencia: string;
  nome: string;
  descricao: string | null;
  storage_path: string;
  url: string;
  mime: string | null;
  tamanho_bytes: number | null;
  tipo: TipoAnexo;
  ordem: number;
  incluir_no_pdf: boolean;
  criado_por: string | null;
  created_at: string;
}

/** Classifica o anexo a partir do MIME (define como entra no PDF). */
export function classificarAnexo(mime: string | null | undefined): TipoAnexo {
  if (!mime) return "arquivo";
  if (mime === "application/pdf") return "pdf";
  if (mime.startsWith("image/")) return "imagem";
  return "arquivo";
}
