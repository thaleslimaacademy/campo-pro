'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

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

interface Time {
  id: string
  nome: string
}

interface Evento {
  id: string
  tipo: string
  atletaNome: string
  timeId: string
  minuto: number | null
  createdAt: string
}

interface Atleta {
  id: string
  nome: string
}

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
  const [formEvento, setFormEvento] = useState({
    tipo: 'gol',
    timeId: '',
    atletaNome: '',
    minuto: '',
  })

  async function carregar() {
    const { data: j } = await supabase.from('CampeonatoJogo').select('*').eq('id', id).single()
    setJogo(j)
    if (!j) { setLoading(false); return }

    const { data: tA } = await supabase.from('CampeonatoTime').select('id, nome').eq('id', j.timeAId).single()
    const { data: tB } = await supabase.from('CampeonatoTime').select('id, nome').eq('id', j.timeBId).single()
    setTimeA(tA)
    setTimeB(tB)

    const { data: atsA } = await supabase
      .from('CampeonatoAtleta')
      .select('id, nome')
      .eq('timeId', j.timeAId)
    setAtletasA(atsA || [])

    const { data: atsB } = await supabase
      .from('CampeonatoAtleta')
      .select('id, nome')
      .eq('timeId', j.timeBId)
    setAtletasB(atsB || [])

    const { data: evs } = await supabase
      .from('SumulaEvento')
      .select('*')
      .eq('jogoId', id)
      .order('minuto')
    setEventos(evs || [])

    setLoading(false)
  }

  useEffect(() => { carregar() }, [id])

  async function iniciarJogo() {
    await supabase.from('CampeonatoJogo').update({ status: 'andamento' }).eq('id', id)
    carregar()
  }

  async function encerrarJogo() {
    if (!confirm('Encerrar este jogo? O placar sera finalizado.')) return
    await supabase.from('CampeonatoJogo').update({ status: 'encerrado' }).eq('id', id)
    carregar()
  }

  async function adicionarEvento() {
    if (!formEvento.atletaNome || !formEvento.timeId) {
      return alert('Selecione o time e informe o nome do atleta.')
    }
    setSalvando(true)

    const novoGolsA = jogo!.golsA + (formEvento.tipo === 'gol' && formEvento.timeId === jogo!.timeAId ? 1 : 0)
    const novoGolsB = jogo!.golsB + (formEvento.tipo === 'gol' && formEvento.timeId === jogo!.timeBId ? 1 : 0)

    await supabase.from('SumulaEvento').insert({
      jogoId: id,
      tipo: formEvento.tipo,
      atletaNome: formEvento.atletaNome,
      timeId: formEvento.timeId,
      minuto: formEvento.minuto ? parseInt(formEvento.minuto) : null,
    })

    if (formEvento.tipo === 'gol') {
      await supabase.from('CampeonatoJogo').update({
        golsA: novoGolsA,
        golsB: novoGolsB,
      }).eq('id', id)
    }

    setFormEvento({ tipo: 'gol', timeId: '', atletaNome: '', minuto: '' })
    setShowAddEvento(false)
    carregar()
    setSalvando(false)
  }

  async function removerEvento(eventoId: string, tipo: string, timeId: string) {
    if (!confirm('Remover este evento?')) return

    if (tipo === 'gol' && jogo) {
      const novoGolsA = jogo.golsA - (timeId === jogo.timeAId ? 1 : 0)
      const novoGolsB = jogo.golsB - (timeId === jogo.timeBId ? 1 : 0)
      await supabase.from('CampeonatoJogo').update({
        golsA: Math.max(0, novoGolsA),
        golsB: Math.max(0, novoGolsB),
      }).eq('id', id)
    }

    await supabase.from('SumulaEvento').delete().eq('id', eventoId)
    carregar()
  }

  async function salvarRelatorio() {
    setSalvando(true)
    await supabase.from('CampeonatoJogo').update({ relatorioArbitro: relatorio } as any).eq('id', id)
    setShowRelatorio(false)
    setSalvando(false)
    alert('Relatorio salvo!')
  }

  const atletasDoTime = formEvento.timeId === jogo?.timeAId ? atletasA : atletasB

  const tipoIcon: Record<string, string> = {
    gol: '⚽',
    cartao_amarelo: '🟨',
    cartao_vermelho: '🟥',
  }

  const tipoLabel: Record<string, string> = {
    gol: 'Gol',
    cartao_amarelo: 'Cartao Amarelo',
    cartao_vermelho: 'Cartao Vermelho',
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <p className="text-gray-400">Carregando...</p>
      </div>
    )
  }

  if (!jogo || !timeA || !timeB) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <p>Jogo nao encontrado.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 pb-24">
      <div className="flex items-center gap-3 mb-4">
        <a href={"/campeonato/" + jogo.campeonatoId} className="text-gray-400">Voltar</a>
        <h1 className="text-xl font-bold">📋 Sumula</h1>
      </div>

      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-500">{jogo.fase}{jogo.grupo ? ' - Grupo ' + jogo.grupo : ''}</span>
          <span className={"text-xs px-2 py-1 rounded-full font-bold " + (jogo.status === 'encerrado' ? 'bg-green-600/20 text-green-400' : jogo.status === 'andamento' ? 'bg-yellow-600/20 text-yellow-400' : 'bg-gray-700 text-gray-400')}>
            {jogo.status === 'agendado' ? 'Agendado' : jogo.status === 'andamento' ? 'Em andamento' : 'Encerrado'}
          </span>
        </div>

        <div className="flex items-center justify-center gap-4 my-4">
          <p className="text-white font-bold text-base flex-1 text-right">{timeA.nome}</p>
          <div className="bg-gray-800 rounded-2xl px-6 py-3 text-center">
            <p className="text-white font-bold text-4xl">{jogo.golsA} x {jogo.golsB}</p>
          </div>
          <p className="text-white font-bold text-base flex-1 text-left">{timeB.nome}</p>
        </div>

        <div className="flex gap-2 justify-center">
          {jogo.status === 'agendado' && (
            <button onClick={iniciarJogo} className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-bold">
              Iniciar Jogo
            </button>
          )}
          {jogo.status === 'andamento' && (
            <>
              <button onClick={() => setShowAddEvento(!showAddEvento)} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold">
                + Evento
              </button>
              <button onClick={encerrarJogo} className="bg-red-600/20 text-red-400 px-4 py-2 rounded-xl text-sm font-bold">
                Encerrar
              </button>
            </>
          )}
          {jogo.status === 'encerrado' && (
            <button onClick={() => setShowRelatorio(!showRelatorio)} className="bg-gray-700 text-white px-4 py-2 rounded-xl text-sm font-bold">
              Relatorio do Arbitro
            </button>
          )}
        </div>
      </div>

      {showAddEvento && (
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-4">
          <p className="text-green-500 font-bold text-sm mb-3">Registrar Evento</p>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-400">Tipo</label>
              <select value={formEvento.tipo} onChange={e => setFormEvento(p => ({ ...p, tipo: e.target.value }))} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 mt-1 text-white">
                <option value="gol">Gol</option>
                <option value="cartao_amarelo">Cartao Amarelo</option>
                <option value="cartao_vermelho">Cartao Vermelho</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-400">Time</label>
              <select value={formEvento.timeId} onChange={e => setFormEvento(p => ({ ...p, timeId: e.target.value, atletaNome: '' }))} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 mt-1 text-white">
                <option value="">Selecione o time</option>
                <option value={timeA.id}>{timeA.nome}</option>
                <option value={timeB.id}>{timeB.nome}</option>
              </select>
            </div>
            {formEvento.timeId && (
              <div>
                <label className="text-sm text-gray-400">Atleta</label>
                {atletasDoTime.length > 0 ? (
                  <select value={formEvento.atletaNome} onChange={e => setFormEvento(p => ({ ...p, atletaNome: e.target.value }))} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 mt-1 text-white">
                    <option value="">Selecione o atleta</option>
                    {atletasDoTime.map(a => (
                      <option key={a.id} value={a.nome}>{a.nome}</option>
                    ))}
                    <option value="outro">Outro (digitar)</option>
                  </select>
                ) : (
                  <input value={formEvento.atletaNome} onChange={e => setFormEvento(p => ({ ...p, atletaNome: e.target.value }))} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 mt-1 text-white" placeholder="Nome do atleta" />
                )}
                {formEvento.atletaNome === 'outro' && (
                  <input onChange={e => setFormEvento(p => ({ ...p, atletaNome: e.target.value }))} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 mt-1 text-white" placeholder="Digite o nome do atleta" />
                )}
              </div>
            )}
            <div>
              <label className="text-sm text-gray-400">Minuto (opcional)</label>
              <input value={formEvento.minuto} onChange={e => setFormEvento(p => ({ ...p, minuto: e.target.value }))} type="number" className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 mt-1 text-white" placeholder="Ex: 23" />
            </div>
            <button onClick={adicionarEvento} disabled={salvando} className="w-full bg-green-600 text-white py-3 rounded-xl font-bold disabled:opacity-50">
              {salvando ? 'Salvando...' : 'Registrar'}
            </button>
          </div>
        </div>
      )}

      {showRelatorio && (
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-4">
          <p className="text-green-500 font-bold text-sm mb-3">Relatorio do Arbitro</p>
          <textarea
            value={relatorio}
            onChange={e => setRelatorio(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white"
            rows={5}
            placeholder="Descreva ocorrencias, incidentes, observacoes do jogo..."
          />
          <button onClick={salvarRelatorio} disabled={salvando} className="w-full bg-green-600 text-white py-3 rounded-xl font-bold mt-3 disabled:opacity-50">
            {salvando ? 'Salvando...' : 'Salvar Relatorio'}
          </button>
        </div>
      )}

      <div className="bg-gray-900 rounded-xl border border-gray-800 mb-4">
        <p className="text-white font-bold text-sm p-4 border-b border-gray-800">
          Eventos ({eventos.length})
        </p>
        {eventos.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-6">Nenhum evento registrado.</p>
        ) : (
          <div className="divide-y divide-gray-800">
            {eventos.map(e => (
              <div key={e.id} className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{tipoIcon[e.tipo]}</span>
                  <div>
                    <p className="text-white text-sm font-bold">{e.atletaNome}</p>
                    <p className="text-gray-500 text-xs">
                      {tipoLabel[e.tipo]} - {e.timeId === timeA.id ? timeA.nome : timeB.nome}
                      {e.minuto ? " - " + e.minuto + "'" : ''}
                    </p>
                  </div>
                </div>
                {jogo.status !== 'encerrado' && (
                  <button onClick={() => removerEvento(e.id, e.tipo, e.timeId)} className="text-red-400 text-xs bg-red-600/20 px-2 py-1 rounded-lg">
                    Remover
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <p className="text-green-500 font-bold text-sm mb-2">{timeA.nome}</p>
          {eventos.filter(e => e.tipo === 'gol' && e.timeId === timeA.id).length === 0 ? (
            <p className="text-gray-500 text-xs">Sem gols</p>
          ) : (
            eventos.filter(e => e.tipo === 'gol' && e.timeId === timeA.id).map(e => (
              <p key={e.id} className="text-white text-xs">{"⚽ " + e.atletaNome + (e.minuto ? " " + e.minuto + "'" : '')}</p>
            ))
          )}
        </div>
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <p className="text-green-500 font-bold text-sm mb-2">{timeB.nome}</p>
          {eventos.filter(e => e.tipo === 'gol' && e.timeId === timeB.id).length === 0 ? (
            <p className="text-gray-500 text-xs">Sem gols</p>
          ) : (
            eventos.filter(e => e.tipo === 'gol' && e.timeId === timeB.id).map(e => (
              <p key={e.id} className="text-white text-xs">{"⚽ " + e.atletaNome + (e.minuto ? " " + e.minuto + "'" : '')}</p>
            ))
          )}
        </div>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 flex justify-around p-4">
        <a href="/dashboard" className="text-gray-400 text-xs text-center">🏠<br />Inicio</a>
        <a href="/atletas" className="text-gray-400 text-xs text-center">👥<br />Atletas</a>
        <a href="/presenca" className="text-gray-400 text-xs text-center">✅<br />Presenca</a>
        <a href="/financeiro" className="text-gray-400 text-xs text-center">💰<br />Financeiro</a>
      </nav>
    </div>
  )
}