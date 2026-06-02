'use client'
import { usePerfil } from '@/lib/usePerfil'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Atleta = {
  id: string
  nome: string
  posicao: string | null
  turmaId: string | null
}

export default function Atletas() {
  const { escolaId, isLoaded } = usePerfil()
  const [atletas, setAtletas] = useState<Atleta[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')

  const syne = 'Syne, sans-serif'
  const neon = '#39FF14'
  const gold = '#D4AF37'
  const muted = 'rgba(255,255,255,0.4)'
  const cardBg = 'rgba(255,255,255,0.05)'
  const cardBorder = '1px solid rgba(255,255,255,0.07)'

  useEffect(() => {
    if (!escolaId) return
    async function carregar() {
      const { data } = await supabase
        .from('Atleta')
        .select('id, nome, posicao, turmaId')
        .eq('escolaId', escolaId!)
        .eq('ativo', true)
        .order('nome')
      setAtletas(data || [])
      setLoading(false)
    }
    carregar()
  }, [escolaId])

  const filtrados = atletas.filter(a =>
    a.nome.toLowerCase().includes(busca.toLowerCase()) ||
    (a.posicao || '').toLowerCase().includes(busca.toLowerCase())
  )

  const iniciais = (nome: string) => nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()

  const corPosicao = (pos: string | null) => {
    if (!pos) return muted
    const p = pos.toLowerCase()
    if (p.includes('goleiro')) return '#60a5fa'
    if (p.includes('zagueiro') || p.includes('lateral')) return '#a78bfa'
    if (p.includes('meio') || p.includes('volante')) return gold
    if (p.includes('atacante') || p.includes('centroavante') || p.includes('ponta')) return neon
    return muted
  }

  if (!isLoaded || !escolaId) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: muted, fontFamily: 'Inter, sans-serif' }}>Carregando...</p>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '80px', color: '#F0F0F0', fontFamily: 'Inter, sans-serif' }}>

      {/* HEADER */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <div>
            <div style={{ fontSize: '10px', color: muted, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '2px' }}>Elenco</div>
            <div style={{ fontFamily: syne, fontSize: '24px', fontWeight: 800, color: '#F0F0F0' }}>
              Atletas <span style={{ color: neon }}>({atletas.length})</span>
            </div>
          </div>
          <a href="/atletas/novo" style={{
            background: 'linear-gradient(135deg,#39FF14,#00cc00)',
            color: '#000',
            padding: '10px 18px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: 800,
            fontFamily: syne,
            textDecoration: 'none',
            boxShadow: '0 0 16px rgba(57,255,20,0.3)',
          }}>+ Novo</a>
        </div>
      </div>

      {/* BUSCA */}
      <div style={{ padding: '16px 20px' }}>
        <input
          type="text"
          placeholder="Buscar atleta ou posicao..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          style={{
            width: '100%',
            background: cardBg,
            border: cardBorder,
            borderRadius: '12px',
            padding: '12px 16px',
            color: '#F0F0F0',
            fontFamily: 'Inter, sans-serif',
            fontSize: '13px',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* STATS */}
      {!loading && atletas.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', padding: '0 20px 16px' }}>
          {[
            { label: 'Total', value: atletas.length, color: neon },
            { label: 'Atacantes', value: atletas.filter(a => a.posicao?.toLowerCase().includes('atacante') || a.posicao?.toLowerCase().includes('ponta') || a.posicao?.toLowerCase().includes('centroavante')).length, color: neon },
            { label: 'Goleiros', value: atletas.filter(a => a.posicao?.toLowerCase().includes('goleiro')).length, color: '#60a5fa' },
          ].map(s => (
            <div key={s.label} style={{ background: cardBg, border: cardBorder, borderRadius: '12px', padding: '10px 12px' }}>
              <div style={{ fontSize: '9px', color: muted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>{s.label}</div>
              <div style={{ fontFamily: syne, fontSize: '20px', fontWeight: 800, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* LISTA */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: muted }}>Carregando...</div>
      )}

      {!loading && atletas.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>o</div>
          <p style={{ fontFamily: syne, fontSize: '18px', fontWeight: 700, color: '#F0F0F0', marginBottom: '8px' }}>Nenhum atleta</p>
          <p style={{ fontSize: '13px', color: muted, marginBottom: '24px' }}>Cadastre o primeiro atleta da sua escola</p>
          <a href="/atletas/novo" style={{ background: 'linear-gradient(135deg,#39FF14,#00cc00)', color: '#000', padding: '12px 24px', borderRadius: '12px', fontSize: '13px', fontWeight: 800, fontFamily: syne, textDecoration: 'none' }}>
            Cadastrar atleta
          </a>
        </div>
      )}

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {filtrados.map((atleta, i) => (
          <a
            key={atleta.id}
            href={'/atletas/' + atleta.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              background: cardBg,
              border: cardBorder,
              borderRadius: '16px',
              padding: '14px',
              textDecoration: 'none',
              color: '#F0F0F0',
              transition: 'border-color 0.2s',
            }}
          >
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg,rgba(57,255,20,0.2),rgba(57,255,20,0.05))',
              border: '1px solid rgba(57,255,20,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: syne,
              fontWeight: 800,
              fontSize: '14px',
              color: neon,
              flexShrink: 0,
            }}>
              {iniciais(atleta.nome)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily: syne, fontWeight: 700, fontSize: '14px', color: '#F0F0F0', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{atleta.nome}</p>
              <p style={{ fontSize: '11px', color: corPosicao(atleta.posicao), margin: '2px 0 0', fontWeight: 500 }}>{atleta.posicao || 'Sem posicao'}</p>
            </div>
            <div style={{ fontSize: '10px', fontFamily: syne, fontWeight: 800, color: neon, padding: '4px 10px', background: 'rgba(57,255,20,0.08)', borderRadius: '20px', flexShrink: 0 }}>
              #{String(i + 1).padStart(2, '0')}
            </div>
          </a>
        ))}
      </div>

      {busca && filtrados.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: muted }}>
          <p>Nenhum atleta encontrado para "{busca}"</p>
        </div>
      )}

      {/* NAV */}
      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-around', padding: '12px 0 20px', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(5,5,5,0.95)', backdropFilter: 'blur(10px)' }}>
        {[
          { href: '/dashboard', label: 'Inicio', active: false },
          { href: '/atletas', label: 'Atletas', active: true },
          { href: '/presenca', label: 'Presenca', active: false },
          { href: '/financeiro', label: 'Financeiro', active: false },
        ].map(item => (
          <a key={item.href} href={item.href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', textDecoration: 'none' }}>
            <span style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px', color: item.active ? neon : muted, fontFamily: syne, fontWeight: item.active ? 700 : 400 }}>{item.label}</span>
            {item.active && <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: neon, boxShadow: '0 0 4px #39FF14' }}></div>}
          </a>
        ))}
      </nav>
    </div>
  )
}
