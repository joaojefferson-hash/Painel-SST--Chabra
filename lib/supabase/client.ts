// lib/supabase/client.ts -- versao self-host (Painel SST, cutover .107).
//
// Wrapper composto que mantem a API do supabase-js mas direciona cada
// sub-servico para um backend diferente:
//   .auth       -> Supabase Auth SaaS  (NEXT_PUBLIC_SUPABASE_URL)
//   .from/.rpc  -> PostgREST self-host (.107), RLS real via JWT do usuario
//   .storage    -> MinIO self-host via wrapper S3 (NEXT_PUBLIC_STORAGE_ENDPOINT)
//
// Os call sites que chamam createSupabaseBrowserClient()/ServerClient()/
// ServiceClient() NAO mudam -- a forma do objeto e preservada.
//
// PostgREST same-origin (decisao 2026-06-21):
//   - BROWSER: base ABSOLUTA same-origin (NEXT_PUBLIC_POSTGREST_URL =
//     https://painel-sst.chabra.com.br/api/rest/v1). Um rewrite (next.config.ts)
//     encaminha /api/rest/v1/* -> http://painel-sst-postgrest:3000/* (interno).
//   - SERVIDOR: fala DIRETO o PostgREST interno por DNS docker
//     (POSTGREST_INTERNAL_URL = http://painel-sst-postgrest:3000), SEM /rest/v1.
//
// Service client: bypassa RLS via token service_role (PostgREST aceita por JWKS
// multi-key; role=service_role no Postgres tem BYPASSRLS). Storage usa creds
// SERVER-ONLY (le buckets privados: certificados/pdfs-*), nunca as do bundle.

import {
  createBrowserClient,
  createServerClient,
  type CookieOptions,
} from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { PostgrestClient } from "@supabase/postgrest-js";
import type { Database } from "./types";
import { createStorageNamespace, type StorageNamespace } from "@/lib/storage/s3-client";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

// Base do PostgREST: browser usa same-origin absoluto; servidor usa DNS interno.
const browserPostgrestBase = process.env.NEXT_PUBLIC_POSTGREST_URL ?? supabaseUrl;
const serverPostgrestBase = process.env.POSTGREST_INTERNAL_URL ?? browserPostgrestBase;

// Storage (MinIO). Endpoint publico p/ ambos (presigned URLs precisam ser
// alcancaveis pelo browser); o que muda sao as CREDENCIAIS por contexto.
const storageEndpoint = process.env.NEXT_PUBLIC_STORAGE_ENDPOINT ?? "";
const storagePublicEndpoint =
  process.env.NEXT_PUBLIC_STORAGE_PUBLIC_ENDPOINT ?? storageEndpoint;
const storageBucket = process.env.NEXT_PUBLIC_STORAGE_BUCKET ?? "fotos";

// Creds publicas (bundle) -- escopo bucket `fotos` (upload/leitura publica).
const pubKeyId = process.env.NEXT_PUBLIC_STORAGE_ACCESS_KEY_ID ?? "";
const pubSecret = process.env.NEXT_PUBLIC_STORAGE_SECRET_ACCESS_KEY ?? "";
// Creds server-only -- leem buckets PRIVADOS (certificados/pdfs-*). Fallback p/
// as publicas em dev se as server nao estiverem setadas.
const srvKeyId = process.env.STORAGE_ACCESS_KEY_ID ?? pubKeyId;
const srvSecret = process.env.STORAGE_SECRET_ACCESS_KEY ?? pubSecret;

// Token service_role (server-only). JWT com role=service_role aceito pelo
// PostgREST (JWKS multi-key); BYPASSRLS no Postgres. Fallback p/ a service key
// legada do Supabase se o token interno nao estiver setado.
const serviceToken =
  process.env.POSTGREST_SERVICE_TOKEN ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

if (!supabaseUrl || !anonKey) {
  if (typeof window !== "undefined") {
    console.warn(
      "[supabase] NEXT_PUBLIC_SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_ANON_KEY nao definidas"
    );
  }
}

// ------------------------------------------------------------
// Tipos do cliente composto
// ------------------------------------------------------------

type SupabaseAuthLikeClient = ReturnType<typeof createBrowserClient<Database>>;
type AuthClient = SupabaseAuthLikeClient["auth"];
type FunctionsClient = SupabaseAuthLikeClient["functions"];
type PostgrestFrom = PostgrestClient<Database>["from"];
type PostgrestRpc = PostgrestClient<Database>["rpc"];

export interface ComposedSupabaseClient {
  auth: AuthClient;
  functions: FunctionsClient;
  from: PostgrestFrom;
  rpc: PostgrestRpc;
  storage: StorageNamespace;
}

// ------------------------------------------------------------
// Helper: PostgREST com Authorization dinamico.
// `baseUrl` ja vem completo por contexto -- NAO concatenar /rest/v1 aqui.
// ------------------------------------------------------------

function makePostgrestClient(
  baseUrl: string,
  getAccessToken: () => Promise<string | null>
): PostgrestClient<Database> {
  return new PostgrestClient<Database>(baseUrl, {
    fetch: async (input, init) => {
      const token = await getAccessToken();
      const headers = new Headers(init?.headers);
      headers.set("apikey", anonKey); // paridade supabase-js; PostgREST puro ignora
      headers.set("Authorization", token ? `Bearer ${token}` : `Bearer ${anonKey}`);
      return fetch(input, { ...init, headers });
    },
  });
}

// ------------------------------------------------------------
// Browser client
// ------------------------------------------------------------

export function createSupabaseBrowserClient(): ComposedSupabaseClient {
  const auth = createBrowserClient<Database>(supabaseUrl, anonKey);
  const postgrest = makePostgrestClient(browserPostgrestBase, async () => {
    const { data } = await auth.auth.getSession();
    return data.session?.access_token ?? null;
  });
  const storage = createStorageNamespace({
    endpoint: storageEndpoint,
    publicEndpoint: storagePublicEndpoint,
    bucket: storageBucket,
    accessKeyId: pubKeyId,
    secretAccessKey: pubSecret,
  });
  return {
    auth: auth.auth,
    functions: auth.functions,
    from: postgrest.from.bind(postgrest),
    rpc: postgrest.rpc.bind(postgrest),
    storage,
  };
}

// ------------------------------------------------------------
// Server client (Route Handlers, Server Actions, Server Components)
// ------------------------------------------------------------

type CookieStore = {
  getAll: () => { name: string; value: string }[];
  set?: (name: string, value: string, options?: CookieOptions) => void;
};

export function createSupabaseServerClient(cookieStore: CookieStore): ComposedSupabaseClient {
  const auth = createServerClient<Database>(supabaseUrl, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookies) {
        if (!cookieStore.set) return;
        for (const { name, value, options } of cookies) {
          try {
            cookieStore.set(name, value, options);
          } catch {
            // contexto read-only (Server Components fora de Route Handlers)
          }
        }
      },
    },
  });
  const postgrest = makePostgrestClient(serverPostgrestBase, async () => {
    const { data } = await auth.auth.getSession();
    return data.session?.access_token ?? null;
  });
  const storage = createStorageNamespace({
    endpoint: storageEndpoint,
    publicEndpoint: storagePublicEndpoint,
    bucket: storageBucket,
    accessKeyId: srvKeyId,
    secretAccessKey: srvSecret,
  });
  return {
    auth: auth.auth,
    functions: auth.functions,
    from: postgrest.from.bind(postgrest),
    rpc: postgrest.rpc.bind(postgrest),
    storage,
  };
}

// ------------------------------------------------------------
// Service client -- SERVICE_ROLE: bypassa RLS. USAR SOMENTE server-side e
// SOMENTE depois de validar auth/autorizacao manualmente na rota.
// .from/.rpc usam o token service_role contra o PostgREST interno (BYPASSRLS);
// .storage usa creds server-only (le buckets privados: certificados/pdfs-*).
// ------------------------------------------------------------

export function createSupabaseServiceClient(): ComposedSupabaseClient {
  if (!serviceToken) {
    throw new Error("POSTGREST_SERVICE_TOKEN (ou SUPABASE_SERVICE_ROLE_KEY) nao configurado no servidor.");
  }
  // Auth-only client sem sessao (paridade de forma; rotas usam o server client p/ auth).
  const auth = createClient<Database>(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const postgrest = makePostgrestClient(serverPostgrestBase, async () => serviceToken);
  const storage = createStorageNamespace({
    endpoint: storageEndpoint,
    publicEndpoint: storagePublicEndpoint,
    bucket: storageBucket,
    accessKeyId: srvKeyId,
    secretAccessKey: srvSecret,
  });
  return {
    auth: auth.auth,
    functions: auth.functions,
    from: postgrest.from.bind(postgrest),
    rpc: postgrest.rpc.bind(postgrest),
    storage,
  };
}
