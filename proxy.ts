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

  // Rotas públicas — libera sem verificação
  if (isPublicRoute(req)) return NextResponse.next()

  // Não logado — redireciona para login
  if (!userId) {
    const loginUrl = new URL('/login', req.url)
    return NextResponse.redirect(loginUrl)
  }

  // Onboarding — só permite via convite (tem ?token= na URL)
  if (isOnboarding(req)) {
    const token = req.nextUrl.searchParams.get('token')
    if (!token) {
      return NextResponse.redirect(new URL('/acesso-negado', req.url))
    }
    return NextResponse.next()
  }

  // Verifica se usuário tem perfil no banco
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env
  if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/PerfilUsuario?clerkUserId=eq.${userId}&select=id,ativo&limit=1`,
      { headers: { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` } }
    )
    const perfis = await res.json()
    const perfil = perfis?.[0]

    if (!perfil || !perfil.ativo) {
      return NextResponse.redirect(new URL('/acesso-negado', req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
