/**
 * Gera PDF da página atual.
 *
 * Modos:
 *   - Electron        → printMainWindowPdf() (sempre, para ambos os fluxos)
 *   - Web, visualizar → window.print()  — abre o diálogo nativo, sem buffer
 *   - Web, assinar    → html-to-image + jsPDF (client-side, sem Railway)
 *
 * A abordagem Railway/Puppeteer + setContent() foi descartada: o React tentava
 * hidratar sem __NEXT_DATA__ e produzia página em branco em produção.
 * html-to-image captura o DOM vivo diretamente no browser, garantindo conteúdo
 * correto independente de serviço externo.
 */
export async function gerarHtmlParaPdf(opts?: { forSigning?: boolean }): Promise<ArrayBuffer> {
  // ── 1. Electron ──────────────────────────────────────────────────────────────
  if (typeof window !== 'undefined' && window.electronAPI?.isElectron) {
    const result = await window.electronAPI.printMainWindowPdf()
    if (!result.success || !result.data) {
      throw new Error(result.error ?? 'Erro ao gerar PDF no Electron')
    }
    const bytes = result.data as unknown as Uint8Array
    const ab = new ArrayBuffer(bytes.byteLength)
    new Uint8Array(ab).set(bytes)
    return ab
  }

  // ── 2. Web — visualizar: impressão nativa ────────────────────────────────────
  // window.print() usa o Chromium local com @media print. Não retorna bytes —
  // buffer vazio sinaliza ao caller que não há PDF para assinar.
  if (!opts?.forSigning) {
    window.print()
    return new ArrayBuffer(0)
  }

  // ── 3. Web — assinar: html-to-image + jsPDF (client-side) ────────────────────
  // Captura o conteúdo visível do documento como PNG e converte em PDF A4.
  // Mais confiável do que Railway: sem CORS, sem problemas de layout, sem
  // dependência de serviço externo.

  const { toPng } = await import('html-to-image')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { jsPDF } = (await import('jspdf')) as any

  // Encontra o container do laudo. Prioridade:
  //   1. [data-pdf-content]  — atributo explícito no container do laudo
  //   2. div.bg-white maior  — heurística: o maior div branco é o conteúdo principal
  //   3. main                — fallback semântico
  let contentEl = document.querySelector<HTMLElement>('[data-pdf-content]')

  if (!contentEl) {
    const bgWhiteEls = Array.from(
      document.querySelectorAll<HTMLElement>('div.bg-white'),
    )
    contentEl =
      bgWhiteEls.length > 0
        ? bgWhiteEls.reduce((a, b) => (b.scrollHeight > a.scrollHeight ? b : a))
        : document.querySelector<HTMLElement>('main')
  }

  if (!contentEl) {
    throw new Error(
      'Não foi possível localizar o conteúdo do documento. ' +
        'Verifique se a página carregou completamente e tente novamente.',
    )
  }

  // Dimensões do elemento
  const elW = contentEl.scrollWidth || contentEl.offsetWidth || 794
  const elH = contentEl.scrollHeight || contentEl.offsetHeight || 1123

  // A4 a 96 DPI
  const A4_W = 794
  const A4_H = 1123

  // Captura como PNG (pixelRatio: 2 para resolução 2×)
  const dataUrl = await toPng(contentEl, {
    backgroundColor: '#ffffff',
    pixelRatio: 2,
    width: elW,
    height: elH,
  })

  // Escala a imagem para A4 preservando proporção
  const scaledH = Math.round(elH * (A4_W / elW))
  const numPages = Math.max(1, Math.ceil(scaledH / A4_H))

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'px',
    format: [A4_W, A4_H],
    compress: true,
  })

  for (let i = 0; i < numPages; i++) {
    if (i > 0) pdf.addPage()
    // Desloca a imagem para cima a cada página para revelar a fatia correta
    pdf.addImage(dataUrl, 'PNG', 0, -(i * A4_H), A4_W, scaledH, '', 'FAST')
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return pdf.output('arraybuffer') as ArrayBuffer
}
