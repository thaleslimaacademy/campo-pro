'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
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

  async function carregar() {
    const { data: camp } = await supabase.from('Campeonato').select('*').eq('id', id).single()
    setCampeonato(camp)
    const { data: tms } = await supabase.from('CampeonatoTime').select('*').eq('campeonatoId', id).order('nome')
    setTimes(tms || [])
    const { data: jgs } = await supabase.from('CampeonatoJogo').select('*').eq('campeonatoId', id).order('data')
    setJogos(jgs || [])
    setLoading(false)
  }

  useEffect(() => { carregar() }, [id])

  async function adicionarTime() {
    if (!formTime.nome) return alert('Nome obrigatorio.')
    if (times.length >= 16) return alert('Maximo 16 times.')
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
    if (!confirm('Excluir este time?')) return
    await supabase.from('CampeonatoAtleta').delete().eq('timeId', timeId)
    await supabase.from('CampeonatoTime').delete().eq('id', timeId)
    carregar()
  }

  async function toggleAcesso(timeId: string, ativo: boolean) {
    await supabase.from('CampeonatoTime').update({ acessoAtivo: !ativo }).eq('id', timeId)
    carregar()
  }

  async function atualizarStatus(novoStatus: string) {
    await supabase.from('Campeonato').update({ status: novoStatus }).eq('id', id)
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
      if (!confirm('Ja existem jogos de grupos. Regerar?')) return
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
      if (!confirm('Ainda ha jogos nao encerrados nesta fase. Continuar mesmo assim?')) return
    }

    const vencedores: string[] = []
    for (const j of jogosEncerrados) {
      if (j.golsA > j.golsB) vencedores.push(j.timeAId)
      else if (j.golsB > j.golsA) vencedores.push(j.timeBId)
    }

    if (vencedores.length < 2) return alert('Poucos vencedores para gerar proxima fase.')

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
      if (!confirm('Ja existem jogos desta fase. Regerar?')) return
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

  const statusColor: Record<string, string> = {
    rascunho: 'bg-gray-700 text-gray-300',
    inscricoes: 'bg-blue-600/20 text-blue-400',
    andamento: 'bg-green-600/20 text-green-400',
    encerrado: 'bg-red-600/20 text-red-400',
  }

  const fasesOpcoes = ['Oitavas de Final', 'Quartas de Final', 'Semifinal', 'Final']

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <p className="text-gray-400">Carregando...</p>
      </div>
    )
  }

  if (!campeonato) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <p>Campeonato nao encontrado.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 pb-24">
      <div className="flex items-center gap-3 mb-4">
        <a href="/campeonato" className="text-gray-400">Voltar</a>
        <h1 className="text-xl font-bold">🏆 {campeonato.nome}</h1>
      </div>

      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-4">
        <div className="flex items-center justify-between mb-3">
          <span className={"text-xs px-2 py-1 rounded-full font-bold " + statusColor[campeonato.status]}>
            {campeonato.status}
          </span>
          <p className="text-gray-400 text-xs">{times.length}/16 times · {campeonato.formato}</p>
        </div>

        <div className="flex gap-2 flex-wrap">
          {campeonato.status === 'rascunho' && (
            <button onClick={() => atualizarStatus('inscricoes')} className="text-xs bg-blue-600/20 text-blue-400 px-3 py-1 rounded-lg">Abrir inscricoes</button>
          )}
          {campeonato.status === 'inscricoes' && (
            <button onClick={() => atualizarStatus('andamento')} className="text-xs bg-green-600/20 text-green-400 px-3 py-1 rounded-lg">Iniciar</button>
          )}
          {campeonato.status === 'andamento' && (
            <button onClick={() => atualizarStatus('encerrado')} className="text-xs bg-red-600/20 text-red-400 px-3 py-1 rounded-lg">Encerrar</button>
          )}

          {campeonato.formato !== 'mata-mata' && (
            <>
              <button onClick={sortearGrupos} className="text-xs bg-yellow-600/20 text-yellow-400 px-3 py-1 rounded-lg">Sortear grupos</button>
              <button onClick={gerarJogosFaseGrupos} className="text-xs bg-purple-600/20 text-purple-400 px-3 py-1 rounded-lg">Gerar jogos grupos</button>
              <button onClick={() => setShowMataMata(!showMataMata)} className="text-xs bg-orange-600/20 text-orange-400 px-3 py-1 rounded-lg">Gerar mata-mata</button>
            </>
          )}

          {campeonato.formato === 'mata-mata' && (
            <button onClick={() => setShowMataMata(!showMataMata)} className="text-xs bg-purple-600/20 text-purple-400 px-3 py-1 rounded-lg">Gerar jogos</button>
          )}
        </div>

        {showMataMata && (
          <div className="mt-3 p-3 bg-gray-800 rounded-xl space-y-3">
            <p className="text-sm text-white font-bold">Configurar fase</p>

            <div>
              <label className="text-xs text-gray-400">Nome da fase</label>
              <select
                value={faseEscolhida}
                onChange={e => setFaseEscolhida(e.target.value)}
                className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm mt-1"
              >
                {fasesOpcoes.map(f => <option key={f} value={f}>{f}</option>)}
                <option value="custom">Personalizado...</option>
              </select>
              {faseEscolhida === 'custom' && (
                <input
                  onChange={e => setFaseEscolhida(e.target.value)}
                  className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm mt-2"
                  placeholder="Digite o nome da fase..."
                />
              )}
            </div>

            {campeonato.formato !== 'mata-mata' && (
              <div>
                <label className="text-xs text-gray-400">Times que avancam por grupo</label>
                <select
                  value={classificadosPorGrupo}
                  onChange={e => setClassificadosPorGrupo(parseInt(e.target.value))}
                  className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm mt-1"
                >
                  {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n} por grupo</option>)}
                </select>
              </div>
            )}

            <p className="text-xs text-gray-500">O sorteio dos confrontos sera feito automaticamente.</p>

            <button
              onClick={campeonato.formato === 'mata-mata' ? gerarJogosMataMataPuro : gerarMataMata}
              className="w-full bg-orange-600 text-white py-2 rounded-xl text-sm font-bold"
            >
              Gerar confrontos
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-2 mb-4">
        {(['times', 'jogos', 'classificacao'] as const).map(a => (
          <button
            key={a}
            onClick={() => setAba(a)}
            className={"flex-1 py-2 rounded-xl text-sm font-bold " + (aba === a ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400')}
          >
            {a === 'times' ? 'Times' : a === 'jogos' ? 'Jogos' : 'Classificacao'}
          </button>
        ))}
      </div>

      {aba === 'times' && (
        <div>
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm text-gray-400">{times.length} time(s)</p>
            <button onClick={() => setShowFormTime(!showFormTime)} className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm font-bold">
              {showFormTime ? 'Fechar' : '+ Adicionar'}
            </button>
          </div>

          {showFormTime && (
            <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-4 space-y-3">
              <div>
                <label className="text-sm text-gray-400">Nome *</label>
                <input value={formTime.nome} onChange={e => setFormTime(p => ({ ...p, nome: e.target.value }))} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 mt-1 text-white" placeholder="Ex: FC Estrela" />
              </div>
              <div>
                <label className="text-sm text-gray-400">Tipo</label>
                <select value={formTime.tipo} onChange={e => setFormTime(p => ({ ...p, tipo: e.target.value }))} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 mt-1 text-white">
                  <option value="interno">Interno</option>
                  <option value="externo">Externo</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-400">Responsavel</label>
                <input value={formTime.responsavelNome} onChange={e => setFormTime(p => ({ ...p, responsavelNome: e.target.value }))} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 mt-1 text-white" placeholder="Nome do tecnico" />
              </div>
              <div>
                <label className="text-sm text-gray-400">WhatsApp</label>
                <input value={formTime.responsavelWhatsapp} onChange={e => setFormTime(p => ({ ...p, responsavelWhatsapp: e.target.value }))} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 mt-1 text-white" placeholder="5534999999999" />
              </div>
              <button onClick={adicionarTime} disabled={salvandoTime} className="w-full bg-green-600 text-white py-3 rounded-xl font-bold disabled:opacity-50">
                {salvandoTime ? 'Salvando...' : 'Adicionar'}
              </button>
            </div>
          )}

          {grupos.length > 0 ? (
            grupos.map(grupo => (
              <div key={grupo} className="mb-4">
                <p className="text-yellow-400 font-bold text-sm mb-2">Grupo {grupo}</p>
                <div className="space-y-2">
                  {times.filter(t => t.grupo === grupo).map(t => (
                    <div key={t.id} className="bg-gray-900 rounded-xl p-3 border border-gray-800 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-white text-sm">{t.nome}</p>
                        <p className="text-gray-500 text-xs">{t.tipo}{t.responsavelNome ? ' - ' + t.responsavelNome : ''}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => toggleAcesso(t.id, t.acessoAtivo)} className={"text-xs px-2 py-1 rounded-lg " + (t.acessoAtivo ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400')}>
                          {t.acessoAtivo ? 'Ativo' : 'Bloqueado'}
                        </button>
                        <button onClick={() => excluirTime(t.id)} className="text-xs bg-red-600/20 text-red-400 px-2 py-1 rounded-lg">Excluir</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="space-y-2">
              {times.map(t => (
                <div key={t.id} className="bg-gray-900 rounded-xl p-3 border border-gray-800 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-white text-sm">{t.nome}</p>
                    <p className="text-gray-500 text-xs">{t.tipo}{t.responsavelNome ? ' - ' + t.responsavelNome : ''}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => toggleAcesso(t.id, t.acessoAtivo)} className={"text-xs px-2 py-1 rounded-lg " + (t.acessoAtivo ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400')}>
                      {t.acessoAtivo ? 'Ativo' : 'Bloqueado'}
                    </button>
                    <button onClick={() => excluirTime(t.id)} className="text-xs bg-red-600/20 text-red-400 px-2 py-1 rounded-lg">Excluir</button>
                  </div>
                </div>
              ))}
              {times.length === 0 && <p className="text-gray-400 text-center py-8">Nenhum time cadastrado.</p>}
            </div>
          )}
        </div>
      )}

      {aba === 'jogos' && (
        <div className="space-y-4">
          {jogos.length === 0 ? (
            <p className="text-gray-400 text-center py-8">Nenhum jogo gerado.</p>
          ) : (
            <>
              {grupos.length > 0 && jogos.some(j => j.fase === 'Fase de Grupos') && (
                <div>
                  <p className="text-green-500 font-bold text-sm mb-3">Fase de Grupos</p>
                  {grupos.map(grupo => (
                    <div key={grupo} className="mb-4">
                      <p className="text-yellow-400 text-xs font-bold mb-2">Grupo {grupo}</p>
                      <div className="space-y-2">
                        {jogos.filter(j => j.fase === 'Fase de Grupos' && j.grupo === grupo).map(j => (
                          <div key={j.id} className="bg-gray-900 rounded-xl p-3 border border-gray-800">
                            <div className="flex items-center justify-center gap-3 mb-2">
                              <p className="text-white text-sm font-bold flex-1 text-right">{nomeTime(j.timeAId)}</p>
                              <div className="bg-gray-800 rounded-lg px-3 py-1 min-w-14 text-center">
                                <p className="text-white font-bold">{j.golsA} x {j.golsB}</p>
                              </div>
                              <p className="text-white text-sm font-bold flex-1">{nomeTime(j.timeBId)}</p>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className={"text-xs px-2 py-1 rounded-full " + (j.status === 'encerrado' ? 'bg-green-600/20 text-green-400' : j.status === 'andamento' ? 'bg-yellow-600/20 text-yellow-400' : 'bg-gray-700 text-gray-400')}>
                                {j.status}
                              </span>
                              <a href={"/campeonato/jogo/" + j.id} className="text-xs bg-green-600/20 text-green-400 px-3 py-1 rounded-lg font-bold">Sumula</a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  {campeonato.formato !== 'grupos' && (
                    <button onClick={() => setShowMataMata(!showMataMata)} className="w-full bg-orange-600/20 text-orange-400 py-3 rounded-xl text-sm font-bold mb-2">
                      Gerar mata-mata com classificados
                    </button>
                  )}
                </div>
              )}

              {fasesMataMatata.map(fase => (
                <div key={fase}>
                  <p className="text-orange-400 font-bold text-sm mb-3">{fase}</p>
                  <div className="space-y-2">
                    {jogos.filter(j => j.fase === fase).map(j => (
                      <div key={j.id} className="bg-gray-900 rounded-xl p-3 border border-gray-800">
                        <div className="flex items-center justify-center gap-3 mb-2">
                          <p className="text-white text-sm font-bold flex-1 text-right">{nomeTime(j.timeAId)}</p>
                          <div className="bg-gray-800 rounded-lg px-3 py-1 min-w-14 text-center">
                            <p className="text-white font-bold">{j.golsA} x {j.golsB}</p>
                          </div>
                          <p className="text-white text-sm font-bold flex-1">{nomeTime(j.timeBId)}</p>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={"text-xs px-2 py-1 rounded-full " + (j.status === 'encerrado' ? 'bg-green-600/20 text-green-400' : j.status === 'andamento' ? 'bg-yellow-600/20 text-yellow-400' : 'bg-gray-700 text-gray-400')}>
                            {j.status}
                          </span>
                          <a href={"/campeonato/jogo/" + j.id} className="text-xs bg-green-600/20 text-green-400 px-3 py-1 rounded-lg font-bold">Sumula</a>
                        </div>
                      </div>
                    ))}
                  </div>
                  {fase !== 'Final' && jogos.filter(j => j.fase === fase).every(j => j.status === 'encerrado') && jogos.filter(j => j.fase === fase).length > 0 && (
                    <button onClick={() => gerarProximaFase(fase)} className="w-full bg-orange-600/20 text-orange-400 py-2 rounded-xl text-sm font-bold mt-2">
                      Gerar proxima fase
                    </button>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {aba === 'classificacao' && (
        <div className="space-y-4">
          {classificacao.length === 0 ? (
            <p className="text-gray-400 text-center py-8">Sorteie os grupos e gere os jogos primeiro.</p>
          ) : (
            classificacao.map(({ grupo, times: tms }) => (
              <div key={grupo} className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                <p className="text-yellow-400 font-bold text-sm p-3 border-b border-gray-800">Grupo {grupo}</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-gray-500 border-b border-gray-800">
                        <th className="text-left p-2 pl-3">Time</th>
                        <th className="p-2">J</th>
                        <th className="p-2">V</th>
                        <th className="p-2">E</th>
                        <th className="p-2">D</th>
                        <th className="p-2">GP</th>
                        <th className="p-2">GC</th>
                        <th className="p-2">SG</th>
                        <th className="p-2 pr-3">Pts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tms.map((t, i) => (
                        <tr key={t.id} className={"border-b border-gray-800 " + (i < classificadosPorGrupo ? 'bg-green-600/10' : '')}>
                          <td className="p-2 pl-3 text-white font-bold">{t.nome}</td>
                          <td className="p-2 text-center text-gray-400">{t.jogos}</td>
                          <td className="p-2 text-center text-gray-400">{t.v}</td>
                          <td className="p-2 text-center text-gray-400">{t.e}</td>
                          <td className="p-2 text-center text-gray-400">{t.d}</td>
                          <td className="p-2 text-center text-gray-400">{t.gp}</td>
                          <td className="p-2 text-center text-gray-400">{t.gc}</td>
                          <td className="p-2 text-center text-gray-400">{t.saldo}</td>
                          <td className="p-2 pr-3 text-center text-green-400 font-bold">{t.pts}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-gray-500 p-2 pl-3">Verde = classificados</p>
              </div>
            ))
          )}
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 flex justify-around p-4">
        <a href="/dashboard" className="text-gray-400 text-xs text-center">🏠<br />Inicio</a>
        <a href="/atletas" className="text-gray-400 text-xs text-center">👥<br />Atletas</a>
        <a href="/presenca" className="text-gray-400 text-xs text-center">✅<br />Presenca</a>
        <a href="/financeiro" className="text-gray-400 text-xs text-center">💰<br />Financeiro</a>
      </nav>
    </div>
  )
}