/**
 * Monta o arquivo .env.netlify juntando:
 *   - o que ja esta na Vercel (producao)
 *   - o que so existe no seu .env local (ex: RESEND_API_KEY)
 *   - as variaveis novas que a loja passou a precisar
 *
 * NENHUM valor e mostrado na tela. O arquivo fica so no seu computador.
 *
 * Como usar:
 *   1) vercel env pull .env.vercel --environment=production
 *   2) node scripts/preparar-env-netlify.mjs
 *   3) abra .env.netlify e preencha o que estiver como PREENCHA_AQUI
 *   4) netlify env:import .env.netlify
 *   5) rm .env.vercel .env.netlify
 */
import dotenv from 'dotenv'
import { writeFileSync, existsSync } from 'fs'
import crypto from 'crypto'

const ler = (arq) => (existsSync(arq) ? dotenv.config({ path: arq }).parsed || {} : {})

const daVercel = ler('.env.vercel')
const doLocal = ler('.env')

if (!existsSync('.env.vercel')) {
  console.log('Faltou o passo 1. Rode antes:')
  console.log('   vercel env pull .env.vercel --environment=production')
  process.exit(1)
}

// O que o codigo realmente usa. O resto da Vercel e lixo herdado.
const necessarias = [
  'DATABASE_URL',
  'STRIPE_SECRET_KEY',
  'MELHOR_ENVIO_TOKEN',
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'META_CAPI_ACCESS_TOKEN',
  'RESEND_API_KEY',
]

const saida = {}
const faltando = []

for (const chave of necessarias) {
  const valor = daVercel[chave] || doLocal[chave]
  const placeholder = valor && /placeholder|^xxx|seu_|change/i.test(valor)
  if (valor && !placeholder) saida[chave] = valor
  else faltando.push(chave)
}

// Novas, geradas na hora
saida.ADMIN_SESSION_SECRET = crypto.randomBytes(32).toString('hex')
saida.CRON_SECRET = crypto.randomBytes(24).toString('hex')

// O nome na Vercel estava errado (NEXT_FB_PIXEL_ID). O codigo le este aqui.
saida.NEXT_PUBLIC_FB_PIXEL_ID = daVercel.NEXT_FB_PIXEL_ID || '907187875503640'

// Estas so voce sabe
saida.ADMIN_PASSWORD = 'PREENCHA_AQUI_senha_nova_do_admin'
saida.STORE_CEP = 'PREENCHA_AQUI_cep_da_loja'
saida.STORE_DOCUMENT = 'PREENCHA_AQUI_cpf_ou_cnpj'

const texto = Object.entries(saida).map(([k, v]) => `${k}=${v}`).join('\n') + '\n'
writeFileSync('.env.netlify', texto)

console.log('Arquivo .env.netlify criado com', Object.keys(saida).length, 'variaveis.')
console.log()
console.log('Vieram prontas (nao precisa digitar):')
for (const k of necessarias) if (saida[k]) console.log('   ' + k)
console.log('   ADMIN_SESSION_SECRET  (gerada agora)')
console.log('   CRON_SECRET           (gerada agora)')
console.log('   NEXT_PUBLIC_FB_PIXEL_ID')
if (faltando.length) {
  console.log()
  console.log('NAO ENCONTRADAS (vao ficar de fora, veja de onde tirar):')
  for (const k of faltando) console.log('   ' + k)
}
console.log()
console.log('Agora abra .env.netlify e troque os 3 campos PREENCHA_AQUI.')
console.log('Depois: netlify env:import .env.netlify')
