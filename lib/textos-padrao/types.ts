import type { CaixaTexto } from "@/lib/drps/types";

export type ModuloTextoPadrao =
  | "sst"
  | "conformidade"
  | "nao_conformidade"
  | "analise_quimicos"
  | "apreciacao_maquinas"
  | "aep"
  | "aet"
  | "psicossocial";

export type OrientacaoPagina = "retrato" | "paisagem";

/** Quebra de página antes do capítulo. 'continua' = segue na mesma página do anterior. */
export type QuebraPagina = "nova" | "continua";

/** Posição lógica do capítulo no PDF final do relatório (V53). */
export type PosicaoPdf =
  | "inicio"
  | "apos_sumario"
  | "apos_setores"
  | "apos_conclusao"
  | "apos_medidas"
  | "fim";

export const POSICAO_PDF_LABELS: Record<PosicaoPdf, string> = {
  inicio: "Início — antes do sumário (capa, dedicatória)",
  apos_sumario: "Após o sumário (introdução, metodologia)",
  apos_setores: "Após a análise por setor (antes da conclusão geral)",
  apos_conclusao: "Após a conclusão geral (antes do plano)",
  apos_medidas: "Após medidas/monitoramento/revisão",
  fim: "Fim do PDF (considerações finais)",
};

export const POSICAO_PDF_ORDEM: PosicaoPdf[] = [
  "inicio",
  "apos_sumario",
  "apos_setores",
  "apos_conclusao",
  "apos_medidas",
  "fim",
];

export interface TextoPadraoCapitulo {
  id_capitulo: string;
  modulo: ModuloTextoPadrao;
  ordem: number;
  titulo: string;
  conteudo: string | null;
  /** URL pública da imagem de fundo. Quando setada, vira página inteira no PDF. */
  bg_imagem_url: string | null;
  /** Caixas posicionadas sobre a bg (só usadas quando há bg). */
  caixas_texto: CaixaTexto[] | null;
  /** Orientação da página deste capítulo no PDF. */
  orientacao: OrientacaoPagina;
  /** Inicia nova página ou continua na anterior. Ignorado se for capa. */
  quebra_pagina: QuebraPagina;
  /** V53: posição do capítulo no PDF do relatório. */
  posicao_pdf: PosicaoPdf;
  ativo: boolean;
  tipo: "fixo" | "editavel";
  slug_fixo: string | null;
  created_at: string;
  updated_at: string | null;
}

/** Capítulo gerado automaticamente pelo sistema (não editável pelo usuário). */
export interface FixoCapitulo {
  titulo: string;
  slug_fixo: string;
  descricao: string;
  ordem_base: number;
}

export interface ModuloConfig {
  modulo: ModuloTextoPadrao;
  titulo: string;
  descricao: string;
  destino: string;
  fixos: FixoCapitulo[];
  /** Posições efetivamente renderizadas no laudo deste módulo.
   *  O PosicaoPdfStepper mostra só essas — evita o usuário mover
   *  um capítulo para uma posição que nunca aparece no PDF. */
  posicoesDisponiveis: PosicaoPdf[];
}

export const MODULO_CONFIGS: Record<ModuloTextoPadrao, ModuloConfig> = {
  sst: {
    modulo: "sst",
    titulo: "Texto Padrão — Painel SST",
    descricao:
      "Capítulos reutilizáveis para os relatórios de Inspeção e PGR. Use as variáveis abaixo pra preencher empresa, CNPJ, datas etc. na hora da geração do PDF.",
    destino: "Aparecem nos relatórios de inspeção, ficha NR-01 e PGR.",
    posicoesDisponiveis: ["inicio", "fim"],
    fixos: [
      { titulo: "Itens Inspecionados",               slug_fixo: "sst_itens",             descricao: "Checklist de todos os itens avaliados na inspeção — gerado automaticamente.", ordem_base: 2000 },
      { titulo: "Não Conformidades Identificadas",   slug_fixo: "sst_nao_conformidades", descricao: "Lista de não conformidades com nível de risco — gerada automaticamente.", ordem_base: 3000 },
      { titulo: "Plano de Ação Corretiva",           slug_fixo: "sst_plano_acao",        descricao: "Plano de ação com prazos e responsáveis — gerado automaticamente.", ordem_base: 4000 },
      { titulo: "Avaliação de Riscos",               slug_fixo: "sst_riscos",            descricao: "Tabela de avaliação de riscos identificados — gerada automaticamente.", ordem_base: 4500 },
      { titulo: "Assinatura do Responsável Técnico", slug_fixo: "sst_assinatura",        descricao: "Rodapé de assinatura — gerado automaticamente.", ordem_base: 9000 },
    ],
  },
  conformidade: {
    modulo: "conformidade",
    titulo: "Texto Padrão — Conformidade NR",
    descricao:
      "Capítulos reutilizáveis para os Relatórios de Conformidade NR. Inclua introdução, fundamentação legal, considerações finais — com variáveis dinâmicas.",
    destino: "Aparecem nos Relatórios de Conformidade (NR-24, NR-17 etc).",
    posicoesDisponiveis: ["inicio", "fim"],
    fixos: [
      { titulo: "Itens de Conformidade Avaliados",   slug_fixo: "conformidade_itens",      descricao: "Tabela de itens por NR avaliados — gerada automaticamente.", ordem_base: 2000 },
      { titulo: "Resultado Geral de Conformidade",   slug_fixo: "conformidade_resultado",  descricao: "Percentual de conformidade por NR — gerado automaticamente.", ordem_base: 3000 },
      { titulo: "Assinatura do Responsável Técnico", slug_fixo: "conformidade_assinatura", descricao: "Rodapé de assinatura — gerado automaticamente.", ordem_base: 9000 },
    ],
  },
  nao_conformidade: {
    modulo: "nao_conformidade",
    titulo: "Texto Padrão — Não Conformidade",
    descricao:
      "Capítulos reutilizáveis para os Relatórios de Não Conformidade (RNC). Inclua introdução, base metodológica e considerações sobre o plano de ação.",
    destino: "Aparecem nos Relatórios de Não Conformidade.",
    posicoesDisponiveis: ["inicio", "fim"],
    fixos: [
      { titulo: "Descrição da Não Conformidade",     slug_fixo: "nc_descricao",  descricao: "Dados da NC: título, data, setor e evidências — gerados automaticamente.", ordem_base: 2000 },
      { titulo: "Plano de Ação Corretiva",           slug_fixo: "nc_plano",      descricao: "Ações corretivas com responsáveis e prazos — geradas automaticamente.", ordem_base: 3000 },
      { titulo: "Assinatura do Responsável",         slug_fixo: "nc_assinatura", descricao: "Rodapé de assinatura — gerado automaticamente.", ordem_base: 9000 },
    ],
  },
  analise_quimicos: {
    modulo: "analise_quimicos",
    titulo: "Texto Padrão — Análise de Químicos",
    descricao:
      "Capítulos reutilizáveis para as análises de produtos químicos. Pode incluir disclaimers, metodologia, normas aplicáveis.",
    destino: "Aparecem no relatório de Análise de Químicos.",
    posicoesDisponiveis: ["inicio", "fim"],
    fixos: [
      { titulo: "Inventário de Substâncias Químicas",  slug_fixo: "quimicos_inventario", descricao: "Inventário com CAS, quantidade e armazenamento — gerado automaticamente.", ordem_base: 2000 },
      { titulo: "Fichas de Dados de Segurança (FDS)",  slug_fixo: "quimicos_fds",        descricao: "Resumo de riscos por produto — gerado automaticamente.", ordem_base: 3000 },
      { titulo: "Classificação de Risco e EPC/EPI",    slug_fixo: "quimicos_risco",      descricao: "Nível de risco e medidas de controle — gerado automaticamente.", ordem_base: 4000 },
      { titulo: "Assinatura do Responsável Técnico",   slug_fixo: "quimicos_assinatura", descricao: "Rodapé de assinatura — gerado automaticamente.", ordem_base: 9000 },
    ],
  },
  apreciacao_maquinas: {
    modulo: "apreciacao_maquinas",
    titulo: "Texto Padrão — Apreciação de Máquinas (NR-12)",
    descricao:
      "Capítulos reutilizáveis para os laudos de Apreciação NR-12: introdução, fundamentação legal (ISOs 12100/13849), metodologia, considerações finais.",
    destino: "Aparecem no PDF do laudo da Apreciação NR-12, após a conclusão técnica.",
    posicoesDisponiveis: ["inicio", "fim"],
    fixos: [
      { titulo: "Identificação da Máquina/Equipamento",  slug_fixo: "apreciacao_identificacao", descricao: "Dados de identificação: fabricante, modelo, ano, função — gerados automaticamente.", ordem_base: 2000 },
      { titulo: "Checklist NR-12",                       slug_fixo: "apreciacao_checklist",     descricao: "Resultado do checklist NR-12 por item e zona — gerado automaticamente.", ordem_base: 2500 },
      { titulo: "Apreciação de Risco (ISO 12100)",       slug_fixo: "apreciacao_risco",         descricao: "Análise de risco residual por zona/hazard — gerada automaticamente.", ordem_base: 3000 },
      { titulo: "Plano de Ação NR-12",                   slug_fixo: "apreciacao_plano",         descricao: "Ações de adequação com prioridade e prazo — gerado automaticamente.", ordem_base: 4000 },
      { titulo: "Assinatura do Responsável Técnico",     slug_fixo: "apreciacao_assinatura",    descricao: "Rodapé de assinatura — gerado automaticamente.", ordem_base: 9000 },
    ],
  },
  aep: {
    modulo: "aep",
    titulo: "Texto Padrão — AEP (Análise Ergonômica Preliminar)",
    descricao:
      "Capítulos editáveis para os Laudos AEP: capa, introdução, metodologia, considerações finais. Use variáveis dinâmicas para empresa, responsável técnico, data etc.",
    destino: "Aparecem no Laudo AEP antes (posição 'início') e após (posição 'fim') a análise por setor.",
    posicoesDisponiveis: ["inicio", "fim"],
    fixos: [],
  },
  aet: {
    modulo: "aet",
    titulo: "Texto Padrão — AET (Análise Ergonômica do Trabalho)",
    descricao:
      "Capítulos editáveis para os Laudos AET: capa, introdução, metodologia, considerações finais. Use variáveis dinâmicas para empresa, responsável técnico, data etc.",
    destino: "Aparecem no Laudo AET antes e após as seções analíticas.",
    posicoesDisponiveis: ["inicio", "fim"],
    fixos: [],
  },
  psicossocial: {
    modulo: "psicossocial",
    titulo: "Texto Padrão — DRPS (Psicossocial)",
    descricao:
      "Capítulos editáveis para os Relatórios DRPS. Suporta todas as 6 posições no PDF: início, após sumário, após setores, após conclusão, após medidas e fim.",
    destino: "Aparecem no Relatório DRPS na posição configurada em cada capítulo.",
    posicoesDisponiveis: ["inicio", "apos_sumario", "apos_setores", "apos_conclusao", "apos_medidas", "fim"],
    fixos: [],
  },
};
