import type { NextConfig } from "next";
import path from "node:path";
import { version } from "./package.json";

// Proxy same-origin p/ o PostgREST interno (cutover .107). O browser chama
// /api/rest/v1/* (mesma origem, sem hostname publico do PostgREST) e o Next
// reescreve para o container interno. SSR fala o interno direto (ver client.ts).
const postgrestInternal =
  process.env.POSTGREST_INTERNAL_URL ?? "http://painel-sst-postgrest:3000";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: version,
  },
  // Necessario para empacotar o Next.js dentro do Electron (producao desktop)
  // e para a imagem Docker standalone do self-host.
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname),
  transpilePackages: ["xlsx"],
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core", "puppeteer"],
  outputFileTracingIncludes: {
    "/api/pdf/aep/[id]": ["./node_modules/@sparticuz/chromium/**/*"],
  },
  async rewrites() {
    return [
      {
        // PostgREST puro serve as tabelas na raiz -> sem /rest/v1 no destino.
        source: "/api/rest/v1/:path*",
        destination: `${postgrestInternal}/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      // Storage self-host (MinIO via tunnel CF).
      { protocol: "https", hostname: "storage.chabra.com.br" },
      // Legado Supabase Storage (fallback p/ URLs antigas nao reescritas).
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
};

export default nextConfig;
