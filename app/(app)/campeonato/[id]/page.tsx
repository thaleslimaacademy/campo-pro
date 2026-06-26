'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useTransition } from 'react'
import { getCampeonatoDetalhe, atualizarStatusCampeonato } from './actions'
import { supabase } from '@/lib/supabase'

interface Campeonato {
  id: string
  nome: string
  formato: string
  status: string
  dataInicio: string
  dataFim: string
  descricao: string
}

interface Time {
  id: string
  nome: string
  tipo: string
  grupo: string | null
  acessoAtivo: boolean
  responsavelNome: string | null
  responsavelWhatsapp: string | null
  accessToken: string
}

interface Jogo {
  id: string
  timeAId: string
  timeBId: string
  data: string | null
  fase: string | null
  grupo: string | null
  status: string
  golsA: number
  golsB: number
}

export default function CampeonatoDetalhes() {
  const params = useParams()
  const id = params.id as string

  const [campeonato, setCampeonato] = useState<Campeonato | null>(null)
  const [times, setTimes] = useState<Time[]>([])
  const [jogos, setJogos] = useState<Jogo[]>([])
  const [loading, setLoading] = useState(true)
  const [aba, setAba] = useState<'times' | 'jogos' | 'classificacao'>('times')
  const [showFormTime, setShowFormTime] = useState(false)
  const [salvandoTime, setSalvandoTime] = useState(false)
  const [showMataMata, setShowMataMata] = useState(false)
  const [classificadosPorGrupo, setClassificadosPorGrupo] = useState(2)
  const [faseEscolhida, setFaseEscolhida] = useState('Quartas de Final')
  const [formTime, setFormTime] = useState({
    nome: '',
    tipo: 'externo',
    responsavelNome: '',
    responsavelWhatsapp: '',
  })

  // ── Tokens visuais ──
  const syne = 'Syne, sans-serif'
  const neon = '#4169E1'
  const gold = '#FFD700'
  const bg = 'linear-gradient(160deg,#0A0E1A,#0A0E1A,#0A0E1A)'
  const cardBg = 'rgba(255,255,255,0.03)'
  const cardBorder = '1px solid rgba(255,255,255,0.07)'
  const inputStyle = { width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px 12px', color: '#F0F4FF', fontFamily: 'Inter,sans-serif', fontSize: '13px', marginTop: '6px', outline: 'none', boxSizing: 'border-box' as const }

  // Helper: estilo do badge de status do campeonato
  function statusBadgeStyle(status: string) {
    const map: { [k: string]: { background: string; color: string; border: string } } = {
      rascunho:  { background: 'rgba(107,114,128,0.15)', color: '#9CA3AF', border: '1px solid rgba(107,114,128,0.2)' },
      inscricoes: { background: 'rgba(59,130,246,0.12)',  color: '#60A5FA', border: '1px solid rgba(59,130,246,0.2)'  },
      andamento:  { background: 'rgba(57,255,20,0.08)',   color: '#4169E1', border: '1px solid rgba(57,255,20,0.2)'   },
      encerrado:  { background: 'rgba(239,68,68,0.12)',   color: '#F87171', border: '1px solid rgba(239,68,68,0.2)'   },
    }
    return map[status] || {}
  }

  // Helper: estilo do badge de status do jogo
  function jogoBadgeStyle(status: string) {
    if (status === 'encerrado') return { background: 'rgba(57,255,20,0.1)',  color: neon }
    if (status === 'andamento') return { background: 'rgba(212,175,55,0.1)', color: gold }
    return { background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.4)' }
  }

  const [, startLoad] = useTransition()
  function carregar() {
    setLoading(true)
    startLoad(async () => {
      const d = await getCampeonatoDetalhe(id)
      setCampeonato(d.campeonato as any)
      setTimes(d.times as any[])
      setJogos(d.jogos as any[])
      setLoading(false)
    })
  }

  useEffect(() => { carregar() }, [id])

  async function adicionarTime() {
    if (!formTime.nome) return alert('Nome obrigatório.')
    if (times.length >= 16) return alert('Máximo 16 times.')
    setSalvandoTime(true)
    const { error } = await supabase.from('CampeonatoTime').insert({
      campeonatoId: id,
      nome: formTime.nome,
      tipo: formTime.tipo,
      responsavelNome: formTime.responsavelNome || null,
      responsavelWhatsapp: formTime.responsavelWhatsapp || null,
      acessoAtivo: true,
    })
    if (error) alert('Erro: ' + error.message)
    else { setFormTime({ nome: '', tipo: 'externo', responsavelNome: '', responsavelWhatsapp: '' }); setShowFormTime(false); carregar() }
    setSalvandoTime(false)
  }

  async function excluirTime(timeId: string) {
    if (!confirm('Excluir este time? Os jogos relacionados tambem serao removidos.')) return

    // 1. Remove eventos de sumula dos jogos que envolvem este time
    const jogosDoTime = jogos.filter(j => j.timeAId === timeId || j.timeBId === timeId)
    for (const j of jogosDoTime) {
      await supabase.from('SumulaEvento').delete().eq('jogoId', j.id)
    }

    // 2. Remove os jogos que envolvem este time (FK: CampeonatoJogo_timebid_fkey)
    const { error: errJogosA } = await supabase.from('CampeonatoJogo').delete().eq('timeAId', timeId)
    if (errJogosA) { alert('Erro ao excluir jogos (A): ' + errJogosA.message); return }
    const { error: errJogosB } = await supabase.from('CampeonatoJogo').delete().eq('timeBId', timeId)
    if (errJogosB) { alert('Erro ao excluir jogos (B): ' + errJogosB.message); return }

    // 3. Remove atletas do time
    const { error: errAtletas } = await supabase.from('CampeonatoAtleta').delete().eq('timeId', timeId)
    if (errAtletas) { alert('Erro ao excluir atletas: ' + errAtletas.message); return }

    // 4. Remove o time
    const { error: errTime } = await supabase.from('CampeonatoTime').delete().eq('id', timeId)
    if (errTime) { alert('Erro ao excluir time: ' + errTime.message); return }

    carregar()
  }

  async function toggleAcesso(timeId: string, ativo: boolean) {
    await supabase.from('CampeonatoTime').update({ acessoAtivo: !ativo }).eq('id', timeId)
    carregar()
  }

  async function atualizarStatus(novoStatus: string) {
    await atualizarStatusCampeonato(id, novoStatus)
    carregar()
  }

  async function sortearGrupos() {
    if (times.length < 2) return alert('Adicione pelo menos 2 times.')
    if (!confirm('Sortear grupos automaticamente?')) return
    const letras = ['A', 'B', 'C', 'D']
    const embaralhados = [...times].sort(() => Math.random() - 0.5)
    const porGrupo = Math.ceil(embaralhados.length / 4)
    for (let i = 0; i < embaralhados.length; i++) {
      const grupo = letras[Math.floor(i / porGrupo)] || 'A'
      await supabase.from('CampeonatoTime').update({ grupo }).eq('id', embaralhados[i].id)
    }
    carregar()
  }

  async function gerarJogosFaseGrupos() {
    const jogosGrupos = jogos.filter(j => j.fase === 'Fase de Grupos')
    if (jogosGrupos.length > 0) {
      if (!confirm('Já existem jogos de grupos. Regerar?')) return
      await supabase.from('CampeonatoJogo').delete().in('id', jogosGrupos.map(j => j.id))
    }
    const grupos = [...new Set(times.map(t => t.grupo).filter(Boolean))]
    if (grupos.length === 0) return alert('Sorteie os grupos primeiro.')
    const novos: any[] = []
    for (const grupo of grupos) {
      const tg = times.filter(t => t.grupo === grupo)
      for (let i = 0; i < tg.length; i++) {
        for (let j = i + 1; j < tg.length; j++) {
          novos.push({ campeonatoId: id, timeAId: tg[i].id, timeBId: tg[j].id, fase: 'Fase de Grupos', grupo, status: 'agendado', golsA: 0, golsB: 0 })
        }
      }
    }
    if (novos.length === 0) return alert('Nenhum jogo gerado.')
    await supabase.from('CampeonatoJogo').insert(novos)
    alert(novos.length + ' jogos gerados!')
    carregar()
  }

  async function gerarMataMata() {
    const grupos = [...new Set(times.map(t => t.grupo).filter(Boolean))].sort()
    const classificados: Time[] = []
    for (const grupo of grupos) {
      const tg = times.filter(t => t.grupo === grupo)
      const comPts = tg.map(time => {
        const jt = jogos.filter(j => (j.timeAId === time.id || j.timeBId === time.id) && j.status === 'encerrado')
        let pts = 0, gp = 0, gc = 0
        jt.forEach(j => {
          const isA = j.timeAId === time.id
          const gf = isA ? j.golsA : j.golsB
          const gs = isA ? j.golsB : j.golsA
          gp += gf; gc += gs
          if (gf > gs) pts += 3
          else if (gf === gs) pts += 1
        })
        return { ...time, pts, saldo: gp - gc, gp }
      }).sort((a, b) => b.pts - a.pts || b.saldo - a.saldo || b.gp - a.gp)
      classificados.push(...comPts.slice(0, classificadosPorGrupo))
    }
    if (classificados.length < 2) return alert('Poucos times classificados. Verifique se os jogos foram encerrados.')
    const embaralhados = [...classificados].sort(() => Math.random() - 0.5)
    const novos: any[] = []
    for (let i = 0; i < embaralhados.length - 1; i += 2) {
      if (embaralhados[i + 1]) {
        novos.push({ campeonatoId: id, timeAId: embaralhados[i].id, timeBId: embaralhados[i + 1].id, fase: faseEscolhida, status: 'agendado', golsA: 0, golsB: 0 })
      }
    }
    await supabase.from('CampeonatoJogo').insert(novos)
    setShowMataMata(false)
    alert(novos.length + ' jogos de ' + faseEscolhida + ' gerados!')
    carregar()
  }

  async function gerarProximaFase(faseAtual: string) {
    const jogosEncerrados = jogos.filter(j => j.fase === faseAtual && j.status === 'encerrado')
    const pendentes = jogos.filter(j => j.fase === faseAtual && j.status !== 'encerrado')
    if (pendentes.length > 0) {
      if (!confirm('Ainda há jogos não encerrados nesta fase. Continuar mesmo assim?')) return
    }
    const vencedores: string[] = []
    for (const j of jogosEncerrados) {
      if (j.golsA > j.golsB) vencedores.push(j.timeAId)
      else if (j.golsB > j.golsA) vencedores.push(j.timeBId)
    }
    if (vencedores.length < 2) return alert('Poucos vencedores para gerar próxima fase.')
    setFaseEscolhida(
      vencedores.length <= 2 ? 'Final' :
      vencedores.length <= 4 ? 'Semifinal' :
      vencedores.length <= 8 ? 'Quartas de Final' : 'Oitavas de Final'
    )
    setShowMataMata(true)
  }

  async function gerarJogosMataMataPuro() {
    if (times.length < 2) return alert('Adicione pelo menos 2 times.')
    const jogosExistentes = jogos.filter(j => j.fase === faseEscolhida)
    if (jogosExistentes.length > 0) {
      if (!confirm('Já existem jogos desta fase. Regerar?')) return
      await supabase.from('CampeonatoJogo').delete().in('id', jogosExistentes.map(j => j.id))
    }
    const embaralhados = [...times].sort(() => Math.random() - 0.5)
    const novos: any[] = []
    for (let i = 0; i < embaralhados.length - 1; i += 2) {
      if (embaralhados[i + 1]) {
        novos.push({ campeonatoId: id, timeAId: embaralhados[i].id, timeBId: embaralhados[i + 1].id, fase: faseEscolhida, status: 'agendado', golsA: 0, golsB: 0 })
      }
    }
    await supabase.from('CampeonatoJogo').insert(novos)
    alert(novos.length + ' jogos de ' + faseEscolhida + ' gerados!')
    carregar()
  }

  function nomeTime(timeId: string) {
    return times.find(t => t.id === timeId)?.nome || '?'
  }

  const grupos = [...new Set(times.map(t => t.grupo).filter(Boolean))].sort()
  const fasesMataMatata = [...new Set(jogos.filter(j => j.fase !== 'Fase de Grupos').map(j => j.fase).filter(Boolean))].sort() as string[]
  const fasesOpcoes = ['Oitavas de Final', 'Quartas de Final', 'Semifinal', 'Final']

  const classificacao = grupos.map(grupo => {
    const tg = times.filter(t => t.grupo === grupo)
    return {
      grupo,
      times: tg.map(time => {
        const jt = jogos.filter(j => (j.timeAId === time.id || j.timeBId === time.id) && j.status === 'encerrado')
        let pts = 0, v = 0, e = 0, d = 0, gp = 0, gc = 0
        jt.forEach(j => {
          const isA = j.timeAId === time.id
          const gf = isA ? j.golsA : j.golsB
          const gs = isA ? j.golsB : j.golsA
          gp += gf; gc += gs
          if (gf > gs) { pts += 3; v++ }
          else if (gf === gs) { pts += 1; e++ }
          else d++
        })
        return { ...time, pts, v, e, d, gp, gc, saldo: gp - gc, jogos: jt.length }
      }).sort((a, b) => b.pts - a.pts || b.saldo - a.saldo)
    }
  })

  if (loading) return (
    <div style={{ minHeight: '100vh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Inter,sans-serif' }}>Carregando...</p>
    </div>
  )

  if (!campeonato) return (
    <div style={{ minHeight: '100vh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'rgba(255,255,255,0.4)' }}>Campeonato não encontrado.</p>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: bg, color: '#F0F4FF', fontFamily: 'Inter,sans-serif', paddingBottom: '96px' }}>

      {/* ── HEADER ── */}
      <div style={{ padding: '20px 20px 0', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <a href="/campeonato" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', textDecoration: 'none' }}>← Voltar</a>
        <h1 style={{ fontFamily: syne, fontWeight: 800, fontSize: '20px', color: '#F0F4FF', margin: 0 }}>🏆 {campeonato.nome}</h1>
      </div>

      <div style={{ padding: '0 20px' }}>

        {/* ── INFO + AÇÕES ── */}
        <div style={{ background: cardBg, border: '1px solid rgba(57,255,20,0.15)', borderRadius: '16px', padding: '16px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <span style={{ fontSize: '11px', padding: '4px 12px', borderRadius: '20px', fontWeight: 700, fontFamily: syne, ...statusBadgeStyle(campeonato.status) }}>
              {campeonato.status.toUpperCase()}
            </span>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>{times.length}/16 times · {campeonato.formato}</p>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {campeonato.status === 'rascunho' && (
              <button onClick={() => atualizarStatus('inscricoes')} style={{ fontSize: '11px', background: 'rgba(59,130,246,0.12)', color: '#60A5FA', border: '1px solid rgba(59,130,246,0.2)', padding: '5px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Abrir inscrições</button>
            )}
            {campeonato.status === 'inscricoes' && (
              <button onClick={() => atualizarStatus('andamento')} style={{ fontSize: '11px', background: 'rgba(57,255,20,0.08)', color: neon, border: '1px solid rgba(57,255,20,0.2)', padding: '5px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>▶ Iniciar</button>
            )}
            {campeonato.status === 'andamento' && (
              <button onClick={() => atualizarStatus('encerrado')} style={{ fontSize: '11px', background: 'rgba(239,68,68,0.12)', color: '#F87171', border: '1px solid rgba(239,68,68,0.2)', padding: '5px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Encerrar</button>
            )}
            {campeonato.formato !== 'mata-mata' && (
              <>
                <button onClick={sortearGrupos} style={{ fontSize: '11px', background: 'rgba(212,175,55,0.1)', color: gold, border: '1px solid rgba(212,175,55,0.2)', padding: '5px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>🎲 Sortear grupos</button>
                <button onClick={gerarJogosFaseGrupos} style={{ fontSize: '11px', background: 'rgba(139,92,246,0.12)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.2)', padding: '5px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>⚽ Gerar jogos</button>
                <button onClick={() => setShowMataMata(!showMataMata)} style={{ fontSize: '11px', background: 'rgba(249,115,22,0.12)', color: '#FB923C', border: '1px solid rgba(249,115,22,0.2)', padding: '5px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>🏆 Mata-mata</button>
              </>
            )}
            {campeonato.formato === 'mata-mata' && (
              <button onClick={() => setShowMataMata(!showMataMata)} style={{ fontSize: '11px', background: 'rgba(139,92,246,0.12)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.2)', padding: '5px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>⚽ Gerar jogos</button>
            )}
          </div>

          {showMataMata && (
            <div style={{ marginTop: '14px', padding: '14px', background: 'rgba(212,175,55,0.04)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: '12px' }}>
              <p style={{ fontFamily: syne, fontWeight: 700, fontSize: '12px', color: gold, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>⚙️ Configurar fase</p>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Nome da fase</label>
                <select value={faseEscolhida} onChange={e => setFaseEscolhida(e.target.value)} style={{ ...inputStyle, appearance: 'none' as const }}>
                  {fasesOpcoes.map(f => <option key={f} value={f}>{f}</option>)}
                  <option value="custom">Personalizado...</option>
                </select>
                {faseEscolhida === 'custom' && (
                  <input onChange={e => setFaseEscolhida(e.target.value)} placeholder="Digite o nome da fase..." style={inputStyle} />
                )}
              </div>
              {campeonato.formato !== 'mata-mata' && (
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Times que avançam por grupo</label>
                  <select value={classificadosPorGrupo} onChange={e => setClassificadosPorGrupo(parseInt(e.target.value))} style={{ ...inputStyle, appearance: 'none' as const }}>
                    {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n} por grupo</option>)}
                  </select>
                </div>
              )}
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginBottom: '12px' }}>O sorteio dos confrontos será feito automaticamente.</p>
              <button onClick={campeonato.formato === 'mata-mata' ? gerarJogosMataMataPuro : gerarMataMata} style={{ width: '100%', background: 'rgba(249,115,22,0.15)', color: '#FB923C', border: '1px solid rgba(249,115,22,0.25)', padding: '10px', borderRadius: '10px', fontSize: '13px', fontWeight: 700, fontFamily: syne, cursor: 'pointer' }}>
                Gerar confrontos ⚡
              </button>
            </div>
          )}
        </div>

        {/* ── TABS ── */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          {(['times', 'jogos', 'classificacao'] as const).map(a => (
            <button key={a} onClick={() => setAba(a)} style={{ flex: 1, padding: '10px', borderRadius: '12px', fontSize: '12px', fontWeight: 700, fontFamily: syne, border: 'none', cursor: 'pointer', background: aba === a ? 'linear-gradient(135deg,#4169E1,#2bcc0f)' : 'rgba(255,255,255,0.05)', color: aba === a ? '#0A0E1A' : 'rgba(255,255,255,0.5)', transition: 'all 0.2s' }}>
              {a === 'times' ? '⚽ Times' : a === 'jogos' ? '📋 Jogos' : '🏅 Classificação'}
            </button>
          ))}
        </div>

        {/* ── ABA TIMES ── */}
        {aba === 'times' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>{times.length} time(s)</p>
              <button onClick={() => setShowFormTime(!showFormTime)} style={{ background: showFormTime ? 'rgba(255,255,255,0.05)' : 'rgba(57,255,20,0.1)', border: showFormTime ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(57,255,20,0.3)', color: showFormTime ? 'rgba(255,255,255,0.4)' : neon, padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, fontFamily: syne, cursor: 'pointer' }}>
                {showFormTime ? 'Fechar' : '+ Adicionar'}
              </button>
            </div>

            {showFormTime && (
              <div style={{ background: 'rgba(57,255,20,0.03)', border: '1px solid rgba(57,255,20,0.15)', borderRadius: '14px', padding: '16px', marginBottom: '14px' }}>
                <p style={{ fontFamily: syne, fontWeight: 700, fontSize: '12px', color: neon, marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>Novo Time</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Nome *</label>
                    <input value={formTime.nome} onChange={e => setFormTime(p => ({ ...p, nome: e.target.value }))} placeholder="Ex: FC Estrela" style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Tipo</label>
                    <select value={formTime.tipo} onChange={e => setFormTime(p => ({ ...p, tipo: e.target.value }))} style={{ ...inputStyle, appearance: 'none' as const }}>
                      <option value="interno">Interno</option>
                      <option value="externo">Externo</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Responsável</label>
                    <input value={formTime.responsavelNome} onChange={e => setFormTime(p => ({ ...p, responsavelNome: e.target.value }))} placeholder="Nome do técnico" style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>WhatsApp</label>
                    <input value={formTime.responsavelWhatsapp} onChange={e => setFormTime(p => ({ ...p, responsavelWhatsapp: e.target.value }))} placeholder="5534999999999" style={inputStyle} />
                  </div>
                  <button onClick={adicionarTime} disabled={salvandoTime} style={{ width: '100%', background: salvandoTime ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg,#4169E1,#2bcc0f)', color: salvandoTime ? 'rgba(255,255,255,0.3)' : '#0A0E1A', padding: '12px', borderRadius: '10px', fontSize: '13px', fontWeight: 800, fontFamily: syne, border: 'none', cursor: 'pointer' }}>
                    {salvandoTime ? 'Salvando...' : 'Adicionar Time ✓'}
                  </button>
                </div>
              </div>
            )}

            {grupos.length > 0 ? (
              grupos.map(grupo => (
                <div key={grupo} style={{ marginBottom: '16px' }}>
                  <p style={{ fontFamily: syne, fontWeight: 700, fontSize: '11px', color: gold, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Grupo {grupo}</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {times.filter(t => t.grupo === grupo).map(t => (
                      <div key={t.id} style={{ background: cardBg, border: cardBorder, borderRadius: '12px', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <p style={{ fontFamily: syne, fontWeight: 700, fontSize: '13px', color: '#F0F4FF', margin: 0 }}>{t.nome}</p>
                          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', margin: '2px 0 0' }}>{t.tipo}{t.responsavelNome ? ' · ' + t.responsavelNome : ''}</p>
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={() => toggleAcesso(t.id, t.acessoAtivo)} style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: t.acessoAtivo ? 'rgba(57,255,20,0.1)' : 'rgba(239,68,68,0.1)', color: t.acessoAtivo ? neon : '#F87171', fontWeight: 600 }}>
                            {t.acessoAtivo ? 'Ativo' : 'Bloqueado'}
                          </button>
                          <button onClick={() => excluirTime(t.id)} style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: 'rgba(239,68,68,0.08)', color: '#F87171' }}>Excluir</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {times.map(t => (
                  <div key={t.id} style={{ background: cardBg, border: cardBorder, borderRadius: '12px', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <p style={{ fontFamily: syne, fontWeight: 700, fontSize: '13px', color: '#F0F4FF', margin: 0 }}>{t.nome}</p>
                      <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', margin: '2px 0 0' }}>{t.tipo}{t.responsavelNome ? ' · ' + t.responsavelNome : ''}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => toggleAcesso(t.id, t.acessoAtivo)} style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: t.acessoAtivo ? 'rgba(57,255,20,0.1)' : 'rgba(239,68,68,0.1)', color: t.acessoAtivo ? neon : '#F87171', fontWeight: 600 }}>
                        {t.acessoAtivo ? 'Ativo' : 'Bloqueado'}
                      </button>
                      <button onClick={() => excluirTime(t.id)} style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: 'rgba(239,68,68,0.08)', color: '#F87171' }}>Excluir</button>
                    </div>
                  </div>
                ))}
                {times.length === 0 && <p style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '40px 0', fontSize: '13px' }}>Nenhum time cadastrado.</p>}
              </div>
            )}
          </div>
        )}

        {/* ── ABA JOGOS ── */}
        {aba === 'jogos' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {jogos.length === 0 ? (
              <p style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '40px 0', fontSize: '13px' }}>Nenhum jogo gerado.</p>
            ) : (
              <>
                {grupos.length > 0 && jogos.some(j => j.fase === 'Fase de Grupos') && (
                  <div>
                    <p style={{ fontFamily: syne, fontWeight: 700, fontSize: '12px', color: neon, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Fase de Grupos</p>
                    {grupos.map(grupo => (
                      <div key={grupo} style={{ marginBottom: '16px' }}>
                        <p style={{ fontFamily: syne, fontWeight: 700, fontSize: '11px', color: gold, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1.2px' }}>Grupo {grupo}</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {jogos.filter(j => j.fase === 'Fase de Grupos' && j.grupo === grupo).map(j => (
                            <div key={j.id} style={{ background: cardBg, border: cardBorder, borderRadius: '14px', padding: '12px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '10px' }}>
                                <p style={{ fontFamily: syne, fontWeight: 700, fontSize: '12px', color: '#F0F4FF', flex: 1, textAlign: 'right', margin: 0 }}>{nomeTime(j.timeAId)}</p>
                                <div style={{ background: 'rgba(57,255,20,0.08)', border: '1px solid rgba(57,255,20,0.2)', borderRadius: '10px', padding: '5px 12px', minWidth: '60px', textAlign: 'center' }}>
                                  <p style={{ fontFamily: syne, fontWeight: 800, fontSize: '15px', color: neon, margin: 0 }}>{j.golsA} × {j.golsB}</p>
                                </div>
                                <p style={{ fontFamily: syne, fontWeight: 700, fontSize: '12px', color: '#F0F4FF', flex: 1, margin: 0 }}>{nomeTime(j.timeBId)}</p>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '20px', fontWeight: 600, ...jogoBadgeStyle(j.status) }}>{j.status}</span>
                                <a href={'/campeonato/jogo/' + j.id} style={{ fontSize: '12px', background: 'rgba(57,255,20,0.08)', border: '1px solid rgba(57,255,20,0.2)', color: neon, padding: '4px 12px', borderRadius: '8px', fontWeight: 700, fontFamily: syne, textDecoration: 'none' }}>Súmula</a>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    {campeonato.formato !== 'grupos' && (
                      <button onClick={() => setShowMataMata(!showMataMata)} style={{ width: '100%', background: 'rgba(249,115,22,0.1)', color: '#FB923C', border: '1px solid rgba(249,115,22,0.2)', padding: '12px', borderRadius: '12px', fontSize: '13px', fontWeight: 700, fontFamily: syne, cursor: 'pointer', marginBottom: '8px' }}>
                        🏆 Gerar mata-mata com classificados
                      </button>
                    )}
                  </div>
                )}

                {fasesMataMatata.map(fase => (
                  <div key={fase}>
                    <p style={{ fontFamily: syne, fontWeight: 700, fontSize: '12px', color: '#FB923C', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>{fase}</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {jogos.filter(j => j.fase === fase).map(j => (
                        <div key={j.id} style={{ background: cardBg, border: '1px solid rgba(249,115,22,0.15)', borderRadius: '14px', padding: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '10px' }}>
                            <p style={{ fontFamily: syne, fontWeight: 700, fontSize: '12px', color: '#F0F4FF', flex: 1, textAlign: 'right', margin: 0 }}>{nomeTime(j.timeAId)}</p>
                            <div style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.25)', borderRadius: '10px', padding: '5px 12px', minWidth: '60px', textAlign: 'center' }}>
                              <p style={{ fontFamily: syne, fontWeight: 800, fontSize: '15px', color: '#FB923C', margin: 0 }}>{j.golsA} × {j.golsB}</p>
                            </div>
                            <p style={{ fontFamily: syne, fontWeight: 700, fontSize: '12px', color: '#F0F4FF', flex: 1, margin: 0 }}>{nomeTime(j.timeBId)}</p>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '20px', fontWeight: 600, ...jogoBadgeStyle(j.status) }}>{j.status}</span>
                            <a href={'/campeonato/jogo/' + j.id} style={{ fontSize: '12px', background: 'rgba(57,255,20,0.08)', border: '1px solid rgba(57,255,20,0.2)', color: neon, padding: '4px 12px', borderRadius: '8px', fontWeight: 700, fontFamily: syne, textDecoration: 'none' }}>Súmula</a>
                          </div>
                        </div>
                      ))}
                    </div>
                    {fase !== 'Final' && jogos.filter(j => j.fase === fase).every(j => j.status === 'encerrado') && jogos.filter(j => j.fase === fase).length > 0 && (
                      <button onClick={() => gerarProximaFase(fase)} style={{ width: '100%', background: 'rgba(249,115,22,0.1)', color: '#FB923C', border: '1px solid rgba(249,115,22,0.2)', padding: '10px', borderRadius: '10px', fontSize: '12px', fontWeight: 700, fontFamily: syne, cursor: 'pointer', marginTop: '8px' }}>
                        Gerar próxima fase →
                      </button>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* ── ABA CLASSIFICAÇÃO ── */}
        {aba === 'classificacao' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {classificacao.length === 0 ? (
              <p style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '40px 0', fontSize: '13px' }}>Sorteie os grupos e gere os jogos primeiro.</p>
            ) : (
              classificacao.map(({ grupo, times: tms }) => (
                <div key={grupo} style={{ background: cardBg, border: cardBorder, borderRadius: '14px', overflow: 'hidden' }}>
                  <p style={{ fontFamily: syne, fontWeight: 700, fontSize: '11px', color: gold, padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', textTransform: 'uppercase', letterSpacing: '1.5px', margin: 0 }}>Grupo {grupo}</p>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                          {['Time', 'J', 'V', 'E', 'D', 'GP', 'GC', 'SG', 'Pts'].map((h, i) => (
                            <th key={h} style={{ padding: i === 0 ? '8px 8px 8px 14px' : '8px', color: 'rgba(255,255,255,0.35)', fontWeight: 600, textAlign: i === 0 ? 'left' : 'center', whiteSpace: 'nowrap' as const }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {tms.map((t, i) => (
                          <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: i < classificadosPorGrupo ? 'rgba(57,255,20,0.04)' : 'transparent' }}>
                            <td style={{ padding: '8px 8px 8px 14px', fontFamily: syne, fontWeight: 700, fontSize: '12px', color: '#F0F4FF', whiteSpace: 'nowrap' as const }}>{t.nome}</td>
                            <td style={{ padding: '8px', textAlign: 'center' as const, color: 'rgba(255,255,255,0.5)' }}>{t.jogos}</td>
                            <td style={{ padding: '8px', textAlign: 'center' as const, color: 'rgba(255,255,255,0.5)' }}>{t.v}</td>
                            <td style={{ padding: '8px', textAlign: 'center' as const, color: 'rgba(255,255,255,0.5)' }}>{t.e}</td>
                            <td style={{ padding: '8px', textAlign: 'center' as const, color: 'rgba(255,255,255,0.5)' }}>{t.d}</td>
                            <td style={{ padding: '8px', textAlign: 'center' as const, color: 'rgba(255,255,255,0.5)' }}>{t.gp}</td>
                            <td style={{ padding: '8px', textAlign: 'center' as const, color: 'rgba(255,255,255,0.5)' }}>{t.gc}</td>
                            <td style={{ padding: '8px', textAlign: 'center' as const, color: 'rgba(255,255,255,0.5)' }}>{t.saldo}</td>
                            <td style={{ padding: '8px 14px 8px 8px', textAlign: 'center' as const, color: neon, fontFamily: syne, fontWeight: 800, fontSize: '13px' }}>{t.pts}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p style={{ fontSize: '11px', color: 'rgba(57,255,20,0.5)', padding: '6px 14px', borderTop: '1px solid rgba(255,255,255,0.04)', margin: 0 }}>🟢 Verde = classificados</p>
                </div>
              ))
            )}
          </div>
        )}

      </div>

      {/* ── NAV ── */}
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
