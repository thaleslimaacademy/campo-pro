import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/login(.*)', '/acesso-negado(.*)', '/matricula(.*)', '/rematricula(.*)',
  '/convite(.*)', '/qrcode(.*)', '/planos(.*)', '/api/webhook(.*)',
  '/api/lembretes(.*)', '/api/perfil(.*)', '/api/conciliacao-asaas(.*)',
  // crons (autenticados por CRON_SECRET dentro da rota)
  '/api/cobranca-reemissao(.*)', '/api/cobranca-mensal(.*)',
  '/api/inadimplentes(.*)', '/api/atleta-turma(.*)', '/home(.*)', '/api/aniversariantes(.*)', '/logout(.*)',
  '/pagar(.*)', '/pagar-atleta(.*)', '/convocacao(.*)', '/api/notificar-convocacao(.*)',
  '/api/pagar(.*)', '/api/pagar-atleta(.*)', '/galeria(.*)',
  '/fotos-compra(.*)', '/api/fotos-compra(.*)',
  '/loja(.*)', '/pais(.*)', '/onboarding(.*)',
  '/sign-up(.*)', '/',
  '/privacidade(.*)', '/excluir-conta(.*)',
  '/nps(.*)', '/api/push/subscribe(.*)', '/api/matricula(.*)',
  // /api/cobranca, /api/cobranca/acao, /cancelar e /api/cobranca-manual
  // NAO sao publicas: exigem login (e papel financeiro dentro da rota).
])

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth()

  if (!isPublicRoute(req) && !userId) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('redirect_url', req.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Injeta userId como header seguro para todas as rotas
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-clerk-user-id', userId || '')
  return NextResponse.next({ request: { headers: requestHeaders } })
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
