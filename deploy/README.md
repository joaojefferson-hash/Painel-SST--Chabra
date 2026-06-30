# Painel SST — Self-host (.107) + CI/CD

> Doc de operação do Painel SST rodando **100% na infraestrutura Chabra (.107)**,
> versionado no **git.chabra (Forgejo)**. Para devs e sessões que consomem este repo.
> Última atualização: 2026-06-30.

---

## Arquitetura (self-host .107)

```
painel-sst.chabra.com.br  (CF Tunnel + CF Access: PIN/Google @chabra.com.br)
        |
        v
  painel-sst-app  (Next.js 15 standalone, container, 127.0.0.1:3003)
   ├─ Auth      -> GoTrue self-host (container painel-sst-gotrue) via /auth/v1/* (rewrite same-origin)
   ├─ Dados     -> PostgREST (container painel-sst-postgrest, interno) via /api/rest/v1/* -> Postgres painel_sst
   ├─ Storage   -> MinIO (storage.chabra.com.br) -- wrapper S3 (lib/storage/s3-client.ts)
   ├─ IA        -> rotas /api/fn/* (Groq) -- portadas das Supabase Edge Functions
   └─ Gestao    -> rotas /api/gestao/* (formulario publico + .ics)
```

- **Postgres**: container `db-messages-postgres`, db `painel_sst`, user **`chabra_admin`** (não `postgres`).
- **Buckets MinIO**: públicos (anon read) `fotos, anexos, atualizacoes, updates`; privados `certificados, pdfs-gerados, pdfs-assinados`.
- **JWT**: PostgREST valida via JWKS multi-chave (`PGRST_JWT_SECRET=@/jwks.json`): Supabase ES256 + `painel-svc` HS256 + `gotrue` HS256.

## CI/CD — Forgejo Actions

Push na branch **`cutover/2026-06-26`** dispara o workflow `.forgejo/workflows/deploy.yml`:

1. **checkout** → 2. **`deploy/build.ps1`** (docker build, args `NEXT_PUBLIC_*` dos Secrets, tag `:sha`+`:latest`, guarda `:previous` p/ rollback) → 3. **`deploy/migrate.ps1`** (migrations pendentes, controle em `public.schema_migrations`; 1ª execução faz **baseline** sem rodar) → 4. **`deploy/deploy.ps1`** (monta `.env.painel` dos Secrets + `docker compose up -d --force-recreate painel-sst-app`) → 5. **`deploy/healthcheck.ps1`** (`/api/health`==200 ou **rollback** p/ `:previous`).

- **Runner**: `chabra-107` (host mode — usa docker + PowerShell do host), scheduled task `ForgejoRunner` (precisa do usuário logado p/ acesso ao Docker Desktop).
- **Secrets** (Settings → Actions → Secrets): `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_STORAGE_ACCESS_KEY_ID/SECRET` (build), `AUTHENTICATOR_PWD`, `STORAGE_ACCESS_KEY_ID/SECRET` (server), `POSTGREST_SERVICE_TOKEN`, `GOTRUE_JWT_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `GROQ_API_KEY`, `RESEND_API_KEY`.
- **Migrations** daqui pra frente vão pra `.107` via este pipeline (não mais pro Supabase). Adicione o `.sql` em `supabase/migrations/` e dê push.
- O webhook Bun antigo (`:3010`) foi **desabilitado** (Forgejo Actions é a fonte única).

> **Estado (2026-06-30):** o 1º run do pipeline **falhou no build** e o Forgejo não persistiu logs legíveis pelo backend. Suspeita principal: `ROOT_URL=https://git.chabra.com.br/` (público, atrás do CF Access) faz o runner tentar upload de log/checkout no hostname público → **CF Access bloqueia server-to-server**. Correção provável: forçar o runner a usar a URL interna (`127.0.0.1:3008`) p/ tudo, ou ajustar `[server] LOCAL_ROOT_URL`. **O app vivo está correto** (deploy manual; nada quebrado).
>
> ⚠️ **AUTO-DEPLOY DESLIGADO (interino):** com o webhook Bun **desabilitado** (hook id=1) e o Forgejo Actions em ajuste, **pushes na `cutover` NÃO refletem na `.107` sozinhos**. Para restaurar enquanto o Actions não é corrigido, escolha um:
> - **Re-habilitar o webhook Bun** (`PATCH /api/v1/repos/chabra-admin/painel-sst/hooks/1` `{active:true}`) — ele já deploya a `cutover` canônica, que tem todos os fixes (seguro agora).
> - **Deploy manual** (abaixo).
> O cutover definitivo é o Forgejo Actions; até lá, a canônica do Forgejo já está correta (nada se perde).

## Deploy manual (fallback enquanto o pipeline é ajustado)

Na `.107` (`C:\temp\painel-build` = clone; `C:\temp\painel-sst\` = scripts/env operacionais):
```powershell
# build (le AnonKey do .env.painel):
powershell -File C:\temp\107-build-wrap.ps1
# deploy:
docker compose -f C:\temp\painel-sst\painel-sst-compose.yml --env-file C:\temp\painel-sst\.env.painel up -d --no-deps --force-recreate painel-sst-app
```

## Adaptações self-host aplicadas (vs o app Vercel/Supabase original)

- **Auth**: GoTrue self-host reusando os hashes bcrypt do Supabase (47 usuários migrados).
- **Storage (bucket privado no browser)**: as creds do browser têm escopo `fotos` (público) → `createSignedUrl/download` de buckets privados dá 403. O wrapper (`s3-client.ts`, `proxyPrivateBuckets`) roteia esses por **`/api/storage/file`** (creds server). Downloads de PDF assinado/gerado: **`/api/pdf/assinado`** e **`/api/pdf/gerado`**.
- **PDF (Puppeteer)**: usa o `@sparticuz/chromium` bundled via env **`PDF_USE_SPARTICUZ=1`** (o container não tem Chrome do sistema). `mem_limit` do app = 2g.
- **Assinatura por imagem**: o PDF é gerado **no cliente** (same-origin) e enviado via FormData; o fetch server-to-server na URL pública era bloqueado pelo CF Access.
- **CF Access + server-to-server**: qualquer chamada server→hostname público é bloqueada (retorna HTML de login). Use sempre a **URL interna** (`AUTH_INTERNAL_URL`, default `http://127.0.0.1:3000`) no server. Ex.: `app/api/pdf/aet` (imagens OWAS) e `app/api/sign-image`.
- **Edge Functions IA**: 16 funções Groq + welcome-email portadas p/ `/api/fn/<name>`; `client.ts` reescreve `functions.invoke('<x>')` → `/api/fn/<x>`.

## Pendências

- Ajustar o pipeline (1º run / CF Access no runner).
- Updater do Electron → re-apontar p/ Forgejo + MinIO.
- Matar Vercel + arquivar repo GitHub + pausar Supabase (após verificação final).
- **Rotacionar** a senha do Postgres do Supabase + as chaves S3 (passaram por canal inseguro durante o cutover).
