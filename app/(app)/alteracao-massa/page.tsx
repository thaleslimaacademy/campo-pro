'use client'
import { usePerfil } from '@/lib/usePerfil'
import AdminGuard from '@/components/AdminGuard'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { salvarConfiguracoes } from '../configuracoes/actions'

interface Atleta {
  id: string
  nome: string
  turmaId: string | null
  diaVencimento: number | null
  valorMensalidade: number | null
  dataNascimento: string | null
}

interface Turma {
  id: string
  nome: string
}

function AlteracaoMassaInner() {
  const { escolaId } = usePerfil()
  const [atletas, setAtletas] = useState<Atleta[]>([])
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState('')
  const [erro, setErro] = useState('')
  const [selecionados, setSelecionados] = useState<string[]>([])
  const [filtroTurma, setFiltroTurma] = useState('')
  const [filtroNome, setFiltroNome] = useState('')
  const [aba, setAba] = useState<'vencimento' | 'mensalidade' | 'turma' | 'aniversario'>('vencimento')

  const [novoVencimento, setNovoVencimento] = useState('10')
  const [novaMensalidade, setNovaMensalidade] = useState('')
  const [novaTurma, setNovaTurma] = useState('')

  async function carregar() {
    const { data: ats } = await supabase
      .from('Atleta')
      .select('id, nome, turmaId, diaVencimento, valorMensalidade, dataNascimento')
      .eq('escolaId', escolaId!)
      .eq('ativo', true)
      .order('nome')
    setAtletas(ats || [])

    const { data: tms } = await supabase
      .from('Turma')
      .select('id, nome')
      .eq('escolaId', escolaId!)
      .eq('ativa', true)
      .order('nome')
    setTurmas(tms || [])
    setLoading(false)
  }

  useEffect(() => { carregar() }, [])

  const atletasFiltrados = atletas.filter(a => {
    const matchNome = filtroNome === '' || a.nome.toLowerCase().includes(filtroNome.toLowerCase())
    const matchTurma = filtroTurma === '' || a.turmaId === filtroTurma
    return matchNome && matchTurma
  })

  function toggleAtleta(id: string) {
    setSelecionados(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id])
  }

  function selecionarTodos() {
    const ids = atletasFiltrados.map(a => a.id)
    const todosSelecionados = ids.every(id => selecionados.includes(id))
    if (todosSelecionados) {
      setSelecionados(prev => prev.filter(id => !ids.includes(id)))
    } else {
      setSelecionados(prev => [...new Set([...prev, ...ids])])
    }
  }

  async function aplicar() {
    if (selecionados.length === 0) return setErro('Selecione pelo menos um atleta.')
    setSalvando(true)
    setErro('')
    setSucesso('')

    let update: any = {}

    if (aba === 'vencimento') {
      if (!novoVencimento) return setErro('Informe o dia de vencimento.')
      update = { diaVencimento: parseInt(novoVencimento) }
    } else if (aba === 'mensalidade') {
      if (!novaMensalidade) return setErro('Informe o valor da mensalidade.')
      update = { valorMensalidade: parseFloat(novaMensalidade) }
    } else if (aba === 'turma') {
      if (!novaTurma) return setErro('Selecione uma turma.')
      update = { turmaId: novaTurma }
    }

    if (Object.keys(update).length === 0) {
      setSalvando(false)
      return
    }

    const { error } = await supabase
      .from('Atleta')
      .update(update)
      .in('id', selecionados)

    if (error) {
      setErro('Erro: ' + error.message)
    } else {
      setSucesso(selecionados.length + ' atleta(s) atualizados com sucesso!')
      setSelecionados([])
      carregar()
      setTimeout(() => setSucesso(''), 4000)
    }
    setSalvando(false)
  }

  const aniversariantes = atletas.filter(a => {
    if (!a.dataNascimento) return false
    const hoje = new Date()
    const nasc = new Date(a.dataNascimento + 'T12:00:00')
    return nasc.getMonth() === hoje.getMonth()
  }).sort((a, b) => {
    const diaA = new Date(a.dataNascimento + 'T12:00:00').getDate()
    const diaB = new Date(b.dataNascimento + 'T12:00:00').getDate()
    return diaA - diaB
  })

  const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
  const mesAtual = meses[new Date().getMonth()]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <p className="text-gray-400">Carregando...</p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: "100vh", color: "#F0F0F0", padding: "20px 20px 80px", fontFamily: "Inter, sans-serif" }}>
      <div className="flex items-center gap-3 mb-6">
        <a href="/dashboard" className="text-gray-400">Voltar</a>
        <h1 className="text-xl font-bold">Alteracao em Massa</h1>
      </div>

      {sucesso && (
        <div className="bg-green-600 rounded-xl p-3 mb-4 text-center">
          <p className="text-white font-bold">{sucesso}</p>
        </div>
      )}

      {erro && (
        <div className="bg-red-600/20 border border-red-600/40 rounded-xl p-3 mb-4">
          <p className="text-red-400 font-bold">{erro}</p>
        </div>
      )}

      <div className="flex gap-2 mb-4 overflow-x-auto">
        {([
          { key: 'vencimento', label: 'Vencimento' },
          { key: 'mensalidade', label: 'Mensalidade' },
          { key: 'turma', label: 'Turma' },
          { key: 'aniversario', label: 'Aniversarios' },
        ] as const).map(a => (
          <button
            key={a.key}
            onClick={() => setAba(a.key)}
            className={"px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap " + (aba === a.key ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400')}
          >
            {a.label}
          </button>
        ))}
      </div>

      {aba === 'aniversario' ? (
        <div>
          <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: "16px", padding: "16px", border: "1px solid rgba(255,255,255,0.07)", marginBottom: "12px" }}>
            <p className="text-green-500 font-bold text-sm mb-1">Aniversariantes de {mesAtual}</p>
            <p className="text-gray-500 text-xs">{aniversariantes.length} atleta(s)</p>
          </div>
          {aniversariantes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-4xl mb-3">🎂</p>
              <p className="text-gray-400">Nenhum aniversariante este mes.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {aniversariantes.map(a => {
                const nasc = new Date(a.dataNascimento + 'T12:00:00')
                const dia = nasc.getDate()
                const idade = new Date().getFullYear() - nasc.getFullYear()
                const hoje = new Date()
                const isHoje = nasc.getDate() === hoje.getDate() && nasc.getMonth() === hoje.getMonth()
                return (
                  <div key={a.id} className={"bg-gray-900 rounded-xl p-4 border flex items-center justify-between " + (isHoje ? 'border-yellow-500/50' : 'border-gray-800')}>
                    <div className="flex items-center gap-3">
                      <div className={"w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold " + (isHoje ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-600/20 text-green-400')}>
                        {isHoje ? '🎂' : a.nome[0]}
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm">{a.nome}</p>
                        <p className="text-gray-400 text-xs">Dia {dia} - {idade} anos</p>
                      </div>
                    </div>
                    {isHoje && (
                      <span className="bg-yellow-500/20 text-yellow-400 text-xs px-2 py-1 rounded-full font-bold">
                        Hoje!
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ) : (
        <div>
          <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: "16px", padding: "16px", border: "1px solid rgba(255,255,255,0.07)", marginBottom: "12px" }}>
            <p className="text-green-500 font-bold text-sm mb-3">
              {aba === 'vencimento' ? 'Novo dia de vencimento' :
               aba === 'mensalidade' ? 'Novo valor de mensalidade' :
               'Nova turma'}
            </p>

            {aba === 'vencimento' && (
              <select value={novoVencimento} onChange={e => setNovoVencimento(e.target.value)} style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "12px", color: "#F0F0F0", fontFamily: "Inter, sans-serif", fontSize: "13px", boxSizing: "border-box" }}>
                {[1, 5, 10, 15, 20, 25, 30].map(d => (
                  <option key={d} value={d}>Dia {d}</option>
                ))}
              </select>
            )}

            {aba === 'mensalidade' && (
              <input
                type="number"
                value={novaMensalidade}
                onChange={e => setNovaMensalidade(e.target.value)}
                style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "12px", color: "#F0F0F0", fontFamily: "Inter, sans-serif", fontSize: "13px", boxSizing: "border-box" }}
                placeholder="Ex: 150.00"
              />
            )}

            {aba === 'turma' && (
              <select value={novaTurma} onChange={e => setNovaTurma(e.target.value)} style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "12px", color: "#F0F0F0", fontFamily: "Inter, sans-serif", fontSize: "13px", boxSizing: "border-box" }}>
                <option value="">Selecione uma turma</option>
                {turmas.map(t => (
                  <option key={t.id} value={t.id}>{t.nome}</option>
                ))}
              </select>
            )}
          </div>

          <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: "16px", padding: "16px", border: "1px solid rgba(255,255,255,0.07)", marginBottom: "12px" }}>
            <div className="flex justify-between items-center mb-3">
              <p className="text-green-500 font-bold text-sm">Selecionar atletas</p>
              <button onClick={selecionarTodos} className="text-xs text-blue-400 font-bold">
                {atletasFiltrados.every(a => selecionados.includes(a.id)) ? 'Desmarcar todos' : 'Selecionar todos'}
              </button>
            </div>

            <div className="space-y-2 mb-3">
              <input
                value={filtroNome}
                onChange={e => setFiltroNome(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm"
                placeholder="Buscar por nome..."
              />
              <select value={filtroTurma} onChange={e => setFiltroTurma(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm">
                <option value="">Todas as turmas</option>
                {turmas.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
              </select>
            </div>

            <p className="text-xs text-gray-500 mb-2">{selecionados.length} selecionado(s) de {atletasFiltrados.length}</p>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {atletasFiltrados.map(a => (
                <div
                  key={a.id}
                  onClick={() => toggleAtleta(a.id)}
                  className={"flex items-center gap-3 p-2 rounded-lg cursor-pointer " + (selecionados.includes(a.id) ? 'bg-green-600/20 border border-green-600/40' : 'bg-gray-800')}
                >
                  <div className={"w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 " + (selecionados.includes(a.id) ? 'bg-green-600 border-green-600' : 'border-gray-600')}>
                    {selecionados.includes(a.id) && <span className="text-white text-xs">✓</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{a.nome}</p>
                    <p className="text-xs text-gray-500">
                      {aba === 'vencimento' ? 'Venc: dia ' + (a.diaVencimento || '-') :
                       aba === 'mensalidade' ? 'R$ ' + (a.valorMensalidade?.toFixed(2) || '-') :
                       turmas.find(t => t.id === a.turmaId)?.nome || 'Sem turma'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={aplicar}
            disabled={salvando || selecionados.length === 0}
            className="w-full bg-green-600 hover:bg-green-500 text-white py-4 rounded-xl font-bold text-lg disabled:opacity-50"
          >
            {salvando ? 'Aplicando...' : 'Aplicar para ' + selecionados.length + ' atleta(s)'}
          </button>
        </div>
      )}

      <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, display: "flex", justifyContent: "space-around", padding: "12px 0 20px", borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(5,5,5,0.95)", backdropFilter: "blur(10px)" }}>
        <a href="/dashboard" className="text-gray-400 text-xs text-center">Inicio</a>
        <a href="/atletas" className="text-gray-400 text-xs text-center">Atletas</a>
        <a href="/presenca" className="text-gray-400 text-xs text-center">Presenca</a>
        <a href="/financeiro" className="text-gray-400 text-xs text-center">Financeiro</a>
      </nav>
    </div>
  )
}
export default function AlteracaoMassa(props: any) {
  return (
    <AdminGuard>
      <AlteracaoMassaInner {...props} />
    </AdminGuard>
  )
}
