"use client";

import React from "react";
import { useTextosPadrao } from "@/lib/hooks/useTextosPadrao";
import TextosPadraoPrint from "@/components/textos-padrao/TextosPadraoPrint";
import {
  substituirVariaveis,
  substituirVariaveisTexto,
} from "@/lib/textos-padrao/variaveis";
import type { ModuloTextoPadrao } from "@/lib/textos-padrao/types";

/**
 * Renderiza o corpo do laudo como uma LISTA ÚNICA de blocos na ordem definida
 * em Texto Padrão (`textos_padrao(modulo)`, campo `ordem`). Cada bloco é:
 *  - um capítulo EDITÁVEL → título + conteúdo (visível na tela e no print);
 *  - uma seção do SISTEMA (capítulo `fixo`) → o JSX passado em `secoes[slug]`.
 *
 * Capítulos com imagem de fundo (capa) caem no `TextosPadraoPrint` (que trata
 * a página inteira). É o mesmo modelo do AEP/AET, reaproveitável pelos demais
 * módulos cujo PDF é gerado a partir do DOM da página.
 */
export default function LaudoBlocos({
  modulo,
  valores,
  secoes,
}: {
  modulo: ModuloTextoPadrao;
  valores: Record<string, string>;
  /** Mapa slug_fixo → conteúdo da seção do sistema. */
  secoes: Record<string, React.ReactNode>;
}) {
  const { data: capitulos = [] } = useTextosPadrao(modulo);
  const blocos = [...capitulos]
    .filter((c) => c.ativo !== false)
    .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));

  if (blocos.length === 0) return null;

  return (
    <>
      {blocos.map((c) => {
        if (c.tipo === "fixo") {
          const secao = secoes[c.slug_fixo ?? ""];
          return secao ? (
            <React.Fragment key={c.id_capitulo}>{secao}</React.Fragment>
          ) : null;
        }
        // Capa (imagem de fundo) → usa o componente de print dedicado
        if (c.bg_imagem_url) {
          return (
            <TextosPadraoPrint
              key={c.id_capitulo}
              modulo={modulo}
              capituloId={c.id_capitulo}
              valores={valores}
            />
          );
        }
        // Texto editável — visível na tela e no print
        return (
          <div key={c.id_capitulo} className="mb-6 break-inside-avoid">
            <h2 className="mb-2 border-b-2 border-emerald-700 pb-1 text-sm font-bold text-emerald-900">
              {substituirVariaveisTexto(c.titulo, valores)}
            </h2>
            <div
              className="prose prose-sm max-w-none text-xs leading-relaxed text-gray-700 [&_p]:mb-2 [&_table]:w-full [&_td]:border [&_td]:border-gray-300 [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:border-gray-300 [&_th]:bg-gray-50 [&_th]:px-2 [&_th]:py-1"
              dangerouslySetInnerHTML={{ __html: substituirVariaveis(c.conteudo, valores) }}
            />
          </div>
        );
      })}
    </>
  );
}
