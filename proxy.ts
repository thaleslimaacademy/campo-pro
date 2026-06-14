import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/login(.*)',
  '/acesso-negado(.*)',
  '/matricula(.*)',
  '/rematricula(.*)',
  '/convite(.*)',
  '/qrcode(.*)',
  '/planos(.*)',
  '/api/webhook(.*)',
  '/api/lembretes(.*)',
  '/api/cobranca(.*)',
  '/api/perfil(.*)',
  '/api/inadimplentes(.*)',
  '/api/aniversariantes(.*)',
  '/logout(.*)',
  '/pagar(.*)',
  '/convocacao(.*)',
  '/api/notificar-convocacao(.*)',
  '/api/pagar(.*)',
  '/api/whatsapp-aprovacao(.*)',
  '/galeria(.*)',
  '/loja(.*)',
  '/pais(.*)',
  '/onboarding(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return NextResponse.next()

  const { userId } = await auth()

  if (!userId) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('redirect_url', req.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
