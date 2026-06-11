'use client'
import { usePerfil } from '@/lib/usePerfil'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Atleta = { id: string; nome: string; posicao: string | null }
type Presenca = { atletaId: string; status: 'PRESENTE' | 'AUSENTE' }

export default function Presenca() {
  const { escolaId, isLoaded } = usePerfil()
  const [atletas, setAtletas] = useState<Atleta[]>([])
  const [presencas, setPresencas] = useState<Record<string, 'PRESENTE' | 'AUSENTE'>>({})
  const [treinoId, setTreinoId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState<string | null>(null)

  const hoje = new Date().toLocaleDateString('pt-BR')
  const syne = 'Syne, sans-serif'
  const neon = '#FF6B00'
  const muted = 'rgba(255,255,255,0.4)'

  useEffect(() => {
    if (!escolaId) return
    async function carregar() {
      const { data: atletasData } = await supabase
        .from('Atleta').select('id, nome, posicao')
        .eq('escolaId', escolaId!).eq('ativo', true).order('nome')
      setAtletas(atletasData || [])

      const dataHoje = new Date().toISOString().split('T')[0]
      let { data: treino } = await supabase
        .from('Treino').select('id').eq('escolaId', escolaId!)
        .gte('data', dataHoje).limit(1).single()

      if (!treino) {
        const { data: novoTreino } = await supabase
          .from('Treino').insert({ id: crypto.randomUUID(), escolaId: escolaId!, data: new Date().toISOString() })
          .select('id').single()
        treino = novoTreino
      }

      if (treino) {
        setTreinoId(treino.id)
        const { data: presencasData } = await supabase
          .from('Presenca').select('atletaId, status').eq('treinoId', treino.id)
        const map: Record<string, 'PRESENTE' | 'AUSENTE'> = {}
        presencasData?.forEach((p: Presenca) => { map[p.atletaId] = p.status })
        setPresencas(map)
      }
      setLoading(false)
    }
    carregar()
  }, [escolaId])

  async function marcar(atletaId: string, status: 'PRESENTE' | 'AUSENTE') {
    if (!treinoId) return
    setSalvando(atletaId)
    if (presencas[atletaId]) {
      await supabase.from('Presenca').update({ status }).eq('atletaId', atletaId).eq('treinoId', treinoId)
    } else {
      await supabase.from('Presenca').insert({ id: crypto.randomUUID(), atletaId, treinoId, status })
    }
    setPresencas(prev => ({ ...prev, [atletaId]: status }))
    setSalvando(null)
  }

  const presentes = Object.values(presencas).filter(s => s === 'PRESENTE').length
  const ausentes = Object.values(presencas).filter(s => s === 'AUSENTE').length
  const pct = atletas.length > 0 ? Math.round((presentes / atletas.length) * 100) : 0

  const iniciais = (nome: string) => nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '80px', color: '#F0F0F0', fontFamily: 'Inter, sans-serif' }}>

      {/* HEADER */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ fontSize: '10px', color: muted, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '2px' }}>Chamada</div>
        <div style={{ fontFamily: syne, fontSize: '24px', fontWeight: 800, color: '#F0F0F0', marginBottom: '4px' }}>Presenca</div>
        <div style={{ fontSize: '12px', color: muted }}>Hoje — {hoje}</div>
      </div>

      {/* STATS */}
      {!loading && (
        <div style={{ padding: '16px 20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '16px' }}>
            <div style={{ background: 'rgba(57,255,20,0.07)', border: '1px solid rgba(57,255,20,0.2)', borderRadius: '14px', padding: '12px' }}>
              <div style={{ fontSize: '9px', color: muted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>Presentes</div>
              <div style={{ fontFamily: syne, fontSize: '22px', fontWeight: 800, color: neon }}>{presentes}</div>
            </div>
            <div style={{ background: 'rgba(255,70,70,0.07)', border: '1px solid rgba(255,70,70,0.2)', borderRadius: '14px', padding: '12px' }}>
              <div style={{ fontSize: '9px', color: muted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>Ausentes</div>
              <div style={{ fontFamily: syne, fontSize: '22px', fontWeight: 800, color: '#ff5555' }}>{ausentes}</div>
            </div>
            <div style={{ background: 'rgba(212,175,55,0.07)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: '14px', padding: '12px' }}>
              <div style={{ fontSize: '9px', color: muted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>Taxa</div>
              <div style={{ fontFamily: syne, fontSize: '22px', fontWeight: 800, color: '#FFD700' }}>{pct}%</div>
            </div>
          </div>

          {/* Barra de progresso */}
          <div style={{ height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden', marginBottom: '4px' }}>
            <div style={{ height: '100%', background: 'linear-gradient(90deg,#FF6B00,#00cc00)', width: pct + '%', borderRadius: '4px', transition: 'width 0.5s ease' }}></div>
          </div>
          <div style={{ fontSize: '10px', color: muted }}>{presentes} de {atletas.length} atletas marcados</div>
        </div>
      )}

      {loading && <div style={{ textAlign: 'center', padding: '60px 0', color: muted }}>Carregando...</div>}

      {/* LISTA */}
      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {atletas.map(atleta => {
          const status = presencas[atleta.id]
          const carregando = salvando === atleta.id
          return (
            <div key={atleta.id} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: status === 'PRESENTE' ? 'rgba(57,255,20,0.05)' : status === 'AUSENTE' ? 'rgba(255,70,70,0.05)' : 'rgba(255,255,255,0.04)',
              border: status === 'PRESENTE' ? '1px solid rgba(57,255,20,0.2)' : status === 'AUSENTE' ? '1px solid rgba(255,70,70,0.2)' : '1px solid rgba(255,255,255,0.07)',
              borderRadius: '16px',
              padding: '12px 14px',
              transition: 'all 0.2s',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                  background: status === 'PRESENTE' ? 'rgba(57,255,20,0.15)' : status === 'AUSENTE' ? 'rgba(255,70,70,0.15)' : 'rgba(255,255,255,0.08)',
                  border: status === 'PRESENTE' ? '1px solid rgba(57,255,20,0.3)' : status === 'AUSENTE' ? '1px solid rgba(255,70,70,0.3)' : '1px solid rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: syne, fontWeight: 800, fontSize: '13px',
                  color: status === 'PRESENTE' ? neon : status === 'AUSENTE' ? '#ff5555' : muted,
                }}>
                  {iniciais(atleta.nome)}
                </div>
                <div>
                  <p style={{ fontFamily: syne, fontWeight: 700, fontSize: '13px', color: '#F0F0F0', margin: 0 }}>{atleta.nome}</p>
                  <p style={{ fontSize: '11px', color: muted, margin: '2px 0 0' }}>{atleta.posicao || 'Sem posicao'}</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={() => marcar(atleta.id, 'PRESENTE')}
                  disabled={!!carregando}
                  style={{
                    width: '38px', height: '38px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                    background: status === 'PRESENTE' ? 'linear-gradient(135deg,#FF6B00,#00cc00)' : 'rgba(255,255,255,0.07)',
                    color: status === 'PRESENTE' ? '#000' : muted,
                    fontWeight: 800, fontSize: '16px', fontFamily: syne,
                    boxShadow: status === 'PRESENTE' ? '0 0 10px rgba(57,255,20,0.4)' : 'none',
                    transition: 'all 0.15s',
                  }}
                >V</button>
                <button
                  onClick={() => marcar(atleta.id, 'AUSENTE')}
                  disabled={!!carregando}
                  style={{
                    width: '38px', height: '38px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                    background: status === 'AUSENTE' ? '#ff5555' : 'rgba(255,255,255,0.07)',
                    color: status === 'AUSENTE' ? '#fff' : muted,
                    fontWeight: 800, fontSize: '16px', fontFamily: syne,
                    boxShadow: status === 'AUSENTE' ? '0 0 10px rgba(255,70,70,0.4)' : 'none',
                    transition: 'all 0.15s',
                  }}
                >X</button>
              </div>
            </div>
          )
        })}
      </div>

      {/* NAV */}
      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-around', padding: '12px 0 20px', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(5,5,5,0.95)', backdropFilter: 'blur(10px)' }}>
        {[
          { href: '/dashboard', label: 'Inicio', active: false },
          { href: '/atletas', label: 'Atletas', active: false },
          { href: '/presenca', label: 'Presenca', active: true },
          { href: '/financeiro', label: 'Financeiro', active: false },
        ].map(item => (
          <a key={item.href} href={item.href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', textDecoration: 'none' }}>
            <span style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px', color: item.active ? neon : muted, fontFamily: syne, fontWeight: item.active ? 700 : 400 }}>{item.label}</span>
            {item.active && <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: neon, boxShadow: '0 0 4px #FF6B00' }}></div>}
          </a>
        ))}
      </nav>
    </div>
  )
}
