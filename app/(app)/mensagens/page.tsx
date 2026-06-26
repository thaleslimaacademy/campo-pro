'use client'
import { useEffect, useState, useTransition } from 'react'
import PlanoGate from '@/components/PlanoGate'
import BottomNav from '@/components/ui/BottomNav'
import { getMensagens } from './actions'

const T = { bg: '#0A0E1A', surface: '#0D1220', primary: '#4169E1', accent: '#00BFFF', text: '#F0F4FF', muted: 'rgba(240,244,255,0.4)', border: 'rgba(240,244,255,0.08)', green: '#00D67A' }
const SYNE = 'Syne, sans-serif'

type Mensagem = { id: string; titulo: string | null; conteudo: string; tipo: string; totalEnviados: number; criadoEm: string }

const TIPO_COR: Record<string, { color: string; bg: string }> = {
  TURMA:      { color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' },
  TODOS:      { color: T.primary, bg: `${T.primary}18` },
  INDIVIDUAL: { color: T.green,   bg: `${T.green}18` },
}

const ACOES = [
  { href: '/mensagens/nova?tipo=TODOS',      icon: 'ti-speakerphone', label: 'Mensagem para Todos',  sub: 'Envia para todos os responsáveis',     color: T.primary  },
  { href: '/turmas',                         icon: 'ti-users',        label: 'Mensagem por Turma',   sub: 'Selecione uma turma para enviar',       color: '#8B5CF6'  },
  { href: '/mensagens/nova?tipo=INDIVIDUAL', icon: 'ti-user',         label: 'Mensagem Individual',  sub: 'Selecione um atleta específico',        color: T.green    },
]

export default function Mensagens() {
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [loading, startLoad] = useTransition()

  useEffect(() => {
    startLoad(async () => {
      const data = await getMensagens()
      setMensagens(data as Mensagem[])
    })
  }, [])

  return (
    <PlanoGate feature="mensagens" planoMinimo="PRO">
      <div style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: 'Inter, sans-serif', paddingBottom: 80 }}>
        <div style={{ background: T.primary, padding: '20px 20px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 10, color: 'rgba(240,244,255,0.65)', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 700, marginBottom: 4 }}>Comunicação</div>
              <div style={{ fontFamily: SYNE, fontWeight: 900, fontSize: 26, color: T.text, letterSpacing: -0.8, textTransform: 'uppercase' }}>Mensagens</div>
            </div>
            <a href="/mensagens/nova" style={{ background: T.text, color: T.primary, borderRadius: 8, padding: '10px 16px', fontFamily: SYNE, fontWeight: 800, fontSize: 12, textDecoration: 'none', textTransform: 'uppercase' }}>+ Nova</a>
          </div>
        </div>

        <div style={{ padding: '16px 20px 8px' }}>
          <div style={{ fontSize: 10, color: T.muted, textTransform: 'uppercase', letterSpacing: 2, fontWeight: 700, marginBottom: 12 }}>Envio rápido</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {ACOES.map(a => (
              <a key={a.href} href={a.href} style={{ display: 'flex', alignItems: 'center', gap: 14, background: T.surface, border: `1px solid ${T.border}`, borderLeft: `3px solid ${a.color}`, borderRadius: 8, padding: '14px 16px', textDecoration: 'none' }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: a.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className={`ti ${a.icon}`} style={{ fontSize: 18, color: a.color }} aria-hidden="true"></i>
                </div>
                <div>
                  <p style={{ fontFamily: SYNE, fontWeight: 800, fontSize: 13, color: T.text, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: 0.3 }}>{a.label}</p>
                  <p style={{ fontSize: 11, color: T.muted, margin: 0 }}>{a.sub}</p>
                </div>
                <i className="ti ti-chevron-right" style={{ fontSize: 16, color: T.border, marginLeft: 'auto' }} aria-hidden="true"></i>
              </a>
            ))}
          </div>
        </div>

        <div style={{ padding: '16px 20px 0' }}>
          <div style={{ fontSize: 10, color: T.muted, textTransform: 'uppercase', letterSpacing: 2, fontWeight: 700, marginBottom: 12 }}>Histórico</div>
          {loading && <p style={{ color: T.muted, textAlign: 'center', padding: 40, fontSize: 13 }}>Carregando...</p>}
          {!loading && mensagens.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <i className="ti ti-message-off" style={{ fontSize: 48, color: T.border, display: 'block', marginBottom: 12 }} aria-hidden="true"></i>
              <p style={{ fontSize: 13, color: T.muted }}>Nenhuma mensagem enviada ainda</p>
            </div>
          )}
          {mensagens.map(m => {
            const tc = TIPO_COR[m.tipo] || { color: T.muted, bg: T.border }
            return (
              <div key={m.id} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14, marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <p style={{ fontFamily: SYNE, fontWeight: 800, fontSize: 13, color: T.text, margin: 0, textTransform: 'uppercase' }}>{m.titulo || 'Sem título'}</p>
                  <span style={{ fontSize: 9, fontWeight: 800, color: tc.color, background: tc.bg, padding: '2px 8px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: 0.5, flexShrink: 0 }}>{m.tipo}</span>
                </div>
                <p style={{ fontSize: 12, color: T.muted, marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{m.conteudo}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: T.muted }}>{new Date(m.criadoEm).toLocaleDateString('pt-BR')} · {new Date(m.criadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                  <span style={{ fontSize: 11, color: T.muted }}>{m.totalEnviados} enviado{m.totalEnviados !== 1 ? 's' : ''}</span>
                </div>
              </div>
            )
          })}
        </div>
        <BottomNav />
      </div>
    </PlanoGate>
  )
}
