'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { usePerfil } from '@/lib/usePerfil'

interface Escola {
  id: string
  nome: string
  slug: string
  plano: string
  ativa: boolean
  statusPlano: string
  cidade: string
  estado: string
  email: string
  whatsapp: string
  valorMensalidade: number
  createdAt: string
  clerkUserId: string | null
}

interface EscolaStats extends Escola {
  totalAtletas: number
  totalCobrancas: number
  receitaMes: number
}

const PLANO_LABELS: Record<string, string> = {
  SOCIAL: 'Social',
  STARTER: 'Básico',
  PRO: 'Pro',
  ELITE: 'Elite',
}

function planoBadgeStyle(plano: string) {
  if (plano === 'ELITE') return { background: 'rgba(139,92,246,0.15)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.3)' }
  if (plano === 'PRO')   return { background: 'rgba(57,255,20,0.08)',  color: '#39FF14', border: '1px solid rgba(57,255,20,0.25)' }
  if (plano === 'STARTER') return { background: 'rgba(59,130,246,0.12)', color: '#60A5FA', border: '1px solid rgba(59,130,246,0.2)' }
  return { background: 'rgba(107,114,128,0.15)', color: '#9CA3AF', border: '1px solid rgba(107,114,128,0.2)' }
}

export default function SuperAdmin() {
  const { escolaId, role, isLoaded } = usePerfil()
  const router = useRouter()
  const [escolas, setEscolas] = useState<EscolaStats[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')

  // ── Tokens visuais ──
  const syne = 'Syne, sans-serif'
  const neon = '#39FF14'
  const gold = '#D4AF37'
  const bg = 'linear-gradient(160deg,#0a1a06,#050505,#111003)'
  const cardBg = 'rgba(255,255,255,0.03)'
  const cardBorder = '1px solid rgba(255,255,255,0.07)'

  useEffect(() => {
    if (!isLoaded) return
    if (role !== 'superadmin') { router.replace('/dashboard'); return }
    carregarEscolas()
  }, [isLoaded, role])

  async function carregarEscolas() {
    const res = await fetch('/api/super-admin/escolas')
    const data = await res.json()
    setEscolas(data)
    setLoading(false)
  }

  if (!isLoaded) return (
    <div style={{ minHeight: '100vh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Inter,sans-serif' }}>Carregando...</p>
    </div>
  )

  if (role !== 'superadmin') return null

  const filtradas = escolas.filter(e =>
    e.nome.toLowerCase().includes(busca.toLowerCase()) ||
    e.cidade.toLowerCase().includes(busca.toLowerCase()) ||
    e.email.toLowerCase().includes(busca.toLowerCase())
  )

  const totalAtletas = escolas.reduce((s, e) => s + e.totalAtletas, 0)
  const totalReceita = escolas.reduce((s, e) => s + e.receitaMes, 0)
  const totalEscolas = escolas.length

  return (
    <div style={{ minHeight: '100vh', background: bg, color: '#F0F0F0', fontFamily: 'Inter,sans-serif', paddingBottom: '40px' }}>

      {/* ── HEADER ── */}
      <div style={{ position: 'relative', overflow: 'hidden', padding: '28px 20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <div style={{ width: '200px', height: '80px', borderRadius: '50%', filter: 'blur(50px)', opacity: 0.12, background: gold }} />
        </div>
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <span style={{ fontSize: '24px' }}>👑</span>
            <h1 style={{ fontFamily: syne, fontWeight: 900, fontSize: '24px', color: gold, margin: 0 }}>Super Admin</h1>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', margin: 0 }}>Painel de controle global — GestaoFC</p>
        </div>
      </div>

      <div style={{ padding: '20px' }}>

        {/* ── STATS GLOBAIS ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '20px' }}>
          {[
            { label: 'Escolas', value: loading ? '...' : String(totalEscolas), color: gold },
            { label: 'Atletas', value: loading ? '...' : String(totalAtletas), color: neon },
            { label: 'Receita/mês', value: loading ? '...' : 'R$' + totalReceita.toFixed(0), color: neon, small: true },
          ].map(s => (
            <div key={s.label} style={{ background: cardBg, border: cardBorder, borderRadius: '14px', padding: '12px' }}>
              <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>{s.label}</p>
              <p style={{ fontFamily: syne, fontWeight: 800, fontSize: s.small ? '16px' : '22px', color: s.color, margin: 0 }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* ── BUSCA ── */}
        <input
          type="text"
          placeholder="Buscar escola, cidade ou email..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px 16px', color: '#F0F0F0', fontFamily: 'Inter,sans-serif', fontSize: '13px', outline: 'none', boxSizing: 'border-box' as const, marginBottom: '16px' }}
        />

        {/* ── LISTA DE ESCOLAS ── */}
        {loading ? (
          <p style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '40px 0' }}>Carregando escolas...</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filtradas.length === 0 && (
              <p style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '40px 0', fontSize: '13px' }}>Nenhuma escola encontrada.</p>
            )}
            {filtradas.map(escola => (
              <div key={escola.id} style={{ background: cardBg, border: escola.ativa ? cardBorder : '1px solid rgba(239,68,68,0.15)', borderRadius: '16px', padding: '16px' }}>

                {/* Nome + Badges */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <p style={{ fontFamily: syne, fontWeight: 700, fontSize: '15px', color: '#F0F0F0', margin: '0 0 2px' }}>{escola.nome}</p>
                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>{escola.cidade}, {escola.estado}</p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    <span style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '20px', fontWeight: 700, fontFamily: syne, ...planoBadgeStyle(escola.plano) }}>
                      {PLANO_LABELS[escola.plano] || escola.plano}
                    </span>
                    <span style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '20px', fontWeight: 600, background: escola.ativa ? 'rgba(57,255,20,0.08)' : 'rgba(239,68,68,0.1)', color: escola.ativa ? neon : '#F87171' }}>
                      {escola.ativa ? 'Ativa' : 'Inativa'}
                    </span>
                  </div>
                </div>

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', padding: '12px 0', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '10px' }}>
                  <div>
                    <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginBottom: '2px' }}>Atletas</p>
                    <p style={{ fontFamily: syne, fontWeight: 700, fontSize: '16px', color: '#F0F0F0', margin: 0 }}>{escola.totalAtletas}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginBottom: '2px' }}>Receita/mês</p>
                    <p style={{ fontFamily: syne, fontWeight: 700, fontSize: '16px', color: neon, margin: 0 }}>R${escola.receitaMes.toFixed(0)}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginBottom: '2px' }}>Mensalidade</p>
                    <p style={{ fontFamily: syne, fontWeight: 700, fontSize: '16px', color: gold, margin: 0 }}>R${escola.valorMensalidade}</p>
                  </div>
                </div>

                {/* Email + Data */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', margin: 0 }}>{escola.email}</p>
                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', margin: 0 }}>
                    {new Date(escola.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
