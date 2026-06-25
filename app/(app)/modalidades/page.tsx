'use client'
import { useEffect, useState } from 'react'
import { listarModalidadesEscola, toggleModalidade, getInfoEscola } from './actions'
import { MODALIDADES, PLANOS_GESTAOFC } from './constants'

const C = { bg: '#0A0E1A', surface: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.07)', orange: '#4169E1', gold: '#FFD700', muted: 'rgba(255,255,255,0.4)', text: '#F0F4FF' }
const SYNE = 'Syne, sans-serif'

export default function ModalidadesPage() {
  const [ativas, setAtivas] = useState<{id:string;modalidade:string;ativa:boolean}[]>([])
  const [info, setInfo] = useState<{planoGestaoFC:string;maxModalidades:number}|null>(null)
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState<string|null>(null)
  const [erro, setErro] = useState('')

  useEffect(() => {
    Promise.all([listarModalidadesEscola(), getInfoEscola()])
      .then(([m, i]) => { setAtivas(m as any); setInfo(i as any) })
      .finally(() => setLoading(false))
  }, [])

  const isAtiva = (slug: string) => Array.isArray(ativas) ? (ativas.find(a => a.modalidade === slug)?.ativa ?? false) : false
  const totalAtivas = Array.isArray(ativas) ? ativas.filter(a => a.ativa).length : 0
  const plano = PLANOS_GESTAOFC.find(p => p.slug === info?.planoGestaoFC) || PLANOS_GESTAOFC[0]

  const toggle = async (slug: string) => {
    const novoEstado = !isAtiva(slug)
    setSalvando(slug); setErro('')
    try {
      await toggleModalidade(slug, novoEstado)
      setAtivas(prev => {
        const existe = prev.find(a => a.modalidade === slug)
        if (existe) return prev.map(a => a.modalidade === slug ? { ...a, ativa: novoEstado } : a)
        return [...prev, { id: slug, modalidade: slug, ativa: novoEstado }]
      })
    } catch (e) {
      const msg = (e as Error).message
      setErro(msg.includes('Limite') ? msg : 'Erro ao atualizar modalidade. Tente novamente.')
    }
    finally { setSalvando(null) }
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, padding: '20px 20px 80px', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '10px', color: C.muted, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '2px' }}>Configuração</div>
        <div style={{ fontFamily: SYNE, fontSize: '24px', fontWeight: 800 }}>Modalidades</div>
      </div>

      {/* Plano atual */}
      <div style={{ background: 'rgba(255,215,0,0.06)', border: '1px solid rgba(255,215,0,0.2)', borderRadius: '14px', padding: '14px 16px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '10px', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>Plano GestaoFC</div>
            <div style={{ fontFamily: SYNE, fontWeight: 800, fontSize: '18px', color: C.gold }}>{plano.label}</div>
            <div style={{ fontSize: '12px', color: C.muted, marginTop: '2px' }}>
              {totalAtivas} de {info?.maxModalidades === 99 ? '∞' : info?.maxModalidades || 1} modalidades ativas
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: SYNE, fontWeight: 800, fontSize: '20px', color: C.gold }}>R$ {plano.preco}/mês</div>
          </div>
        </div>
      </div>

      {erro && (
        <div style={{ background: 'rgba(255,70,70,0.1)', border: '1px solid rgba(255,70,70,0.3)', borderRadius: '12px', padding: '12px', marginBottom: '16px', fontSize: '13px', color: '#ff5555' }}>
          ⚠️ {erro}
        </div>
      )}

      {/* Grid modalidades */}
      {loading ? (
        <p style={{ color: C.muted, textAlign: 'center', padding: '40px' }}>Carregando...</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {MODALIDADES.map(m => {
            const ativa = isAtiva(m.slug)
            const carregando = salvando === m.slug
            return (
              <div key={m.slug} onClick={() => !carregando && toggle(m.slug)}
                style={{ background: ativa ? 'rgba(255,107,0,0.1)' : C.surface, border: `1px solid ${ativa ? 'rgba(255,107,0,0.4)' : C.border}`, borderRadius: '14px', padding: '16px', cursor: 'pointer', transition: 'all 0.2s', opacity: carregando ? 0.6 : 1 }}>
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>{m.emoji}</div>
                <div style={{ fontFamily: SYNE, fontWeight: 700, fontSize: '14px', color: ativa ? C.orange : C.text, marginBottom: '6px' }}>{m.label}</div>
                <div style={{ display: 'inline-block', fontSize: '10px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', background: ativa ? 'rgba(255,107,0,0.2)' : 'rgba(255,255,255,0.05)', color: ativa ? C.orange : C.muted }}>
                  {carregando ? '...' : ativa ? '✓ Ativa' : 'Inativa'}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-around', padding: '12px 0 20px', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(5,5,5,0.95)', backdropFilter: 'blur(10px)' }}>
        {[
          { href: '/dashboard', label: 'Inicio' },
          { href: '/atletas', label: 'Atletas' },
          { href: '/presenca', label: 'Presenca' },
          { href: '/financeiro', label: 'Financeiro' },
        ].map(item => (
          <a key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
            <span style={{ fontSize: '9px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontFamily: SYNE }}>{item.label}</span>
          </a>
        ))}
      </nav>
    </div>
  )
}
