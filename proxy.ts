import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/login(.*)', '/acesso-negado(.*)', '/matricula(.*)', '/rematricula(.*)',
  '/convite(.*)', '/qrcode(.*)', '/planos(.*)', '/api/webhook(.*)',
  '/api/lembretes(.*)', '/api/cobranca(.*)', '/api/perfil(.*)',
  '/api/inadimplentes(.*)', '/api/atleta-turma(.*)', '/home(.*)', '/api/aniversariantes(.*)', '/logout(.*)',
  '/pagar(.*)', '/convocacao(.*)', '/api/notificar-convocacao(.*)',
  '/api/pagar(.*)', '/api/whatsapp-aprovacao(.*)', '/galeria(.*)',
  '/loja(.*)', '/pais(.*)', '/onboarding(.*)',
  '/sign-up(.*)', '/',
  '/privacidade(.*)', '/excluir-conta(.*)',
  '/nps(.*)', '/api/push(.*)', '/api/matricula(.*)',
  '/api/cobranca-manual(.*)',
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
