import React from "react";
import FolhaAssinaturas from "@/components/pdf/FolhaAssinaturas";
import type { Signatario } from "@/components/pdf/FolhaAssinaturas";
import type { TextoPadraoCapitulo } from "@/lib/textos-padrao/types";
import { renderEditaveis } from "./shared";
import {
  aplicarMatriz,
  calcularResumoCompleto,
  filtrarPorSetor,
  listarSetores,
} from "@/lib/drps/calculos";
import { MEDIDAS_CONTROLE, MESES, TOPICOS } from "@/lib/drps/topicos";
import { ACOES_OBRIGATORIAS, EQUIPE_REVISAO } from "@/lib/drps/gestao";
import { formatCNPJ, formatCPF, formatCEI, formatCAEPF, formatCNO } from "@/lib/utils";
import type {
  DrpsMonitoramento,
  DrpsPlanoMedidas,
  DrpsProbabilidade,
  DrpsRespondente,
  DrpsRevisao,
  NivelMatriz,
  TopicoComMatriz,
} from "@/lib/drps/types";

export interface DrpsTemplateProps {
  relatorio: {
    revisao: number;
    responsavel_tecnico: string | null;
    crp: string | null;
    data_elaboracao: string | null;
    agravos_por_setor: Record<string, string> | null;
    medidas_por_setor: Record<string, string> | null;
    conclusoes_por_setor: Record<string, string> | null;
    conclusao_geral: string | null;
  };
  empresa: {
    nome_empresa: string;
    cnpj: string | null;
    cpf: string | null;
    cei: string | null;
    caepf: string | null;
    cno: string | null;
  } | null;
  respondentes: DrpsRespondente[];
  probabilidades: DrpsProbabilidade[];
  planoMedidas: DrpsPlanoMedidas | null;
  monitoramentos: DrpsMonitoramento[];
  revisao: DrpsRevisao | null;
  anoMedidas: number;
  capitulos: TextoPadraoCapitulo[];
  valores: Record<string, string>;
  signatarios: Signatario[];
  folhaEmpresa: { razaoSocial: string; cnpj: string } | null;
  dataHoraAssinatura: string;
  identificadorDocumento: string;
}

const STYLE_BLOCK = `
* { box-sizing: border-box; }
.drps-tabela { border-collapse: collapse; width: 100%; font-size: 11px; margin-bottom: 0; }
.drps-tabela td, .drps-tabela th { border: 1px solid #cbd5e1; padding: 6px 9px; vertical-align: top; }
.drps-label { background: #f0f9f4; font-weight: 600; color: #1e4d28; font-size: 10.5px; width: 30%; }
.drps-header-section { background: #d4edda; color: #1e4d28; font-weight: 700; text-align: center; font-size: 11.5px; letter-spacing: 0.06em; text-transform: uppercase; padding: 7px 9px; }
.drps-title { background: #006B54; color: white; font-weight: 700; font-size: 13px; text-align: center; letter-spacing: 0.06em; text-transform: uppercase; padding: 9px 11px; }
.drps-setor-bloco { margin-bottom: 22px; page-break-before: always; page-break-inside: auto; }
.drps-setor-bloco:first-of-type { page-break-before: auto; }
.drps-badge { display: inline-block; padding: 2px 9px; border-radius: 999px; font-size: 10px; font-weight: 700; color: #fff; }
.drps-conc { font-size: 11px; line-height: 1.5; color: #1f2937; }
.tp-cap { margin-bottom: 16pt; }
.tp-cap h2 { font-size: 13pt; font-weight: 700; color: #1e4d28; border-bottom: 2px solid #006B54; padding-bottom: 3px; margin: 0 0 8pt; }
.tp-cap .corpo { font-size: 11pt; color: #1f2937; line-height: 1.5; text-align: justify; }
.tp-cap .corpo p { margin: 0 0 8pt; }
.tp-cap .corpo table { border-collapse: collapse; width: 100%; margin: 8pt 0; font-size: 10pt; }
.tp-cap .corpo th, .tp-cap .corpo td { border: 1px solid #999; padding: 4px 6px; }
.tp-cap .corpo th { background: #d4edda; color: #1e4d28; }
.tp-capa { position: relative; width: 100%; margin-bottom: 16pt; page-break-after: always; }
.tp-capa img.bg { width: 100%; height: auto; display: block; }
.tp-capa .caixa { position: absolute; white-space: pre-wrap; line-height: 1.3; }
.drps-sec { page-break-before: always; font-family: 'Times New Roman', Times, serif; }
.drps-sec h2 { font-size: 16pt; font-weight: 700; color: #1e4d28; border-bottom: 2px solid #006B54; padding-bottom: 6px; margin: 0 0 14pt; text-transform: uppercase; letter-spacing: .05em; }
.drps-sec h3 { font-size: 13pt; font-weight: 700; color: #1e4d28; margin: 14pt 0 6pt; }
.drps-sec p { font-size: 12pt; line-height: 1.6; text-align: justify; color: #1f2937; margin: 0 0 12pt; }
.drps-ex-table { width: 100%; border-collapse: collapse; font-size: 10pt; margin: 8pt 0 14pt; }
.drps-ex-table th, .drps-ex-table td { border: 1px solid #b5b5b5; padding: 4pt 6pt; vertical-align: top; }
.drps-ex-table th { background: #d4edda; color: #1e4d28; font-weight: 700; text-align: left; }
.drps-ex-table td.mes { text-align: center; font-weight: 700; color: #006B54; }
.drps-ex-list { margin: 6pt 0 12pt 1.5em; padding: 0; font-size: 11pt; line-height: 1.6; }
.drps-ex-list li { margin: 3pt 0; }
`;

function corMatriz(m: NivelMatriz): string {
  if (m === "Crítico") return "#111827";
  if (m === "Alto") return "#dc2626";
  if (m === "Médio") return "#d97706";
  if (m === "Baixo") return "#16a34a";
  return "#6b7280";
}

function fmtData(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso + (iso.includes("T") ? "" : "T00:00")).toLocaleDateString("pt-BR");
  } catch {
    return "—";
  }
}

function montarMapaProb(probabilidades: DrpsProbabilidade[], setor: string): Record<number, 1 | 2 | 3> {
  const m: Record<number, 1 | 2 | 3> = {};
  for (let i = 0; i < TOPICOS.length; i++) m[i] = 1;
  for (const p of probabilidades) {
    if (p.setor === setor) m[p.topico_idx] = p.probabilidade as 1 | 2 | 3;
  }
  return m;
}

function BlocoSetor({
  setor,
  totalRespondentes,
  funcoes,
  topicos,
  rel,
  empresa,
}: {
  setor: string;
  totalRespondentes: number;
  funcoes: string;
  topicos: TopicoComMatriz[];
  rel: DrpsTemplateProps["relatorio"];
  empresa: DrpsTemplateProps["empresa"];
}) {
  const identificadores: { label: string; valor: string }[] = [];
  if (empresa?.cnpj) identificadores.push({ label: "CNPJ", valor: formatCNPJ(empresa.cnpj) });
  if (empresa?.cpf) identificadores.push({ label: "CPF", valor: formatCPF(empresa.cpf) });
  if (empresa?.cei) identificadores.push({ label: "CEI", valor: formatCEI(empresa.cei) });
  if (empresa?.caepf) identificadores.push({ label: "CAEPF", valor: formatCAEPF(empresa.caepf) });
  if (empresa?.cno) identificadores.push({ label: "CNO", valor: formatCNO(empresa.cno) });
  if (identificadores.length === 0) identificadores.push({ label: "CNPJ", valor: "—" });

  const conclusao = rel.conclusoes_por_setor?.[setor] ?? "";

  return (
    <section className="drps-setor-bloco">
      <table className="drps-tabela">
        <tbody>
          <tr>
            <td className="drps-title" colSpan={4}>
              DRPS — Diagnóstico de Riscos Psicossociais · Rev. {rel.revisao}
            </td>
          </tr>
          <tr>
            <td className="drps-label" style={{ width: "30%" }}>Responsável Técnico pela Avaliação (Psicólogo)</td>
            <td>{rel.responsavel_tecnico ?? ""}</td>
            <td className="drps-label" style={{ width: "10%" }}>CRP</td>
            <td style={{ width: "20%" }}>{rel.crp ?? ""}</td>
          </tr>
          <tr><td className="drps-header-section" colSpan={4}>IDENTIFICAÇÃO</td></tr>
          <tr>
            <td className="drps-label">{identificadores[0].label}</td>
            <td>{identificadores[0].valor}</td>
            <td className="drps-label">Data da Elaboração</td>
            <td>{fmtData(rel.data_elaboracao)}</td>
          </tr>
          {identificadores.slice(1).map((id) => (
            <tr key={id.label}>
              <td className="drps-label">{id.label}</td>
              <td colSpan={3}>{id.valor}</td>
            </tr>
          ))}
          <tr><td className="drps-label">Empresa</td><td colSpan={3}>{empresa?.nome_empresa ?? "—"}</td></tr>
          <tr><td className="drps-label">Setor</td><td colSpan={3}>{setor}</td></tr>
          <tr><td className="drps-label">Funções</td><td colSpan={3}>{funcoes || "—"}</td></tr>
          <tr><td className="drps-label">Quantidade de Trabalhadores na Função</td><td colSpan={3}>{totalRespondentes}</td></tr>
          <tr>
            <td className="drps-label">Possíveis Agravos à Saúde Mental</td>
            <td colSpan={3} style={{ whiteSpace: "pre-wrap" }}>{rel.agravos_por_setor?.[setor] ?? ""}</td>
          </tr>
          <tr>
            <td className="drps-label">Medidas de Controle Existentes</td>
            <td colSpan={3} style={{ whiteSpace: "pre-wrap" }}>{rel.medidas_por_setor?.[setor] ?? ""}</td>
          </tr>
          <tr><td className="drps-header-section" colSpan={4}>Classificação de Risco Psicossocial</td></tr>
        </tbody>
      </table>

      <table className="drps-tabela">
        <thead>
          <tr>
            <th className="drps-label" style={{ width: "30%", textAlign: "left" }}>Fatores de Risco</th>
            <th className="drps-label" style={{ width: "35%", textAlign: "left" }}>Fontes Geradoras do Risco</th>
            <th className="drps-label" style={{ width: "11%", textAlign: "center" }}>Gravidade</th>
            <th className="drps-label" style={{ width: "12%", textAlign: "center" }}>Probabilidade</th>
            <th className="drps-label" style={{ width: "12%", textAlign: "center" }}>Matriz de Risco</th>
          </tr>
        </thead>
        <tbody>
          {topicos.map((t) => (
            <tr key={t.idx}>
              <td>{t.nome.replace(/^Tópico \d+ - /, "")}</td>
              <td style={{ fontSize: "10px", color: "#374151" }}>{t.fonteGeradora}</td>
              <td style={{ textAlign: "center" }}>
                <span className="drps-badge" style={{ backgroundColor: t.classificacaoGravidade.cor }}>{t.classificacaoGravidade.texto}</span>
              </td>
              <td style={{ textAlign: "center", fontSize: "10px" }}>{t.classificacaoProbabilidade}</td>
              <td style={{ textAlign: "center" }}>
                <span className="drps-badge" style={{ backgroundColor: t.corMatriz }}>{t.matriz}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: 6, fontSize: "9px", color: "#6b7280" }}>
        {totalRespondentes} respondente(s) · {topicos.length} tópico(s)
      </div>

      <table className="drps-tabela" style={{ marginTop: 8 }}>
        <tbody>
          <tr><td className="drps-header-section">Conclusão</td></tr>
          <tr>
            <td>
              <div className="drps-conc" dangerouslySetInnerHTML={{ __html: conclusao || "<em style=\"color:#9ca3af\">(Conclusão não preenchida)</em>" }} />
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}

export default function DrpsTemplate({
  relatorio,
  empresa,
  respondentes,
  probabilidades,
  planoMedidas,
  monitoramentos,
  revisao,
  anoMedidas,
  capitulos,
  valores,
  signatarios,
  folhaEmpresa,
  dataHoraAssinatura,
  identificadorDocumento,
}: DrpsTemplateProps) {
  const setores = listarSetores(respondentes);
  const blocos = setores.map((s) => {
    const filtrados = filtrarPorSetor(respondentes, s);
    const topicos = aplicarMatriz(calcularResumoCompleto(filtrados), montarMapaProb(probabilidades, s));
    const cargos = Array.from(new Set(filtrados.map((r) => r.cargo?.trim()).filter(Boolean) as string[]))
      .sort((a, b) => a.localeCompare(b, "pt-BR", { sensitivity: "base" }))
      .join(", ");
    return { setor: s, totalRespondentes: filtrados.length, funcoes: cargos, topicos };
  });

  // Monitoramento: matriz (pior caso) por tópico por setor
  const topicosPorSetorMon = setores.map((s) => {
    const filtrados = filtrarPorSetor(respondentes, s);
    const topicos = aplicarMatriz(calcularResumoCompleto(filtrados), montarMapaProb(probabilidades, s));
    return { setor: s, topicos };
  });

  const planoEntries = planoMedidas?.plano ? Object.entries(planoMedidas.plano) : [];
  const planoComConteudo = planoEntries.filter(
    ([, p]) => p.meses.some((m) => m) || (p.responsavel ?? "").trim().length > 0,
  );
  const checklist = (revisao?.checklist as Record<string, boolean>) ?? {};
  const equipe = (revisao?.equipe as Record<string, boolean>) ?? {};
  const anotacoes = revisao?.anotacoes ?? "";

  return (
    <>
      {/* eslint-disable-next-line react/no-danger */}
      <style dangerouslySetInnerHTML={{ __html: STYLE_BLOCK }} />

      {renderEditaveis(capitulos, valores, "inicio")}
      {renderEditaveis(capitulos, valores, "apos_sumario")}

      {blocos.map((b) => (
        <BlocoSetor key={b.setor} {...b} rel={relatorio} empresa={empresa} />
      ))}

      {renderEditaveis(capitulos, valores, "apos_setores")}

      {relatorio.conclusao_geral && (
        <section className="drps-sec">
          <h2>Conclusão Geral</h2>
          <p style={{ whiteSpace: "pre-wrap", textIndent: "1.25cm" }}>{relatorio.conclusao_geral}</p>
        </section>
      )}

      {renderEditaveis(capitulos, valores, "apos_conclusao")}

      {/* Medidas de Controle — Plano Anual */}
      {planoComConteudo.length > 0 && (
        <section className="drps-sec">
          <h2>Medidas de Controle — Plano Anual {anoMedidas}</h2>
          <p style={{ textIndent: "1.25cm" }}>
            Cronograma das ações de controle dos riscos psicossociais identificados, com indicação dos meses de execução e responsáveis.
          </p>
          <table className="drps-ex-table">
            <thead>
              <tr>
                <th style={{ width: "44%" }}>Ação</th>
                <th style={{ width: "20%" }}>Responsável</th>
                {MESES.map((m) => <th key={m} style={{ textAlign: "center", padding: "4pt 2pt" }}>{m.slice(0, 3)}</th>)}
              </tr>
            </thead>
            <tbody>
              {planoComConteudo.map(([acao, p]) => (
                <tr key={acao}>
                  <td>{acao}</td>
                  <td>{p.responsavel || "—"}</td>
                  {p.meses.map((marcado, idx) => <td key={idx} className="mes">{marcado ? "✓" : ""}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ fontSize: "10pt", fontStyle: "italic", textIndent: 0 }}>
            Total de ações catalogadas: {MEDIDAS_CONTROLE.length}. Foram cronogramadas {planoComConteudo.length} ação(ões) para este período.
          </p>
        </section>
      )}

      {/* Monitoramento do Desempenho */}
      {topicosPorSetorMon.length > 0 && (
        <section className="drps-sec">
          <h2>Monitoramento do Desempenho</h2>
          <p style={{ textIndent: "1.25cm" }}>
            Acompanhamento das intervenções por tópico psicossocial, por setor, com status de execução e data da próxima reavaliação.
          </p>
          {topicosPorSetorMon.map((grupo) => (
            <div key={grupo.setor}>
              <h3>Setor: {grupo.setor}</h3>
              <table className="drps-ex-table">
                <thead>
                  <tr>
                    <th style={{ width: "32%" }}>Tópico</th>
                    <th style={{ width: "10%" }}>Matriz</th>
                    <th>Responsável</th>
                    <th>Status</th>
                    <th>Data interv.</th>
                    <th>Próxima reaval.</th>
                  </tr>
                </thead>
                <tbody>
                  {grupo.topicos.map((t) => {
                    const mon = monitoramentos.find((m) => m.setor === grupo.setor && m.topico_idx === t.idx);
                    return (
                      <tr key={t.idx}>
                        <td>{t.nome.replace(/^Tópico \d+ - /, "")}</td>
                        <td><span className="drps-badge" style={{ backgroundColor: corMatriz(t.matriz) }}>{t.matriz}</span></td>
                        <td>{mon?.responsavel || "—"}</td>
                        <td>{mon?.status || "Pendente"}</td>
                        <td>{fmtData(mon?.data_intervencao ?? null)}</td>
                        <td>{fmtData(mon?.proxima_avaliacao ?? null)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))}
        </section>
      )}

      {/* Revisão e Melhoria Contínua */}
      {revisao && (
        <section className="drps-sec">
          <h2>Revisão e Melhoria Contínua</h2>
          <p style={{ textIndent: "1.25cm" }}>
            Compromissos de gestão para manter o ciclo PDCA do programa de riscos psicossociais ativo, com equipe técnica designada e anotações da coordenação.
          </p>
          <h3>Ações de revisão obrigatórias</h3>
          <ul className="drps-ex-list">
            {ACOES_OBRIGATORIAS.map((a) => <li key={a.id}>{checklist[a.id] ? "☑" : "☐"} {a.texto}</li>)}
          </ul>
          <h3>Equipe técnica designada</h3>
          <ul className="drps-ex-list">
            {EQUIPE_REVISAO.map((e) => <li key={e.id}>{equipe[e.id] ? "☑" : "☐"} {e.texto}</li>)}
          </ul>
          {anotacoes && (
            <>
              <h3>Anotações da coordenação</h3>
              <p style={{ textIndent: 0, whiteSpace: "pre-wrap" }}>{anotacoes}</p>
            </>
          )}
        </section>
      )}

      {renderEditaveis(capitulos, valores, "apos_medidas")}
      {renderEditaveis(capitulos, valores, "fim")}

      <FolhaAssinaturas
        signatarios={signatarios}
        empresa={folhaEmpresa}
        dataHoraAssinatura={dataHoraAssinatura}
        identificadorDocumento={identificadorDocumento}
      />
    </>
  );
}
