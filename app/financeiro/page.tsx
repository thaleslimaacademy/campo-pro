'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Atleta = {
  id: string
  nome: string
}

export default function Financeiro() {
  const [atletas, setAtletas] = useState<Atleta[]>([])
  const [cobrancas, setCobrancas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [gerando, setGerando] = useState(false)
  const [copiado, setCopiado] = useState<string | null>(null)
  const [atletaId, setAtletaId] = useState('')
  const [valor, setValor] = useState('150')
  const [vencimento, setVencimento] = useState('')
  const [descricao, setDescricao] = useState('Mensalidade')
  const [mostrarForm, setMostrarForm] = useState(false)

  async function carregar() {
    const { data: atletasData } = await supabase
      .from('Atleta')
      .select('id, nome')
      .eq('escolaId', 'escola-demo')
      .eq('ativo', true)

    setAtletas(atletasData || [])
    if (atletasData && atletasData.length > 0) setAtletaId(atletasData[0].id)

    const { data: cobrancasData, error } = await supabase
      .from('Cobranca')
      .select('id, valor, vencimento, status, pixCopiaCola, descricao, atletaId')
      .eq('escolaId', 'escola-demo')
      .order('vencimento', { ascending: false })

    console.log('cobrancas:', cobrancasData, 'erro:', error)
    setCobrancas(cobrancasData || [])
    setLoading(false)
  }

  useEffect(() => { carregar() }, [])

  async function gerarCobranca() {
    if (!atletaId || !vencimento) return
    setGerando(true)

    const res = await fetch('/api/cobranca', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        atletaId,
        valor: parseFloat(valor),
        vencimento,
        descricao,
      }),
    })

    const data = await res.json()

    if (data.sucesso) {
      setMostrarForm(false)
      await carregar()
    } else {
      alert('Erro: ' + JSON.stringify(data))
    }

    setGerando(false)
  }

  function copiarPix(pix: string, id: string) {
    navigator.clipboard.writeText(pix)
    setCopiado(id)
    setTimeout(() => setCopiado(null), 2000)
  }

  const statusCor: Record<string, string> = {
    PENDENTE: 'text-yellow-400',
    PAGO: 'text-green-400',
    VENCIDO: 'text-red-400',
    CANCELADO: 'text-gray-400',
  }

  // Buscar nome do atleta pelo id
  function nomeAtleta(id: string) {
    return atletas.find(a => a.id === id)?.nome || 'Atleta'
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 pb-24">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">💰 Financeiro</h1>
        <button
          onClick={() => setMostrarForm(!mostrarForm)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          + Cobrança
        </button>
      </div>

      {mostrarForm && (
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-6">
          <p className="font-bold mb-4">Nova Cobrança</p>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-400">Atleta</label>
              <select value={atletaId} onChange={e => setAtletaId(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 mt-1 text-white">
                {atletas.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-400">Valor (R$)</label>
              <input value={valor} onChange={e => setValor(e.target.value)} type="number" className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 mt-1 text-white"/>
            </div>
            <div>
              <label className="text-sm text-gray-400">Vencimento</label>
              <input value={vencimento} onChange={e => setVencimento(e.target.value)} type="date" className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 mt-1 text-white"/>
            </div>
            <div>
              <label className="text-sm text-gray-400">Descrição</label>
              <input value={descricao} onChange={e => setDescricao(e.target.value)} type="text" className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 mt-1 text-white"/>
            </div>
            <button onClick={gerarCobranca} disabled={gerando} className="w-full bg-green-600 text-white py-3 rounded-lg font-bold disabled:opacity-50">
              {gerando ? 'Gerando Pix...' : 'Gerar Cobrança com Pix'}
            </button>
          </div>
        </div>
      )}

      {loading && <p className="text-gray-400 text-center mt-10">Carregando...</p>}

      {!loading && cobrancas.length === 0 && !mostrarForm && (
        <div className="text-center text-gray-500 mt-20">
          <p className="text-5xl mb-4">💳</p>
          <p className="text-lg">Nenhuma cobrança gerada</p>
          <p className="text-sm mt-2">Clique em "+ Cobrança" para começar</p>
        </div>
      )}

      <div className="space-y-3">
        {cobrancas.map(c => (
          <div key={c.id} className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-bold">{nomeAtleta(c.atletaId)}</p>
                <p className="text-gray-400 text-sm">{c.descricao || 'Mensalidade'}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-green-400">R$ {Number(c.valor).toFixed(2)}</p>
                <p className={`text-xs ${statusCor[c.status] || 'text-gray-400'}`}>{c.status}</p>
              </div>
            </div>
            <p className="text-gray-500 text-xs mb-2">Vencimento: {new Date(c.vencimento).toLocaleDateString('pt-BR')}</p>
            {c.pixCopiaCola && c.status === 'PENDENTE' && (
              <button onClick={() => copiarPix(c.pixCopiaCola, c.id)} className="w-full bg-gray-800 text-white py-2 rounded-lg text-sm font-medium">
                {copiado === c.id ? '✅ Pix copiado!' : '📋 Copiar Pix'}
              </button>
            )}
          </div>
        ))}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 flex justify-around p-4">
        <a href="/dashboard" className="text-gray-400 text-xs text-center">🏠<br/>Início</a>
        <a href="/atletas" className="text-gray-400 text-xs text-center">👥<br/>Atletas</a>
        <a href="/presenca" className="text-gray-400 text-xs text-center">✅<br/>Presença</a>
        <a href="/financeiro" className="text-green-500 text-xs text-center">💰<br/>Financeiro</a>
      </nav>
    </div>
  )
}