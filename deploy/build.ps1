# Build da imagem painel-sst-app a partir do workspace (checkout). Args NEXT_PUBLIC_*
# vem do env (secrets). Guarda a :latest atual como :previous p/ rollback.
$ErrorActionPreference = 'Stop'
$sha = if ($env:GITHUB_SHA) { $env:GITHUB_SHA.Substring(0, [Math]::Min(12, $env:GITHUB_SHA.Length)) } else { 'manual' }

docker image inspect painel-sst-app:latest *> $null
if ($LASTEXITCODE -eq 0) { docker tag painel-sst-app:latest painel-sst-app:previous | Out-Null }

docker build -t "painel-sst-app:$sha" -t painel-sst-app:latest `
  --build-arg NEXT_PUBLIC_SUPABASE_URL=https://painel-sst.chabra.com.br `
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=$env:ANON `
  --build-arg NEXT_PUBLIC_POSTGREST_URL=https://painel-sst.chabra.com.br/api/rest/v1 `
  --build-arg NEXT_PUBLIC_STORAGE_ENDPOINT=https://storage.chabra.com.br `
  --build-arg NEXT_PUBLIC_STORAGE_PUBLIC_ENDPOINT=https://storage.chabra.com.br `
  --build-arg NEXT_PUBLIC_STORAGE_BUCKET=fotos `
  --build-arg NEXT_PUBLIC_STORAGE_ACCESS_KEY_ID=$env:UPID `
  --build-arg NEXT_PUBLIC_STORAGE_SECRET_ACCESS_KEY=$env:UPSEC `
  -f Dockerfile .
if ($LASTEXITCODE -ne 0) { throw "docker build falhou" }
Write-Output "IMAGE_BUILT painel-sst-app:$sha (+ :latest)"
