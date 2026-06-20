'use client'
import { useEffect, useState } from 'react'
import { usePerfil } from '@/lib/usePerfil'
import { supabase } from '@/lib/supabase'

const T = {
  bg: '#0A0E1A', surface: '#0D1220', primary: '#4169E1', accent: '#00BFFF',
  sky: '#7DD3FC', text: '#F0F4FF', muted: 'rgba(240,244,255,0.4)',
  border: 'rgba(240,244,255,0.08)', green: '#00D67A', red: '#FF4444',
}
const SYNE = 'Syne, sans-serif'

export default function Atletas() {
  const { escolaId } = usePerfil()
  const [atletas, setAtletas] = useState<any[]>([])
  const [busca, setBusca] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!escolaId) return
    supabase.from('Atleta').select('id, nome, posicao, fotoUrl, bolsista')
      .eq('escolaId', escolaId).eq('ativo', true).order('nome')
      .then(({ data }) => { setAtletas(data || []); setLoading(false) })
  }, [escolaId])

  const filtrados = atletas.filter(a => a.nome.toLowerCase().includes(busca.toLowerCase()))

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: 'Inter, sans-serif', paddingBottom: 80 }}>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css" />

      {/* HEADER */}
      <div style={{ background: T.primary, padding: '20px 20px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 10, color: 'rgba(240,244,255,0.65)', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 700, marginBottom: 4 }}>Elenco</div>
            <div style={{ fontFamily: SYNE, fontWeight: 900, fontSize: 26, color: T.text, letterSpacing: -0.8, textTransform: 'uppercase', lineHeight: 1 }}>
              Atletas <span style={{ color: T.accent, fontStyle: 'italic' }}>{atletas.length}</span>
            </div>
          </div>
          <a href="/atletas/novo" style={{ background: T.text, color: T.primary, borderRadius: 8, padding: '10px 16px', fontFamily: SYNE, fontWeight: 800, fontSize: 12, textDecoration: 'none', textTransform: 'uppercase', letterSpacing: 0.5 }}>+ Novo</a>
        </div>
      </div>

      {/* STATS */}
      <div style={{ display: 'flex', background: '#080C15', borderBottom: `1px solid ${T.border}` }}>
        <div style={{ flex: 1, padding: '12px 0', textAlign: 'center', borderRight: `1px solid ${T.border}` }}>
          <div style={{ fontFamily: SYNE, fontSize: 20, fontWeight: 900, color: T.accent }}>{atletas.length}</div>
          <div style={{ fontSize: 9, color: T.muted, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 700, marginTop: 3 }}>Total</div>
        </div>
        <div style={{ flex: 1, padding: '12px 0', textAlign: 'center', borderRight: `1px solid ${T.border}` }}>
          <div style={{ fontFamily: SYNE, fontSize: 20, fontWeight: 900, color: T.green }}>{atletas.filter(a => !a.bolsista).length}</div>
          <div style={{ fontSize: 9, color: T.muted, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 700, marginTop: 3 }}>Pagantes</div>
        </div>
        <div style={{ flex: 1, padding: '12px 0', textAlign: 'center' }}>
          <div style={{ fontFamily: SYNE, fontSize: 20, fontWeight: 900, color: '#00C896' }}>{atletas.filter(a => a.bolsista).length}</div>
          <div style={{ fontSize: 9, color: T.muted, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 700, marginTop: 3 }}>Bolsistas</div>
        </div>
      </div>

      {/* BUSCA */}
      <div style={{ padding: '14px 20px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 14px' }}>
          <i className="ti ti-search" style={{ fontSize: 16, color: T.muted }} aria-hidden="true"></i>
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar atleta, posição..." style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: T.text, fontSize: 13, fontFamily: 'Inter, sans-serif' }} />
        </div>
      </div>

      {/* LISTA */}
      <div style={{ padding: '0 20px' }}>
        {loading && <p style={{ color: T.muted, textAlign: 'center', padding: '40px 0', fontSize: 13 }}>Carregando...</p>}
        {filtrados.map((a, i) => (
          <a key={a.id} href={`/atletas/${a.id}`} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 0', borderBottom: `1px solid ${T.border}`, textDecoration: 'none' }}>
            <div style={{ width: 44, height: 44, borderRadius: 8, background: T.surface, border: `1.5px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SYNE, fontWeight: 900, fontSize: 14, color: T.primary, flexShrink: 0, overflow: 'hidden' }}>
              {a.fotoUrl ? <img src={a.fotoUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={a.nome} /> : a.nome.slice(0, 2).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: SYNE, fontWeight: 800, fontSize: 13, color: T.text, textTransform: 'uppercase', letterSpacing: 0.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.nome}</div>
              <div style={{ fontSize: 10, color: T.muted, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>{a.posicao || 'Sem posição'}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              {a.bolsista && <span style={{ fontSize: 9, fontWeight: 800, color: '#00C896', background: 'rgba(0,200,150,0.12)', padding: '2px 7px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Bolsista</span>}
              <span style={{ fontFamily: SYNE, fontWeight: 900, fontSize: 13, color: T.primary, fontStyle: 'italic' }}>{String(i + 1).padStart(2, '0')}</span>
            </div>
          </a>
        ))}
      </div>

      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-around', padding: '10px 0 20px', borderTop: `1px solid ${T.border}`, background: 'rgba(10,14,26,0.97)', backdropFilter: 'blur(12px)', zIndex: 50 }}>
        {[
          { href: '/dashboard', label: 'Início', icon: 'ti-home' },
          { href: '/atletas', label: 'Atletas', icon: 'ti-users', active: true },
          { href: '/presenca', label: 'Presença', icon: 'ti-check' },
          { href: '/financeiro/caixa', label: 'Financeiro', icon: 'ti-wallet' },
        ].map(item => (
          <a key={item.href} href={item.href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, textDecoration: 'none' }}>
            <i className={`ti ${item.icon}`} style={{ fontSize: 22, color: (item as any).active ? T.primary : T.muted }} aria-hidden="true"></i>
            <span style={{ fontSize: 9, fontFamily: SYNE, fontWeight: 700, color: (item as any).active ? T.primary : T.muted, letterSpacing: '0.5px', textTransform: 'uppercase' }}>{item.label}</span>
          </a>
        ))}
      </nav>
    </div>
  )
}
