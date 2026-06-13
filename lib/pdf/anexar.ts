// Merge de anexos no PDF do laudo (server-side, vetorial).
// - PDFs: páginas reais mescladas via pdf-lib (texto selecionável preservado).
// - Imagens: embutidas como páginas A4 inteiras.
// - Outros arquivos: ficam apenas no índice de anexos (não embutíveis).
//
// Roda nas rotas /api/pdf/<modulo>/[id] APÓS gerarPdf(), antes de devolver.

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { TipoAnexo } from "@/lib/anexos/types";

export interface AnexoParaMerge {
  nome: string;
  descricao?: string | null;
  url: string;
  mime?: string | null;
  tipo: TipoAnexo;
}

const A4 = { w: 595.28, h: 841.89 };

async function baixarBytes(url: string): Promise<Uint8Array | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return new Uint8Array(await res.arrayBuffer());
  } catch {
    return null;
  }
}

/**
 * Mescla os anexos no PDF do laudo e devolve os bytes finais.
 * Se não houver anexos, devolve o laudo inalterado.
 */
export async function mesclarAnexos(
  laudoPdf: Uint8Array | Buffer,
  anexos: AnexoParaMerge[],
): Promise<Uint8Array> {
  const base = laudoPdf instanceof Uint8Array ? laudoPdf : new Uint8Array(laudoPdf);
  if (anexos.length === 0) return base;

  const doc = await PDFDocument.load(base);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  // Página divisória + índice dos anexos.
  const idx = doc.addPage([A4.w, A4.h]);
  let y = A4.h - 72;
  idx.drawText("ANEXOS", { x: 56, y, size: 22, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
  y -= 34;
  anexos.forEach((a, i) => {
    if (y < 56) return;
    const linha = `${i + 1}. ${a.nome}${a.descricao ? " — " + a.descricao : ""}`;
    idx.drawText(linha.length > 95 ? linha.slice(0, 95) + "…" : linha, {
      x: 56, y, size: 11, font, color: rgb(0.2, 0.2, 0.2),
    });
    y -= 18;
  });

  for (const a of anexos) {
    const bytes = await baixarBytes(a.url);
    if (!bytes) continue;

    if (a.tipo === "pdf") {
      try {
        const externo = await PDFDocument.load(bytes, { ignoreEncryption: true });
        const paginas = await doc.copyPages(externo, externo.getPageIndices());
        paginas.forEach((p) => doc.addPage(p));
      } catch {
        /* PDF ilegível/criptografado: permanece só no índice */
      }
    } else if (a.tipo === "imagem") {
      try {
        const img = (a.mime ?? "").includes("png")
          ? await doc.embedPng(bytes)
          : await doc.embedJpg(bytes);
        const page = doc.addPage([A4.w, A4.h]);
        const margin = 40;
        const maxW = A4.w - margin * 2;
        const maxH = A4.h - margin * 2 - 24;
        const escala = Math.min(maxW / img.width, maxH / img.height, 1);
        const w = img.width * escala;
        const h = img.height * escala;
        const legenda = `${a.nome}${a.descricao ? " — " + a.descricao : ""}`;
        page.drawText(legenda.length > 95 ? legenda.slice(0, 95) + "…" : legenda, {
          x: margin, y: A4.h - margin, size: 10, font, color: rgb(0.3, 0.3, 0.3),
        });
        page.drawImage(img, { x: (A4.w - w) / 2, y: (A4.h - h) / 2 - 12, width: w, height: h });
      } catch {
        /* imagem inválida: permanece só no índice */
      }
    }
    // tipo 'arquivo' (doc/xls/etc): não há como embutir vetorial; fica no índice.
  }

  return await doc.save();
}
