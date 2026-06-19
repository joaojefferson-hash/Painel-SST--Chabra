/**
 * Template server-side do Laudo AET (NR-17) para geração via Puppeteer.
 * FRAME (passos 1-2): capa, identificação, sumário, capítulos editáveis,
 * considerações e assinatura — com numeração e quebra de página corretas.
 * Os blocos de setor (Agentes Ambientais / Análise Ergonômica / Psicossocial)
 * estão como PLACEHOLDER e serão portados nos passos 3-4.
 *
 * Restrições: sem "use client", sem hooks; apenas inline styles + um <style>.
 */

import React from "react";
import FolhaAssinaturas from "@/components/pdf/FolhaAssinaturas";
import type { Signatario } from "@/components/pdf/FolhaAssinaturas";
import { SecaoIdentificacaoEmpresa, SecaoSumario } from "@/components/pdf/SecoesComuns";
import { classeQuebraFixo, numerarCapitulos, numLabel } from "@/components/pdf/templates/shared";
import type { Empresa } from "@/lib/supabase/types";
import type { TextoPadraoCapitulo } from "@/lib/textos-padrao/types";
import { substituirVariaveis, substituirVariaveisTexto } from "@/lib/textos-padrao/variaveis";

export interface AetTemplateProps {
  relatorio: {
    setores: Array<{ id: string }>;
    consideracoes_finais: string | null;
  };
  empresa: Partial<Empresa> | null;
  capitulos: TextoPadraoCapitulo[];
  valoresVars: Record<string, string>;
  signatarios: Signatario[];
  folhaEmpresa: { razaoSocial: string; cnpj: string } | null;
  dataHoraAssinatura: string;
  identificadorDocumento: string;
}

const STYLE_BLOCK = `
* { box-sizing: border-box; }
.textos-padrao-capitulo { margin-bottom: 18pt; page-break-inside: auto; }
.textos-padrao-capitulo--nova-pagina { page-break-before: always; }
.textos-padrao-capitulo--continua    { page-break-before: auto; margin-top: 16pt; }
.textos-padrao-capitulo--capa {
  position: relative; margin: -3cm -2cm -2cm -3cm; padding: 0;
  height: 297mm; width: 210mm; overflow: hidden;
}
.textos-padrao-capitulo-bg-img {
  position: absolute; inset: 0; width: 100%; height: 100%;
  object-fit: cover; object-position: center; z-index: 0;
}
.textos-padrao-capitulo--capa .textos-padrao-capitulo-titulo { display: none; }
.textos-padrao-capitulo--capa .textos-padrao-caixa-texto { position: absolute; z-index: 1; }
.textos-padrao-capitulo-titulo {
  font-size: 14pt; font-weight: 700; color: #1e4d28;
  border-bottom: 2px solid #006B54; padding-bottom: 4px; margin-bottom: 12pt;
}
.textos-padrao-capitulo-conteudo { font-size: 12pt; color: #1f2937; line-height: 1.5; text-align: justify; }
.textos-padrao-capitulo-conteudo p { margin: 0 0 12pt; text-indent: 1.25cm; text-align: justify; }
.textos-padrao-capitulo-conteudo h1 { font-size: 14pt; font-weight: 700; color: #1e4d28; margin: 18pt 0 6pt; }
.textos-padrao-capitulo-conteudo h2 { font-size: 13pt; font-weight: 700; color: #1e4d28; margin: 14pt 0 6pt; }
.textos-padrao-capitulo-conteudo h3 { font-size: 12pt; font-weight: 700; color: #1e4d28; margin: 12pt 0 4pt; }
.textos-padrao-capitulo-conteudo ul, .textos-padrao-capitulo-conteudo ol { margin: 0 0 12pt 1.25cm; padding: 0; }
.textos-padrao-capitulo-conteudo li { margin: 2pt 0; }
.textos-padrao-capitulo-conteudo img { max-width: 100%; height: auto; border-radius: 4px; margin: 8pt 0; }
.textos-padrao-capitulo-conteudo table { border-collapse: collapse; width: 100%; margin: 12pt 0; font-size: 10pt; }
.textos-padrao-capitulo-conteudo th, .textos-padrao-capitulo-conteudo td { border: 1px solid #999; padding: 5px 7px; vertical-align: top; }
.textos-padrao-capitulo-conteudo th { background: #d4edda; color: #1e4d28; font-weight: 700; text-align: left; }
/* Seções AET */
.aet-sec-titulo { font-size: 14pt; font-weight: 700; color: #1e4d28; border-bottom: 2px solid #006B54; padding-bottom: 4px; margin: 0 0 12pt; }
.aet-fixo { page-break-before: always; }
.aet-fixo--continua { page-break-before: auto; }
.aet-conc p { font-size: 12pt; line-height: 1.6; text-align: justify; color: #1f2937; margin: 0 0 12pt; white-space: pre-line; }
/* Blocos de setor (placeholder; porte real nos passos 3-4) */
.aet-setor-bloco { page-break-before: always; }
.aet-setor-bloco:first-of-type { page-break-before: auto; }
.aet-placeholder { border: 1px dashed #cbd5e1; background: #f8fafc; color: #64748b; padding: 16px; border-radius: 8px; font-size: 11px; }
`;

function SectionTitulo({ titulo }: { titulo: string }) {
  return <h2 className="aet-sec-titulo">{titulo}</h2>;
}

export default function AetTemplate({
  relatorio: rel,
  empresa,
  capitulos,
  valoresVars,
  signatarios,
  folhaEmpresa,
  dataHoraAssinatura,
  identificadorDocumento,
}: AetTemplateProps) {
  const temSetores = (rel.setores?.length ?? 0) > 0;
  const consideracoes = (rel.consideracoes_finais ?? "").trim();

  const blocosOrdenados = [...capitulos]
    .filter((c) => c.ativo !== false)
    .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));

  const tituloPorSlug: Record<string, string> = {};
  for (const c of capitulos) if (c.slug_fixo) tituloPorSlug[c.slug_fixo] = c.titulo;

  function renderizaNumerado(c: TextoPadraoCapitulo): boolean {
    if (c.ativo === false) return false;
    const ehCapa = !!c.bg_imagem_url || (c.titulo ?? "").trim().toLowerCase() === "capa";
    if (ehCapa) return false;
    if (c.tipo !== "fixo") return true;
    switch (c.slug_fixo) {
      case "identificacao_empresa": return true;
      case "aet_agentes_ambientais": return temSetores;
      case "aet_analise_ergonomica": return temSetores;
      case "aet_psicossocial": return true; // frame: placeholder; passo 4: fatoresPsi.length>0
      case "aet_consideracoes_finais": return !!consideracoes;
      case "aet_assinatura": return true;
      default: return false; // sumario
    }
  }

  const { numPorSlug, numPorId } = numerarCapitulos(capitulos, renderizaNumerado);

  const sumarioTitulos = blocosOrdenados
    .filter((c) => renderizaNumerado(c))
    .map((c) => (c.tipo === "fixo" ? c.titulo : substituirVariaveisTexto(c.titulo, valoresVars)))
    .filter((t) => t && t.trim());

  function renderEditavel(c: TextoPadraoCapitulo) {
    const ehCapa = !!c.bg_imagem_url;
    const orientacao = c.orientacao ?? "retrato";
    const novaPagina = ehCapa || (c.quebra_pagina ?? "nova") === "nova";
    const conteudo = substituirVariaveis(c.conteudo, valoresVars);
    const titulo = numLabel(numPorId[c.id_capitulo], substituirVariaveisTexto(c.titulo, valoresVars));
    const classes = [
      "textos-padrao-capitulo",
      orientacao === "paisagem" ? "textos-padrao-capitulo--paisagem" : "textos-padrao-capitulo--retrato",
      novaPagina ? "textos-padrao-capitulo--nova-pagina" : "textos-padrao-capitulo--continua",
      ehCapa ? "textos-padrao-capitulo--capa" : "",
    ].filter(Boolean).join(" ");
    return (
      <article key={c.id_capitulo} className={classes}>
        {ehCapa && c.bg_imagem_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={c.bg_imagem_url} alt="" className="textos-padrao-capitulo-bg-img" />
        )}
        {!ehCapa && <h2 className="textos-padrao-capitulo-titulo">{titulo}</h2>}
        {ehCapa && c.caixas_texto && c.caixas_texto.length > 0 ? (
          c.caixas_texto.map((cx) => (
            <div
              key={cx.id}
              className="textos-padrao-caixa-texto"
              style={{
                left: `${cx.x}%`,
                top: `${cx.y}%`,
                width: `${cx.w ?? 40}%`,
                fontSize: cx.fontSize ?? 16,
                fontWeight: cx.bold ? 700 : 400,
                color: cx.color ?? "#ffffff",
                textAlign: (cx.align ?? "left") as React.CSSProperties["textAlign"],
                whiteSpace: "pre-wrap",
                lineHeight: 1.3,
              }}
            >
              {substituirVariaveisTexto(cx.conteudo, valoresVars)}
            </div>
          ))
        ) : !ehCapa ? (
          <div className="textos-padrao-capitulo-conteudo" dangerouslySetInnerHTML={{ __html: conteudo }} />
        ) : null}
      </article>
    );
  }

  // Placeholder dos blocos de setor (porte real nos passos 3-4).
  function placeholderSetor(slug: string, rotulo: string, intro: string | null) {
    return (
      <>
        <SectionTitulo titulo={numLabel(numPorSlug[slug], tituloPorSlug[slug] ?? rotulo)} />
        {intro && (
          <p style={{ marginBottom: 12, fontSize: 11, color: "#374151", borderLeft: "2px solid #cbd5e1", paddingLeft: 12 }}>
            {intro}
          </p>
        )}
        <div className="aet-placeholder">
          [Conteúdo por setor — em construção (passos 3-4): tabela de riscos, OWAS, checklist e 13 fatores.]
        </div>
      </>
    );
  }

  const temAssinaturaFixo = capitulos.some(
    (c) => c.tipo === "fixo" && c.slug_fixo === "aet_assinatura" && c.ativo !== false,
  );

  const folhaNode = (
    <FolhaAssinaturas
      signatarios={signatarios}
      empresa={folhaEmpresa}
      dataHoraAssinatura={dataHoraAssinatura}
      identificadorDocumento={identificadorDocumento}
      quebraAntes={false}
      numero={numPorSlug["aet_assinatura"]}
    />
  );

  function renderBloco(c: TextoPadraoCapitulo) {
    if (c.tipo !== "fixo") return renderEditavel(c);

    const intro = c.conteudo ? substituirVariaveisTexto(c.conteudo, valoresVars) : null;
    let conteudoFixo: React.ReactNode = null;
    switch (c.slug_fixo) {
      case "identificacao_empresa":
        conteudoFixo = <SecaoIdentificacaoEmpresa empresa={empresa} numero={numPorSlug["identificacao_empresa"]} />;
        break;
      case "sumario":
        conteudoFixo = <SecaoSumario titulos={sumarioTitulos} />;
        break;
      case "aet_agentes_ambientais":
        conteudoFixo = temSetores ? placeholderSetor("aet_agentes_ambientais", "Agentes Ambientais para as Áreas Operacionais", intro) : null;
        break;
      case "aet_analise_ergonomica":
        conteudoFixo = temSetores ? placeholderSetor("aet_analise_ergonomica", "Análises Ergonômicas do Trabalho", intro) : null;
        break;
      case "aet_psicossocial":
        conteudoFixo = placeholderSetor("aet_psicossocial", "Fatores Psicossociais", intro);
        break;
      case "aet_consideracoes_finais":
        conteudoFixo = consideracoes ? (
          <div className="aet-conc">
            <SectionTitulo titulo={numLabel(numPorSlug["aet_consideracoes_finais"], tituloPorSlug["aet_consideracoes_finais"] ?? "Considerações Finais")} />
            <p>{consideracoes}</p>
          </div>
        ) : null;
        break;
      case "aet_assinatura":
        conteudoFixo = folhaNode;
        break;
      default:
        conteudoFixo = null;
    }
    return conteudoFixo ? (
      <div key={c.id_capitulo} className={classeQuebraFixo(c)} data-slug={c.slug_fixo ?? undefined}>
        {conteudoFixo}
      </div>
    ) : null;
  }

  return (
    <>
      {/* eslint-disable-next-line react/no-danger */}
      <style dangerouslySetInnerHTML={{ __html: STYLE_BLOCK }} />
      {blocosOrdenados.map((c) => renderBloco(c))}
      {!temAssinaturaFixo && (
        <FolhaAssinaturas
          signatarios={signatarios}
          empresa={folhaEmpresa}
          dataHoraAssinatura={dataHoraAssinatura}
          identificadorDocumento={identificadorDocumento}
        />
      )}
    </>
  );
}
