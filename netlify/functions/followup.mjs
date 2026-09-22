/**
 * Substitui o cron que rodava na Vercel (vercel.json).
 * Todo dia a meia-noite chama a rota de follow-up de pedidos pendentes.
 *
 * A logica em si continua em src/app/api/cron/followup/route.ts.
 * Esta funcao so faz o disparo no horario.
 */
export default async () => {
  const base = process.env.URL || process.env.DEPLOY_PRIME_URL
  if (!base) {
    console.error('[cron] URL do site nao disponivel')
    return new Response('sem URL', { status: 500 })
  }

  const cabecalhos = {}
  if (process.env.CRON_SECRET) {
    cabecalhos.authorization = `Bearer ${process.env.CRON_SECRET}`
  }

  const resposta = await fetch(`${base}/api/cron/followup`, { headers: cabecalhos })
  const texto = await resposta.text()
  console.log('[cron] follow-up:', resposta.status, texto.slice(0, 200))

  return new Response(texto, { status: resposta.status })
}

export const config = {
  schedule: '0 0 * * *',
}
