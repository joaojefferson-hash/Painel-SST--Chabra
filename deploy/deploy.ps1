# Monta o .env.painel a partir dos secrets (env) e recria so o painel-sst-app.
# postgrest + gotrue ficam de pe (compose/stacks separados).
$ErrorActionPreference = 'Stop'
$dir = 'C:\temp\painel-sst'; New-Item -ItemType Directory -Force -Path $dir | Out-Null
$envFile = "$dir\.env.painel"
@(
  "AUTHENTICATOR_PWD=$env:AUTHENTICATOR_PWD"
  "NEXT_PUBLIC_SUPABASE_ANON_KEY=$env:NEXT_PUBLIC_SUPABASE_ANON_KEY"
  "STORAGE_ACCESS_KEY_ID=$env:STORAGE_ACCESS_KEY_ID"
  "STORAGE_SECRET_ACCESS_KEY=$env:STORAGE_SECRET_ACCESS_KEY"
  "POSTGREST_SERVICE_TOKEN=$env:POSTGREST_SERVICE_TOKEN"
  "GOTRUE_JWT_SECRET=$env:GOTRUE_JWT_SECRET"
  "SUPABASE_SERVICE_ROLE_KEY=$env:SUPABASE_SERVICE_ROLE_KEY"
  "GROQ_API_KEY=$env:GROQ_API_KEY"
  "RESEND_API_KEY=$env:RESEND_API_KEY"
) | Set-Content -Encoding ascii $envFile

# Remove um painel-sst-app preso de deploy manual / projeto compose anterior. O
# runner roda em working dir variavel -> nome de projeto compose diferente -> o
# container vira "orfao" (nao pertence a este projeto) e o compose tenta CRIAR,
# batendo em "name already in use". Idempotente (no-op se nao existir). So o app
# (stateless) e tocado: postgrest/gotrue/DB sao stacks separados e ficam de pe.
docker rm -f painel-sst-app *> $null

docker compose -f "deploy\painel-sst-compose.yml" --env-file $envFile up -d --no-deps --force-recreate painel-sst-app
if ($LASTEXITCODE -ne 0) { throw "docker compose up falhou" }
Write-Output "DEPLOY_OK"
