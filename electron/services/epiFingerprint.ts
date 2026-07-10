import { spawn } from 'child_process'
import path from 'path'

// Ponte para o helper nativo de biometria (DigitalPersona) empacotado em extraResources.
// Contrato JSON (stdout):
//   check              -> {"ok":true,"disponivel":true|false}
//   enroll             -> {"ok":true,"template":"<base64 FMD>","qualidade":N} | {"ok":false,"erro":"..."}
//   verify (template via stdin) -> {"ok":true,"match":true|false,"score":N} | {"ok":false,"erro":"..."}

export interface FpCheck { ok: boolean; disponivel?: boolean; erro?: string }
export interface FpEnroll { ok: boolean; template?: string; qualidade?: number; erro?: string }
export interface FpVerify { ok: boolean; match?: boolean; score?: number; erro?: string }

function helperPath(): string {
  // resources/native/EpiFingerprint/EpiFingerprint.exe (fora do asar, via extraResources)
  return path.join(process.resourcesPath, 'native', 'EpiFingerprint', 'EpiFingerprint.exe')
}

function run<T>(args: string[], stdin?: string): Promise<T> {
  return new Promise<T>((resolve) => {
    let out = ''
    let err = ''
    let child
    try {
      child = spawn(helperPath(), args, { windowsHide: true })
    } catch (e) {
      resolve({ ok: false, erro: `Helper de biometria indisponível: ${(e as Error).message}` } as unknown as T)
      return
    }
    child.stdout.on('data', (d) => { out += d.toString() })
    child.stderr.on('data', (d) => { err += d.toString() })
    child.on('error', (e) => resolve({ ok: false, erro: `Leitor de digital não encontrado: ${e.message}` } as unknown as T))
    child.on('close', () => {
      const txt = out.trim()
      try {
        resolve(JSON.parse(txt) as T)
      } catch {
        resolve({ ok: false, erro: err.trim() || txt || 'Resposta inválida do leitor de digital.' } as unknown as T)
      }
    })
    if (stdin) {
      child.stdin.write(stdin)
      child.stdin.end()
    }
  })
}

export const epiFingerprint = {
  check: () => run<FpCheck>(['check']),
  enroll: () => run<FpEnroll>(['enroll']),
  verify: (templateBase64: string) => run<FpVerify>(['verify'], templateBase64),
}
