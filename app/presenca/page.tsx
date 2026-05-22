'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Atleta = {
  id: string
  nome: string
  posicao: string | null
}

type Presenca = {
  atletaId: string
  status: 'PRESENTE' | 'AUSENTE'
}

export default function Presenca() {
  const [atletas, setAtletas] = useState<Atleta[]>([])
  const [presencas, setPresencas] = useState<Record<string, 'PRESENTE' | 'AUSENTE'>>({})
  const [treinoId, setTreinoId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState<string | null>(null)

  const hoje = new Date().toLocaleDateString('pt-BR')

  useEffect(() => {
    async function carregar() {
      const { data: atletasData } = await supabase
        .from('Atleta')
        .select('id, nome, posicao')
        .eq('escolaId', 'escola-demo')
        .eq('ativo', true)

      setAtletas(atletasData || [])

      const dataHoje = new Date().toISOString().split('T')[0]
      let { data: treino } = await supabase
        .from('Treino')
        .select('id')
        .eq('escolaId', 'escola-demo')
        .gte('data', dataHoje)
        .limit(1)
        .single()

      if (!treino) {
        const { data: novoTreino } = await supabase
          .from('Treino')
          .insert({ id: crypto.randomUUID(), escolaId: 'escola-demo', data: new Date().toISOString() })
          .select('id')
          .single()
        treino = novoTreino
      }

      if (treino) {
        setTreinoId(treino.id)
        const { data: presencasData } = await supabase
          .from('Presenca')
          .select('atletaId, status')
          .eq('treinoId', treino.id)

        const map: Record<string, 'PRESENTE' | 'AUSENTE'> = {}
        presencasData?.forEach((p: Presenca) => { map[p.atletaId] = p.status })
        setPresencas(map)
      }

      setLoading(false)
    }
    carregar()
  }, [])

  async function marcar(atletaId: string, status: 'PRESENTE' | 'AUSENTE') {
    if (!treinoId) return
    setSalvando(atletaId)

    const existente = presencas[atletaId]
    if (existente) {
      await supabase.from('Presenca').update({ status }).eq('atletaId', atletaId).eq('treinoId', treinoId)
    } else {
      await supabase.from('Presenca').insert({ id: crypto.randomUUID(), atletaId, treinoId, status })
    }

    setPresencas(prev => ({ ...prev, [atletaId]: status }))
    setSalvando(null)
  }

  const presentes = Object.values(presencas).filter(s => s === 'PRESENTE').length

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 pb-24">
      <h1 className="text-xl font-bold mb-1">✅ Presença</h1>
      <p className="text-gray-400 text-sm mb-2">Hoje — {hoje}</p>
      <p className="text-green-400 text-sm mb-6">{presentes} de {atletas.length} presentes</p>

      {loading && <p className="text-gray-400 text-center mt-20">Carregando...</p>}

      <div className="space-y-3">
        {atletas.map(atleta => {
          const status = presencas[atleta.id]
          const carregando = salvando === atleta.id
          return (
            <div key={atleta.id} className="bg-gray-900 rounded-xl p-4 border border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-900 rounded-full flex items-center justify-center font-bold text-green-400">
                  {atleta.nome[0]}
                </div>
                <div>
                  <p className="font-bold text-sm">{atleta.nome}</p>
                  <p className="text-gray-400 text-xs">{atleta.posicao || 'Sem posição'}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => marcar(atleta.id, 'PRESENTE')}
                  disabled={!!carregando}
                  className={`px-3 py-2 rounded-lg text-sm font-bold ${status === 'PRESENTE' ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400'}`}
                >
                  ✓
                </button>
                <button
                  onClick={() => marcar(atleta.id, 'AUSENTE')}
                  disabled={!!carregando}
                  className={`px-3 py-2 rounded-lg text-sm font-bold ${status === 'AUSENTE' ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400'}`}
                >
                  ✗
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 flex justify-around p-4">
        <a href="/dashboard" className="text-gray-400 text-xs text-center">🏠<br/>Início</a>
        <a href="/atletas" className="text-gray-400 text-xs text-center">👥<br/>Atletas</a>
        <a href="/presenca" className="text-green-500 text-xs text-center">✅<br/>Presença</a>
        <a href="/financeiro" className="text-gray-400 text-xs text-center">💰<br/>Financeiro</a>
      </nav>
    </div>
  )
}