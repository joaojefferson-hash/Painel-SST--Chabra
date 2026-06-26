// app/api/health/route.ts -- healthcheck do container (compose + monitoramento).
// force-dynamic evita otimizacao estatica (precisa responder em runtime).
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ status: "ok", ts: new Date().toISOString() });
}
