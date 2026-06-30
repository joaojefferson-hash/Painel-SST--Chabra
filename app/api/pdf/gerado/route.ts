import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/client";

// Visualização/download de PDF gerado (bucket PRIVADO `pdfs-gerados`). Mesma razão
// da rota /api/pdf/assinado: o browser nao presigna buckets privados (creds escopo
// `fotos`). Server baixa com creds server e devolve same-origin (inline -> abre na
// aba; o link "Baixar" usa target=_blank). Exige sessao (middleware gateia /api/pdf).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const path = new URL(req.url).searchParams.get("path");
  if (!path) {
    return NextResponse.json({ error: "Parâmetro 'path' ausente." }, { status: 400 });
  }

  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { data, error } = await supabase.storage.from("pdfs-gerados").download(path);
  if (error || !data) {
    return NextResponse.json({ error: "PDF não encontrado." }, { status: 404 });
  }

  const bytes = new Uint8Array(await data.arrayBuffer());
  const filename = (path.split("/").pop() || "documento").replace(/[^A-Za-z0-9._-]/g, "_");
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
