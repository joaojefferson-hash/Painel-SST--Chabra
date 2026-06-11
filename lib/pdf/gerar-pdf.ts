/**
 * Wrapper centralizado de geração de PDF via Puppeteer.
 *
 * Vercel serverless:    puppeteer-core + @sparticuz/chromium
 * Dev local / Electron: puppeteer-core + Chrome ou Edge do sistema
 *
 * Usar apenas em route handlers Node.js (nunca em Client Components ou Edge).
 */

import { existsSync } from 'fs'

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

/** Caminhos comuns do Chrome/Edge por plataforma. */
const SYSTEM_CHROME_PATHS: string[] =
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

function findSystemChrome(): string {
  const found = SYSTEM_CHROME_PATHS.find((p) => existsSync(p))
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
    // Vercel serverless: @sparticuz/chromium (binário baixado no build via camada)
    const [{ default: chromium }, { default: puppeteer }] = await Promise.all([
      import('@sparticuz/chromium'),
      import('puppeteer-core'),
    ])
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: { width: 794, height: 1123 }, // A4 a 96dpi (210mm × 297mm)
      executablePath: await chromium.executablePath(),
      headless: 'shell' as never,
    })
  } else {
    // Dev local / Electron prod: puppeteer-core + Chrome ou Edge do sistema
    const executablePath = findSystemChrome()
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
