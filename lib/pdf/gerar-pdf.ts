/**
 * Wrapper centralizado de geração de PDF via Puppeteer.
 *
 * Vercel serverless:    puppeteer-core + @sparticuz/chromium
 * Dev local:            puppeteer completo (Chromium próprio do pacote)
 * Electron / prod local: puppeteer-core + Chrome/Edge instalado no sistema
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

/** Busca Chrome ou Edge instalado no sistema (Electron prod / Windows). */
async function findSystemChrome(): Promise<string> {
  const { existsSync } = await import('fs')

  const paths =
    process.platform === 'win32'
      ? [
          'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
          'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
          'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
          'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        ]
      : [
          '/usr/bin/google-chrome',
          '/usr/bin/chromium-browser',
          '/usr/bin/chromium',
          '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        ]

  const found = paths.find((p) => existsSync(p))
  if (!found) {
    throw new Error(
      'Nenhum browser compatível encontrado no sistema. ' +
        'Instale o Google Chrome ou Microsoft Edge para gerar PDFs.',
    )
  }
  return found
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

  if (process.env.VERCEL) {
    // Vercel serverless: @sparticuz/chromium (binário baixado no build)
    const [{ default: chromium }, { default: puppeteer }] = await Promise.all([
      import('@sparticuz/chromium'),
      import('puppeteer-core'),
    ])
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless as never,
    })
  } else if (process.env.NODE_ENV !== 'production') {
    // Dev: puppeteer completo (Chromium gerenciado pelo próprio pacote)
    const { default: puppeteer } = await import('puppeteer')
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
  } else {
    // Electron / prod local: puppeteer-core + Chrome ou Edge do sistema
    const executablePath = await findSystemChrome()
    const { default: puppeteer } = await import('puppeteer-core')
    browser = await puppeteer.launch({
      executablePath,
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
    return Buffer.isBuffer(raw) ? raw : Buffer.from(raw)
  } finally {
    await browser.close()
  }
}
