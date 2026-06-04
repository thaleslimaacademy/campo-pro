'use client'
import { usePerfil } from '@/lib/usePerfil'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Atleta = {
  id: string
  nome: string
  posicao: string | null
  fotoUrl: string | null
  turmaId: string | null
  dataNascimento: string | null
}

type Turma = {
  id: string
  nome: string
  descricao: string | null
  diasSemana: string | null
  horario: string | null
  ativa: boolean
}

export default function TurmaDetalhes() {
  const { escolaId } = usePerfil()
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [turma, setTurma] = useState<Turma | null>(null)
  const [atletasTurma, setAtletasTurma] = useState<Atleta[]>([])
  const [atletasSemTurma, setAtletasSemTurma] = useState<Atleta[]>([])
  const [loading, setLoading] = useState(true)
  const [adicionando, setAdicionando] = useState(false)
  const [editando, setEditando] = useState(false)
  const [formEdit, setFormEdit] = useState({ nome: '', diasSemana: '', horario: '', descricao: '' })

  async function carregar() {
    const { data: t } = await supabase.from('Turma').select('*').eq('id', id).single()
    if (t) setTurma(t)

    const { data: comTurma } = await supabase
      .from('Atleta')
      .select('id, nome, posicao, fotoUrl, turmaId, dataNascimento')
      .eq('turmaId', id)
      .eq('ativo', true)
      .order('nome')
    setAtletasTurma(comTurma || [])

    const { data: semTurma } = await supabase
      .from('Atleta')
      .select('id, nome, posicao, fotoUrl, turmaId, dataNascimento')
      .eq('escolaId', escolaId!)
      .eq('ativo', true)
      .is('turmaId', null)
      .order('nome')
    setAtletasSemTurma(semTurma || [])

    if (t) setFormEdit({
        nome: t.nome || '',
        diasSemana: t.diasSemana || '',
        horario: t.horario || '',
        descricao: t.descricao || '',
      })
    setLoading(false)
  }

  useEffect(() => { if (escolaId) carregar() }, [id, escolaId])

  async function adicionarAtleta(atletaId: string) {
    await supabase.from('Atleta').update({ turmaId: id }).eq('id', atletaId)
    await carregar()
  }

  async function removerAtleta(atletaId: string) {
    await supabase.from('Atleta').update({ turmaId: null }).eq('id', atletaId)
    await carregar()
  }

  async function salvarEdicao() {
    await supabase.from('Turma').update({
      nome: formEdit.nome,
      diasSemana: formEdit.diasSemana,
      horario: formEdit.horario,
      descricao: formEdit.descricao,
    }).eq('id', id)
    setTurma(prev => prev ? { ...prev, ...formEdit } : prev)
    setEditando(false)
  }

  async function excluirTurma() {
    if (!confirm('Excluir esta turma? Os atletas serao desvinculados.')) return
    await supabase.from('Atleta').update({ turmaId: null }).eq('turmaId', id)
    await supabase.from('Turma').update({ ativa: false }).eq('id', id)
    router.push('/turmas')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <p className="text-gray-400">Carregando...</p>
      </div>
    )
  }

  if (!turma) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <p>Turma nao encontrada.</p>
      </div>
    )
  }

  const linkMensagem = "/mensagens/nova?turmaId=" + id + "&turmaNome=" + encodeURIComponent(turma.nome)

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 pb-24">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <a href="/turmas" className="text-gray-400">Voltar</a>
          <h1 className="text-xl font-bold">{turma.nome}</h1>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setEditando(!editando)} className="text-blue-400 text-xs font-bold">Editar</button>
          <button onClick={excluirTurma} className="text-red-400 text-xs">Excluir</button>
        </div>
      </div>

      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-4">
        {turma.diasSemana && (
          <p className="text-green-500 text-sm">{turma.diasSemana}{turma.horario ? " - " + turma.horario : ""}</p>
        )}
        {turma.descricao && <p className="text-gray-400 text-sm mt-1">{turma.descricao}</p>}
        <p className="text-gray-500 text-xs mt-2">{atletasTurma.length} atletas nesta turma</p>
      </div>
        {editando && (
          <div className="bg-gray-900 rounded-xl p-4 border border-blue-800 mb-4 mt-4">
            <p className="font-bold text-blue-400 mb-3">Editar Turma</p>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400">Nome</label>
                <input value={formEdit.nome} onChange={e => setFormEdit(p => ({...p, nome: e.target.value}))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 mt-1 text-white text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-400">Dias da semana</label>
                <input value={formEdit.diasSemana} onChange={e => setFormEdit(p => ({...p, diasSemana: e.target.value}))}
                  placeholder="Ex: Terca e Quinta"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 mt-1 text-white text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-400">Horario</label>
                <input value={formEdit.horario} onChange={e => setFormEdit(p => ({...p, horario: e.target.value}))}
                  placeholder="Ex: 18:00 - 19:00"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 mt-1 text-white text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-400">Descricao</label>
                <input value={formEdit.descricao} onChange={e => setFormEdit(p => ({...p, descricao: e.target.value}))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 mt-1 text-white text-sm" />
              </div>
              <div className="flex gap-2">
                <button onClick={salvarEdicao} className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-bold">Salvar</button>
                <button onClick={() => setEditando(false)} className="flex-1 bg-gray-800 text-gray-400 py-2 rounded-lg text-sm">Cancelar</button>
              </div>
            </div>
          </div>
        )}

      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-4">
        <div className="flex justify-between items-center mb-3">
          <p className="font-bold text-sm">Atletas</p>
          <button onClick={() => setAdicionando(!adicionando)} className="text-green-400 text-xs font-bold">
            {adicionando ? 'Fechar' : '+ Adicionar'}
          </button>
        </div>

        {atletasTurma.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-4">Nenhum atleta nesta turma</p>
        )}

        {atletasTurma.length > 0 && (
          <div className="space-y-2">
            {atletasTurma.map(a => (
              <div key={a.id} className="flex items-center justify-between bg-gray-800 rounded-xl p-3">
                <div className="flex items-center gap-3">
                  {a.fotoUrl ? (
                    <img src={a.fotoUrl} alt={a.nome} className="w-9 h-9 rounded-full object-cover" />
                  ) : (
                    <div className="w-9 h-9 bg-green-900 rounded-full flex items-center justify-center text-sm font-bold text-green-400">
                      {a.nome[0]}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium">{a.nome}</p>
                    <p style={{ fontSize: '12px', color: '#D4AF37', fontWeight: 800, margin: '1px 0 0' }}>{a.dataNascimento ? String(new Date(a.dataNascimento.includes('T') ? a.dataNascimento : a.dataNascimento + 'T12:00:00').getFullYear()) : ''}</p>
                    <p className="text-xs text-gray-400">{a.posicao || 'Sem posicao'}</p>
                  </div>
                </div>
                <button onClick={() => removerAtleta(a.id)} className="text-red-400 text-xs">Remover</button>
              </div>
            ))}
          </div>
        )}

        {adicionando && atletasSemTurma.length > 0 && (
          <div className="mt-4 border-t border-gray-700 pt-4">
            <p className="text-xs text-gray-400 mb-3">Atletas sem turma:</p>
            <div className="space-y-2">
              {atletasSemTurma.map(a => (
                <div key={a.id} className="flex items-center justify-between bg-gray-800/50 rounded-xl p-3">
                  <div className="flex items-center gap-3">
                    {a.fotoUrl ? (
                      <img src={a.fotoUrl} alt={a.nome} className="w-9 h-9 rounded-full object-cover" />
                    ) : (
                      <div className="w-9 h-9 bg-gray-700 rounded-full flex items-center justify-center text-sm font-bold text-gray-400">
                        {a.nome[0]}
                      </div>
                    )}
                    <p className="text-sm">{a.nome}</p>
                    <p style={{ fontSize: '12px', color: '#D4AF37', fontWeight: 800, margin: '1px 0 0' }}>{a.dataNascimento ? String(new Date(a.dataNascimento.includes('T') ? a.dataNascimento : a.dataNascimento + 'T12:00:00').getFullYear()) : ''}</p>
                  </div>
                  <button onClick={() => adicionarAtleta(a.id)} className="text-green-400 text-xs font-bold">+ Adicionar</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {adicionando && atletasSemTurma.length === 0 && (
          <p className="text-gray-500 text-xs text-center mt-4">Todos os atletas ja estao em uma turma</p>
        )}
      </div>

      <a href={linkMensagem} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold text-sm text-center block mb-4 transition">
        Enviar Mensagem para a Turma
      </a>

      <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 flex justify-around p-4">
        <a href="/dashboard" className="text-gray-400 text-xs text-center">Inicio</a>
        <a href="/atletas" className="text-gray-400 text-xs text-center">Atletas</a>
        <a href="/presenca" className="text-gray-400 text-xs text-center">Presenca</a>
        <a href="/financeiro" className="text-gray-400 text-xs text-center">Financeiro</a>
      </nav>
    </div>
  )
}
