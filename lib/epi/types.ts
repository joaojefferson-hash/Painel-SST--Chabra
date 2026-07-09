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
