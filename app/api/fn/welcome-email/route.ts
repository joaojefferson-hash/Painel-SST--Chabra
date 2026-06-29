import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Porte fiel da Edge Function `welcome-email` (Resend).
// Envia e-mail de boas-vindas a novos usuários do Painel SST.
// Mesma chamada externa (https://api.resend.com/emails), mesmo template,
// mesmos shapes/status de resposta. CORS removido (same-origin).
//
// Comportamento preservado: se RESEND_API_KEY estiver ausente, NÃO falha —
// retorna 200 { ok:true, sent:false, reason } para não interromper a criação
// de usuário. (A chave chega depois.)

const APP_URL = process.env.APP_URL ?? "https://painel-sst-chabra.vercel.app";
const FROM_EMAIL =
  process.env.FROM_EMAIL ?? "Painel SST Chabra <onboarding@resend.dev>";

interface Body {
  email: string;
  nome: string;
  perfil: string;
  senha?: string;
}

function template({ email, nome, perfil, senha }: Body): string {
  const linhaSenha = senha
    ? `<tr><td style="padding:6px 0;color:#374151;"><strong>Senha temporária:</strong></td><td style="padding:6px 0;font-family:monospace;color:#111827;">${senha}</td></tr>`
    : "";
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Painel SST Chabra</title>
</head>
<body style="margin:0;padding:0;background:#f0f7f0;font-family:Arial,sans-serif;color:#111827;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
          <tr>
            <td style="background:linear-gradient(135deg,#1e4d28 0%,#006B54 100%);padding:32px 24px;text-align:center;">
              <div style="display:inline-block;width:56px;height:56px;border-radius:14px;background:rgba(255,255,255,.15);line-height:56px;font-size:28px;color:#ffffff;">🛡️</div>
              <h1 style="margin:12px 0 4px;color:#ffffff;font-size:24px;font-weight:700;">Painel SST</h1>
              <p style="margin:0;color:rgba(255,255,255,.8);font-size:13px;">Chabra · Segurança e Saúde do Trabalho</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 24px;">
              <h2 style="margin:0 0 12px;font-size:20px;color:#111827;">Bem-vindo(a), ${nome}!</h2>
              <p style="margin:0 0 16px;color:#374151;line-height:1.55;">
                Sua conta no <strong>Painel SST Chabra</strong> foi criada. Você já pode
                acessar o sistema com os dados abaixo:
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background:#f0f7f0;border:1px solid #c8e6c9;border-radius:8px;padding:14px;margin:0 0 20px;">
                <tr><td style="padding:6px 0;color:#374151;"><strong>E-mail:</strong></td><td style="padding:6px 0;color:#111827;">${email}</td></tr>
                ${linhaSenha}
                <tr><td style="padding:6px 0;color:#374151;"><strong>Perfil:</strong></td><td style="padding:6px 0;color:#111827;">${perfil}</td></tr>
              </table>
              <p style="margin:0 0 24px;color:#374151;line-height:1.55;">
                ${
                  senha
                    ? "Recomendamos trocar a senha após o primeiro acesso."
                    : "Use a senha que você recebeu separadamente."
                }
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td style="background:#006B54;border-radius:8px;">
                    <a href="${APP_URL}/login"
                       style="display:inline-block;padding:12px 28px;font-weight:700;color:#ffffff;text-decoration:none;font-size:15px;">
                      Acessar o Painel SST →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:14px 24px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;">
              <p style="margin:0;color:#6b7280;font-size:12px;">
                Se você não esperava este e-mail, ignore-o.<br>
                © Chabra · Painel SST
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function POST(req: NextRequest) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid json" },
      { status: 400 }
    );
  }

  if (!body?.email || !body?.nome) {
    return NextResponse.json(
      { ok: false, error: "email e nome são obrigatórios" },
      { status: 400 }
    );
  }

  // Sem provedor configurado: não falha — só registra que não enviou.
  if (!RESEND_API_KEY) {
    console.warn("[welcome-email] RESEND_API_KEY ausente, e-mail não enviado");
    return NextResponse.json(
      {
        ok: true,
        sent: false,
        reason: "RESEND_API_KEY não configurado",
      },
      { status: 200 }
    );
  }

  const html = template(body);

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: body.email,
      subject: "Bem-vindo ao Painel SST Chabra",
      html,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json(
      { ok: false, sent: false, error: text },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true, sent: true }, { status: 200 });
}
