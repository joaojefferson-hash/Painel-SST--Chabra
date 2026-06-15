import React from "react";
import FolhaAssinaturas from "@/components/pdf/FolhaAssinaturas";
import type { Signatario } from "@/components/pdf/FolhaAssinaturas";
import type { TextoPadraoCapitulo } from "@/lib/textos-padrao/types";
import { TP_STYLE, renderEditaveis, temSecoesSistema, renderUnificado } from "./shared";
import {
  CATEGORIAS_NR12_LABELS,
  CATEGORIAS_NR12_ORDEM,
  type CategoriaNR12,
} from "@/lib/apreciacao-maquinas/catalogo-nr12";

export interface ApreciacaoItemLocal {
  id_item: string;
  item_codigo: string;
  item_categoria: string;
  item_titulo: string;
  item_descricao: string | null;
  item_origem: string | null;
  situacao: string;
  observacao: string | null;
  recomendacao: string | null;
  probabilidade: string | null;
  severidade: string | null;
  nivel_risco_calculado: string | null;
  foto_urls: string[];
  foto_legendas: string[];
}

export interface ApreciacaoAcaoLocal {
  id_acao: string;
  what_acao: string;
  why_justificativa: string | null;
  where_local: string | null;
  when_prazo: string | null;
  who_responsavel: string | null;
  how_metodo: string | null;
  how_much_custo: string | null;
  status: string;
  prioridade: string;
  origem_label: string | null;
}

export interface ApreciacaoTemplateProps {
  apreciacao: {
    titulo: string | null;
    setor: string | null;
    cidade: string | null;
    responsavel: string | null;
    responsavel_empresa: string | null;
    data_apreciacao: string | null;
    risco_residual: string | null;
    observacoes_gerais: string | null;
    conclusao_tecnica: string | null;
    recomendacoes: string | null;
  };
  maquinaNome: string;
  empresa?: { nome_empresa: string; cnpj: string | null } | null;
  itens: ApreciacaoItemLocal[];
  acoes: ApreciacaoAcaoLocal[];
  capitulos: TextoPadraoCapitulo[];
  valores: Record<string, string>;
  signatarios: Signatario[];
  folhaEmpresa: { razaoSocial: string; cnpj: string } | null;
  dataHoraAssinatura: string;
  identificadorDocumento: string;
}

const LARANJA = "#c2410c";

const SITUACAO_LABELS: Record<string, string> = {
  CONFORME: "Conforme",
  NAO_CONFORME: "Não conforme",
  NAO_APLICAVEL: "Não aplicável",
  PENDENTE: "Pendente",
};

const STYLE_BLOCK = `
* { box-sizing: border-box; }
${TP_STYLE}
.sec-titulo { font-size: 13pt; font-weight: 700; color: ${LARANJA}; border-bottom: 2px solid ${LARANJA}; padding-bottom: 3px; margin: 14pt 0 8pt; }
.cat-titulo { font-size: 10.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: .03em; color: #9a3412; border-bottom: 1px solid #fdba74; padding-bottom: 2px; margin: 10pt 0 6pt; }
.dados { width: 100%; border-collapse: collapse; font-size: 10.5pt; margin-bottom: 8pt; }
.dados td { border: 1px solid #e5e7eb; padding: 4px 8px; vertical-align: top; }
.dados .rot { width: 28%; font-size: 9px; font-weight: 700; text-transform: uppercase; color: #6b7280; }
.ap-item { border: 1px solid #d1d5db; border-radius: 6px; padding: 8px 10px; margin-bottom: 8px; page-break-inside: avoid; }
.ap-item .cab { display: flex; align-items: flex-start; gap: 8px; }
.ap-cod { font-family: monospace; font-size: 10px; font-weight: 700; border-radius: 4px; padding: 2px 6px; background: #f3f4f6; color: #4b5563; white-space: nowrap; }
.ap-cod.livre { background: #f3e8ff; color: #7e22ce; }
.sit { font-size: 9px; font-weight: 700; border: 1px solid; border-radius: 999px; padding: 2px 8px; white-space: nowrap; }
.risco { margin-top: 6px; border: 1px solid #fed7aa; background: #fff7ed; border-radius: 6px; padding: 6px 8px; font-size: 10pt; }
.risco .rot { font-size: 9px; font-weight: 700; text-transform: uppercase; color: #9a3412; margin: 0 0 2px; }
.campo { margin-top: 6px; }
.campo .rot { font-size: 9px; font-weight: 700; text-transform: uppercase; color: #6b7280; margin: 0; }
.campo .rot.rec { color: #b91c1c; }
.campo .val { font-size: 10pt; color: #111827; white-space: pre-wrap; margin: 2px 0 0; }
.fotos { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
.fotos .f { width: 120px; }
.fotos img { width: 120px; height: 90px; object-fit: cover; border: 1px solid #d1d5db; border-radius: 4px; }
.fotos .leg { font-size: 8px; color: #6b7280; text-align: center; margin: 2px 0 0; line-height: 1.2; }
.acao { border: 1px solid #e5e7eb; border-radius: 6px; padding: 6px 8px; margin-bottom: 6px; page-break-inside: avoid; }
.acao .top { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.prio { font-size: 8px; font-weight: 700; border-radius: 4px; padding: 1px 5px; }
.acao .what { font-size: 10.5pt; font-weight: 600; color: #111827; }
.acao .meta { font-size: 9pt; color: #4b5563; margin: 3px 0 0; }
.stat { font-size: 8px; font-weight: 700; border: 1px solid; border-radius: 999px; padding: 1px 6px; }
`;

function corSituacao(s: string) {
  if (s === "CONFORME") return { bg: "#d1fae5", fg: "#047857", bd: "#6ee7b7" };
  if (s === "NAO_CONFORME") return { bg: "#fee2e2", fg: "#b91c1c", bd: "#fca5a5" };
  if (s === "NAO_APLICAVEL") return { bg: "#f3f4f6", fg: "#374151", bd: "#d1d5db" };
  return { bg: "#fef3c7", fg: "#b45309", bd: "#fcd34d" };
}

function corPrioridade(p: string) {
  if (p === "Critica") return { bg: "#fee2e2", fg: "#b91c1c" };
  if (p === "Alta") return { bg: "#ffedd5", fg: "#c2410c" };
  if (p === "Media") return { bg: "#fef3c7", fg: "#b45309" };
  return { bg: "#d1fae5", fg: "#047857" };
}

function corStatusAcao(s: string) {
  if (s === "Concluida") return { bg: "#d1fae5", fg: "#047857", bd: "#6ee7b7" };
  if (s === "Em Andamento") return { bg: "#dbeafe", fg: "#1d4ed8", bd: "#93c5fd" };
  if (s === "Cancelada") return { bg: "#f3f4f6", fg: "#6b7280", bd: "#d1d5db" };
  return { bg: "#fef3c7", fg: "#b45309", bd: "#fcd34d" };
}

function ChecklistSection({ itens }: { itens: ApreciacaoItemLocal[] }) {
  const grupos = CATEGORIAS_NR12_ORDEM.map((cat) => ({
    categoria: cat as CategoriaNR12,
    label: CATEGORIAS_NR12_LABELS[cat as CategoriaNR12],
    itens: itens.filter((i) => i.item_categoria === cat),
  })).filter((g) => g.itens.length > 0);

  return (
    <div>
      <p className="sec-titulo">Checklist NR-12 ({itens.length})</p>
      {grupos.map((g) => (
        <div key={g.categoria}>
          <p className="cat-titulo">{g.label} ({g.itens.length})</p>
          {g.itens.map((item) => {
            const cs = corSituacao(item.situacao);
            const ehLivre = item.item_origem === "LIVRE";
            const temRisco = item.situacao === "NAO_CONFORME" && (item.probabilidade || item.severidade || item.nivel_risco_calculado);
            return (
              <div key={item.id_item} className="ap-item">
                <div className="cab">
                  <span className={`ap-cod ${ehLivre ? "livre" : ""}`}>{item.item_codigo}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: "#111827" }}>
                      {item.item_titulo}{ehLivre ? " · Livre" : ""}
                    </p>
                    {item.item_descricao && (
                      <p style={{ margin: "2px 0 0", fontSize: 10, color: "#4b5563" }}>{item.item_descricao}</p>
                    )}
                  </div>
                  <span className="sit" style={{ background: cs.bg, color: cs.fg, borderColor: cs.bd }}>
                    {SITUACAO_LABELS[item.situacao] ?? item.situacao}
                  </span>
                </div>

                {temRisco && (
                  <div className="risco">
                    <p className="rot">Avaliação de risco</p>
                    <span>Probabilidade: <strong>{item.probabilidade || "—"}</strong> · Severidade: <strong>{item.severidade || "—"}</strong>{item.nivel_risco_calculado ? <> · Nível: <strong>{item.nivel_risco_calculado}</strong></> : null}</span>
                  </div>
                )}

                {item.foto_urls.length > 0 && (
                  <div className="fotos">
                    {item.foto_urls.map((url, i) => (
                      <div key={`${url}-${i}`} className="f">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt={`Foto ${item.item_codigo}`} />
                        {item.foto_legendas?.[i] ? <p className="leg">{item.foto_legendas[i]}</p> : null}
                      </div>
                    ))}
                  </div>
                )}

                {item.observacao && (
                  <div className="campo">
                    <p className="rot">Observação técnica</p>
                    <p className="val">{item.observacao}</p>
                  </div>
                )}
                {item.recomendacao && (
                  <div className="campo">
                    <p className="rot rec">Recomendação / ação corretiva</p>
                    <p className="val">{item.recomendacao}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function PlanoAcaoSection({ acoes }: { acoes: ApreciacaoAcaoLocal[] }) {
  return (
    <div>
      <p className="sec-titulo">Plano de Ação ({acoes.length})</p>
      {acoes.length === 0 && (
        <p style={{ fontSize: 10.5, color: "#6b7280" }}>Nenhuma ação cadastrada.</p>
      )}
      {acoes.map((a) => {
        const cp = corPrioridade(a.prioridade);
        const cst = corStatusAcao(a.status);
        const prazo = a.when_prazo ? new Date(a.when_prazo + "T00:00").toLocaleDateString("pt-BR") : null;
        const detalhes = [
          a.why_justificativa && `Por quê: ${a.why_justificativa}`,
          a.how_metodo && `Como: ${a.how_metodo}`,
          a.where_local && `Onde: ${a.where_local}`,
          a.who_responsavel && `Quem: ${a.who_responsavel}`,
          prazo && `Quando: ${prazo}`,
          a.how_much_custo && `Quanto: ${a.how_much_custo}`,
        ].filter(Boolean);
        return (
          <div key={a.id_acao} className="acao">
            <div className="top">
              <span className="prio" style={{ background: cp.bg, color: cp.fg }}>{a.prioridade}</span>
              <span className="what" style={{ flex: 1 }}>{a.what_acao}</span>
              <span className="stat" style={{ background: cst.bg, color: cst.fg, borderColor: cst.bd }}>{a.status}</span>
            </div>
            {a.origem_label && <p className="meta">Origem: {a.origem_label}</p>}
            {detalhes.length > 0 && <p className="meta">{detalhes.join(" · ")}</p>}
          </div>
        );
      })}
    </div>
  );
}

export default function ApreciacaoTemplate({
  apreciacao,
  maquinaNome,
  empresa,
  itens,
  acoes,
  capitulos,
  valores,
  signatarios,
  folhaEmpresa,
  dataHoraAssinatura,
  identificadorDocumento,
}: ApreciacaoTemplateProps) {
  const dataAp = apreciacao.data_apreciacao
    ? new Date(apreciacao.data_apreciacao + "T00:00").toLocaleDateString("pt-BR")
    : "—";

  // Seções do sistema como nós nomeados (reutilizados nos dois modos).
  const checklistNode = <ChecklistSection itens={itens} />;
  const conclusaoNode = (apreciacao.conclusao_tecnica || apreciacao.recomendacoes) ? (
    <div>
      <p className="sec-titulo">Conclusão Técnica</p>
      {apreciacao.conclusao_tecnica && (
        <div className="campo"><p className="rot">Parecer técnico</p><p className="val">{apreciacao.conclusao_tecnica}</p></div>
      )}
      {apreciacao.recomendacoes && (
        <div className="campo"><p className="rot">Recomendações finais</p><p className="val">{apreciacao.recomendacoes}</p></div>
      )}
    </div>
  ) : null;
  const planoNode = <PlanoAcaoSection acoes={acoes} />;

  // Mapeia os slugs fixos do módulo às seções (cabeçalho fica fixo no topo;
  // a folha de assinatura, sempre ao final).
  function renderSecaoApreciacao(slug: string): React.ReactNode {
    switch (slug) {
      case "apreciacao_checklist": return checklistNode;
      case "apreciacao_risco":     return conclusaoNode;
      case "apreciacao_plano":     return planoNode;
      default:                     return null;
    }
  }

  const corpo = temSecoesSistema(capitulos)
    ? renderUnificado(capitulos, valores, renderSecaoApreciacao)
    : (
      <>
        {renderEditaveis(capitulos, valores, "inicio")}
        {checklistNode}
        {conclusaoNode}
        {planoNode}
        {renderEditaveis(capitulos, valores, "fim")}
      </>
    );

  return (
    <>
      {/* eslint-disable-next-line react/no-danger */}
      <style dangerouslySetInnerHTML={{ __html: STYLE_BLOCK }} />

      {/* Cabeçalho */}
      <div style={{ marginBottom: 16, borderBottom: `3px solid ${LARANJA}`, paddingBottom: 14 }}>
        <p style={{ margin: 0, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: LARANJA }}>
          Apreciação de Risco — NR-12
        </p>
        <h1 style={{ margin: "4px 0 0", fontSize: 20, fontWeight: 700, color: "#111827" }}>
          {apreciacao.titulo || `Apreciação ${maquinaNome}`}
        </h1>
      </div>

      {/* Dados gerais */}
      <table className="dados">
        <tbody>
          <tr><td className="rot">Empresa</td><td>{empresa?.nome_empresa ?? "—"}</td><td className="rot">CNPJ</td><td>{empresa?.cnpj ?? "—"}</td></tr>
          <tr><td className="rot">Máquina</td><td>{maquinaNome}</td><td className="rot">Setor</td><td>{apreciacao.setor ?? "—"}</td></tr>
          <tr><td className="rot">Responsável técnico</td><td>{apreciacao.responsavel ?? "—"}</td><td className="rot">Responsável da empresa</td><td>{apreciacao.responsavel_empresa ?? "—"}</td></tr>
          <tr><td className="rot">Cidade</td><td>{apreciacao.cidade ?? "—"}</td><td className="rot">Data da apreciação</td><td>{dataAp}</td></tr>
          {apreciacao.risco_residual && (
            <tr><td className="rot">Risco residual</td><td colSpan={3}>{apreciacao.risco_residual}</td></tr>
          )}
        </tbody>
      </table>
      {apreciacao.observacoes_gerais && (
        <div className="campo" style={{ marginBottom: 8 }}>
          <p className="rot">Observações gerais</p>
          <p className="val">{apreciacao.observacoes_gerais}</p>
        </div>
      )}

      {corpo}

      <FolhaAssinaturas
        signatarios={signatarios}
        empresa={folhaEmpresa}
        dataHoraAssinatura={dataHoraAssinatura}
        identificadorDocumento={identificadorDocumento}
      />
    </>
  );
}
