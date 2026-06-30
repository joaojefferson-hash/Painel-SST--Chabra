import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/client";

// Stream genérico de arquivo de bucket PRIVADO (creds server). O browser nao
// presigna privados (creds escopo `fotos`); o wrapper (s3-client) aponta
// createSignedUrl/download desses buckets pra ca. Exige sessao (middleware
// gateia /api). Whitelist evita virar proxy aberto pra qualquer bucket.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ALLOWED = new Set(["certificados", "pdfs-gerados", "pdfs-assinados"]);

function contentTypeFor(path: string): string {
  const p = path.toLowerCase();
  if (p.endsWith(".pdf")) return "application/pdf";
  if (p.endsWith(".png")) return "image/png";
  if (p.endsWith(".jpg") || p.endsWith(".jpeg")) return "image/jpeg";
  if (p.endsWith(".webp")) return "image/webp";
  return "application/octet-stream";
}

export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams;
  const bucket = sp.get("bucket");
  const path = sp.get("path");
  if (!bucket || !path) {
    return NextResponse.json({ error: "Parâmetros 'bucket' e 'path' obrigatórios." }, { status: 400 });
  }
  if (!ALLOWED.has(bucket)) {
    return NextResponse.json({ error: "Bucket não permitido." }, { status: 403 });
  }

  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { data, error } = await supabase.storage.from(bucket).download(path);
  if (error || !data) {
    return NextResponse.json({ error: "Arquivo não encontrado." }, { status: 404 });
  }

  const bytes = new Uint8Array(await data.arrayBuffer());
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": contentTypeFor(path),
      "Content-Disposition": "inline",
      "Cache-Control": "private, no-store",
    },
  });
}
