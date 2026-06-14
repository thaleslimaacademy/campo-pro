import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

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
  const isPublic = isPublicRoute(req)
  if (!isPublic) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
