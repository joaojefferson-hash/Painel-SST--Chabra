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

interface AetRiscoLike {
  id: string;
  tipo?: string | null;
  risco?: string | null;
  intensidade_concentracao?: string | null;
  tecnica_metodologia?: string | null;
  epi_ca?: string | null;
  epi_eficaz?: string | null;
  classificacao_risco?: string | null;
}
interface AetCargoLike { nome?: string | null; descricao?: string | null }
export interface AetSetorLike {
  id: string;
  nome_setor?: string | null;
  maquinas_equipamentos?: string | null;
  descricao_atividade?: string | null;
  cargos?: AetCargoLike[];
  riscos?: AetRiscoLike[];
}

const CLASS_COLOR_HEX: Record<string, { bg: string; cor: string }> = {
  "Trivial": { bg: "#dcfce7", cor: "#166534" },
  "De Atenção": { bg: "#fef9c3", cor: "#854d0e" },
  "Moderado": { bg: "#ffedd5", cor: "#9a3412" },
  "Alto": { bg: "#fee2e2", cor: "#991b1b" },
  "Crítico": { bg: "#fecaca", cor: "#7f1d1d" },
};

export interface AetTemplateProps {
  relatorio: {
    setores: AetSetorLike[];
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
/* Capa no estilo DRPS (img 100%, sem full-bleed → não corta caixas na borda) */
.tp-capa { position: relative; width: 100%; margin-bottom: 16pt; page-break-after: always; }
.tp-capa img.bg { width: 100%; height: auto; display: block; }
.tp-capa .caixa { position: absolute; white-space: pre-wrap; line-height: 1.3; }
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
/* Blocos de setor */
.aet-setor-bloco { border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden; margin-bottom: 14pt; page-break-inside: auto; }
.aet-setor-head { background: #374151; padding: 7px 12px; }
.aet-setor-head .t { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; color: #fff; margin: 0; }
.aet-setor-head .s { font-size: 10px; color: #d1d5db; margin: 2px 0 0; }
.aet-setor-tab { width: 100%; border-collapse: collapse; font-size: 11px; }
.aet-setor-tab td, .aet-setor-tab th { border: 1px solid #e5e7eb; padding: 4px 8px; vertical-align: top; color: #374151; }
.aet-setor-info td.k { width: 160px; background: #f9fafb; font-weight: 600; color: #4b5563; }
.aet-riscos th { background: #f3f4f6; font-size: 10px; font-weight: 700; text-transform: uppercase; color: #4b5563; text-align: left; }
.aet-riscos tr:nth-child(even) { background: #f9fafb; }
.aet-placeholder { border: 1px dashed #cbd5e1; background: #f8fafc; color: #64748b; padding: 16px; border-radius: 8px; font-size: 11px; }
`;

function SectionTitulo({ titulo }: { titulo: string }) {
  return <h2 className="aet-sec-titulo">{titulo}</h2>;
}

/** Tabela de riscos por setor (portado do laudo, com estilo inline/CSS). */
function SetorRiscosBlock({ setor, idx }: { setor: AetSetorLike; idx: number }) {
  const cargos = setor.cargos ?? [];
  const riscos = setor.riscos ?? [];
  const COLS = ["Tipo", "Agente / Risco", "Intensidade / Conc.", "Técnica / Metodologia", "EPI (CA)", "EPI Eficaz", "Classificação"];
  return (
    <div className="aet-setor-bloco">
      <div className="aet-setor-head">
        <p className="t">Setor {idx + 1}: {setor.nome_setor || "—"}</p>
        {cargos.length > 0 && (
          <p className="s">{cargos.map((c) => c.nome).filter(Boolean).join(" · ")}</p>
        )}
      </div>
      <table className="aet-setor-tab aet-setor-info">
        <tbody>
          {setor.maquinas_equipamentos && (
            <tr><td className="k">Máquinas e Equipamentos</td><td>{setor.maquinas_equipamentos.split("\n").filter(Boolean).join(" · ")}</td></tr>
          )}
          {setor.descricao_atividade && (
            <tr><td className="k">Descrição da Atividade</td><td>{setor.descricao_atividade}</td></tr>
          )}
          {cargos.filter((c) => c.descricao).map((cargo, i) => (
            <tr key={i}><td className="k">{cargo.nome}</td><td>{cargo.descricao}</td></tr>
          ))}
        </tbody>
      </table>
      {riscos.length > 0 ? (
        <table className="aet-setor-tab aet-riscos">
          <thead><tr>{COLS.map((h) => <th key={h}>{h}</th>)}</tr></thead>
          <tbody>
            {riscos.map((r) => {
              const cls = CLASS_COLOR_HEX[r.classificacao_risco ?? ""] ?? { bg: "#f3f4f6", cor: "#374151" };
              return (
                <tr key={r.id}>
                  <td>{r.tipo}</td>
                  <td>{r.risco}</td>
                  <td>{r.intensidade_concentracao}</td>
                  <td>{r.tecnica_metodologia}</td>
                  <td>{r.epi_ca}</td>
                  <td>{r.epi_eficaz}</td>
                  <td className="aet-class" style={{ background: cls.bg, color: cls.cor }}>{r.classificacao_risco}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <p style={{ padding: "8px 12px", fontSize: 11, fontStyle: "italic", color: "#9ca3af", margin: 0 }}>
          Nenhum agente / risco identificado neste setor.
        </p>
      )}
    </div>
  );
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
    const ehCapa = !!c.bg_imagem_url || (c.titulo ?? "").trim().toLowerCase() === "capa";

    // Capa: estilo DRPS (img 100% + caixas posicionadas), evita o corte da borda.
    if (ehCapa) {
      return (
        <div key={c.id_capitulo} className="tp-capa">
          {c.bg_imagem_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="bg" src={c.bg_imagem_url} alt="" />
          )}
          {(c.caixas_texto ?? []).map((cx) => (
            <div
              key={cx.id}
              className="caixa"
              style={{
                left: `${cx.x}%`,
                top: `${cx.y}%`,
                width: `${cx.w ?? 40}%`,
                fontSize: cx.fontSize ?? 16,
                fontWeight: cx.bold ? 700 : 400,
                color: cx.color ?? "#ffffff",
                textAlign: (cx.align ?? "left") as React.CSSProperties["textAlign"],
              }}
            >
              {substituirVariaveisTexto(cx.conteudo, valoresVars)}
            </div>
          ))}
        </div>
      );
    }

    const orientacao = c.orientacao ?? "retrato";
    const novaPagina = (c.quebra_pagina ?? "nova") === "nova";
    const conteudo = substituirVariaveis(c.conteudo, valoresVars);
    const titulo = numLabel(numPorId[c.id_capitulo], substituirVariaveisTexto(c.titulo, valoresVars));
    const classes = [
      "textos-padrao-capitulo",
      orientacao === "paisagem" ? "textos-padrao-capitulo--paisagem" : "textos-padrao-capitulo--retrato",
      novaPagina ? "textos-padrao-capitulo--nova-pagina" : "textos-padrao-capitulo--continua",
    ].join(" ");
    return (
      <article key={c.id_capitulo} className={classes}>
        <h2 className="textos-padrao-capitulo-titulo">{titulo}</h2>
        <div className="textos-padrao-capitulo-conteudo" dangerouslySetInnerHTML={{ __html: conteudo }} />
      </article>
    );
  }

  // Seção por setor: tabela de riscos (passo 3, real) + análise OWAS/checklist
  // (passo 4, ainda placeholder). comAnalise controla o sub-bloco de análise.
  function secaoSetores(slug: string, rotulo: string, intro: string | null, comAnalise: boolean) {
    return (
      <>
        <SectionTitulo titulo={numLabel(numPorSlug[slug], tituloPorSlug[slug] ?? rotulo)} />
        {intro && (
          <p style={{ marginBottom: 12, fontSize: 11, color: "#374151", borderLeft: "2px solid #cbd5e1", paddingLeft: 12 }}>
            {intro}
          </p>
        )}
        {rel.setores.map((s, i) => (
          <div key={s.id} style={{ marginBottom: 16 }}>
            <SetorRiscosBlock setor={s} idx={i} />
            {comAnalise && (
              <div className="aet-placeholder" style={{ marginTop: 8 }}>
                [Análise ergonômica do setor (OWAS + checklist + 13 fatores) — passo 4.]
              </div>
            )}
          </div>
        ))}
      </>
    );
  }

  function placeholderSetor(slug: string, rotulo: string, intro: string | null) {
    return (
      <>
        <SectionTitulo titulo={numLabel(numPorSlug[slug], tituloPorSlug[slug] ?? rotulo)} />
        {intro && (
          <p style={{ marginBottom: 12, fontSize: 11, color: "#374151", borderLeft: "2px solid #cbd5e1", paddingLeft: 12 }}>
            {intro}
          </p>
        )}
        <div className="aet-placeholder">[Fatores Psicossociais (QPS) — passo 4.]</div>
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
        conteudoFixo = temSetores ? secaoSetores("aet_agentes_ambientais", "Agentes Ambientais para as Áreas Operacionais", intro, false) : null;
        break;
      case "aet_analise_ergonomica":
        conteudoFixo = temSetores ? secaoSetores("aet_analise_ergonomica", "Análises Ergonômicas do Trabalho", intro, true) : null;
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
