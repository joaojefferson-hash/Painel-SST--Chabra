// Classificação das 3 abas do Inventário (Equipamentos · Máquinas · Medições).
//
// DECISÃO: a categoria é DERIVADA dos dados que já existem — não há coluna
// dedicada no banco e nada no fluxo de cadastro muda. Um item é classificado a
// partir do texto livre já gravado em `categoria`, `tipo` ou `nome`.
//
// ⚠️ ÚNICO PONTO A AJUSTAR: se a regra real for outra (ex.: um valor específico
// em `categoria`, ou distinguir por `id_empresa`), altere SOMENTE as expressões
// abaixo ou o corpo de `categoriaInventario`. Nenhuma outra parte do app depende
// disto — a lista importa esta função e pronto.

import type { Maquina } from "@/lib/supabase/types";

export type AbaInventario = "equipamentos" | "maquinas" | "medicoes";

/** Ordem e rótulos das abas (mesma ordem pedida: Equipamentos, Máquinas, Medições). */
export const ABAS_INVENTARIO: { id: AbaInventario; label: string }[] = [
  { id: "equipamentos", label: "Equipamentos" },
  { id: "maquinas", label: "Máquinas" },
  { id: "medicoes", label: "Medições" },
];

/** Aba mostrada ao abrir o inventário (a que concentra os itens por padrão). */
export const ABA_INVENTARIO_PADRAO: AbaInventario = "maquinas";

// Palavras-chave provisórias (case-insensitive, sem acento sensível). Medições
// é checada primeiro por ser a mais específica; Equipamentos em seguida; o
// restante cai em Máquinas (o módulo é centrado em máquinas NR-12).
const RX_MEDICAO =
  /medi[çc][aã]o|medi[çc][oõ]es|medidor|calibra|lux[íi]metro|decibel|dos[íi]metro|term[oô]metro|anem[oô]metro|balan[çc]a/i;
const RX_EQUIPAMENTO =
  /equipamento|ferramenta|mobili|comput|notebook|impressora|ve[íi]culo|el[eé]trico portat/i;

/** Categoria derivada de um item do inventário. Sempre retorna exatamente uma aba. */
export function categoriaInventario(
  m: Pick<Maquina, "categoria" | "tipo" | "nome">,
): AbaInventario {
  const txt = [m.categoria, m.tipo, m.nome].filter(Boolean).join(" ");
  if (RX_MEDICAO.test(txt)) return "medicoes";
  if (RX_EQUIPAMENTO.test(txt)) return "equipamentos";
  return "maquinas";
}
