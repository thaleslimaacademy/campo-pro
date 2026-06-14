import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/login(.*)',
  '/acesso-negado(.*)',
  '/matricula(.*)',
  '/rematricula(.*)',
  '/convite(.*)',
  '/pais(.*)',
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
])

const isOnboarding = createRouteMatcher(['/onboarding(.*)'])

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth()

  if (isPublicRoute(req)) return NextResponse.next()

  if (!userId) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (isOnboarding(req)) {
    const token = req.nextUrl.searchParams.get('token')
    if (!token) {
      return NextResponse.redirect(new URL('/acesso-negado', req.url))
    }
    return NextResponse.next()
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
