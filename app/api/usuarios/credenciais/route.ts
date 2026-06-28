import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  createSupabaseServerClient,
  createSupabaseServiceClient,
} from "@/lib/supabase/client";
import { createSupabaseAuthAdminClient } from "@/lib/supabase/auth-admin";

export const dynamic = "force-dynamic";

/**
 * Troca de e-mail e/ou senha de um usuário (admin). Pós-Bloco H usa a Admin API
 * do GoTrue (updateUserById) -- substitui as RPCs atualizar_email_admin /
 * redefinir_senha_admin, que tocavam auth.users via SQL (quebradas no self-host).
 * Se o e-mail mudar, sincroniza public.usuarios na .107.
 */
export async function POST(req: NextRequest) {
  const supabase = createSupabaseServerClient(await cookies());
  const {
    data: { user: caller },
  } = await supabase.auth.getUser();
  if (!caller?.email) {
    return NextResponse.json({ ok: false, error: "Não autorizado" }, { status: 401 });
  }
  const { data: callerRow } = await supabase
    .from("usuarios")
    .select("perfil")
    .eq("email", caller.email.toLowerCase())
    .single();
  if ((callerRow as { perfil?: string } | null)?.perfil !== "Admin") {
    return NextResponse.json(
      { ok: false, error: "Apenas administradores podem alterar credenciais" },
      { status: 403 }
    );
  }

  let body: { id_usuario?: string; email_atual?: string; email_novo?: string; nova_senha?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido" }, { status: 400 });
  }
  const { id_usuario, email_atual, email_novo, nova_senha } = body;
  if (!email_atual) {
    return NextResponse.json({ ok: false, error: "email_atual é obrigatório" }, { status: 400 });
  }
  if (nova_senha && nova_senha.length < 6) {
    return NextResponse.json(
      { ok: false, error: "A nova senha deve ter ao menos 6 caracteres" },
      { status: 400 }
    );
  }

  const admin = createSupabaseAuthAdminClient();
  const { data: list, error: listErr } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (listErr) {
    return NextResponse.json({ ok: false, error: listErr.message }, { status: 500 });
  }
  const target = list.users.find((u) => u.email?.toLowerCase() === email_atual.toLowerCase());
  if (!target) {
    return NextResponse.json({ ok: false, error: "Usuário não encontrado no Auth" }, { status: 404 });
  }

  const attrs: { password?: string; email?: string; email_confirm?: boolean } = {};
  if (nova_senha) attrs.password = nova_senha;
  if (email_novo && email_novo.toLowerCase() !== email_atual.toLowerCase()) {
    attrs.email = email_novo.toLowerCase();
    attrs.email_confirm = true;
  }
  if (Object.keys(attrs).length > 0) {
    const { error: upErr } = await admin.auth.admin.updateUserById(target.id, attrs);
    if (upErr) {
      const m = (upErr.message ?? "").toLowerCase();
      if (m.includes("already") && m.includes("registered")) {
        return NextResponse.json({ ok: false, error: "E-mail já cadastrado" }, { status: 400 });
      }
      return NextResponse.json({ ok: false, error: upErr.message }, { status: 500 });
    }
  }
  // Sincroniza o e-mail no perfil da .107
  if (attrs.email && id_usuario) {
    const service = createSupabaseServiceClient();
    await service
      .from("usuarios")
      .update({ email: attrs.email } as never)
      .eq("id_usuario", id_usuario);
  }
  return NextResponse.json({ ok: true });
}
