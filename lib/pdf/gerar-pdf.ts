/**
 * Wrapper centralizado de geração de PDF via Puppeteer.
 *
 * Produção (Vercel):  puppeteer-core + @sparticuz/chromium (sem Chromium bundled)
 * Dev local:          puppeteer completo com Chromium próprio
 *
 * Usar apenas em route handlers Node.js (nunca em Client Components ou Edge).
 * O browser é aberto e fechado por invocação — correto para Vercel serverless.
 */

export interface GerarPdfOpts {
  /** Margens da página. Padrão: 20mm topo/base, 15mm laterais. */
  margens?: {
    top: string
    bottom: string
    left: string
    right: string
  }
  /** Imprime fundos e cores CSS. Padrão: true. */
  printBackground?: boolean
}

const MARGENS_PADRAO: NonNullable<GerarPdfOpts['margens']> = {
  top: '20mm',
  bottom: '20mm',
  left: '15mm',
  right: '15mm',
}

/**
 * Converte uma string HTML completa em buffer de PDF A4.
 *
 * O HTML deve ser autocontido: CSS em <style>, imagens como data URIs ou URLs
 * acessíveis ao browser headless. Regras @media print são aplicadas pelo Puppeteer.
 */
export async function gerarPdf(
  html: string,
  opts?: GerarPdfOpts,
): Promise<Buffer> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let browser: { newPage(): Promise<any>; close(): Promise<void> }

  if (process.env.NODE_ENV === 'production') {
    // Em produção: usa chromium serverless (sem Chromium bundled no build)
    const [{ default: chromium }, { default: puppeteer }] = await Promise.all([
      import('@sparticuz/chromium'),
      import('puppeteer-core'),
    ])
    browser = await puppeteer.launch({
      args: await puppeteer.defaultArgs({ args: chromium.args, headless: 'shell' }),
      defaultViewport: { width: 1920, height: 1080 },
      executablePath: await chromium.executablePath(),
      headless: 'shell',
    })
  } else {
    // Em dev: usa puppeteer completo (Chromium gerenciado pelo próprio pacote)
    const { default: puppeteer } = await import('puppeteer')
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
  }

  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })
    const raw = await page.pdf({
      format: 'A4',
      printBackground: opts?.printBackground ?? true,
      margin: opts?.margens ?? MARGENS_PADRAO,
    })
    // Normaliza para Buffer — puppeteer v21+ já retorna Buffer, versões mais
    // antigas retornam Uint8Array; o Buffer.from() cobre ambos os casos.
    return Buffer.isBuffer(raw) ? raw : Buffer.from(raw)
  } finally {
    await browser.close()
  }
}
