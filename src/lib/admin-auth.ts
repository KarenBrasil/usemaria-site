/**
 * Sessao do painel admin.
 *
 * O cookie antigo guardava apenas o texto "true" e o sistema so conferia se
 * ele existia. Na pratica, qualquer pessoa entrava no painel mandando um
 * cookie inventado. Agora o cookie carrega uma assinatura digital que so o
 * servidor sabe gerar, com data de validade.
 *
 * Este arquivo NAO pode importar "next/headers": ele tambem roda no proxy.ts,
 * que funciona em outro ambiente.
 */

const encoder = new TextEncoder()
const VALIDADE_MS = 7 * 24 * 60 * 60 * 1000 // 7 dias

function segredo(): string | null {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || null
}

function base64url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf)
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function assinar(dados: string): Promise<string | null> {
  const s = segredo()
  if (!s) return null
  const chave = await crypto.subtle.importKey(
    'raw', encoder.encode(s), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  return base64url(await crypto.subtle.sign('HMAC', chave, encoder.encode(dados)))
}

/** Gera o valor do cookie depois de um login correto. */
export async function criarToken(): Promise<string | null> {
  const exp = String(Date.now() + VALIDADE_MS)
  const assinatura = await assinar(exp)
  return assinatura ? `${exp}.${assinatura}` : null
}

/** Confere se o cookie e autentico e ainda esta na validade. */
export async function tokenValido(token?: string | null): Promise<boolean> {
  if (!token) return false
  const ponto = token.indexOf('.')
  if (ponto < 1) return false

  const exp = token.slice(0, ponto)
  const assinatura = token.slice(ponto + 1)

  const prazo = Number(exp)
  if (!Number.isFinite(prazo) || prazo < Date.now()) return false

  const esperada = await assinar(exp)
  if (!esperada || esperada.length !== assinatura.length) return false

  // Comparacao de tempo constante, para nao vazar a assinatura aos poucos.
  let diferenca = 0
  for (let i = 0; i < esperada.length; i++) {
    diferenca |= esperada.charCodeAt(i) ^ assinatura.charCodeAt(i)
  }
  return diferenca === 0
}

/** Confere a senha digitada. Sem ADMIN_PASSWORD configurada, ninguem entra. */
export function senhaCorreta(senha: unknown): boolean {
  const esperada = process.env.ADMIN_PASSWORD
  if (!esperada) {
    console.error('[admin] ADMIN_PASSWORD nao esta configurada. Login bloqueado.')
    return false
  }
  return typeof senha === 'string' && senha === esperada
}
