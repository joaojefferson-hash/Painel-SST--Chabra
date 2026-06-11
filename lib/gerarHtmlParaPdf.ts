/**
 * Captura o HTML da página atual e gera um PDF A4 nativo.
 *
 * Ordem de prioridade:
 *   1. Electron (desktop) — abre janela invisível com Chromium local via IPC
 *      → sem Railway, sem rasterização, sem timeout Vercel
 *   2. Railway Puppeteer  — para usuários web sem app desktop
 *      → token HMAC de 2 min, @media print aplicado pelo Chrome
 *
 * Em ambos os casos:
 *   - PDF gerado por page.pdf() / printToPDF() do Chrome (texto vetorial)
 *   - @media print CSS é aplicado corretamente
 *   - Não usa html-to-image, canvas, JPEG, nem jsPDF
 */
export async function gerarHtmlParaPdf(): Promise<ArrayBuffer> {
  // ── 1. Electron: imprime a janela principal diretamente ──────────
  // Mais confiável que abrir uma janela oculta — a main window já está
  // visível, autenticada e com a página carregada.
  // Sidebar e barra de ações têm print:hidden → só o conteúdo do relatório
  // aparece no PDF.
  if (typeof window !== 'undefined' && window.electronAPI?.isElectron) {
    const result = await window.electronAPI.printMainWindowPdf()
    if (!result.success || !result.data) {
      throw new Error(result.error ?? 'Erro ao gerar PDF no Electron')
    }
    // Buffer Node.js → ArrayBuffer
    const bytes = result.data as unknown as Uint8Array
    const ab = new ArrayBuffer(bytes.byteLength)
    new Uint8Array(ab).set(bytes)
    return ab
  }

  // ── 2. Browser: impressão nativa (Ctrl+P → Salvar como PDF) ────────
  // O Railway Puppeteer gerava PDF em branco porque não conseguia
  // carregar o CSS do Next.js via URL externa. window.print() usa o
  // mesmo motor Chromium e aplica o @media print corretamente.
  // A assinatura digital A1 continua disponível apenas no app desktop.
  window.print()
  // Retorna buffer vazio — BotaoGerarPdf ignora o fluxo de assinatura
  // neste caso.
  return new ArrayBuffer(0)
}
