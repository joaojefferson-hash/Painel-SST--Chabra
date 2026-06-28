import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// /api/health: liberado p/ o healthcheck do container.
// /api/rest/v1: proxy same-origin do PostgREST -- a auth e feita la (JWT -> RLS);
//   rodar getUser() aqui por request de dados seria lento e redundante. CF Access
//   e o gate externo do app.
// /auth/v1: proxy same-origin do GoTrue (Bloco H). O middleware roda ANTES do
//   rewrite -- sem isto, login/refresh (sem sessao ainda) cairiam em /login.
const PUBLIC_PATHS = ["/login", "/f/", "/api/health", "/api/rest/v1", "/auth/v1"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Permite assets e api públicas livremente.
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  // Sem credenciais ainda? Não bloqueia para o dev conseguir abrir login.
  if (!url || !key || url === "PREENCHER" || key === "PREENCHER") {
    if (pathname !== "/login") {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  const response = NextResponse.next({ request });

  // Auth no servidor: URL publica (p/ o nome do cookie de sessao bater com o do
  // browser) mas a chamada de rede vai pra porta interna do app -- o CF Access
  // bloqueia server-to-server na URL publica.
  const internalAuthBase = process.env.AUTH_INTERNAL_URL ?? "http://127.0.0.1:3000";
  const authFetch: typeof fetch = (input, init) => {
    const rw = (u: string) => (url && u.startsWith(url) ? internalAuthBase + u.slice(url.length) : u);
    if (typeof input === "string") return fetch(rw(input), init);
    if (input instanceof URL) return fetch(rw(input.href), init);
    const r = input as Request;
    return fetch(new Request(rw(r.url), r), init);
  };
  const supabase = createServerClient(url, key, {
    global: { fetch: authFetch },
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookies) {
        for (const { name, value, options } of cookies) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    // Tudo, exceto: arquivos estáticos do Next, imagens e API auth do Supabase.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico)$).*)",
  ],
};
