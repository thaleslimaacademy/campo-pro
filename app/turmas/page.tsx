'use client'
import { usePerfil } from '@/lib/usePerfil'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Turma = {
  id: string
  nome: string
  descricao: string | null
  diasSemana: string | null
  horario: string | null
  ativa: boolean
  totalAtletas?: number
}

export default function Turmas() {
  const { escolaId } = usePerfil()
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [loading, setLoading] = useState(true)
  const [criando, setCriando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [form, setForm] = useState({
    nome: '',
    descricao: '',
    diasSemana: '',
    horario: '',
  })

  async function carregar() {
    const { data } = await supabase
      .from('Turma')
      .select('*')
      .eq('escolaId', escolaId!)
      .eq('ativa', true)
      .order('nome')

    if (data) {
      const turmasComTotal = await Promise.all(
        data.map(async t => {
          const { count } = await supabase
            .from('Atleta')
            .select('*', { count: 'exact', head: true })
            .eq('turmaId', t.id)
            .eq('ativo', true)
          return { ...t, totalAtletas: count || 0 }
        })
      )
      setTurmas(turmasComTotal)
    }
    setLoading(false)
  }

  useEffect(() => { carregar() }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  async function salvar() {
    if (!form.nome) return
    setSalvando(true)
    await supabase.from('Turma').insert({
      escolaId: escolaId!,
      nome: form.nome,
      descricao: form.descricao || null,
      diasSemana: form.diasSemana || null,
      horario: form.horario || null,
    })
    setForm({ nome: '', descricao: '', diasSemana: '', horario: '' })
    setCriando(false)
    await carregar()
    setSalvando(false)
  }

  const dias = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 pb-24">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <a href="/dashboard" className="text-gray-400">← Voltar</a>
          <h1 className="text-xl font-bold">👥 Turmas</h1>
        </div>
        <button
          onClick={() => setCriando(true)}
          className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium"
        >
          + Nova
        </button>
      </div>

      {/* Formulário nova turma */}
      {criando && (
        <div className="bg-gray-900 rounded-xl p-4 border border-green-800 mb-4">
          <p className="text-green-500 font-bold text-sm mb-4">➕ Nova Turma</p>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-400">Nome da turma *</label>
              <input name="nome" value={form.nome} onChange={handleChange} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 mt-1 text-white" placeholder="Ex: Sub-10, Iniciante, Avançado..." />
            </div>
            <div>
              <label className="text-xs text-gray-400">Dias da semana</label>
              <input name="diasSemana" value={form.diasSemana} onChange={handleChange} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 mt-1 text-white" placeholder="Ex: Seg, Qua, Sex" />
            </div>
            <div>
              <label className="text-xs text-gray-400">Horário</label>
              <input name="horario" value={form.horario} onChange={handleChange} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 mt-1 text-white" placeholder="Ex: 08:00 - 09:30" />
            </div>
            <div>
              <label className="text-xs text-gray-400">Descrição</label>
              <textarea name="descricao" value={form.descricao} onChange={handleChange} rows={2} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 mt-1 text-white resize-none" placeholder="Observações sobre a turma..." />
            </div>
            <div className="flex gap-2">
              <button onClick={salvar} disabled={salvando || !form.nome} className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold disabled:opacity-50">
                {salvando ? 'Salvando...' : '💾 Salvar'}
              </button>
              <button onClick={() => setCriando(false)} className="flex-1 bg-gray-800 text-gray-400 py-3 rounded-xl font-bold">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {loading && <p className="text-gray-400 text-center mt-20">Carregando...</p>}

      {!loading && turmas.length === 0 && (
        <div className="text-center text-gray-500 mt-20">
          <p className="text-5xl mb-4">👥</p>
          <p className="text-lg">Nenhuma turma cadastrada</p>
          <p className="text-sm mt-2">Clique em + Nova para criar a primeira</p>
        </div>
      )}

      <div className="space-y-3">
        {turmas.map(t => (
          <a key={t.id} href={`/turmas/${t.id}`} className="block bg-gray-900 rounded-xl p-4 border border-gray-800">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold text-white">{t.nome}</p>
                {t.diasSemana && <p className="text-green-500 text-sm mt-1">{t.diasSemana} {t.horario ? `· ${t.horario}` : ''}</p>}
                {t.descricao && <p className="text-gray-400 text-xs mt-1">{t.descricao}</p>}
              </div>
              <div className="text-right">
                <span className="bg-gray-800 text-gray-300 text-xs px-2 py-1 rounded-full">
                  {t.totalAtletas} atleta{t.totalAtletas !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </a>
        ))}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 flex justify-around p-4">
        <a href="/dashboard" className="text-gray-400 text-xs text-center">🏠<br/>Início</a>
        <a href="/atletas" className="text-gray-400 text-xs text-center">👥<br/>Atletas</a>
        <a href="/presenca" className="text-gray-400 text-xs text-center">✅<br/>Presença</a>
        <a href="/financeiro" className="text-gray-400 text-xs text-center">💰<br/>Financeiro</a>
      </nav>
    </div>
  )
}