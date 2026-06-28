import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  createSupabaseServerClient,
  createSupabaseServiceClient,
} from "@/lib/supabase/client";
import { createSupabaseAuthAdminClient } from "@/lib/supabase/auth-admin";

export const dynamic = "force-dynamic";

/**
 * Exclusão de usuário (admin). Pós-Bloco H: remove a identidade no GoTrue
 * (auth.admin.deleteUser) E o perfil em public.usuarios na .107 -- substitui a
 * RPC excluir_usuario_admin, que só apagava o stub auth.users (no-op).
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
      { ok: false, error: "Apenas administradores podem excluir usuários" },
      { status: 403 }
    );
  }

  let body: { id_usuario?: string; email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido" }, { status: 400 });
  }
  const { id_usuario, email } = body;
  if (!email) {
    return NextResponse.json({ ok: false, error: "email é obrigatório" }, { status: 400 });
  }
  if (email.toLowerCase() === caller.email.toLowerCase()) {
    return NextResponse.json(
      { ok: false, error: "Não é possível excluir o próprio usuário" },
      { status: 400 }
    );
  }

  const admin = createSupabaseAuthAdminClient();
  const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const target = list?.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (target) {
    const { error: delErr } = await admin.auth.admin.deleteUser(target.id);
    if (delErr) {
      return NextResponse.json({ ok: false, error: delErr.message }, { status: 500 });
    }
  }
  // Remove o perfil na .107 (service_role, BYPASSRLS)
  const service = createSupabaseServiceClient();
  const q = service.from("usuarios").delete();
  const { error: profErr } = id_usuario
    ? await q.eq("id_usuario", id_usuario)
    : await q.eq("email", email.toLowerCase());
  if (profErr) {
    return NextResponse.json(
      { ok: false, error: `Identidade removida, mas falhou ao apagar o perfil: ${profErr.message}` },
      { status: 500 }
    );
  }
  return NextResponse.json({ ok: true });
}
