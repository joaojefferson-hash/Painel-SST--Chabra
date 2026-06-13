import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/client";
import type { Signatario } from "@/components/pdf/FolhaAssinaturas";
import type { NaoConformidadeItemLocal } from "@/components/pdf/templates/NaoConformidadeTemplate";
import type { Empresa } from "@/lib/supabase/types";
import type { TextoPadraoCapitulo } from "@/lib/textos-padrao/types";
import { montarValoresEmpresa, formatarDataBR } from "@/lib/textos-padrao/variaveis";

import { aplicarAnexosNoPdf } from "@/lib/anexos/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { data: rawRel, error: relErr } = await supabase
      .from("relatorios_nao_conformidade")
      .select("*")
      .eq("id_relatorio", id)
      .single();
    if (relErr || !rawRel) {
      return NextResponse.json({ error: "Relatório não encontrado" }, { status: 404 });
    }
    const rel = rawRel as Record<string, unknown>;

    const { data: rawItens } = await supabase
      .from("relatorios_nao_conformidade_itens")
      .select("*")
      .eq("id_relatorio", id)
      .order("ordem", { ascending: true });
    const itens: NaoConformidadeItemLocal[] = ((rawItens ?? []) as Record<string, unknown>[]).map((i) => ({
      id_item: String(i.id_item),
      descricao: (i.descricao as string) ?? "",
      norma_violada: (i.norma_violada as string) ?? null,
      criticidade: (i.criticidade as string) ?? "MEDIA",
      causa_raiz: (i.causa_raiz as string) ?? null,
      acao_corretiva: (i.acao_corretiva as string) ?? null,
      prazo: (i.prazo as string) ?? null,
      responsavel_tratativa: (i.responsavel_tratativa as string) ?? null,
      status_tratativa: (i.status_tratativa as string) ?? "ABERTA",
      foto_urls: Array.isArray(i.foto_urls) ? (i.foto_urls as string[]) : [],
    }));

    const { data: rawCaps } = await supabase
      .from("textos_padrao")
      .select("*")
      .eq("modulo", "nao_conformidade")
      .order("ordem", { ascending: true });
    const capitulos = (rawCaps ?? []) as unknown as TextoPadraoCapitulo[];

    let empresa: Empresa | null = null;
    if (rel.id_empresa) {
      const { data: rawEmp } = await supabase
        .from("empresas").select("*").eq("id_empresa", rel.id_empresa as string).single();
      empresa = (rawEmp as unknown as Empresa) ?? null;
    }

    const ncsAlta = itens.filter((i) => i.criticidade === "ALTA").length;
    const valores: Record<string, string> = {
      ...montarValoresEmpresa(empresa),
      titulo: (rel.titulo as string) ?? "",
      responsavel: (rel.responsavel as string) ?? "",
      responsavel_empresa: (rel.responsavel_empresa as string) ?? "",
      cidade: (rel.cidade as string) ?? "",
      setor: (rel.setor as string) ?? "",
      data_inspecao: formatarDataBR(rel.data_inspecao as string | null),
      total_ncs: String(itens.length),
      total_ncs_alta: String(ncsAlta),
      carimbo: (rel.responsavel as string) ?? "",
      importado: formatarDataBR(rel.created_at as string | null),
    };

    const { data: rawUsuario } = await supabase
      .from("usuarios").select("nome, cpf").eq("email", user.email).single();
    const perfil = rawUsuario as { nome: string | null; cpf: string | null } | null;

    valores.usuario_logado = perfil?.nome ?? user.email ?? "";
    valores.tipo_relatorio = "Relatório de Não Conformidade";

    const signatarios: Signatario[] = [{
      nomeCompleto: perfil?.nome ?? (rel.responsavel as string) ?? user.email,
      cargo: null,
      registroProfissional: null,
      cpf: perfil?.cpf ?? null,
      funcaoNoDocumento: "Responsável Técnico — Chabra SST",
    }];

    const folhaEmpresa = empresa
      ? { razaoSocial: empresa.nome_empresa, cnpj: empresa.cnpj ?? "" }
      : null;

    const now = new Date();
    const dataHoraAssinatura =
      now.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" }) + " " +
      now.toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo" }) + " -03:00";
    const shortId = String(id).replace(/-/g, "").slice(0, 8);
    const identificadorDocumento = `RNC-${now.getFullYear()}-${shortId}`;

    const [{ default: React }, { renderToStaticMarkup }, { default: NaoConformidadeTemplate }] =
      await Promise.all([
        import("react"),
        import("react-dom/server"),
        import("@/components/pdf/templates/NaoConformidadeTemplate"),
      ]);

    const bodyHtml = renderToStaticMarkup(
      React.createElement(NaoConformidadeTemplate, {
        relatorio: {
          titulo: (rel.titulo as string) ?? "Relatório de Não Conformidade",
          nr_codigo: (rel.nr_codigo as string) ?? null,
          nr_titulo: (rel.nr_titulo as string) ?? null,
          setor: (rel.setor as string) ?? null,
          responsavel: (rel.responsavel as string) ?? null,
          responsavel_empresa: (rel.responsavel_empresa as string) ?? null,
          cidade: (rel.cidade as string) ?? null,
          data_inspecao: (rel.data_inspecao as string) ?? null,
          observacoes_gerais: (rel.observacoes_gerais as string) ?? null,
        },
        empresa: empresa ? { nome_empresa: empresa.nome_empresa, cnpj: empresa.cnpj } : null,
        itens,
        capitulos,
        valores,
        signatarios,
        folhaEmpresa,
        dataHoraAssinatura,
        identificadorDocumento,
      }),
    );

    const styleMatch = bodyHtml.match(/<style[^>]*>([\s\S]*?)<\/style>/);
    const headStyle = styleMatch ? styleMatch[1] : "";
    const bodyWithoutStyle = bodyHtml.replace(/<style[^>]*>[\s\S]*?<\/style>/, "");

    const fullHtml = `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8" /><title>Relatório de Não Conformidade</title>
<style>${headStyle}</style></head>
<body style="margin:0;padding:0;background:#fff;font-family:Arial,Helvetica,sans-serif;">
${bodyWithoutStyle}
</body></html>`;

    const { gerarPdf } = await import("@/lib/pdf/gerar-pdf");
    const pdfBuffer = await gerarPdf(fullHtml, {
      margens: { top: "20mm", bottom: "20mm", left: "18mm", right: "15mm" },
    });

    const pdfFinal = await aplicarAnexosNoPdf(supabase, "nao_conformidade", id, pdfBuffer);

    return new NextResponse(pdfFinal, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="relatorio-nao-conformidade-${shortId}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[pdf/nao-conformidade] Erro ao gerar PDF:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro interno ao gerar PDF" },
      { status: 500 },
    );
  }
}
