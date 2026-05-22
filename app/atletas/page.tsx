'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Atleta = {
  id: string
  nome: string
  posicao: string | null
}

export default function Atletas() {
  const [atletas, setAtletas] = useState<Atleta[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function carregar() {
      const { data } = await supabase
        .from('Atleta')
        .select('id, nome, posicao')
        .eq('escolaId', 'escola-demo')
        .eq('ativo', true)
      setAtletas(data || [])
      setLoading(false)
    }
    carregar()
  }, [])

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 pb-24">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">👥 Atletas ({atletas.length})</h1>
        <a href="/atletas/novo" className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium">+ Novo</a>
      </div>
      {loading && <p className="text-gray-400 text-center mt-20">Carregando...</p>}
      {!loading && atletas.length === 0 && (
        <div className="text-center text-gray-500 mt-20">
          <p className="text-5xl mb-4">⚽</p>
          <p className="text-lg">Nenhum atleta cadastrado</p>
        </div>
      )}
      <div className="space-y-3">
        {atletas.map(atleta => (
          <div key={atleta.id} className="bg-gray-900 rounded-xl p-4 border border-gray-800 flex items-center gap-4">
            <div className="w-12 h-12 bg-green-900 rounded-full flex items-center justify-center text-xl font-bold text-green-400">
              {atleta.nome[0]}
            </div>
            <div>
              <p className="font-bold">{atleta.nome}</p>
              <p className="text-gray-400 text-sm">{atleta.posicao || 'Sem posição'}</p>
            </div>
          </div>
        ))}
      </div>
      <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 flex justify-around p-4">
        <a href="/dashboard" className="text-gray-400 text-xs text-center">🏠<br/>Início</a>
        <a href="/atletas" className="text-green-500 text-xs text-center">👥<br/>Atletas</a>
        <a href="/presenca" className="text-gray-400 text-xs text-center">✅<br/>Presença</a>
        <a href="/financeiro" className="text-gray-400 text-xs text-center">💰<br/>Financeiro</a>
      </nav>
    </div>
  )
}