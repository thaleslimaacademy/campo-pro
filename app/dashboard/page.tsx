'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { usePerfil } from '@/lib/usePerfil'

export default function Dashboard() {
  const { isAdmin, carregou } = usePerfil()
  const [totalAtletas, setTotalAtletas] = useState(0)
  const [presencaHoje, setPresencaHoje] = useState({ presentes: 0, total: 0 })
  const [pendentes, setPendentes] = useState(0)
  const [rematriculas, setRematriculas] = useState(0)
  const [loading, setLoading] = useState(true)
  const [receitaMes, setReceitaMes] = useState(0)
  const [inadimplentes, setInadimplentes] = useState(0)
  const [totalPendente, setTotalPendente] = useState(0)
  const [cobrancasMes, setCobrancasMes] = useState(0)
  const [copiado, setCopiado] = useState(false)
  const linkMatricula = 'https://campo-pro.vercel.app/matricula'

  useEffect(() => {
    async function carregar() {
      const { count } = await supabase.from('Atleta').select('*', { count: 'exact', head: true }).eq('escolaId', 'escola-demo').eq('ativo', true)
      setTotalAtletas(count || 0)
      const dataHoje = new Date().toISOString().split('T')[0]
      const { data: treino } = await supabase.from('Treino').select('id').eq('escolaId', 'escola-demo').gte('data', dataHoje).limit(1).single()
      if (treino) {
        const { data: presencas } = await supabase.from('Presenca').select('status').eq('treinoId', treino.id)
        const presentes = presencas?.filter(p => p.status === 'PRESENTE').length || 0
        setPresencaHoje({ presentes, total: presencas?.length || 0 })
      }
      const { count: countPendentes } = await supabase.from('Matricula').select('*', { count: 'exact', head: true }).eq('escolaId', 'escola-demo').eq('status', 'PENDENTE').eq('tipo', 'matricula')
      setPendentes(countPendentes || 0)
      const { count: countRematriculas } = await supabase.from('Matricula').select('*', { count: 'exact', head: true }).eq('escolaId', 'escola-demo').eq('status', 'PENDENTE').eq('tipo', 'rematricula')
      setRematriculas(countRematriculas || 0)
      const agora = new Date()
      const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1).toISOString().split('T')[0]
      const fimMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 0).toISOString().split('T')[0]
      const { data: cobrancas } = await supabase.from('Cobranca').select('valor, status, vencimento').eq('escolaId', 'escola-demo').gte('vencimento', inicioMes).lte('vencimento', fimMes)
      if (cobrancas) {
        const pagas = cobrancas.filter(c => c.status === 'PAGO')
        const pendentesF = cobrancas.filter(c => c.status === 'PENDENTE' || c.status === 'VENCIDO')
        const vencidas = cobrancas.filter(c => c.status === 'VENCIDO')
        setReceitaMes(pagas.reduce((s, c) => s + Number(c.valor), 0))
        setTotalPendente(pendentesF.reduce((s, c) => s + Number(c.valor), 0))
        setInadimplentes(vencidas.length)
        setCobrancasMes(cobrancas.length)
      }
      setLoading(false)
    }
    carregar()
  }, [])

  function copiarLink() {
    navigator.clipboard.writeText(linkMatricula)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  function enviarWhatsApp() {
    const whatsapp = prompt('Digite o WhatsApp do responsavel (com DDD):')
    if (!whatsapp) return
    const numero = whatsapp.replace(/[^0-9]/g, '')
    const numeroFormatado = numero.startsWith('55') ? numero : '55' + numero
    const mensagem = encodeURIComponent('Ola! Acesse o link para fazer a pre-matricula na Thales Lima Football Academy:\n\n' + linkMatricula)
    window.open('https://wa.me/' + numeroFormatado + '?text=' + mensagem, '_blank')
  }

  const percentualPresenca = presencaHoje.total > 0 ? Math.round((presencaHoje.presentes / presencaHoje.total) * 100) : 0
  const mesAtual = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  if (!carregou) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <p className="text-gray-400">Carregando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 pb-24">
      <h1 className="text-2xl font-bold text-green-500 mb-1">Campo Pro</h1>
      <p className="text-gray-400 text-sm mb-6">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <p className="text-gray-400 text-sm">Alunos Ativos</p>
          <p className="text-3xl font-bold text-white">{loading ? '...' : totalAtletas}</p>
        </div>
        {isAdmin && (
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <p className="text-gray-400 text-sm">Inadimplentes</p>
            <p className={'text-3xl font-bold ' + (inadimplentes > 0 ? 'text-red-400' : 'text-green-400')}>{loading ? '...' : inadimplentes}</p>
          </div>
        )}
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <p className="text-gray-400 text-sm">Presenca Hoje</p>
          <p className={'text-3xl font-bold ' + (percentualPresenca >= 75 ? 'text-green-400' : percentualPresenca > 0 ? 'text-yellow-400' : 'text-gray-400')}>
            {loading ? '...' : presencaHoje.total === 0 ? 'Sem treino' : percentualPresenca + '%'}
          </p>
        </div>
        {isAdmin && (
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <p className="text-gray-400 text-sm">Receita do Mes</p>
            <p className="text-2xl font-bold text-green-400">{loading ? '...' : 'R$ ' + receitaMes.toFixed(0)}</p>
          </div>
        )}
      </div>

      {isAdmin && (
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-4">
          <div className="flex justify-between items-center mb-4">
            <p className="font-bold text-sm">Financeiro - {mesAtual}</p>
            <a href="/financeiro" className="text-green-400 text-xs underline">Ver tudo</a>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500"></div><span className="text-sm text-gray-300">Recebido</span></div>
              <span className="font-bold text-green-400">R$ {loading ? '...' : receitaMes.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-yellow-500"></div><span className="text-sm text-gray-300">A receber</span></div>
              <span className="font-bold text-yellow-400">R$ {loading ? '...' : totalPendente.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {isAdmin && pendentes > 0 && (
        <a href="/matriculas" className="block bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-400 font-bold">Pre-matriculas pendentes</p>
              <p className="text-gray-400 text-sm mt-1">{pendentes} fichas aguardam aprovacao</p>
            </div>
            <span className="bg-yellow-500 text-black text-lg font-bold w-10 h-10 rounded-full flex items-center justify-center">{pendentes}</span>
          </div>
        </a>
      )}

      {isAdmin && rematriculas > 0 && (
        <a href="/rematriculas" className="block bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-400 font-bold">Rematriculas pendentes</p>
              <p className="text-gray-400 text-sm mt-1">{rematriculas} renovacoes aguardam aprovacao</p>
            </div>
            <span className="bg-orange-500 text-black text-lg font-bold w-10 h-10 rounded-full flex items-center justify-center">{rematriculas}</span>
          </div>
        </a>
      )}

      {isAdmin && (
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-4">
          <p className="text-gray-400 text-sm mb-1">Link de Pre-matricula</p>
          <p className="text-xs text-gray-500 break-all mb-3">{linkMatricula}</p>
          <div className="flex gap-2">
            <button onClick={copiarLink} className="flex-1 bg-gray-800 text-white py-2 rounded-lg text-sm font-medium">{copiado ? 'Copiado!' : 'Copiar'}</button>
            <button onClick={enviarWhatsApp} className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-medium">WhatsApp</button>
          </div>
        </div>
      )}

      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-4">
        <p className="text-gray-400 text-sm mb-3">Acoes rapidas</p>
        <div className="grid grid-cols-2 gap-3">
          <a href="/atletas/novo" className="bg-green-600 text-white p-3 rounded-lg text-center text-sm font-medium">Novo Atleta</a>
          <a href="/presenca" className="bg-blue-600 text-white p-3 rounded-lg text-center text-sm font-medium">Fazer Chamada</a>
          <a href="/turmas" className="col-span-2 bg-purple-600 text-white p-3 rounded-lg text-center text-sm font-medium">Gerenciar Turmas</a>
          <a href="/mensagens" className="col-span-2 bg-blue-700 text-white p-3 rounded-lg text-center text-sm font-medium">Mensagens</a>
          <a href="/comissao" className="col-span-2 bg-indigo-700 text-white p-3 rounded-lg text-center text-sm font-medium">Comissao Tecnica</a>
          <a href="/convocacao" className="col-span-2 bg-orange-600 text-white p-3 rounded-lg text-center text-sm font-medium">Convocacoes</a>
          <a href="/campeonato" className="col-span-2 bg-yellow-600 text-white p-3 rounded-lg text-center text-sm font-medium">Campeonatos</a>
          <a href="/relatorios" className="col-span-2 bg-cyan-700 text-white p-3 rounded-lg text-center text-sm font-medium">Relatorios PDF</a>
          {isAdmin && (
            <>
              <a href="/matriculas" className="col-span-2 bg-gray-800 text-white p-3 rounded-lg text-center text-sm font-medium">Pre-matriculas {pendentes > 0 ? '(' + pendentes + ' pendentes)' : ''}</a>
              <a href="/rematriculas" className="col-span-2 bg-orange-700 text-white p-3 rounded-lg text-center text-sm font-medium">Rematriculas {rematriculas > 0 ? '(' + rematriculas + ' pendentes)' : ''}</a>
              <a href="/alteracao-massa" className="col-span-2 bg-teal-700 text-white p-3 rounded-lg text-center text-sm font-medium">Alteracao em Massa</a>
              <a href="/configuracoes" className="col-span-2 bg-gray-800 text-white p-3 rounded-lg text-center text-sm font-medium">Configuracoes da Escola</a>
          <a href='/planos' target='_blank' className='col-span-2 bg-green-800 text-white p-3 rounded-lg text-center text-sm font-medium'>Planos e Precos</a>
            </>
          )}
        </div>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 flex justify-around p-4">
        <a href="/dashboard" className="text-green-500 text-xs text-center">Inicio</a>
        <a href="/atletas" className="text-gray-400 text-xs text-center">Atletas</a>
        <a href="/presenca" className="text-gray-400 text-xs text-center">Presenca</a>
        {isAdmin && <a href="/financeiro" className="text-gray-400 text-xs text-center">Financeiro</a>}
      </nav>
    </div>
  )
}
