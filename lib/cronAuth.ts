import type { NextRequest } from 'next/server'

/**
 * Autoriza chamadas dos crons da Vercel.
 *
 * Com CRON_SECRET configurado na Vercel, ela manda sozinha o header
 * "Authorization: Bearer <CRON_SECRET>" em toda execucao de cron. Esse e o
 * unico jeito seguro: headers como x-vercel-cron ou user-agent qualquer um
 * consegue falsificar com um curl.
 *
 * Sem CRON_SECRET (configuracao antiga) aceita o header da Vercel para nao
 * derrubar a regua de cobranca, mas loga um aviso. Antes, sem a variavel,
 * o texto literal "Bearer undefined" passava na checagem.
 */
export function cronAutorizado(req: NextRequest): boolean {
  const segredo = process.env.CRON_SECRET
  const authHeader = req.headers.get('authorization') || ''

  if (segredo && segredo.length >= 16) {
    return authHeader === `Bearer ${segredo}`
  }

  console.warn('[cron] CRON_SECRET ausente ou curto: cron autorizado so pelo header da Vercel (inseguro). Configure CRON_SECRET na Vercel.')
  const ua = req.headers.get('user-agent') || ''
  return req.headers.get('x-vercel-cron') !== null || ua.includes('vercel-cron')
}
