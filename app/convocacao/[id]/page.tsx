'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface Convocacao {
  id: string
  titulo: string | null
  tipo: string | null
  data: string | null
  local: string | null
  horario: string | null
  escolaId: string
}

interface Atleta {
  id: string
  nome: string
  posicao: string | null
  fotoUrl: string | null
}

export default function ConvocacaoDetalhes() {
  const params = useParams()
  const id = params.id as string

  const [convocacao, setConvocacao] = useState<Convocacao | null>(null)
  const [atletas, setAtletas] = useState<Atleta[]>([])
  const [loading, setLoading] = useState(true)

  const syne = 'Syne, sans-serif'
  const neon = '#39FF14'
  const gold = '#D4AF37'
  const bg = 'linear-gradient(160deg,#0a1a06,#050505,#111003)'
  const cardBg = 'rgba(255,255,255,0.03)'
  const cardBorder = '1px solid rgba(255,255,255,0.07)'

  useEffect(() => {
    async function carregar() {
      const { data: conv } = await supabase
        .from('Convocacao').select('*').eq('id', id).single()
      setConvocacao(conv)

      if (conv) {
        const { data: cas } = await supabase
          .from('ConvocacaoAtleta').select('atletaId').eq('convocacaoId', id)

        if (cas && cas.length > 0) {
          const ids = cas.map((c: any) => c.atletaId)
          const { data: ats } = await supabase
            .from('Atleta').select('id, nome, posicao, fotoUrl').in('id', ids).order('nome')
          setAtletas(ats || [])
        }
      }
      setLoading(false)
    }
    carregar()
  }, [id])

  const iniciais = (nome: string) =>
    nome.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()

  if (loading) return (
    <div style={{ minHeight: '100vh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Inter,sans-serif' }}>Carregando...</p>
    </div>
  )

  if (!convocacao) return (
    <div style={{ minHeight: '100vh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'rgba(255,255,255,0.4)' }}>Convocação não encontrada.</p>
    </div>
  )

  const dataFormatada = convocacao.data
    ? new Date(convocacao.data + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
    : null

  return (
    <div style={{ minHeight: '100vh', background: bg, color: '#F0F0F0', fontFamily: 'Inter,sans-serif', paddingBottom: '40px' }}>

      {/* HEADER */}
      <div style={{ padding: '24px 20px 0', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <span style={{ fontSize: '22px' }}>📣</span>
          <h1 style={{ fontFamily: syne, fontWeight: 800, fontSize: '22px', color: '#F0F0F0', margin: 0 }}>
            {convocacao.titulo || 'Convocação'}
          </h1>
        </div>
        {convocacao.tipo && (
          <span style={{ display: 'inline-block', fontSize: '11px', color: gold, background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)', borderRadius: '20px', padding: '2px 12px', fontFamily: syne, fontWeight: 600 }}>
            {convocacao.tipo}
          </span>
        )}
      </div>

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

        {/* DETALHES */}
        <div style={{ background: cardBg, border: '1px solid rgba(57,255,20,0.15)', borderRadius: '16px', padding: '16px' }}>
          <p style={{ fontFamily: syne, fontWeight: 700, fontSize: '11px', color: neon, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '14px' }}>📋 Detalhes</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {dataFormatada && (
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '16px', flexShrink: 0 }}>📅</span>
                <div>
                  <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 2px' }}>Data</p>
                  <p style={{ fontSize: '14px', color: '#F0F0F0', margin: 0, fontWeight: 600 }}>{dataFormatada}</p>
                </div>
              </div>
            )}
            {convocacao.horario && (
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '16px', flexShrink: 0 }}>🕐</span>
                <div>
                  <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 2px' }}>Horário</p>
                  <p style={{ fontSize: '14px', color: '#F0F0F0', margin: 0, fontWeight: 600 }}>{convocacao.horario}</p>
                </div>
              </div>
            )}
            {convocacao.local && (
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '16px', flexShrink: 0 }}>📍</span>
                <div>
                  <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 2px' }}>Local</p>
                  <p style={{ fontSize: '14px', color: '#F0F0F0', margin: 0, fontWeight: 600 }}>{convocacao.local}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ATLETAS CONVOCADOS */}
        <div style={{ background: cardBg, border: cardBorder, borderRadius: '16px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <p style={{ fontFamily: syne, fontWeight: 700, fontSize: '11px', color: gold, textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>
              👥 Atletas Convocados
            </p>
            <span style={{ fontFamily: syne, fontWeight: 800, fontSize: '13px', color: neon }}>
              {atletas.length}
            </span>
          </div>

          {atletas.length === 0 ? (
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>
              Nenhum atleta convocado.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {atletas.map((a, i) => (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', background: 'rgba(57,255,20,0.03)', border: '1px solid rgba(57,255,20,0.1)', borderRadius: '12px' }}>
                  <span style={{ fontFamily: syne, fontWeight: 800, fontSize: '11px', color: 'rgba(57,255,20,0.5)', minWidth: '20px' }}>#{String(i + 1).padStart(2, '0')}</span>
                  {a.fotoUrl ? (
                    <img src={a.fotoUrl} alt={a.nome} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid rgba(57,255,20,0.3)', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(57,255,20,0.1)', border: '1px solid rgba(57,255,20,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: syne, fontWeight: 800, fontSize: '12px', color: neon, flexShrink: 0 }}>
                      {iniciais(a.nome)}
                    </div>
                  )}
                  <div>
                    <p style={{ fontFamily: syne, fontWeight: 700, fontSize: '13px', color: '#F0F0F0', margin: 0 }}>{a.nome}</p>
                    {a.posicao && <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', margin: '1px 0 0' }}>{a.posicao}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RODAPÉ */}
        <p style={{ textAlign: 'center', fontSize: '11px', color: 'rgba(255,255,255,0.2)', marginTop: '8px' }}>
          Thales Lima Football Academy · GestaoFC
        </p>

      </div>
    </div>
  )
}
