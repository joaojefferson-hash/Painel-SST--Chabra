import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  createSupabaseServerClient,
  createSupabaseServiceClient,
  createSupabaseAuthAdminClient,
} from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

/**
 * Criação de usuário (self-host .107). Substitui a Edge Function
 * `criar-usuario-admin`, que gravava o perfil no DB ÓRFÃO do Supabase enquanto
 * o app lê `usuarios` da .107 — causa do "Login válido, mas usuário não
 * cadastrado na tabela 'usuarios'".
 *
 * Fluxo: valida que o chamador é Admin -> cria a IDENTIDADE no provedor de Auth
 * (Supabase SaaS hoje; GoTrue self-host na .107 no Bloco H) via
 * auth.admin.createUser, sem trocar a sessão do admin -> insere o PERFIL em
 * public.usuarios na .107 via service_role (PostgREST, BYPASSRLS). Rollback do
 * Auth se o INSERT do perfil falhar (não deixa identidade órfã).
 */
export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  // 1. Sessão do chamador
  const {
    data: { user: caller },
  } = await supabase.auth.getUser();
  if (!caller?.email) {
    return NextResponse.json({ ok: false, error: "Não autorizado" }, { status: 401 });
  }

  // 2. Chamador precisa ser Admin (perfil lido da .107 com o JWT dele)
  const { data: callerRow } = await supabase
    .from("usuarios")
    .select("perfil")
    .eq("email", caller.email.toLowerCase())
    .single();
  if ((callerRow as { perfil?: string } | null)?.perfil !== "Admin") {
    return NextResponse.json(
      { ok: false, error: "Apenas administradores podem criar usuários" },
      { status: 403 }
    );
  }

  // 3. Body
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido" }, { status: 400 });
  }
  const { email, senha, id_usuario, nome, ...resto } = body as {
    email?: string;
    senha?: string;
    id_usuario?: string;
    nome?: string;
    [k: string]: unknown;
  };
  if (!email || !senha || !nome || !id_usuario) {
    return NextResponse.json(
      { ok: false, error: "email, senha, nome e id_usuario são obrigatórios" },
      { status: 400 }
    );
  }
  if (typeof senha === "string" && senha.length < 6) {
    return NextResponse.json(
      { ok: false, error: "A senha deve ter pelo menos 6 caracteres" },
      { status: 400 }
    );
  }
  const emailNorm = (email as string).trim().toLowerCase();

  // 4. Cria a identidade no provedor de Auth (não toca a sessão do chamador)
  const authAdmin = createSupabaseAuthAdminClient();
  const { data: authData, error: createErr } = await authAdmin.auth.admin.createUser({
    email: emailNorm,
    password: senha as string,
    email_confirm: true,
  });
  if (createErr) {
    const msg = (createErr.message ?? "").toLowerCase();
    if (msg.includes("already registered") || msg.includes("already been registered")) {
      return NextResponse.json({ ok: false, error: "E-mail já cadastrado" }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: createErr.message }, { status: 500 });
  }

  // 5. Insere o PERFIL na .107 (service_role, BYPASSRLS)
  const service = createSupabaseServiceClient();
  const { error: insertErr } = await service.from("usuarios").insert({
    id_usuario,
    nome: (nome as string).trim(),
    email: emailNorm,
    ...resto,
  } as never);

  if (insertErr) {
    // Rollback: remove a identidade recém-criada p/ não deixar órfão no Auth
    if (authData?.user?.id) {
      await authAdmin.auth.admin.deleteUser(authData.user.id);
    }
    return NextResponse.json(
      {
        ok: false,
        error: `Usuário criado no Auth mas falhou ao salvar perfil: ${insertErr.message}`,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
