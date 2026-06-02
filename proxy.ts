import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/login(.*)',
  '/onboarding(.*)',
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
  '/api/notificar-convocacao(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
