// lib/supabase/auth-admin.ts -- SERVER-ONLY. Cliente admin do provedor de Auth.
// Pos-Bloco H o Auth e o GoTrue self-host (.107): a Admin API exige um JWT
// service_role assinado com GOTRUE_JWT_SECRET. Mintamos esse JWT aqui (HS256)
// e o passamos como "key" ao supabase-js, que o usa como Bearer nas chamadas
// auth.admin.*. Fallback p/ SUPABASE_SERVICE_ROLE_KEY (Supabase SaaS) se o
// GOTRUE_JWT_SECRET nao estiver setado (antes do flip).
//
// node:crypto so existe no server -- este arquivo NUNCA deve ser importado por
// client components (so por route handlers em app/api/*).
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const gotrueSecret = process.env.GOTRUE_JWT_SECRET ?? "";
const legacyKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

function b64url(o: object): string {
  return Buffer.from(JSON.stringify(o)).toString("base64url");
}

function mintServiceRoleJWT(): string {
  const now = Math.floor(Date.now() / 1000);
  const head = b64url({ alg: "HS256", typ: "JWT" });
  const body = b64url({
    role: "service_role",
    aud: "authenticated",
    iss: "painel-sst",
    iat: now,
    exp: now + 300,
  });
  const sig = crypto
    .createHmac("sha256", gotrueSecret)
    .update(`${head}.${body}`)
    .digest("base64url");
  return `${head}.${body}.${sig}`;
}

export function createSupabaseAuthAdminClient() {
  const key = gotrueSecret ? mintServiceRoleJWT() : legacyKey;
  if (!key) {
    throw new Error(
      "Auth admin: nem GOTRUE_JWT_SECRET nem SUPABASE_SERVICE_ROLE_KEY configurados no servidor."
    );
  }
  return createClient<Database>(supabaseUrl, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
