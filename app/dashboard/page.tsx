'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Dashboard() {
  const [totalAtletas, setTotalAtletas] = useState(0)
  const [presencaHoje, setPresencaHoje] = useState({ presentes: 0, total: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function carregar() {
      // Total de atletas
      const { count } = await supabase
        .from('Atleta')
        .select('*', { count: 'exact', head: true })
        .eq('escolaId', 'escola-demo')
        .eq('ativo', true)

      setTotalAtletas(count || 0)

      // Presença de hoje
      const dataHoje = new Date().toISOString().split('T')[0]
      const { data: treino } = await supabase
        .from('Treino')
        .select('id')
        .eq('escolaId', 'escola-demo')
        .gte('data', dataHoje)
        .limit(1)
        .single()

      if (treino) {
        const { data: presencas } = await supabase
          .from('Presenca')
          .select('status')
          .eq('treinoId', treino.id)

        const presentes = presencas?.filter(p => p.status === 'PRESENTE').length || 0
        setPresencaHoje({ presentes, total: presencas?.length || 0 })
      }

      setLoading(false)
    }
    carregar()
  }, [])

  const percentualPresenca = presencaHoje.total > 0
    ? Math.round((presencaHoje.presentes / presencaHoje.total) * 100)
    : 0

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 pb-24">
      <h1 className="text-2xl font-bold text-green-500 mb-1">⚽ Campo Pro</h1>
      <p className="text-gray-400 text-sm mb-6">
        {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
      </p>

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
          <p className={`text-3xl font-bold ${percentualPresenca >= 75 ? 'text-green-400' : percentualPresenca > 0 ? 'text-yellow-400' : 'text-gray-400'}`}>
            {loading ? '...' : presencaHoje.total === 0 ? 'Sem treino' : `${percentualPresenca}%`}
          </p>
          {presencaHoje.total > 0 && (
            <p className="text-gray-500 text-xs mt-1">{presencaHoje.presentes} de {presencaHoje.total}</p>
          )}
        </div>
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <p className="text-gray-400 text-sm">Receita do Mês</p>
          <p className="text-3xl font-bold text-green-400">R$ 0</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-4">
        <p className="text-gray-400 text-sm mb-3">Ações rápidas</p>
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