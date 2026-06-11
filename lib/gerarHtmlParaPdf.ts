/**
 * Gera PDF da página atual.
 *
 * Modos:
 *   - Electron          → printMainWindowPdf() (sempre, para ambos os fluxos)
 *   - Web, visualizar   → window.print()  — sem buffer, só abre o diálogo
 *   - Web, assinar      → Railway Puppeteer com CSS inline — retorna bytes reais
 *
 * O modo "assinar" é necessário porque a rota /api/sign-pdf precisa de bytes
 * reais para passar ao @signpdf. window.print() não retorna bytes.
 */
export async function gerarHtmlParaPdf(opts?: { forSigning?: boolean }): Promise<ArrayBuffer> {
  // ── 1. Electron ──────────────────────────────────────────────────
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

  // ── 2. Web — visualizar: impressão nativa do navegador ───────────
  // window.print() usa o motor Chromium local com @media print aplicado.
  // Não retorna bytes — buffer vazio indica ao caller que não há PDF para assinar.
  if (!opts?.forSigning) {
    window.print()
    return new ArrayBuffer(0)
  }

  // ── 3. Web — assinar: Railway Puppeteer com CSS inline ───────────
  // Para assinar precisamos de bytes reais. Enviamos o HTML com estilos
  // inlining para evitar o PDF em branco causado pelo Puppeteer não
  // conseguir carregar /_next/static/css/... do Vercel.
  const tokenRes = await fetch('/api/pdf/token', { method: 'POST' })
  if (!tokenRes.ok) {
    const body = await tokenRes.json().catch(() => ({}))
    throw new Error(
      (body as { error?: string }).error ??
        'Serviço de PDF não disponível. Tente pelo aplicativo desktop para assinar.',
    )
  }
  const { token, serviceUrl } = (await tokenRes.json()) as {
    token: string
    serviceUrl: string
  }

  const clone = document.documentElement.cloneNode(true) as HTMLElement

  // Remove elementos print:hidden
  clone
    .querySelectorAll<HTMLElement>('[class*="print:hidden"]')
    .forEach((el) => el.remove())

  // Remove portais fora do root Next.js
  const cloneBody = clone.querySelector('body')
  if (cloneBody) {
    const nextRoot = cloneBody.firstElementChild
    Array.from(cloneBody.children).forEach((child) => {
      if (child !== nextRoot) child.remove()
    })
  }

  // ── CSS inline ────────────────────────────────────────────────────
  // Puppeteer não consegue carregar /_next/static/css/*.css via setContent().
  // Extraímos todas as regras CSS carregadas e as injetamos como <style>.
  let cssText = ''
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      for (const rule of Array.from(sheet.cssRules)) {
        cssText += rule.cssText + '\n'
      }
    } catch {
      // Cross-origin ou sheet ainda não carregada — ignora
    }
  }
  if (cssText) {
    clone.querySelectorAll('link[rel="stylesheet"]').forEach((el) => el.remove())
    const styleEl = document.createElement('style')
    styleEl.textContent = cssText
    clone.querySelector('head')?.prepend(styleEl)
  }

  // Torna URLs de imagem absolutas
  clone.querySelectorAll<HTMLImageElement>('img[src]').forEach((img) => {
    const src = img.getAttribute('src')
    if (src && src.startsWith('/')) {
      img.src = window.location.origin + src
    }
  })

  const html = clone.outerHTML

  const pdfRes = await fetch(`${serviceUrl}/render`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, html, baseUrl: window.location.origin }),
  })

  if (!pdfRes.ok) {
    const body = await pdfRes.json().catch(() => ({}))
    throw new Error(
      (body as { error?: string }).error ??
        'Erro ao gerar PDF para assinatura. Tente pelo aplicativo desktop.',
    )
  }

  return pdfRes.arrayBuffer()
}
