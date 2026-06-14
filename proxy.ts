import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createSupabaseEdge } from '@/lib/supabase-edge'

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
])

const isOnboarding = createRouteMatcher(['/onboarding(.*)'])
const isAreaPais   = createRouteMatcher(['/pais(.*)'])

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth()

  // Rotas publicas — libera sempre
  if (isPublicRoute(req)) return NextResponse.next()

  // Nao autenticado — manda para login
  if (!userId) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Onboarding — valida token
  if (isOnboarding(req)) {
    const token = req.nextUrl.searchParams.get('token')
    if (!token) {
      return NextResponse.redirect(new URL('/acesso-negado', req.url))
    }
    return NextResponse.next()
  }

  // Busca perfil no banco
  const supabase = createSupabaseEdge()
  const { data: perfil } = await supabase
    .from('PerfilUsuario')
    .select('perfil, ativo')
    .eq('clerkUserId', userId)
    .single()

  // Sem perfil cadastrado — acesso negado
  if (!perfil) {
    return NextResponse.redirect(new URL('/acesso-negado', req.url))
  }

  // Conta inativa
  if (!perfil.ativo) {
    return NextResponse.redirect(new URL('/acesso-negado?motivo=inativo', req.url))
  }

  // Area dos pais — apenas responsavel
  if (isAreaPais(req)) {
    if (perfil.perfil !== 'responsavel') {
      return NextResponse.redirect(new URL('/acesso-negado?motivo=perfil', req.url))
    }
    return NextResponse.next()
  }

  // Demais rotas protegidas — apenas admin e professor
  if (perfil.perfil === 'responsavel') {
    return NextResponse.redirect(new URL('/pais/dashboard', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
