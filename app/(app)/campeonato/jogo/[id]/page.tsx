'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useTransition } from 'react'
import { getJogoDetalhe, atualizarStatusJogo, adicionarEventoSumula, removerEventoSumula, salvarRelatorioJogo } from './actions'

interface Jogo {
  id: string
  campeonatoId: string
  timeAId: string
  timeBId: string
  data: string | null
  fase: string | null
  grupo: string | null
  status: string
  golsA: number
  golsB: number
}

interface Time { id: string; nome: string }
interface Evento { id: string; tipo: string; atletaNome: string; timeId: string; minuto: number | null; createdAt: string }
interface Atleta { id: string; nome: string }

export default function Sumula() {
  const params = useParams()
  const id = params.id as string

  const [jogo, setJogo] = useState<Jogo | null>(null)
  const [timeA, setTimeA] = useState<Time | null>(null)
  const [timeB, setTimeB] = useState<Time | null>(null)
  const [atletasA, setAtletasA] = useState<Atleta[]>([])
  const [atletasB, setAtletasB] = useState<Atleta[]>([])
  const [eventos, setEventos] = useState<Evento[]>([])
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [relatorio, setRelatorio] = useState('')
  const [showRelatorio, setShowRelatorio] = useState(false)
  const [showAddEvento, setShowAddEvento] = useState(false)
  const [formEvento, setFormEvento] = useState({ tipo: 'gol', timeId: '', atletaNome: '', minuto: '' })

  const syne = 'Syne, sans-serif'
  const neon = '#FF6B00'
  const gold = '#FFD700'
  const bg = 'linear-gradient(160deg,#0F0F1A,#0F0F1A,#111003)'
  const cardBg = 'rgba(255,255,255,0.03)'
  const cardBorder = '1px solid rgba(255,255,255,0.07)'
  const inputStyle = { width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px 12px', color: '#F0F0F0', fontFamily: 'Inter,sans-serif', fontSize: '13px', marginTop: '6px', outline: 'none', boxSizing: 'border-box' as const }

  const tipoIcon: Record<string, string> = { gol: '⚽', cartao_amarelo: '🟨', cartao_vermelho: '🟥' }
  const tipoLabel: Record<string, string> = { gol: 'Gol', cartao_amarelo: 'Cartão Amarelo', cartao_vermelho: 'Cartão Vermelho' }

  const [, startLoad] = useTransition()
  function carregar() {
    setLoading(true)
    startLoad(async () => {
      const d = await getJogoDetalhe(id)
      if (!d) { setLoading(false); return }
      setJogo(d.jogo as any)
      setTimeA(d.timeA as any)
      setTimeB(d.timeB as any)
      setAtletasA(d.atletasA as any[])
      setAtletasB(d.atletasB as any[])
      setEventos(d.eventos as any[])
      setLoading(false)
    })
  }

  useEffect(() => { carregar() }, [id])

  async function iniciarJogo() {
    await atualizarStatusJogo(id, 'andamento')
    carregar()
  }

  async function encerrarJogo() {
    if (!confirm('Encerrar este jogo? O placar será finalizado.')) return
    await atualizarStatusJogo(id, 'encerrado')
    carregar()
  }

  async function adicionarEvento() {
    if (!formEvento.atletaNome || !formEvento.timeId) return alert('Selecione o time e informe o atleta.')
    setSalvando(true)
    try {
      await adicionarEventoSumula(id, {
        tipo: formEvento.tipo, timeId: formEvento.timeId, atletaNome: formEvento.atletaNome,
        minuto: formEvento.minuto ? parseInt(formEvento.minuto) : null,
      })
      setFormEvento({ tipo: 'gol', timeId: '', atletaNome: '', minuto: '' })
      setShowAddEvento(false)
      carregar()
    } catch (e) { alert('Erro: ' + (e as Error).message) }
    setSalvando(false)
  }

  async function removerEvento(eventoId: string) {
    if (!confirm('Remover este evento?')) return
    try { await removerEventoSumula(eventoId, id); carregar() }
    catch (e) { alert('Erro: ' + (e as Error).message) }
  }

  async function salvarRelatorio() {
    setSalvando(true)
    try {
      await salvarRelatorioJogo(id, relatorio)
      setShowRelatorio(false)
      alert('Relatório salvo!')
    } catch (e) { alert('Erro: ' + (e as Error).message) }
    setSalvando(false)
  }

  const atletasDoTime = formEvento.timeId === jogo?.timeAId ? atletasA : atletasB

  if (loading) return (
    <div style={{ minHeight: '100vh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Inter,sans-serif' }}>Carregando...</p>
    </div>
  )

  if (!jogo || !timeA || !timeB) return (
    <div style={{ minHeight: '100vh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'rgba(255,255,255,0.4)' }}>Jogo não encontrado.</p>
    </div>
  )

  const isAndamento = jogo.status === 'andamento'
  const isEncerrado = jogo.status === 'encerrado'
  const scoreColor = isAndamento ? neon : isEncerrado ? gold : 'rgba(255,255,255,0.6)'

  return (
    <div style={{ minHeight: '100vh', background: bg, color: '#F0F0F0', fontFamily: 'Inter,sans-serif', paddingBottom: '96px' }}>

      <div style={{ padding: '20px 20px 0', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <a href={'/campeonato/' + jogo.campeonatoId} style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', textDecoration: 'none' }}>← Voltar</a>
        <h1 style={{ fontFamily: syne, fontWeight: 800, fontSize: '20px', color: '#F0F0F0', margin: 0 }}>📋 Súmula</h1>
      </div>

      <div style={{ padding: '0 20px' }}>

        <div style={{ background: cardBg, border: isAndamento ? '1px solid rgba(57,255,20,0.2)' : isEncerrado ? '1px solid rgba(212,175,55,0.2)' : cardBorder, borderRadius: '20px', padding: '20px', marginBottom: '12px' }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
              {jogo.fase}{jogo.grupo ? ' · Grupo ' + jogo.grupo : ''}
            </span>
            <span style={{
              fontSize: '11px', padding: '3px 10px', borderRadius: '20px', fontWeight: 700, fontFamily: syne,
              background: isEncerrado ? 'rgba(57,255,20,0.08)' : isAndamento ? 'rgba(212,175,55,0.1)' : 'rgba(255,255,255,0.07)',
              color: isEncerrado ? neon : isAndamento ? gold : 'rgba(255,255,255,0.4)',
              border: isEncerrado ? '1px solid rgba(57,255,20,0.2)' : isAndamento ? '1px solid rgba(212,175,55,0.25)' : '1px solid rgba(255,255,255,0.1)',
            }}>
              {isAndamento ? '● Em andamento' : isEncerrado ? '✓ Encerrado' : 'Agendado'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '20px' }}>
            <p style={{ fontFamily: syne, fontWeight: 800, fontSize: '15px', color: '#F0F0F0', flex: 1, textAlign: 'right', margin: 0 }}>{timeA.nome}</p>
            <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '16px', padding: '12px 20px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.08)' }}>
              <p style={{ fontFamily: syne, fontWeight: 900, fontSize: '42px', color: scoreColor, margin: 0, lineHeight: 1, textShadow: isAndamento ? '0 0 20px rgba(57,255,20,0.5)' : 'none' }}>
                {jogo.golsA} × {jogo.golsB}
              </p>
            </div>
            <p style={{ fontFamily: syne, fontWeight: 800, fontSize: '15px', color: '#F0F0F0', flex: 1, textAlign: 'left', margin: 0 }}>{timeB.nome}</p>
          </div>

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {jogo.status === 'agendado' && (
              <button onClick={iniciarJogo} style={{ background: 'linear-gradient(135deg,#FF6B00,#2bcc0f)', color: '#0F0F1A', padding: '10px 24px', borderRadius: '12px', fontSize: '13px', fontWeight: 800, fontFamily: syne, border: 'none', cursor: 'pointer', boxShadow: '0 0 16px rgba(57,255,20,0.3)' }}>
                ▶ Iniciar Jogo
              </button>
            )}
            {jogo.status === 'andamento' && (
              <>
                <button onClick={() => setShowAddEvento(!showAddEvento)} style={{ background: showAddEvento ? 'rgba(255,255,255,0.05)' : 'rgba(57,255,20,0.1)', border: showAddEvento ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(57,255,20,0.3)', color: showAddEvento ? 'rgba(255,255,255,0.4)' : neon, padding: '10px 20px', borderRadius: '12px', fontSize: '13px', fontWeight: 700, fontFamily: syne, cursor: 'pointer' }}>
                  {showAddEvento ? 'Fechar' : '+ Evento'}
                </button>
                <button onClick={encerrarJogo} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#F87171', padding: '10px 20px', borderRadius: '12px', fontSize: '13px', fontWeight: 700, fontFamily: syne, cursor: 'pointer' }}>
                  Encerrar
                </button>
              </>
            )}
            {jogo.status === 'encerrado' && (
              <button onClick={() => setShowRelatorio(!showRelatorio)} style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)', color: gold, padding: '10px 20px', borderRadius: '12px', fontSize: '13px', fontWeight: 700, fontFamily: syne, cursor: 'pointer' }}>
                📝 Relatório do Árbitro
              </button>
            )}
          </div>
        </div>

        {showAddEvento && (
          <div style={{ background: 'rgba(57,255,20,0.03)', border: '1px solid rgba(57,255,20,0.15)', borderRadius: '16px', padding: '16px', marginBottom: '12px' }}>
            <p style={{ fontFamily: syne, fontWeight: 700, fontSize: '12px', color: neon, marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>Registrar Evento</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Tipo</label>
                <select value={formEvento.tipo} onChange={e => setFormEvento(p => ({ ...p, tipo: e.target.value }))} style={{ ...inputStyle, appearance: 'none' as const }}>
                  <option value="gol">⚽ Gol</option>
                  <option value="cartao_amarelo">🟨 Cartão Amarelo</option>
                  <option value="cartao_vermelho">🟥 Cartão Vermelho</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Time</label>
                <select value={formEvento.timeId} onChange={e => setFormEvento(p => ({ ...p, timeId: e.target.value, atletaNome: '' }))} style={{ ...inputStyle, appearance: 'none' as const }}>
                  <option value="">Selecione o time</option>
                  <option value={timeA.id}>{timeA.nome}</option>
                  <option value={timeB.id}>{timeB.nome}</option>
                </select>
              </div>
              {formEvento.timeId && (
                <div>
                  <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Atleta</label>
                  {atletasDoTime.length > 0 ? (
                    <select value={formEvento.atletaNome} onChange={e => setFormEvento(p => ({ ...p, atletaNome: e.target.value }))} style={{ ...inputStyle, appearance: 'none' as const }}>
                      <option value="">Selecione o atleta</option>
                      {atletasDoTime.map(a => (
                        <option key={a.id} value={a.nome}>{a.nome}</option>
                      ))}
                      <option value="outro">Outro (digitar)</option>
                    </select>
                  ) : (
                    <input value={formEvento.atletaNome} onChange={e => setFormEvento(p => ({ ...p, atletaNome: e.target.value }))} placeholder="Nome do atleta" style={inputStyle} />
                  )}
                  {formEvento.atletaNome === 'outro' && (
                    <input onChange={e => setFormEvento(p => ({ ...p, atletaNome: e.target.value }))} placeholder="Digite o nome do atleta" style={{ ...inputStyle, marginTop: '8px' }} />
                  )}
                </div>
              )}
              <div>
                <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Minuto (opcional)</label>
                <input value={formEvento.minuto} onChange={e => setFormEvento(p => ({ ...p, minuto: e.target.value }))} type="number" placeholder="Ex: 23" style={inputStyle} />
              </div>
              <button onClick={adicionarEvento} disabled={salvando} style={{ width: '100%', background: salvando ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg,#FF6B00,#2bcc0f)', color: salvando ? 'rgba(255,255,255,0.3)' : '#0F0F1A', padding: '12px', borderRadius: '10px', fontSize: '13px', fontWeight: 800, fontFamily: syne, border: 'none', cursor: 'pointer' }}>
                {salvando ? 'Salvando...' : 'Registrar Evento'}
              </button>
            </div>
          </div>
        )}

        {showRelatorio && (
          <div style={{ background: 'rgba(212,175,55,0.04)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: '16px', padding: '16px', marginBottom: '12px' }}>
            <p style={{ fontFamily: syne, fontWeight: 700, fontSize: '12px', color: gold, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>📝 Relatório do Árbitro</p>
            <textarea
              value={relatorio}
              onChange={e => setRelatorio(e.target.value)}
              rows={5}
              placeholder="Descreva ocorrências, incidentes, observações do jogo..."
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px', color: '#F0F0F0', fontFamily: 'Inter,sans-serif', fontSize: '13px', outline: 'none', boxSizing: 'border-box' as const, resize: 'vertical' as const }}
            />
            <button onClick={salvarRelatorio} disabled={salvando} style={{ width: '100%', background: salvando ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg,#FFD700,#a88520)', color: salvando ? 'rgba(255,255,255,0.3)' : '#0F0F1A', padding: '12px', borderRadius: '10px', fontSize: '13px', fontWeight: 800, fontFamily: syne, border: 'none', cursor: 'pointer', marginTop: '10px' }}>
              {salvando ? 'Salvando...' : 'Salvar Relatório'}
            </button>
          </div>
        )}

        <div style={{ background: cardBg, border: cardBorder, borderRadius: '16px', marginBottom: '12px', overflow: 'hidden' }}>
          <p style={{ fontFamily: syne, fontWeight: 700, fontSize: '12px', color: neon, padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>
            Eventos ({eventos.length})
          </p>
          {eventos.length === 0 ? (
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px', textAlign: 'center', padding: '24px 0' }}>Nenhum evento registrado.</p>
          ) : (
            <div>
              {eventos.map((e, i) => (
                <div key={e.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: i < eventos.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '20px' }}>{tipoIcon[e.tipo]}</span>
                    <div>
                      <p style={{ fontFamily: syne, fontWeight: 700, fontSize: '13px', color: '#F0F0F0', margin: 0 }}>{e.atletaNome}</p>
                      <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', margin: '2px 0 0' }}>
                        {tipoLabel[e.tipo]} · {e.timeId === timeA.id ? timeA.nome : timeB.nome}
                        {e.minuto ? " · " + e.minuto + "'" : ''}
                      </p>
                    </div>
                  </div>
                  {!isEncerrado && (
                    <button onClick={() => removerEvento(e.id)} style={{ fontSize: '11px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#F87171', padding: '4px 10px', borderRadius: '8px', cursor: 'pointer' }}>
                      Remover
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {[
            { time: timeA, id: timeA.id },
            { time: timeB, id: timeB.id },
          ].map(({ time, id: tId }) => {
            const gols = eventos.filter(e => e.tipo === 'gol' && e.timeId === tId)
            return (
              <div key={tId} style={{ background: cardBg, border: cardBorder, borderRadius: '14px', padding: '14px' }}>
                <p style={{ fontFamily: syne, fontWeight: 700, fontSize: '12px', color: neon, marginBottom: '8px' }}>{time.nome}</p>
                {gols.length === 0 ? (
                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>Sem gols</p>
                ) : (
                  gols.map(e => (
                    <p key={e.id} style={{ fontSize: '12px', color: '#F0F0F0', margin: '3px 0' }}>
                      {'⚽ ' + e.atletaNome + (e.minuto ? " " + e.minuto + "'" : '')}
                    </p>
                  ))
                )}
              </div>
            )
          })}
        </div>

      </div>

      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-around', padding: '12px 0 20px', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(5,5,5,0.95)', backdropFilter: 'blur(10px)' }}>
        {[
          { href: '/dashboard', label: 'Inicio', icon: '🏠' },
          { href: '/atletas', label: 'Atletas', icon: '👥' },
          { href: '/presenca', label: 'Presença', icon: '✅' },
          { href: '/financeiro', label: 'Financeiro', icon: '💰' },
        ].map(item => (
          <a key={item.href} href={item.href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', textDecoration: 'none' }}>
            <span style={{ fontSize: '16px' }}>{item.icon}</span>
            <span style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'rgba(255,255,255,0.4)', fontFamily: syne }}>{item.label}</span>
          </a>
        ))}
      </nav>
    </div>
  )
}
