'use client'

import { useState } from 'react'

export default function GerarCobranca({ atletaId, atletaNome }: { atletaId: string; atletaNome: string }) {
  const [aberto, setAberto] = useState(false)
  const [valor, setValor] = useState('150')
  const [vencimento, setVencimento] = useState('')
  const [descricao, setDescricao] = useState('Mensalidade')
  const [gerando, setGerando] = useState(false)
  const [pix, setPix] = useState<{ copiaCola: string; qrCode: string } | null>(null)
  const [copiado, setCopiado] = useState(false)

  async function gerar() {
    if (!vencimento) return
    setGerando(true)
    const res = await fetch('/api/cobranca', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ atletaId, valor: parseFloat(valor), vencimento, descricao }),
    })
    const data = await res.json()
    if (data.sucesso) {
      setPix({ copiaCola: data.pixCopiaCola, qrCode: data.pixQrCode })
    } else {
      alert('Erro: ' + JSON.stringify(data.error))
    }
    setGerando(false)
  }

  function copiar() {
    if (!pix?.copiaCola) return
    navigator.clipboard.writeText(pix.copiaCola)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  if (pix) {
    return (
      <div className="bg-gray-900 rounded-xl p-4 border border-green-800 mb-4">
        <p className="font-bold text-green-400 mb-3">✅ Cobrança gerada!</p>
        {pix.qrCode && (
          <div className="flex justify-center mb-4">
            <img src={`data:image/png;base64,${pix.qrCode}`} alt="QR Code" className="w-48 h-48 rounded-xl border border-gray-700" />
          </div>
        )}
        <button onClick={copiar} className="w-full bg-green-600 text-white py-3 rounded-xl font-bold text-sm mb-2">
          {copiado ? '✅ Copiado!' : '📋 Copiar Pix Copia e Cola'}
        </button>
        <button onClick={() => { setPix(null); setAberto(false) }} className="w-full bg-gray-800 text-gray-400 py-2 rounded-xl text-sm">
          Fechar
        </button>
      </div>
    )
  }

  if (!aberto) {
    return (
      <button
        onClick={() => setAberto(true)}
        className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold text-sm transition mb-4"
      >
        💰 Gerar Cobrança Pix
      </button>
    )
  }

  return (
    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-4">
      <div className="flex justify-between items-center mb-4">
        <p className="font-bold text-sm">💰 Nova Cobrança — {atletaNome}</p>
        <button onClick={() => setAberto(false)} className="text-gray-400 text-xl">✕</button>
      </div>
      <div className="space-y-3">
        <div>
          <label className="text-xs text-gray-400">Valor (R$)</label>
          <input value={valor} onChange={e => setValor(e.target.value)} type="number" className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 mt-1 text-white" />
        </div>
        <div>
          <label className="text-xs text-gray-400">Vencimento</label>
          <input value={vencimento} onChange={e => setVencimento(e.target.value)} type="date" className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 mt-1 text-white" />
        </div>
        <div>
          <label className="text-xs text-gray-400">Descrição</label>
          <input value={descricao} onChange={e => setDescricao(e.target.value)} type="text" className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 mt-1 text-white" />
        </div>
        <button onClick={gerar} disabled={gerando || !vencimento} className="w-full bg-green-600 text-white py-3 rounded-xl font-bold disabled:opacity-50">
          {gerando ? 'Gerando...' : 'Gerar Pix'}
        </button>
      </div>
    </div>
  )
}