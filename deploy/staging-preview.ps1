# staging-preview.ps1 — sobe um container de STAGING do painel-sst (branch atual)
# para testar com DADOS REAIS, SEM tocar em produção.
#
# Isolamento total: imagem `painel-sst-staging`, container `painel-sst-staging`,
# porta 3005 — SEPARADOS de `painel-sst-app` (prod). NÃO mexe em banco, PostgREST,
# GoTrue nem no container de produção. Só LÊ dados via PostgREST (RLS respeitada).
#
# Como funciona: builda com NEXT_PUBLIC apontando para http://127.0.0.1:3005
# (same-origin), então o browser fala com o próprio container, cujos rewrites
# (/api/rest/v1 e /auth/v1) alcançam PostgREST/GoTrue internos pela rede Docker.
# Acessado via 127.0.0.1 no PRÓPRIO .107, bypassa o Cloudflare Access.
#
# Pré-requisitos (no .107):
#   - checkout da branch a testar (ex.: feat/inventario-unidades)
#   - C:\temp\painel-sst\.env.painel (env operacional de produção)
#   - Docker Desktop rodando
#
# Uso:    powershell -File deploy\staging-preview.ps1
# Parar:  docker rm -f painel-sst-staging ; docker image rm painel-sst-staging:latest
#
# ⚠️ TESTE READ-ONLY: só navegue pelas abas. NÃO crie/edite/exclua (escreveria no
#    banco real). Remova o container ao terminar.

param(
  [int]$Port = 3005,
  [string]$EnvFile = 'C:\temp\painel-sst\.env.painel'
)
$ErrorActionPreference = 'Stop'
$IMG  = 'painel-sst-staging:latest'
$NAME = 'painel-sst-staging'
$NET  = 'db-messages-main_db-messages-network'
$ORIGIN = "http://127.0.0.1:$Port"
$repoRoot = Split-Path $PSScriptRoot -Parent

if (-not (Test-Path $EnvFile)) { throw "Nao achei $EnvFile (env operacional de producao do .107)." }

# Carrega .env.painel (KEY=VALUE) num hashtable.
$cfg = @{}
Get-Content $EnvFile | ForEach-Object {
  if ($_ -match '^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$') { $cfg[$matches[1]] = $matches[2].Trim() }
}
function V($k) { if ($cfg.ContainsKey($k)) { $cfg[$k] } else { '' } }

Write-Host "==> Build $IMG (same-origin $ORIGIN) a partir de $repoRoot"
$buildArgs = @(
  '--build-arg', "NEXT_PUBLIC_SUPABASE_URL=$ORIGIN"
  '--build-arg', "NEXT_PUBLIC_SUPABASE_ANON_KEY=$(V 'NEXT_PUBLIC_SUPABASE_ANON_KEY')"
  '--build-arg', "NEXT_PUBLIC_POSTGREST_URL=$ORIGIN/api/rest/v1"
  '--build-arg', 'NEXT_PUBLIC_STORAGE_ENDPOINT=https://storage.chabra.com.br'
  '--build-arg', 'NEXT_PUBLIC_STORAGE_PUBLIC_ENDPOINT=https://storage.chabra.com.br'
  '--build-arg', 'NEXT_PUBLIC_STORAGE_BUCKET=fotos'
  '--build-arg', "NEXT_PUBLIC_STORAGE_ACCESS_KEY_ID=$(V 'NEXT_PUBLIC_STORAGE_ACCESS_KEY_ID')"
  '--build-arg', "NEXT_PUBLIC_STORAGE_SECRET_ACCESS_KEY=$(V 'NEXT_PUBLIC_STORAGE_SECRET_ACCESS_KEY')"
)
docker build -t $IMG @buildArgs -f "$repoRoot\Dockerfile" $repoRoot
if ($LASTEXITCODE -ne 0) { throw "docker build falhou" }

# Remove um staging anterior (idempotente). NAO toca no painel-sst-app.
docker rm -f $NAME *> $null

$runEnv = @(
  '-e', 'NODE_ENV=production'
  '-e', "NEXT_PUBLIC_SUPABASE_URL=$ORIGIN"
  '-e', "NEXT_PUBLIC_SUPABASE_ANON_KEY=$(V 'NEXT_PUBLIC_SUPABASE_ANON_KEY')"
  '-e', "GOTRUE_JWT_SECRET=$(V 'GOTRUE_JWT_SECRET')"
  '-e', "NEXT_PUBLIC_POSTGREST_URL=$ORIGIN/api/rest/v1"
  '-e', 'POSTGREST_INTERNAL_URL=http://painel-sst-postgrest:3000'
  '-e', 'NEXT_PUBLIC_STORAGE_ENDPOINT=https://storage.chabra.com.br'
  '-e', 'NEXT_PUBLIC_STORAGE_PUBLIC_ENDPOINT=https://storage.chabra.com.br'
  '-e', 'NEXT_PUBLIC_STORAGE_BUCKET=fotos'
  '-e', "STORAGE_ACCESS_KEY_ID=$(V 'STORAGE_ACCESS_KEY_ID')"
  '-e', "STORAGE_SECRET_ACCESS_KEY=$(V 'STORAGE_SECRET_ACCESS_KEY')"
  '-e', "POSTGREST_SERVICE_TOKEN=$(V 'POSTGREST_SERVICE_TOKEN')"
  '-e', "SUPABASE_SERVICE_ROLE_KEY=$(V 'SUPABASE_SERVICE_ROLE_KEY')"
  '-e', 'PDF_USE_SPARTICUZ=1'
)
Write-Host "==> Run $NAME em $ORIGIN (rede $NET)"
docker run -d --name $NAME --network $NET -p "127.0.0.1:${Port}:3000" @runEnv $IMG
if ($LASTEXITCODE -ne 0) { throw "docker run falhou" }

Write-Host ""
Write-Host "STAGING OK  ->  abra no navegador DO .107:  $ORIGIN"
Write-Host "Logs:   docker logs -f $NAME"
Write-Host "Parar:  docker rm -f $NAME ; docker image rm $IMG"
Write-Host ""
Write-Host "(Fotos: se nao carregarem, adicione NEXT_PUBLIC_STORAGE_ACCESS_KEY_ID e"
Write-Host " NEXT_PUBLIC_STORAGE_SECRET_ACCESS_KEY ao .env.painel e rode de novo — opcional.)"
