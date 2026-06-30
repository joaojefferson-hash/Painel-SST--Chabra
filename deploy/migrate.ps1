# Aplica migrations pendentes em supabase/migrations/*.sql, controladas por
# public.schema_migrations. Na 1a execucao faz BASELINE: marca todas as migrations
# atuais como aplicadas SEM rodar (a .107 ja esta no estado atual via re-dump 2026-06-28).
$ErrorActionPreference = 'Stop'
$c = 'db-messages-postgres'; $db = 'painel_sst'

docker exec $c psql -U chabra_admin -d $db -v ON_ERROR_STOP=1 -c "CREATE TABLE IF NOT EXISTS public.schema_migrations (version text primary key, applied_at timestamptz default now());" | Out-Null
if ($LASTEXITCODE -ne 0) { throw "criar schema_migrations falhou" }

$migs = @(Get-ChildItem "supabase\migrations\*.sql" -ErrorAction SilentlyContinue | Sort-Object Name)
$count = (docker exec $c psql -U chabra_admin -d $db -tAc "SELECT count(*) FROM public.schema_migrations" | Out-String).Trim()

if ($count -eq '0') {
  foreach ($m in $migs) {
    docker exec $c psql -U chabra_admin -d $db -c "INSERT INTO public.schema_migrations(version) VALUES ('$($m.BaseName)') ON CONFLICT DO NOTHING;" | Out-Null
  }
  Write-Output ("schema_migrations BASELINE: " + $migs.Count + " marcadas (sem rodar)")
  exit 0
}

$applied = @((docker exec $c psql -U chabra_admin -d $db -tAc "SELECT version FROM public.schema_migrations") -split "`r?`n" | ForEach-Object { $_.Trim() } | Where-Object { $_ })
$n = 0
foreach ($m in $migs) {
  $v = $m.BaseName
  if ($applied -contains $v) { continue }
  Write-Output "aplicando migration $v"
  docker cp $m.FullName "${c}:/tmp/$($m.Name)" | Out-Null
  docker exec $c psql -U chabra_admin -d $db -1 -v ON_ERROR_STOP=1 -f "/tmp/$($m.Name)"
  if ($LASTEXITCODE -ne 0) { throw "migration $v falhou" }
  docker exec $c psql -U chabra_admin -d $db -c "INSERT INTO public.schema_migrations(version) VALUES ('$v') ON CONFLICT DO NOTHING;" | Out-Null
  $n++
}
Write-Output ("migrations OK (" + $n + " nova(s) aplicada(s))")
