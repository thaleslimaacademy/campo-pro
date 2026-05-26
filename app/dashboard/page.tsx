'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Dashboard() {
  const [totalAtletas, setTotalAtletas] = useState(0)
  const [presencaHoje, setPresencaHoje] = useState({ presentes: 0, total: 0 })
  const [pendentes, setPendentes] = useState(0)
  const [loading, setLoading] = useState(true)
  const [receitaMes, setReceitaMes] = useState(0)
  const [inadimplentes, setInadimplentes] = useState(0)
  const [totalPendente, setTotalPendente] = useState(0)
  const [cobrancasMes, setCobrancasMes] = useState(0)

  useEffect(() => {
    async function carregar() {
      const { count } = await supabase
        .from('Atleta')
        .select('*', { count: 'exact', head: true })
        .eq('escolaId', 'escola-demo')
        .eq('ativo', true)
      setTotalAtletas(count || 0)

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

      const { count: countPendentes } = await supabase
        .from('Matricula')
        .select('*', { count: 'exact', head: true })
        .eq('escolaId', 'escola-demo')
        .eq('status', 'PENDENTE')
      setPendentes(countPendentes || 0)

      const agora = new Date()
      const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1).toISOString().split('T')[0]
      const fimMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 0).toISOString().split('T')[0]

      const { data: cobrancas } = await supabase
        .from('Cobranca')
        .select('valor, status, vencimento')
        .eq('escolaId', 'escola-demo')
        .gte('vencimento', inicioMes)
        .lte('vencimento', fimMes)

      if (cobrancas) {
        const pagas = cobrancas.filter(c => c.status === 'PAGO')
        const pendentesFinanceiro = cobrancas.filter(c => c.status === 'PENDENTE' || c.status === 'VENCIDO')
        const vencidas = cobrancas.filter(c => c.status === 'VENCIDO')
        setReceitaMes(pagas.reduce((sum, c) => sum + Number(c.valor), 0))
        setTotalPendente(pendentesFinanceiro.reduce((sum, c) => sum + Number(c.valor), 0))
        setInadimplentes(vencidas.length)
        setCobrancasMes(cobrancas.length)
      }

      setLoading(false)
    }
    carregar()
  }, [])

  const percentualPresenca = presencaHoje.total > 0
    ? Math.round((presencaHoje.presentes / presencaHoje.total) * 100)
    : 0

  const mesAtual = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 pb-24">
      <h1 className="text-2xl font-bold text-green-500 mb-1">⚽ Campo Pro</h1>
      <p className="text-gray-400 text-sm mb-6">
        {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
      </p>

      {/* Cards principais */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <p className="text-gray-400 text-sm">Alunos Ativos</p>
          <p className="text-3xl font-bold text-white">{loading ? '...' : totalAtletas}</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <p className="text-gray-400 text-sm">Inadimplentes</p>
          <p className={`text-3xl font-bold ${inadimplentes > 0 ? 'text-red-400' : 'text-green-400'}`}>
            {loading ? '...' : inadimplentes}
          </p>
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
          <p className="text-2xl font-bold text-green-400">
            {loading ? '...' : `R$ ${receitaMes.toFixed(0)}`}
          </p>
        </div>
      </div>

      {/* Relatório financeiro */}
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-4">
        <div className="flex justify-between items-center mb-4">
          <p className="font-bold text-sm">💰 Financeiro — {mesAtual}</p>
          <a href="/financeiro" className="text-green-400 text-xs underline">Ver tudo</a>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-sm text-gray-300">Recebido</span>
            </div>
            <span className="font-bold text-green-400">R$ {loading ? '...' : receitaMes.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span className="text-sm text-gray-300">A receber</span>
            </div>
            <span className="font-bold text-yellow-400">R$ {loading ? '...' : totalPendente.toFixed(2)}</span>
          </div>
          {!loading && (receitaMes + totalPendente) > 0 && (
            <div className="mt-2">
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{ width: `${Math.round((receitaMes / (receitaMes + totalPendente)) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <p className="text-xs text-gray-500">{cobrancasMes} cobranças no mês</p>
                <p className="text-xs text-gray-500">
                  {`${Math.round((receitaMes / (receitaMes + totalPendente)) * 100)}% recebido`}
                </p>
              </div>
            </div>
          )}
          {!loading && cobrancasMes === 0 && (
            <p className="text-gray-500 text-xs text-center py-2">Nenhuma cobrança este mês</p>
          )}
        </div>
      </div>

      {/* Card pré-matrículas pendentes */}
      {pendentes > 0 && (
        <a href="/matriculas" className="block bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-400 font-bold">📋 Pré-matrículas pendentes</p>
              <p className="text-gray-400 text-sm mt-1">
                {pendentes} {pendentes === 1 ? 'ficha aguarda' : 'fichas aguardam'} sua aprovação
              </p>
            </div>
            <span className="bg-yellow-500 text-black text-lg font-bold w-10 h-10 rounded-full flex items-center justify-center">
              {pendentes}
            </span>
          </div>
        </a>
      )}

      {/* Ações rápidas */}
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-4">
        <p className="text-gray-400 text-sm mb-3">Ações rápidas</p>
        <div className="grid grid-cols-2 gap-3">
          <a href="/atletas/novo" className="bg-green-600 text-white p-3 rounded-lg text-center text-sm font-medium">+ Novo Atleta</a>
          <a href="/presenca" className="bg-blue-600 text-white p-3 rounded-lg text-center text-sm font-medium">✅ Fazer Chamada</a>
          <a href="/matriculas" className="col-span-2 bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-lg text-center text-sm font-medium transition">
            📋 Pré-matrículas {pendentes > 0 ? `(${pendentes} pendentes)` : ''}
          </a>
          <a href="/configuracoes" className="col-span-2 bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-lg text-center text-sm font-medium transition">
            ⚙️ Configurações da Escola
          </a>
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