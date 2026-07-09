// Tipos do módulo Gestão de EPI (Fase 1: cadastro + estoque).

export interface EpiColaborador {
  id: string;
  empresa_id: string;
  nome: string;
  cpf: string | null;
  matricula: string | null;
  cargo: string | null;
  setor: string | null;
  ativo: boolean;
  criado_por: string | null;
  criado_em: string;
  updated_at: string | null;
}

export type EpiTipo = "EPI" | "EPC";

export interface EpiCatalogoItem {
  id: string;
  empresa_id: string;
  nome: string;
  tipo: EpiTipo;
  ca_numero: string | null;
  ca_validade: string | null;
  fabricante: string | null;
  descricao: string | null;
  unidade: string | null;
  estoque_minimo: number;
  foto_url: string | null;
  foto_path: string | null;
  ativo: boolean;
  criado_por: string | null;
  criado_em: string;
  updated_at: string | null;
}

export type EpiMovTipo = "entrada" | "saida" | "ajuste";

export interface EpiMovimentacao {
  id: string;
  empresa_id: string;
  id_catalogo: string;
  tipo: EpiMovTipo;
  quantidade: number;
  origem: string | null;
  ref_id: string | null;
  motivo: string | null;
  responsavel: string | null;
  criado_por: string | null;
  criado_em: string;
}

export interface EpiSaldo {
  empresa_id: string;
  id_catalogo: string;
  saldo: number;
}

export interface EpiImportacaoNfe {
  id: string;
  empresa_id: string;
  chnfe: string;
  fornecedor_cnpj: string | null;
  fornecedor_nome: string | null;
  numero_nf: string | null;
  data_emissao: string | null;
  xml_nome: string | null;
  total_itens: number;
  itens_lancados: number;
  status: string;
  criado_por: string | null;
  criado_em: string;
}

/** Item da NF-e já com a decisão de mapeamento (enviado à RPC epi_importar_nfe). */
export interface EpiNfeItemMap {
  cprod: string;
  xprod: string;
  ncm: string;
  unidade: string;
  quantidade: number;
  valor_unitario: number;
  status_map: "novo" | "vinculado" | "ignorado";
  id_catalogo?: string | null;
  nome_novo?: string;
}

export interface EpiEntrega {
  id: string;
  empresa_id: string;
  id_colaborador: string;
  data_entrega: string;
  responsavel_entrega: string | null;
  observacao: string | null;
  total_itens: number;
  status: string;
  assinatura_recebedor: string | null;
  criado_por: string | null;
  criado_em: string;
  colaborador?: { nome: string } | null;
  assinaturas?: { id: string }[] | null;
}

export interface EpiEntregaItem {
  id: string;
  id_entrega: string;
  empresa_id: string;
  id_catalogo: string | null;
  nome_epi: string | null;
  ca_numero: string | null;
  quantidade: number;
  criado_em: string;
}

/** Linha de item ao registrar uma entrega (enviada à RPC epi_registrar_entrega). */
export interface EpiEntregaItemInput {
  id_catalogo: string;
  nome_epi?: string;
  ca_numero?: string;
  quantidade: number;
}
