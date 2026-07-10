# EpiMatcher — serviço de comparação de digitais (SourceAFIS)

Serviço HTTP que compara a digital **ao vivo** com as **cadastradas** do colaborador e
devolve `{ match, score }`. Usa **SourceAFIS** (open-source, Apache-2.0) — sem SDK
proprietário nem dependência do SGG. Roda como um container no `.107`; o Next.js chama
via rede interna do compose.

## Contrato
- `GET /health` → `{ ok: true }`
- `POST /comparar` — body `{ "sonda": "<png base64>", "amostras": ["<png base64>", …] }`
  → `{ ok: true, match: bool, score: number, threshold: number }`

## Subir no `.107` (o dev faz)
1. **Build da imagem** (nesta pasta):
   ```bash
   docker build -t epi-matcher:latest ./native/EpiMatcher
   ```
2. **Adicionar ao compose** (mesma rede do `painel-sst-app`):
   ```yaml
   epi-matcher:
     image: epi-matcher:latest
     restart: unless-stopped
     # sem porta pública: só a rede interna do compose
   ```
3. **Apontar o app** para o serviço, via variável de ambiente do `painel-sst-app`:
   ```
   EPI_MATCHER_URL=http://epi-matcher:8080
   ```
4. Testar: `docker exec painel-sst-app wget -qO- http://epi-matcher:8080/health`

## Ajustes que o dev PRECISA validar
- **Versão do SourceAFIS** (`EpiMatcher.csproj`) e a API (`FingerprintImage`, `FingerprintTemplate`, `FingerprintMatcher`) — confira contra o NuGet instalado.
- **THRESHOLD** (`Program.cs`) — score de similaridade (MAIOR = mais parecido). SourceAFIS sugere ~40 p/ FAR ~0,01%. **Calibre com dedos reais.**
- **DPI** — U.are.U 4500 = 500 dpi. Ajuste se o leitor for outro.

## Como o app usa
`app/api/epi/biometria/verificar` busca as amostras cadastradas (decifradas), manda a
sonda + amostras para `POST /comparar`, e — se `match` — grava a assinatura como digital
verificada (com o score). Se `EPI_MATCHER_URL` não estiver setado ou o serviço não
responder, a assinatura cai para o **desenho** (não trava).
