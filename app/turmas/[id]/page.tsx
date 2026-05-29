'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Atleta = {
  id: string
  nome: string
  posicao: string | null
  fotoUrl: string | null
  turmaId: string | null
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
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [turma, setTurma] = useState<Turma | null>(null)
  const [atletasTurma, setAtletasTurma] = useState<Atleta[]>([])
  const [atletasSemTurma, setAtletasSemTurma] = useState<Atleta[]>([])
  const [loading, setLoading] = useState(true)
  const [adicionando, setAdicionando] = useState(false)

  async function carregar() {
    const { data: t } = await supabase.from('Turma').select('*').eq('id', id).single()
    if (t) setTurma(t)

    const { data: comTurma } = await supabase
      .from('Atleta')
      .select('id, nome, posicao, fotoUrl, turmaId')
      .eq('turmaId', id)
      .eq('ativo', true)
      .order('nome')
    setAtletasTurma(comTurma || [])

    const { data: semTurma } = await supabase
      .from('Atleta')
      .select('id, nome, posicao, fotoUrl, turmaId')
      .eq('escolaId', 'escola-demo')
      .eq('ativo', true)
      .is('turmaId', null)
      .order('nome')
    setAtletasSemTurma(semTurma || [])

    setLoading(false)
  }

  useEffect(() => { carregar() }, [id])

  async function adicionarAtleta(atletaId: string) {
    await supabase.from('Atleta').update({ turmaId: id }).eq('id', atletaId)
    await carregar()
  }

  async function removerAtleta(atletaId: string) {
    await supabase.from('Atleta').update({ turmaId: null }).eq('id', atletaId)
    await carregar()
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
        <button onClick={excluirTurma} className="text-red-400 text-xs">Excluir</button>
      </div>

      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-4">
        {turma.diasSemana && (
          <p className="text-green-500 text-sm">{turma.diasSemana}{turma.horario ? " - " + turma.horario : ""}</p>
        )}
        {turma.descricao && <p className="text-gray-400 text-sm mt-1">{turma.descricao}</p>}
        <p className="text-gray-500 text-xs mt-2">{atletasTurma.length} atletas nesta turma</p>
      </div>

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
EOF