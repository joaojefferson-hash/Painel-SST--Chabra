# Gate de saude pos-deploy: /api/health == 200 em ate ~60s. Se falhar, rollback
# pra imagem :previous (a anterior) e recria. Falha o job (sinaliza o deploy ruim).
$ErrorActionPreference = 'Continue'
$ok = $false
for ($i = 0; $i -lt 12; $i++) {
  Start-Sleep -Seconds 5
  try {
    $r = Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:3003/api/health' -TimeoutSec 5
    if ($r.StatusCode -eq 200) { $ok = $true; break }
  } catch {}
}
if ($ok) { Write-Output "HEALTH_OK"; exit 0 }

Write-Output "HEALTH FALHOU -> rollback para :previous"
docker image inspect painel-sst-app:previous *> $null
if ($LASTEXITCODE -eq 0) {
  docker tag painel-sst-app:previous painel-sst-app:latest | Out-Null
  docker compose -f "deploy\painel-sst-compose.yml" --env-file C:\temp\painel-sst\.env.painel up -d --no-deps --force-recreate painel-sst-app | Out-Null
  Write-Output "rollback aplicado (:previous)"
}
throw "Health check falhou apos o deploy"
