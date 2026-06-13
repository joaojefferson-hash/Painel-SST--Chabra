import React from "react";
import FolhaAssinaturas from "@/components/pdf/FolhaAssinaturas";
import type { Signatario } from "@/components/pdf/FolhaAssinaturas";
import type { TextoPadraoCapitulo } from "@/lib/textos-padrao/types";
import {
  substituirVariaveis,
  substituirVariaveisTexto,
} from "@/lib/textos-padrao/variaveis";

export interface ConformidadeItemLocal {
  id_item: string;
  item_codigo: string;
  item_titulo: string;
  item_descricao: string | null;
  item_nr_origem: string | null;
  situacao: "CONFORME" | "NAO_APLICAVEL" | "PENDENTE" | string;
  observacao: string | null;
  foto_urls: string[];
}

export interface ConformidadeTemplateProps {
  relatorio: {
    nr_codigo: string | null;
    nr_titulo: string | null;
    setor: string | null;
    responsavel: string | null;
    responsavel_empresa: string | null;
    cidade: string | null;
    data_inspecao: string | null;
    observacoes_gerais: string | null;
  };
  empresa?: { nome_empresa: string; cnpj: string | null } | null;
  itens: ConformidadeItemLocal[];
  capitulos: TextoPadraoCapitulo[];
  valores: Record<string, string>;
  signatarios: Signatario[];
  folhaEmpresa: { razaoSocial: string; cnpj: string } | null;
  dataHoraAssinatura: string;
  identificadorDocumento: string;
}

const STYLE_BLOCK = `
* { box-sizing: border-box; }
.tp-cap { margin-bottom: 16pt; }
.tp-cap h2 { font-size: 13pt; font-weight: 700; color: #0f766e; border-bottom: 2px solid #0f766e; padding-bottom: 3px; margin: 0 0 8pt; }
.tp-cap .corpo { font-size: 11pt; color: #1f2937; line-height: 1.5; text-align: justify; }
.tp-cap .corpo p { margin: 0 0 8pt; }
.tp-cap .corpo table { border-collapse: collapse; width: 100%; margin: 8pt 0; font-size: 10pt; }
.tp-cap .corpo th, .tp-cap .corpo td { border: 1px solid #999; padding: 4px 6px; }
.sec-titulo { font-size: 13pt; font-weight: 700; color: #0f766e; border-bottom: 2px solid #0f766e; padding-bottom: 3px; margin: 0 0 8pt; }
.item { border: 1px solid #d1d5db; border-radius: 6px; padding: 8px; margin-bottom: 8px; page-break-inside: avoid; }
.item .cab { display: flex; align-items: flex-start; gap: 8px; }
.badge { font-family: monospace; font-size: 10px; font-weight: 700; border-radius: 4px; padding: 2px 6px; white-space: nowrap; }
.status { font-size: 9px; font-weight: 700; border-radius: 999px; padding: 2px 8px; white-space: nowrap; }
.fotos { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin-top: 8px; }
.fotos img { height: 150px; width: 200px; object-fit: cover; border: 1px solid #d1d5db; border-radius: 6px; }
.obs { margin-top: 8px; font-size: 10pt; color: #111827; white-space: pre-wrap; }
.obs .rot { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: #6b7280; }
`;

function corStatus(s: string) {
  if (s === "CONFORME") return { bg: "#d1fae5", fg: "#047857", label: "CONFORME" };
  if (s === "NAO_APLICAVEL") return { bg: "#f3f4f6", fg: "#374151", label: "N/A" };
  return { bg: "#fef3c7", fg: "#b45309", label: "PENDENTE" };
}

function ResumoCards({ itens }: { itens: ConformidadeItemLocal[] }) {
  const total = itens.length;
  const conformes = itens.filter((i) => i.situacao === "CONFORME").length;
  const na = itens.filter((i) => i.situacao === "NAO_APLICAVEL").length;
  const pend = itens.filter((i) => i.situacao === "PENDENTE").length;
  const avaliados = total - na;
  const pct = avaliados > 0 ? Math.round((conformes / avaliados) * 100) : 0;
  const card = (label: string, valor: string, bg: string, fg: string) => (
    <div style={{ flex: 1, border: `1px solid ${fg}33`, background: bg, borderRadius: 8, padding: 8, textAlign: "center" }}>
      <p style={{ margin: 0, fontSize: 9, fontWeight: 700, textTransform: "uppercase", color: fg }}>{label}</p>
      <p style={{ margin: "2px 0 0", fontSize: 20, fontWeight: 700, color: fg }}>{valor}</p>
    </div>
  );
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
      {card("Conformes", String(conformes), "#ecfdf5", "#047857")}
      {card("Não aplicáveis", String(na), "#f9fafb", "#374151")}
      {card("Pendentes", String(pend), "#fffbeb", "#b45309")}
      {card("Avaliação", `${pct}%`, "#f0fdfa", "#0f766e")}
    </div>
  );
}

function ItensSection({ itens, obsGerais }: { itens: ConformidadeItemLocal[]; obsGerais: string | null }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <p className="sec-titulo">Itens do Checklist ({itens.length})</p>
      {itens.map((item) => {
        const st = corStatus(item.situacao);
        return (
          <div key={item.id_item} className="item">
            <div className="cab">
              <span className="badge" style={{ background: "#ccfbf1", color: "#115e59" }}>{item.item_codigo}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: "#111827" }}>
                  {item.item_titulo}
                  {item.item_nr_origem && item.item_nr_origem !== "LIVRE" ? ` · ${item.item_nr_origem}` : item.item_nr_origem === "LIVRE" ? " · Livre" : ""}
                </p>
                {item.item_descricao && (
                  <p style={{ margin: "2px 0 0", fontSize: 10, color: "#4b5563" }}>{item.item_descricao}</p>
                )}
              </div>
              <span className="status" style={{ background: st.bg, color: st.fg }}>{st.label}</span>
            </div>
            {item.foto_urls.length > 0 && (
              <div className="fotos">
                {item.foto_urls.map((url, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={`${url}-${i}`} src={url} alt={`Foto ${item.item_codigo}`} />
                ))}
              </div>
            )}
            {item.observacao && (
              <div className="obs">
                <p className="rot" style={{ margin: 0 }}>Observação</p>
                <p style={{ margin: "2px 0 0" }}>{item.observacao}</p>
              </div>
            )}
          </div>
        );
      })}
      {obsGerais && (
        <div style={{ marginTop: 12, border: "1px solid #e5e7eb", borderRadius: 8, padding: 10 }}>
          <p style={{ margin: 0, fontSize: 9, fontWeight: 700, textTransform: "uppercase", color: "#6b7280" }}>Observações Gerais</p>
          <p style={{ margin: "2px 0 0", fontSize: 11, color: "#111827", whiteSpace: "pre-wrap" }}>{obsGerais}</p>
        </div>
      )}
    </div>
  );
}

export default function ConformidadeTemplate({
  relatorio,
  empresa,
  itens,
  capitulos,
  valores,
  signatarios,
  folhaEmpresa,
  dataHoraAssinatura,
  identificadorDocumento,
}: ConformidadeTemplateProps) {
  const blocos = [...capitulos]
    .filter((c) => c.ativo !== false)
    .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));

  const secoes: Record<string, React.ReactNode> = {
    conformidade_resultado: <ResumoCards itens={itens} />,
    conformidade_itens: <ItensSection itens={itens} obsGerais={relatorio.observacoes_gerais} />,
    conformidade_assinatura: (
      <FolhaAssinaturas
        signatarios={signatarios}
        empresa={folhaEmpresa}
        dataHoraAssinatura={dataHoraAssinatura}
        identificadorDocumento={identificadorDocumento}
      />
    ),
  };

  function renderBloco(c: TextoPadraoCapitulo) {
    if (c.tipo === "fixo") {
      const s = secoes[c.slug_fixo ?? ""];
      return s ? <div key={c.id_capitulo}>{s}</div> : null;
    }
    return (
      <div key={c.id_capitulo} className="tp-cap">
        {!c.bg_imagem_url && <h2>{substituirVariaveisTexto(c.titulo, valores)}</h2>}
        <div className="corpo" dangerouslySetInnerHTML={{ __html: substituirVariaveis(c.conteudo, valores) }} />
      </div>
    );
  }

  return (
    <>
      {/* eslint-disable-next-line react/no-danger */}
      <style dangerouslySetInnerHTML={{ __html: STYLE_BLOCK }} />

      {/* Cabeçalho */}
      <div style={{ marginBottom: 24, borderBottom: "3px solid #0f766e", paddingBottom: 16 }}>
        <p style={{ margin: 0, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "#0f766e" }}>
          Relatório de Conformidade — {relatorio.nr_codigo}
        </p>
        <h1 style={{ margin: "4px 0 0", fontSize: 20, fontWeight: 700, color: "#111827" }}>{relatorio.nr_titulo}</h1>
        <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 16px", fontSize: 11, color: "#374151" }}>
          <span><strong>Empresa:</strong> {empresa?.nome_empresa ?? "—"}</span>
          <span><strong>CNPJ:</strong> {empresa?.cnpj ?? "—"}</span>
          <span><strong>Setor / Local:</strong> {relatorio.setor ?? "—"}</span>
          <span><strong>Responsável técnico:</strong> {relatorio.responsavel ?? "—"}</span>
          <span><strong>Responsável da empresa:</strong> {relatorio.responsavel_empresa ?? "—"}</span>
          <span><strong>Cidade:</strong> {relatorio.cidade ?? "—"}</span>
        </div>
      </div>

      {blocos.map((c) => renderBloco(c))}
    </>
  );
}
