import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/client";
import type { Signatario } from "@/components/pdf/FolhaAssinaturas";
import type { Empresa } from "@/lib/supabase/types";
import type { TextoPadraoCapitulo } from "@/lib/textos-padrao/types";
import type {
  DrpsMonitoramento,
  DrpsPlanoMedidas,
  DrpsProbabilidade,
  DrpsRelatorio,
  DrpsRespondente,
  DrpsRevisao,
} from "@/lib/drps/types";
import { montarValoresVariaveis } from "@/lib/drps/variaveis";

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
      .from("drps_relatorios")
      .select("*")
      .eq("id_relatorio", id)
      .single();
    if (relErr || !rawRel) {
      return NextResponse.json({ error: "Relatório DRPS não encontrado" }, { status: 404 });
    }
    const rel = rawRel as unknown as DrpsRelatorio;

    const anoMedidas = new Date().getFullYear();

    const [
      { data: rawResp },
      { data: rawProb },
      { data: rawPlano },
      { data: rawMon },
      { data: rawRev },
      { data: rawCaps },
    ] = await Promise.all([
      supabase.from("drps_respondentes").select("*").eq("id_relatorio", id),
      supabase.from("drps_probabilidades").select("*").eq("id_relatorio", id),
      supabase.from("drps_plano_medidas").select("*").eq("id_relatorio", id).eq("ano", anoMedidas).maybeSingle(),
      supabase.from("drps_monitoramento").select("*").eq("id_relatorio", id),
      supabase.from("drps_revisao").select("*").eq("id_relatorio", id).maybeSingle(),
      supabase.from("drps_texto_padrao").select("*").order("ordem", { ascending: true }),
    ]);

    const respondentes = (rawResp ?? []) as unknown as DrpsRespondente[];
    const probabilidades = (rawProb ?? []) as unknown as DrpsProbabilidade[];
    const planoMedidas = (rawPlano as unknown as DrpsPlanoMedidas) ?? null;
    const monitoramentos = (rawMon ?? []) as unknown as DrpsMonitoramento[];
    const revisao = (rawRev as unknown as DrpsRevisao) ?? null;
    const capitulos = (rawCaps ?? []) as unknown as TextoPadraoCapitulo[];

    if (respondentes.length === 0) {
      return NextResponse.json({ error: "Nenhum respondente importado — não é possível gerar o laudo." }, { status: 400 });
    }

    let empresa: Empresa | null = null;
    if (rel.id_empresa) {
      const { data: rawEmp } = await supabase
        .from("empresas").select("*").eq("id_empresa", rel.id_empresa).single();
      empresa = (rawEmp as unknown as Empresa) ?? null;
    }

    // Variáveis dos textos padrão (inclui período de coleta a partir dos carimbos).
    const base = montarValoresVariaveis(empresa, rel);
    const timestamps = respondentes
      .map((r) => r.data_carimbo)
      .filter((d): d is string => !!d)
      .map((d) => new Date(d).getTime())
      .filter((n) => !Number.isNaN(n));
    const valores: Record<string, string> = {
      ...base,
      data_carimbo_inicio: timestamps.length > 0 ? new Date(Math.min(...timestamps)).toLocaleDateString("pt-BR") : "",
      data_carimbo_fim: timestamps.length > 0 ? new Date(Math.max(...timestamps)).toLocaleDateString("pt-BR") : "",
    };

    const { data: rawUsuario } = await supabase
      .from("usuarios").select("nome, cpf").eq("email", user.email).single();
    const perfil = rawUsuario as { nome: string | null; cpf: string | null } | null;

    valores.usuario_logado = perfil?.nome ?? rel.responsavel_tecnico ?? user.email ?? "";
    valores.tipo_relatorio = "DRPS — Diagnóstico de Riscos Psicossociais";

    const signatarios: Signatario[] = [{
      nomeCompleto: perfil?.nome ?? rel.responsavel_tecnico ?? user.email,
      cargo: "Psicólogo(a)",
      registroProfissional: rel.crp ? `CRP ${rel.crp}` : null,
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
    const identificadorDocumento = `DRPS-${now.getFullYear()}-${shortId}`;

    const [{ default: React }, { renderToStaticMarkup }, { default: DrpsTemplate }] =
      await Promise.all([
        import("react"),
        import("react-dom/server"),
        import("@/components/pdf/templates/DrpsTemplate"),
      ]);

    const bodyHtml = renderToStaticMarkup(
      React.createElement(DrpsTemplate, {
        relatorio: {
          revisao: rel.revisao,
          responsavel_tecnico: rel.responsavel_tecnico,
          crp: rel.crp,
          data_elaboracao: rel.data_elaboracao,
          agravos_por_setor: rel.agravos_por_setor,
          medidas_por_setor: rel.medidas_por_setor,
          conclusoes_por_setor: rel.conclusoes_por_setor,
          conclusao_geral: rel.conclusao_geral,
        },
        empresa: empresa
          ? {
              nome_empresa: empresa.nome_empresa,
              cnpj: empresa.cnpj,
              cpf: empresa.cpf,
              cei: empresa.cei,
              caepf: empresa.caepf,
              cno: empresa.cno,
            }
          : null,
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
      }),
    );

    const styleMatch = bodyHtml.match(/<style[^>]*>([\s\S]*?)<\/style>/);
    const headStyle = styleMatch ? styleMatch[1] : "";
    const bodyWithoutStyle = bodyHtml.replace(/<style[^>]*>[\s\S]*?<\/style>/, "");

    const fullHtml = `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8" /><title>Laudo DRPS</title>
<style>${headStyle}</style></head>
<body style="margin:0;padding:0;background:#fff;font-family:Inter,Arial,Helvetica,sans-serif;color:#111827;">
${bodyWithoutStyle}
</body></html>`;

    const { gerarPdf } = await import("@/lib/pdf/gerar-pdf");
    const pdfBuffer = await gerarPdf(fullHtml, {
      margens: { top: "14mm", bottom: "14mm", left: "12mm", right: "12mm" },
    });

    const pdfFinal = await aplicarAnexosNoPdf(supabase, "psicossocial", id, pdfBuffer);

    return new NextResponse(pdfFinal, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="laudo-drps-${shortId}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[pdf/drps] Erro ao gerar PDF:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro interno ao gerar PDF" },
      { status: 500 },
    );
  }
}
