'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { usePerfil } from '@/lib/usePerfil'
import { supabase } from '@/lib/supabase'
import { useEffect, useState, useRef } from 'react'
import AccountButton from '@/components/AccountButton'

/* ─────────────────────────────────────────
   DESIGN TOKENS — Royal Blue + Cyan
───────────────────────────────────────── */
const C = {
  bg:        '#080C18',
  surface:   '#0D1230',
  surface2:  '#111827',
  blue:      '#4169E1',
  blueDim:   'rgba(65,105,225,0.13)',
  blueBrd:   'rgba(65,105,225,0.22)',
  cyan:      '#00BFFF',
  cyanDim:   'rgba(0,191,255,0.12)',
  text:      '#F0F4FF',
  muted:     'rgba(160,180,220,0.55)',
  border:    'rgba(65,105,225,0.12)',
  border2:   'rgba(65,105,225,0.22)',
}
const SYNE  = "'Syne', 'Segoe UI', sans-serif"
const INTER = "'Inter', 'Segoe UI', sans-serif"

/* ─────────────────────────────────────────
   NAVEGAÇÃO
───────────────────────────────────────── */
const NAV = [
  { href: '/dashboard',        label: 'Início',     icon: '▦' },
  { href: '/atletas',          label: 'Atletas',    icon: '⚽' },
  { href: '/presenca',         label: 'Presença',   icon: '✓' },
  { href: '/financeiro/caixa', label: 'Financeiro', icon: '◈' },
]

const TITULO: Record<string, string> = {
  '/atletas':                   'Atletas',
  '/presenca':                  'Presença',
  '/turmas':                    'Turmas',
  '/campeonato':                'Campeonatos',
  '/convocacao':                'Convocações',
  '/mensagens':                 'Mensagens',
  '/matriculas':                'Matrículas',
  '/configuracoes':             'Configurações',
  '/financeiro/mensalidades':   'Mensalidades',
  '/financeiro/caixa':          'Caixa',
  '/financeiro/patrocinadores': 'Patrocinadores',
  '/financeiro/boleto':         'Boleto',
  '/relatorios':                'Relatórios',
  '/alteracao-massa':           'Alteração em Massa',
}

/* ─────────────────────────────────────────
   LOGO 3D — Canvas renderer
   Mesma lógica do showcase, encapsulada
───────────────────────────────────────── */
function draw3DLogo(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const W  = canvas.width
  const H  = canvas.height
  const cx = W / 2
  const cy = H / 2 - W * 0.04
  const R  = W * 0.36

  ctx.clearRect(0, 0, W, H)

  // Rounded square background
  const rr = W * 0.22
  ctx.beginPath()
  ctx.moveTo(rr, 0); ctx.lineTo(W - rr, 0)
  ctx.quadraticCurveTo(W, 0, W, rr)
  ctx.lineTo(W, H - rr); ctx.quadraticCurveTo(W, H, W - rr, H)
  ctx.lineTo(rr, H); ctx.quadraticCurveTo(0, H, 0, H - rr)
  ctx.lineTo(0, rr); ctx.quadraticCurveTo(0, 0, rr, 0)
  ctx.closePath()
  const bgG = ctx.createLinearGradient(0, 0, W, H)
  bgG.addColorStop(0, '#0D1230')
  bgG.addColorStop(1, '#080C18')
  ctx.fillStyle = bgG
  ctx.fill()
  ctx.strokeStyle = 'rgba(65,105,225,0.3)'
  ctx.lineWidth = W * 0.015
  ctx.stroke()

  // Ball shadow
  const shadowG = ctx.createRadialGradient(cx + R * 0.18, cy + R * 0.22, 0, cx, cy, R * 1.1)
  shadowG.addColorStop(0, 'rgba(0,0,0,0)')
  shadowG.addColorStop(1, 'rgba(0,0,30,0.55)')
  ctx.beginPath(); ctx.arc(cx, cy, R * 1.05, 0, Math.PI * 2)
  ctx.fillStyle = shadowG; ctx.fill()

  // Main ball sphere
  const ballG = ctx.createRadialGradient(cx - R * 0.28, cy - R * 0.28, R * 0.05, cx, cy, R)
  ballG.addColorStop(0,    '#6B9FFF')
  ballG.addColorStop(0.25, '#4169E1')
  ballG.addColorStop(0.6,  '#2040B8')
  ballG.addColorStop(1,    '#0D1A60')
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2)
  ctx.fillStyle = ballG; ctx.fill()

  // Specular highlight
  const specG = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.3, 0, cx - R * 0.2, cy - R * 0.2, R * 0.55)
  specG.addColorStop(0,   'rgba(255,255,255,0.55)')
  specG.addColorStop(0.4, 'rgba(180,210,255,0.2)')
  specG.addColorStop(1,   'rgba(180,210,255,0)')
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2)
  ctx.fillStyle = specG; ctx.fill()

  // Hex patches (clipped to ball)
  ctx.save()
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.clip()

  const hexPatch = (px: number, py: number, pr: number, alpha: number) => {
    ctx.beginPath()
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i - Math.PI / 6
      const x = px + pr * Math.cos(a)
      const y = py + pr * Math.sin(a)
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    }
    ctx.closePath()
    const pg = ctx.createRadialGradient(px - pr * 0.2, py - pr * 0.2, 0, px, py, pr)
    pg.addColorStop(0, `rgba(10,20,100,${alpha * 0.6})`)
    pg.addColorStop(1, `rgba(5,10,60,${alpha})`)
    ctx.fillStyle = pg; ctx.fill()
    ctx.strokeStyle = `rgba(100,149,237,${alpha * 0.7})`
    ctx.lineWidth = W * 0.018; ctx.stroke()
  }

  const pr = R * 0.32
  hexPatch(cx, cy, pr, 0.85)
  ;[
    [0, -R * 0.62], [R * 0.54, -R * 0.31], [R * 0.54, R * 0.31],
    [0, R * 0.62],  [-R * 0.54, R * 0.31], [-R * 0.54, -R * 0.31],
  ].forEach(([dx, dy]) => hexPatch(cx + dx, cy + dy, pr, 0.7))
  ctx.restore()

  // Ball outer ring
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(100,149,237,0.45)'; ctx.lineWidth = W * 0.012; ctx.stroke()

  // Analytics bars 3D
  const bx = cx + R * 0.22
  const by = cy + R * 0.18
  const bw = R * 0.22
  const bsp = R * 0.28
  const bHeights = [R * 0.28, R * 0.42, R * 0.58]
  const bColors: [string, string][] = [['#00BFFF','#0090CC'],['#29D4FF','#00AADD'],['#7DD3FC','#3BB8F0']]

  bHeights.forEach((bh, i) => {
    const bl = bx + i * bsp - R * 0.28
    const bt = by - bh
    const g = ctx.createLinearGradient(bl, bt, bl + bw, bt + bh)
    g.addColorStop(0, bColors[i][0]); g.addColorStop(1, bColors[i][1])
    // Top face
    ctx.beginPath()
    ctx.moveTo(bl, bt); ctx.lineTo(bl + bw, bt)
    ctx.lineTo(bl + bw + bw * 0.25, bt - bw * 0.18); ctx.lineTo(bl + bw * 0.25, bt - bw * 0.18)
    ctx.closePath(); ctx.fillStyle = bColors[i][0]; ctx.globalAlpha = 0.9; ctx.fill()
    // Side face
    ctx.beginPath()
    ctx.moveTo(bl + bw, bt); ctx.lineTo(bl + bw + bw * 0.25, bt - bw * 0.18)
    ctx.lineTo(bl + bw + bw * 0.25, by - bw * 0.18); ctx.lineTo(bl + bw, by)
    ctx.closePath(); ctx.fillStyle = bColors[i][1]; ctx.globalAlpha = 0.7; ctx.fill()
    // Front face
    ctx.beginPath(); ctx.roundRect(bl, bt, bw, bh, [3, 3, 0, 0])
    ctx.fillStyle = g; ctx.globalAlpha = 0.92; ctx.fill()
    ctx.globalAlpha = 1
  })

  // Trend line
  const t0x = bx - R * 0.28, t0y = by - bHeights[0] + bHeights[0] * 0.5
  const t1x = bx,            t1y = by - bHeights[1] + bHeights[1] * 0.3
  const t2x = bx + R * 0.28, t2y = by - bHeights[2] + bHeights[2] * 0.1
  ctx.beginPath()
  ctx.moveTo(t0x, t0y)
  ctx.bezierCurveTo(t0x + R * 0.1, t0y - R * 0.05, t1x - R * 0.1, t1y + R * 0.05, t1x, t1y)
  ctx.bezierCurveTo(t1x + R * 0.1, t1y - R * 0.05, t2x - R * 0.1, t2y + R * 0.05, t2x, t2y)
  ctx.strokeStyle = '#7DD3FC'; ctx.lineWidth = W * 0.022; ctx.lineCap = 'round'
  ctx.shadowColor = '#00BFFF'; ctx.shadowBlur = W * 0.06; ctx.stroke(); ctx.shadowBlur = 0

  // Arrow tip
  const ang = Math.atan2(t2y - t1y, t2x - t1x)
  ctx.save(); ctx.translate(t2x, t2y); ctx.rotate(ang)
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-W * 0.07, -W * 0.04); ctx.lineTo(-W * 0.07, W * 0.04)
  ctx.closePath(); ctx.fillStyle = '#7DD3FC'
  ctx.shadowColor = '#00BFFF'; ctx.shadowBlur = W * 0.05; ctx.fill()
  ctx.shadowBlur = 0; ctx.restore()

  // Ground glow
  const glowG = ctx.createRadialGradient(cx, cy + R * 0.85, 0, cx, cy + R * 0.85, R * 0.7)
  glowG.addColorStop(0, 'rgba(65,105,225,0.25)'); glowG.addColorStop(1, 'rgba(65,105,225,0)')
  ctx.beginPath(); ctx.ellipse(cx, cy + R * 0.88, R * 0.65, R * 0.18, 0, 0, Math.PI * 2)
  ctx.fillStyle = glowG; ctx.fill()
}

/* ─────────────────────────────────────────
   COMPONENTE: Logo3D
───────────────────────────────────────── */
function Logo3D({ size = 40 }: { size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    if (ref.current) draw3DLogo(ref.current)
  }, [])
  return (
    <canvas
      ref={ref}
      width={size * 2}
      height={size * 2}
      style={{ width: size, height: size, display: 'block', flexShrink: 0 }}
    />
  )
}

/* ─────────────────────────────────────────
   APP LAYOUT
───────────────────────────────────────── */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname   = usePathname()
  const { isLoaded, escolaId, role } = usePerfil()
  const [nomeEscola, setNomeEscola]  = useState('Gestão FC')

  useEffect(() => {
    if (!escolaId) return
    supabase.from('Escola').select('nome').eq('id', escolaId).single()
      .then(({ data }) => { if (data) setNomeEscola(data.nome) })
  }, [escolaId])

  /* ── Loading ── */
  if (!isLoaded) return (
    <div style={{
      minHeight: '100vh', background: C.bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ textAlign: 'center' }}>
        <Logo3D size={52} />
        <p style={{ color: C.muted, fontFamily: INTER, fontSize: 12, marginTop: 14, letterSpacing: '0.08em' }}>
          Verificando acesso…
        </p>
      </div>
    </div>
  )

  /* ── Sem role ── */
  if (!role) return (
    <div style={{
      minHeight: '100vh', background: C.bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{ textAlign: 'center', maxWidth: 340 }}>
        <div style={{
          width: 64, height: 64, borderRadius: 16,
          background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28, margin: '0 auto 20px',
        }}>🔒</div>
        <h1 style={{ fontFamily: SYNE, fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 8 }}>
          Acesso não autorizado
        </h1>
        <p style={{ color: C.muted, fontFamily: INTER, fontSize: 13, lineHeight: 1.65, marginBottom: 20 }}>
          Sua conta não tem permissão de acesso ao GestãoFC.<br />
          Entre em contato com o administrador da sua academia.
        </p>
        <AccountButton />
      </div>
    </div>
  )

  const isDashboard = pathname === '/dashboard'
  const titulo = TITULO[pathname]
    ?? TITULO[Object.keys(TITULO).find(k => pathname.startsWith(k)) ?? '']
    ?? ''

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: INTER }}>

      {/* ════ HEADER ════ */}
      {!isDashboard && (
        <header style={{
          position: 'sticky', top: 0, zIndex: 40,
          height: 56,
          background: 'rgba(8,12,24,0.88)',
          backdropFilter: 'blur(14px)',
          borderBottom: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          /* Glow lateral esquerdo */
          boxShadow: `inset 80px 0 60px -40px rgba(65,105,225,0.08)`,
        }}>

          {/* Esquerda: logo + título */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
              <Logo3D size={38} />
            </Link>

            {/* Divisor */}
            <div style={{
              width: 1, height: 22, margin: '0 4px',
              background: 'linear-gradient(to bottom, transparent, rgba(65,105,225,0.35), transparent)',
            }} />

            <div>
              <div style={{
                fontFamily: SYNE, fontWeight: 800, fontSize: 14,
                color: C.text, lineHeight: 1.15, letterSpacing: '-0.02em',
              }}>
                {titulo || (
                  <>
                    Gestão
                    <span style={{
                      background: 'linear-gradient(135deg, #4169E1, #00BFFF)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}>FC</span>
                  </>
                )}
              </div>
              {titulo && (
                <div style={{ fontSize: 10, color: C.muted, letterSpacing: '0.04em' }}>
                  {nomeEscola}
                </div>
              )}
            </div>
          </div>

          {/* Direita: AccountButton */}
          <AccountButton />
        </header>
      )}

      {/* ════ CONTEÚDO ════ */}
      <div style={{ paddingBottom: 84 }}>
        {children}
      </div>

      {/* ════ BOTTOM NAV ════ */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'rgba(13,18,48,0.95)',
        backdropFilter: 'blur(16px)',
        borderTop: `1px solid ${C.border}`,
        display: 'flex', justifyContent: 'space-around',
        padding: '8px 0 20px',
        zIndex: 50,
      }}>
        {NAV.map(item => {
          const active = pathname === item.href
            || (item.href !== '/dashboard' && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, textDecoration: 'none', minWidth: 64, position: 'relative' }}
            >
              {/* Pill de fundo quando ativo */}
              {active && (
                <div style={{
                  position: 'absolute',
                  top: -2, left: '50%', transform: 'translateX(-50%)',
                  width: 44, height: 44,
                  borderRadius: 12,
                  background: C.blueDim,
                  border: `1px solid ${C.blueBrd}`,
                }} />
              )}

              {/* Ícone */}
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: active ? 18 : 16,
                position: 'relative', zIndex: 1,
                color: active ? C.cyan : C.muted,
                transition: 'color 0.15s',
                /* Glow no ícone ativo */
                textShadow: active ? `0 0 12px ${C.cyan}` : 'none',
              }}>
                {item.icon}
              </div>

              {/* Label */}
              <span style={{
                fontSize: 9,
                fontFamily: SYNE,
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: active ? C.blue : C.muted,
                transition: 'color 0.15s',
              }}>
                {item.label}
              </span>

              {/* Dot indicador */}
              {active && (
                <div style={{
                  width: 3, height: 3, borderRadius: '50%',
                  background: C.cyan,
                  boxShadow: `0 0 6px ${C.cyan}`,
                  marginTop: 1,
                }} />
              )}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
