# Dockerfile -- Painel SST (Next 15 standalone) para o self-host .107.
# Multi-stage: deps -> builder -> runner minimo. O runtime e so o .next/standalone
# (Next traca os node_modules necessarios), entao a imagem final e enxuta.
# Build na MESMA plataforma do runtime (Linux/glibc) -> resolve nativos (sharp)
# e o Chromium do @sparticuz (que EXIGE glibc -- nao roda em alpine/musl).
#
# Build (na .107):
#   docker build -t painel-sst-app:latest \
#     --build-arg NEXT_PUBLIC_SUPABASE_URL=... [demais NEXT_PUBLIC_*] \
#     -f scripts/painel-sst/Dockerfile C:\temp\painel-build

# syntax=docker/dockerfile:1

# ---------- deps ----------
FROM node:20-bookworm AS deps
WORKDIR /app
ENV ELECTRON_SKIP_BINARY_DOWNLOAD=1 \
    PUPPETEER_SKIP_DOWNLOAD=1 \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=1 \
    NPM_CONFIG_FUND=false \
    NPM_CONFIG_AUDIT=false
COPY package.json package-lock.json* ./
# package.json mudou (deps novas: aws-sdk/postgrest-js) -> install reconcilia o lock.
RUN npm install --no-audit --no-fund

# ---------- builder ----------
FROM node:20-bookworm AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* sao inlinados no bundle client no build -> precisam existir aqui.
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_POSTGREST_URL
ARG NEXT_PUBLIC_STORAGE_ENDPOINT
ARG NEXT_PUBLIC_STORAGE_PUBLIC_ENDPOINT
ARG NEXT_PUBLIC_STORAGE_BUCKET
ARG NEXT_PUBLIC_STORAGE_ACCESS_KEY_ID
ARG NEXT_PUBLIC_STORAGE_SECRET_ACCESS_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY \
    NEXT_PUBLIC_POSTGREST_URL=$NEXT_PUBLIC_POSTGREST_URL \
    NEXT_PUBLIC_STORAGE_ENDPOINT=$NEXT_PUBLIC_STORAGE_ENDPOINT \
    NEXT_PUBLIC_STORAGE_PUBLIC_ENDPOINT=$NEXT_PUBLIC_STORAGE_PUBLIC_ENDPOINT \
    NEXT_PUBLIC_STORAGE_BUCKET=$NEXT_PUBLIC_STORAGE_BUCKET \
    NEXT_PUBLIC_STORAGE_ACCESS_KEY_ID=$NEXT_PUBLIC_STORAGE_ACCESS_KEY_ID \
    NEXT_PUBLIC_STORAGE_SECRET_ACCESS_KEY=$NEXT_PUBLIC_STORAGE_SECRET_ACCESS_KEY
RUN npm run build

# ---------- runner ----------
FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
# Libs de runtime do Chromium (sparticuz) p/ a rota /api/pdf/aep.
RUN apt-get update && apt-get install -y --no-install-recommends \
      libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 \
      libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2 \
      libpango-1.0-0 libcairo2 libxshmfence1 fonts-liberation \
    && rm -rf /var/lib/apt/lists/*
RUN groupadd -r nodejs && useradd -r -g nodejs nextjs
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
