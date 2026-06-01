'use client'
import { usePerfil } from '@/lib/usePerfil'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Convocacao {
  id: string
  titulo: string
  tipo: string
  data: string
  horario: string
  local: string
  descricao: string
  status: string
  createdAt: string
}

interface Atleta {
  id: string
  nome: string
  fotoUrl: string | null
  turmaId: string | null
  dataNascimento: string | null
}

interface Turma {
  id: string
  nome: string
}

export default function Convocacoes() {
  const { escolaId } = usePerfil()
  const [convocacoes, setConvocacoes] = useState<Convocacao[]>([])
  const [atletas, setAtletas] = useState<Atleta[]>([])
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [atletasSelecionados, setAtletasSelecionados] = useState<string[]>([])
  const [filtroTurma, setFiltroTurma] = useState('')
  const [filtroAno, setFiltroAno] = useState('')
  const [filtroNome, setFiltroNome] = useState('')
  const [form, setForm] = useState({
    titulo: '',
    tipo: 'amistoso',
    data: '',
    horario: '',
    local: '',
    descricao: '',
  })

  async function carregar() {
    const { data: conv } = await supabase
      .from('Convocacao')
      .select('*')
      .eq('escolaId', escolaId!)
      .order('data', { ascending: false })
    setConvocacoes(conv || [])

    const { data: ats } = await supabase
      .from('Atleta')
      .select('id, nome, fotoUrl, turmaId, dataNascimento')
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
    const matchTurma = filtroTurma === '' || a.turmaId === filtroTurma
    const matchAno = filtroAno === '' || (a.dataNascimento && new Date(a.dataNascimento).getFullYear().toString() === filtroAno)
    const matchNome = filtroNome === '' || a.nome.toLowerCase().includes(filtroNome.toLowerCase())
    return matchTurma && matchAno && matchNome
  })

  const anosDisponiveis = [...new Set(
    atletas
      .filter(a => a.dataNascimento)
      .map(a => new Date(a.dataNascimento!).getFullYear().toString())
  )].sort((a, b) => parseInt(b) - parseInt(a))

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  function toggleAtleta(id: string) {
    setAtletasSelecionados(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    )
  }

  function selecionarFiltrados() {
    const idsFiltrados = atletasFiltrados.map(a => a.id)
    const todosSelecionados = idsFiltrados.every(id => atletasSelecionados.includes(id))
    if (todosSelecionados) {
      setAtletasSelecionados(prev => prev.filter(id => !idsFiltrados.includes(id)))
    } else {
      setAtletasSelecionados(prev => [...new Set([...prev, ...idsFiltrados])])
    }
  }

  function selecionarTodos() {
    if (atletasSelecionados.length === atletas.length) {
      setAtletasSelecionados([])
    } else {
      setAtletasSelecionados(atletas.map(a => a.id))
    }
  }

  async function salvar() {
    if (!form.titulo || !form.data || !form.horario) {
      return alert('Titulo, data e horario sao obrigatorios.')
    }
    if (atletasSelecionados.length === 0) {
      return alert('Selecione pelo menos um atleta.')
    }
    setSalvando(true)

    const { data: conv, error } = await supabase
      .from('Convocacao')
      .insert({
        escolaId: escolaId!,
        titulo: form.titulo,
        tipo: form.tipo,
        data: form.data,
        horario: form.horario,
        local: form.local,
        descricao: form.descricao,
        status: 'aberta',
      })
      .select()
      .single()

    if (error || !conv) {
      alert('Erro: ' + error?.message)
      setSalvando(false)
      return
    }

    await supabase.from('ConvocacaoAtleta').insert(
      atletasSelecionados.map(atletaId => ({
        convocacaoId: conv.id,
        atletaId,
        status: 'pendente',
      }))
    )

    setSucesso(true)
    setForm({ titulo: '', tipo: 'amistoso', data: '', horario: '', local: '', descricao: '' })
    setAtletasSelecionados([])
    setFiltroTurma('')
    setFiltroAno('')
    setFiltroNome('')
    setShowForm(false)
    carregar()
    setTimeout(() => setSucesso(false), 3000)
    setSalvando(false)
  }

  async function encerrar(id: string) {
    await supabase.from('Convocacao').update({ status: 'encerrada' }).eq('id', id)
    carregar()
  }

  async function excluir(id: string) {
    if (!confirm('Excluir esta convocacao?')) return
    await supabase.from('ConvocacaoAtleta').delete().eq('convocacaoId', id)
    await supabase.from('Convocacao').delete().eq('id', id)
    carregar()
  }

  const tipoLabel: Record<string, string> = {
    amistoso: 'Amistoso',
    'jogo-treino': 'Jogo-Treino',
    campeonato: 'Campeonato',
    treino: 'Treino',
  }

  const tipoColor: Record<string, string> = {
    amistoso: 'bg-blue-600/20 text-blue-400',
    'jogo-treino': 'bg-purple-600/20 text-purple-400',
    campeonato: 'bg-yellow-600/20 text-yellow-400',
    treino: 'bg-green-600/20 text-green-400',
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <p className="text-gray-400">Carregando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 pb-24">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <a href="/dashboard" className="text-gray-400">Voltar</a>
          <h1 className="text-xl font-bold">📣 Convocacoes</h1>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-green-600 text-white px-4 py-2 rounded-xl font-bold text-sm"
        >
          {showForm ? 'Fechar' : '+ Nova'}
        </button>
      </div>

      {sucesso && (
        <div className="bg-green-600 rounded-xl p-3 mb-4 text-center">
          <p className="text-white font-bold">Convocacao criada com sucesso!</p>
        </div>
      )}

      {showForm && (
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-6">
          <p className="text-green-500 font-bold text-sm mb-4">Nova Convocacao</p>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-400">Titulo *</label>
              <input name="titulo" value={form.titulo} onChange={handleChange} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 mt-1 text-white" placeholder="Ex: Jogo contra Rivais FC" />
            </div>
            <div>
              <label className="text-sm text-gray-400">Tipo</label>
              <select name="tipo" value={form.tipo} onChange={handleChange} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 mt-1 text-white">
                <option value="amistoso">Amistoso</option>
                <option value="jogo-treino">Jogo-Treino</option>
                <option value="campeonato">Campeonato</option>
                <option value="treino">Treino</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-gray-400">Data *</label>
                <input name="data" value={form.data} onChange={handleChange} type="date" className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 mt-1 text-white" />
              </div>
              <div>
                <label className="text-sm text-gray-400">Horario *</label>
                <input name="horario" value={form.horario} onChange={handleChange} type="time" className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 mt-1 text-white" />
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-400">Local</label>
              <input name="local" value={form.local} onChange={handleChange} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 mt-1 text-white" placeholder="Ex: Campo Municipal" />
            </div>
            <div>
              <label className="text-sm text-gray-400">Descricao</label>
              <textarea name="descricao" value={form.descricao} onChange={handleChange} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 mt-1 text-white" rows={2} placeholder="Informacoes adicionais..." />
            </div>

            <div className="border border-gray-700 rounded-xl p-3">
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm text-gray-400 font-bold">Atletas convocados *</label>
                <button onClick={selecionarTodos} className="text-xs text-green-400 font-bold">
                  {atletasSelecionados.length === atletas.length ? 'Desmarcar todos' : 'Todos'}
                </button>
              </div>

              <div className="space-y-2 mb-3">
                <input
                  value={filtroNome}
                  onChange={e => setFiltroNome(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm"
                  placeholder="Buscar por nome..."
                />
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={filtroTurma}
                    onChange={e => setFiltroTurma(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm"
                  >
                    <option value="">Todas as turmas</option>
                    {turmas.map(t => (
                      <option key={t.id} value={t.id}>{t.nome}</option>
                    ))}
                  </select>
                  <select
                    value={filtroAno}
                    onChange={e => setFiltroAno(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm"
                  >
                    <option value="">Todos os anos</option>
                    {anosDisponiveis.map(ano => (
                      <option key={ano} value={ano}>{ano}</option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-xs text-gray-500">{atletasFiltrados.length} atleta(s) no filtro</p>
                  <button onClick={selecionarFiltrados} className="text-xs text-blue-400 font-bold">
                    Selecionar filtrados
                  </button>
                </div>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {atletasFiltrados.map(a => (
                  <div
                    key={a.id}
                    onClick={() => toggleAtleta(a.id)}
                    className={"flex items-center gap-3 p-2 rounded-lg cursor-pointer " + (atletasSelecionados.includes(a.id) ? 'bg-green-600/20 border border-green-600/40' : 'bg-gray-800')}
                  >
                    <div className={"w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 " + (atletasSelecionados.includes(a.id) ? 'bg-green-600 border-green-600' : 'border-gray-600')}>
                      {atletasSelecionados.includes(a.id) && <span className="text-white text-xs">✓</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{a.nome}</p>
                      {a.dataNascimento && (
                        <p className="text-xs text-gray-500">{new Date(a.dataNascimento).getFullYear()}</p>
                      )}
                    </div>
                    {a.turmaId && (
                      <p className="text-xs text-gray-500 truncate">
                        {turmas.find(t => t.id === a.turmaId)?.nome || ''}
                      </p>
                    )}
                  </div>
                ))}
                {atletasFiltrados.length === 0 && (
                  <p className="text-gray-500 text-sm text-center py-4">Nenhum atleta encontrado.</p>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">{atletasSelecionados.length} atleta(s) selecionado(s)</p>
            </div>

            <button onClick={salvar} disabled={salvando} className="w-full bg-green-600 text-white py-3 rounded-xl font-bold disabled:opacity-50">
              {salvando ? 'Salvando...' : 'Criar Convocacao'}
            </button>
          </div>
        </div>
      )}

      {convocacoes.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">📣</p>
          <p className="text-gray-400">Nenhuma convocacao ainda.</p>
          <p className="text-gray-500 text-sm mt-1">Clique em + Nova para criar.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {convocacoes.map(c => (
            <div key={c.id} className="bg-gray-900 rounded-xl p-4 border border-gray-800">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-bold text-white">{c.titulo}</p>
                  <span className={"text-xs px-2 py-1 rounded-full font-bold mt-1 inline-block " + (tipoColor[c.tipo] || 'bg-gray-700 text-gray-300')}>
                    {tipoLabel[c.tipo] || c.tipo}
                  </span>
                </div>
                <span className={"text-xs px-2 py-1 rounded-full font-bold " + (c.status === 'aberta' ? 'bg-green-600/20 text-green-400' : 'bg-gray-700 text-gray-400')}>
                  {c.status === 'aberta' ? 'Aberta' : 'Encerrada'}
                </span>
              </div>
              <div className="space-y-1 mb-3">
                <p className="text-gray-400 text-sm">{"📅 " + new Date(c.data + 'T00:00:00').toLocaleDateString('pt-BR') + " - " + c.horario}</p>
                {c.local && <p className="text-gray-400 text-sm">{"📍 " + c.local}</p>}
                {c.descricao && <p className="text-gray-500 text-xs">{c.descricao}</p>}
              </div>
              <div className="flex gap-2">
                <a href={"/convocacao/" + c.id} className="flex-1 bg-green-600/20 text-green-400 text-center py-2 rounded-lg text-sm font-bold">
                  Ver detalhes
                </a>
                {c.status === 'aberta' && (
                  <button onClick={() => encerrar(c.id)} className="bg-gray-800 text-gray-300 px-3 py-2 rounded-lg text-sm">
                    Encerrar
                  </button>
                )}
                <button onClick={() => excluir(c.id)} className="bg-red-600/20 text-red-400 px-3 py-2 rounded-lg text-sm">
                  Excluir
                </button>
              </div>
            </div>
          ))}
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