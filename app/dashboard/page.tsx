'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Dashboard() {
  const [totalAtletas, setTotalAtletas] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function carregar() {
      const { count } = await supabase
        .from('Atleta')
        .select('*', { count: 'exact', head: true })
        .eq('escolaId', 'escola-demo')
        .eq('ativo', true)
      setTotalAtletas(count || 0)
      setLoading(false)
    }
    carregar()
  }, [])

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 pb-24">
      <h1 className="text-2xl font-bold text-green-500 mb-2">⚽ Campo Pro</h1>
      <p className="text-gray-400 text-sm mb-6">Bem-vindo de volta!</p>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <p className="text-gray-400 text-sm">Alunos Ativos</p>
          <p className="text-3xl font-bold text-white">{loading ? '...' : totalAtletas}</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <p className="text-gray-400 text-sm">Inadimplentes</p>
          <p className="text-3xl font-bold text-red-400">0</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <p className="text-gray-400 text-sm">Presença Hoje</p>
          <p className="text-3xl font-bold text-green-400">0%</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <p className="text-gray-400 text-sm">Receita do Mês</p>
          <p className="text-3xl font-bold text-green-400">R$ 0</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-4">
        <p className="text-gray-400 text-sm mb-2">Ações rápidas</p>
        <div className="grid grid-cols-2 gap-3">
          <a href="/atletas/novo" className="bg-green-600 text-white p-3 rounded-lg text-center text-sm font-medium">+ Novo Atleta</a>
          <a href="/presenca" className="bg-blue-600 text-white p-3 rounded-lg text-center text-sm font-medium">✅ Fazer Chamada</a>
        </div>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 flex justify-around p-4">
        <a href="/dashboard" className="text-green-500 text-xs text-center">🏠<br/>Início</a>
        <a href="/atletas" className="text-gray-400 text-xs text-center">👥<br/>Atletas</a>
        <a href="/presenca" className="text-gray-400 text-xs text-center">✅<br/>Presença</a>
        <a href="/financeiro" className="text-gray-400 text-xs text-center">💰<br/>Financeiro</a>
      </nav>
    </div>
  )
}