import { NextRequest, NextResponse } from 'next/server'

/**
 * Manifest do app instalado (PWA).
 * Admin: abre no /dashboard. Pais: ?start=/pais/<token> faz o app instalado
 * pela familia abrir direto na Area dos Pais (necessario para o aviso no iPhone).
 */
export function GET(req: NextRequest) {
  const start = req.nextUrl.searchParams.get('start') || '/dashboard'
  const seguro = /^\/(dashboard|pais\/[A-Za-z0-9_-]{8,80})$/.test(start) ? start : '/dashboard'
  const pais = seguro.startsWith('/pais/')
  const manifest = {
    id: pais ? seguro : '/dashboard',
    name: pais ? 'GestãoFC Pais' : 'GestãoFC',
    short_name: pais ? 'GestãoFC Pais' : 'GestãoFC',
    description: pais ? 'Avisos, presença e mensalidades do seu filho' : 'Gestão de escolinha de futebol',
    start_url: seguro,
    scope: '/',
    display: 'standalone',
    background_color: '#F6F8F7',
    theme_color: '#4169E1',
    orientation: 'portrait',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
  return new NextResponse(JSON.stringify(manifest), {
    headers: { 'Content-Type': 'application/manifest+json', 'Cache-Control': 'public, max-age=3600' },
  })
}
