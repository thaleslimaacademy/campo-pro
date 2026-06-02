'use client'
import { usePerfil } from '@/lib/usePerfil'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Campeonato {
  id: string
  nome: string
  formato: string
  status: string
  dataInicio: string
  dataFim: string
  descricao: string
  createdAt: string
}

export default function Campeonatos() {
  const { escolaId } = usePerfil()
  const [campeonatos, setCampeonatos] = useState<Campeonato[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [form, setForm] = useState({
    nome: '',
    formato: 'grupos',
    dataInicio: '',
    dataFim: '',
    descricao: '',
  })

  async function carregar() {
    const { data } = await supabase
      .from('Campeonato')
      .select('*')
      .eq('escolaId', escolaId!)
      .order('createdAt', { ascending: false })
    setCampeonatos(data || [])
    setLoading(false)
  }

  useEffect(() => { if (escolaId) carregar() }, [escolaId])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  async function salvar() {
    if (!form.nome) return alert('Nome obrigatorio.')
    setSalvando(true)

    const { error } = await supabase.from('Campeonato').insert({
      escolaId: escolaId!,
      nome: form.nome,
      formato: form.formato,
      dataInicio: form.dataInicio || null,
      dataFim: form.dataFim || null,
      descricao: form.descricao,
      status: 'rascunho',
    })

    if (error) {
      alert('Erro: ' + error.message)
    } else {
      setSucesso(true)
      setForm({ nome: '', formato: 'grupos', dataInicio: '', dataFim: '', descricao: '' })
      setShowForm(false)
      carregar()
      setTimeout(() => setSucesso(false), 3000)
    }
    setSalvando(false)
  }

  async function excluir(id: string) {
    if (!confirm('Excluir este campeonato?')) return
    await supabase.from('SumulaEvento').delete().eq('jogoId', id)
    await supabase.from('CampeonatoJogo').delete().eq('campeonatoId', id)
    await supabase.from('CampeonatoAtleta').delete().in('timeId',
      (await supabase.from('CampeonatoTime').select('id').eq('campeonatoId', id)).data?.map(t => t.id) || []
    )
    await supabase.from('CampeonatoTime').delete().eq('campeonatoId', id)
    await supabase.from('Campeonato').delete().eq('id', id)
    carregar()
  }

  const statusLabel: Record<string, string> = {
    rascunho: 'Rascunho',
    inscricoes: 'Inscricoes',
    andamento: 'Em andamento',
    encerrado: 'Encerrado',
  }

  const statusColor: Record<string, string> = {
    rascunho: 'bg-gray-700 text-gray-300',
    inscricoes: 'bg-blue-600/20 text-blue-400',
    andamento: 'bg-green-600/20 text-green-400',
    encerrado: 'bg-red-600/20 text-red-400',
  }

  const formatoLabel: Record<string, string> = {
    grupos: 'Fase de Grupos',
    'mata-mata': 'Mata-Mata',
    misto: 'Grupos + Mata-Mata',
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
          <h1 className="text-xl font-bold">🏆 Campeonatos</h1>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-green-600 text-white px-4 py-2 rounded-xl font-bold text-sm"
        >
          {showForm ? 'Fechar' : '+ Novo'}
        </button>
      </div>

      {sucesso && (
        <div className="bg-green-600 rounded-xl p-3 mb-4 text-center">
          <p className="text-white font-bold">Campeonato criado!</p>
        </div>
      )}

      {showForm && (
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-6">
          <p className="text-green-500 font-bold text-sm mb-4">Novo Campeonato</p>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-400">Nome *</label>
              <input name="nome" value={form.nome} onChange={handleChange} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 mt-1 text-white" placeholder="Ex: Copa Verao 2026" />
            </div>
            <div>
              <label className="text-sm text-gray-400">Formato</label>
              <select name="formato" value={form.formato} onChange={handleChange} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 mt-1 text-white">
                <option value="grupos">Fase de Grupos</option>
                <option value="mata-mata">Mata-Mata</option>
                <option value="misto">Grupos + Mata-Mata</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-gray-400">Data inicio</label>
                <input name="dataInicio" value={form.dataInicio} onChange={handleChange} type="date" className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 mt-1 text-white" />
              </div>
              <div>
                <label className="text-sm text-gray-400">Data fim</label>
                <input name="dataFim" value={form.dataFim} onChange={handleChange} type="date" className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 mt-1 text-white" />
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-400">Descricao</label>
              <textarea name="descricao" value={form.descricao} onChange={handleChange} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 mt-1 text-white" rows={2} placeholder="Detalhes do campeonato..." />
            </div>
            <button onClick={salvar} disabled={salvando} className="w-full bg-green-600 text-white py-3 rounded-xl font-bold disabled:opacity-50">
              {salvando ? 'Salvando...' : 'Criar Campeonato'}
            </button>
          </div>
        </div>
      )}

      {campeonatos.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🏆</p>
          <p className="text-gray-400">Nenhum campeonato ainda.</p>
          <p className="text-gray-500 text-sm mt-1">Clique em + Novo para criar.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {campeonatos.map(c => (
            <div key={c.id} className="bg-gray-900 rounded-xl p-4 border border-gray-800">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-bold text-white text-lg">{c.nome}</p>
                  <p className="text-gray-400 text-sm">{formatoLabel[c.formato]}</p>
                </div>
                <span className={"text-xs px-2 py-1 rounded-full font-bold " + statusColor[c.status]}>
                  {statusLabel[c.status]}
                </span>
              </div>
              {(c.dataInicio || c.dataFim) && (
                <p className="text-gray-500 text-xs mb-3">
                  {"📅 " + (c.dataInicio ? new Date(c.dataInicio + 'T00:00:00').toLocaleDateString('pt-BR') : '') + (c.dataFim ? " ate " + new Date(c.dataFim + 'T00:00:00').toLocaleDateString('pt-BR') : '')}
                </p>
              )}
              {c.descricao && <p className="text-gray-500 text-xs mb-3">{c.descricao}</p>}
              <div className="flex gap-2">
                <a href={"/campeonato/" + c.id} className="flex-1 bg-yellow-600/20 text-yellow-400 text-center py-2 rounded-lg text-sm font-bold">
                  Gerenciar
                </a>
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