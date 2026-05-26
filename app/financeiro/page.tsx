'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Atleta = {
  id: string
  nome: string
}

type Cobranca = {
  id: string
  valor: number
  vencimento: string
  status: string
  pixCopiaCola: string | null
  pixQrCode: string | null
  descricao: string
  atletaId: string
}

type Inadimplente = {
  atletaId: string
  nome: string
  cobrancas: Cobranca[]
  totalDevido: number
}

export default function Financeiro() {
  const [atletas, setAtletas] = useState<Atleta[]>([])
  const [cobrancas, setCobrancas] = useState<Cobranca[]>([])
  const [inadimplentes, setInadimplentes] = useState<Inadimplente[]>([])
  const [loading, setLoading] = useState(true)
  const [gerando, setGerando] = useState(false)
  const [gerandoLote, setGerandoLote] = useState(false)
  const [copiado, setCopiado] = useState<string | null>(null)
  const [atletaId, setAtletaId] = useState('')
  const [valor, setValor] = useState('150')
  const [vencimento, setVencimento] = useState('')
  const [descricao, setDescricao] = useState('Mensalidade')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [mostrarLote, setMostrarLote] = useState(false)
  const [mostrarInadimplentes, setMostrarInadimplentes] = useState(false)
  const [pixAtivo, setPixAtivo] = useState<Cobranca | null>(null)
  const [valorLote, setValorLote] = useState('150')
  const [vencimentoLote, setVencimentoLote] = useState('')
  const [descricaoLote, setDescricaoLote] = useState('Mensalidade')
  const [atletasSelecionados, setAtletasSelecionados] = useState<string[]>([])
  const [progressoLote, setProgressoLote] = useState<{ atual: number; total: number; nome: string } | null>(null)
  const [aba, setAba] = useState<'todas' | 'inadimplentes'>('todas')

  async function carregar() {
    const { data: atletasData } = await supabase
      .from('Atleta')
      .select('id, nome')
      .eq('escolaId', 'escola-demo')
      .eq('ativo', true)

    setAtletas(atletasData || [])
    if (atletasData && atletasData.length > 0) setAtletaId(atletasData[0].id)

    const { data: cobrancasData } = await supabase
      .from('Cobranca')
      .select('id, valor, vencimento, status, pixCopiaCola, pixQrCode, descricao, atletaId')
      .eq('escolaId', 'escola-demo')
      .order('vencimento', { ascending: false })

    setCobrancas(cobrancasData || [])

    // Calcula inadimplentes — cobranças vencidas ou pendentes com vencimento passado
    const hoje = new Date().toISOString().split('T')[0]
    const vencidas = (cobrancasData || []).filter(c =>
      c.status === 'VENCIDO' || (c.status === 'PENDENTE' && c.vencimento < hoje)
    )

    // Agrupa por atleta
    const porAtleta: Record<string, Inadimplente> = {}
    for (const c of vencidas) {
      if (!porAtleta[c.atletaId]) {
        const nomeAtl = atletasData?.find(a => a.id === c.atletaId)?.nome || 'Atleta'
        porAtleta[c.atletaId] = {
          atletaId: c.atletaId,
          nome: nomeAtl,
          cobrancas: [],
          totalDevido: 0,
        }
      }
      porAtleta[c.atletaId].cobrancas.push(c)
      porAtleta[c.atletaId].totalDevido += Number(c.valor)
    }

    setInadimplentes(Object.values(porAtleta))
    setLoading(false)
  }

  useEffect(() => { carregar() }, [])

  async function gerarCobranca() {
    if (!atletaId || !vencimento) return
    setGerando(true)
    const res = await fetch('/api/cobranca', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ atletaId, valor: parseFloat(valor), vencimento, descricao }),
    })
    const data = await res.json()
    if (data.sucesso) {
      setMostrarForm(false)
      await carregar()
      if (data.pixCopiaCola || data.pixQrCode) {
        setPixAtivo({
          id: crypto.randomUUID(),
          valor: parseFloat(valor),
          vencimento,
          status: 'PENDENTE',
          pixCopiaCola: data.pixCopiaCola,
          pixQrCode: data.pixQrCode,
          descricao,
          atletaId,
        })
      }
    } else {
      alert('Erro: ' + JSON.stringify(data))
    }
    setGerando(false)
  }

  function toggleAtleta(id: string) {
    setAtletasSelecionados(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    )
  }

  function selecionarTodos() {
    if (atletasSelecionados.length === atletas.length) {
      setAtletasSelecionados([])
    } else {
      setAtletasSelecionados(atletas.map(a => a.id))
    }
  }

  async function gerarCobrancaLote() {
    if (atletasSelecionados.length === 0 || !vencimentoLote) return
    setGerandoLote(true)
    const total = atletasSelecionados.length
    let sucesso = 0
    let erro = 0
    for (let i = 0; i < atletasSelecionados.length; i++) {
      const id = atletasSelecionados[i]
      const atleta = atletas.find(a => a.id === id)
      setProgressoLote({ atual: i + 1, total, nome: atleta?.nome || '' })
      try {
        const res = await fetch('/api/cobranca', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ atletaId: id, valor: parseFloat(valorLote), vencimento: vencimentoLote, descricao: descricaoLote }),
        })
        const data = await res.json()
        if (data.sucesso) sucesso++
        else erro++
      } catch { erro++ }
      await new Promise(r => setTimeout(r, 500))
    }
    setProgressoLote(null)
    setMostrarLote(false)
    setAtletasSelecionados([])
    setGerandoLote(false)
    await carregar()
    alert(`✅ Lote concluído!\n${sucesso} cobranças geradas${erro > 0 ? `\n❌ ${erro} erros` : ''}`)
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

  function nomeAtleta(id: string) {
    return atletas.find(a => a.id === id)?.nome || 'Atleta'
  }

  const cobrancasFiltradas = aba === 'inadimplentes'
    ? cobrancas.filter(c => {
        const hoje = new Date().toISOString().split('T')[0]
        return c.status === 'VENCIDO' || (c.status === 'PENDENTE' && c.vencimento < hoje)
      })
    : cobrancas

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 pb-24">

      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">💰 Financeiro</h1>
        <div className="flex gap-2">
          <button
            onClick={() => { setMostrarLote(!mostrarLote); setMostrarForm(false) }}
            className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium"
          >
            📋 Lote
          </button>
          <button
            onClick={() => { setMostrarForm(!mostrarForm); setMostrarLote(false) }}
            className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium"
          >
            + Cobrança
          </button>
        </div>
      </div>

      {/* Card inadimplentes */}
      {!loading && inadimplentes.length > 0 && (
        <button
          onClick={() => setAba(aba === 'inadimplentes' ? 'todas' : 'inadimplentes')}
          className="w-full bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4 text-left"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-400 font-bold">🚨 Inadimplentes</p>
              <p className="text-gray-400 text-sm mt-1">
                {inadimplentes.length} {inadimplentes.length === 1 ? 'atleta' : 'atletas'} com pagamento em atraso
              </p>
              <p className="text-red-400 text-sm font-bold mt-1">
                Total: R$ {inadimplentes.reduce((s, i) => s + i.totalDevido, 0).toFixed(2)}
              </p>
            </div>
            <span className="bg-red-500 text-white text-lg font-bold w-10 h-10 rounded-full flex items-center justify-center">
              {inadimplentes.length}
            </span>
          </div>
        </button>
      )}

      {/* Painel inadimplentes expandido */}
      {aba === 'inadimplentes' && inadimplentes.length > 0 && (
        <div className="bg-gray-900 rounded-xl border border-red-800 mb-4 overflow-hidden">
          <div className="p-3 bg-red-900/20 border-b border-red-800">
            <p className="text-red-400 font-bold text-sm">🚨 Atletas Inadimplentes</p>
          </div>
          {inadimplentes.map(i => (
            <div key={i.atletaId} className="p-4 border-b border-gray-800 last:border-0">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-bold">{i.nome}</p>
                  <p className="text-gray-400 text-xs">{i.cobrancas.length} cobrança{i.cobrancas.length > 1 ? 's' : ''} em atraso</p>
                </div>
                <p className="text-red-400 font-bold">R$ {i.totalDevido.toFixed(2)}</p>
              </div>
              <div className="space-y-1">
                {i.cobrancas.map(c => (
                  <div key={c.id} className="flex justify-between items-center bg-gray-800 rounded-lg px-3 py-2">
                    <div>
                      <p className="text-xs text-gray-300">{c.descricao || 'Mensalidade'}</p>
                      <p className="text-xs text-red-400">
                        Venceu: {new Date(c.vencimento + 'T12:00:00').toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-red-400">R$ {Number(c.valor).toFixed(2)}</p>
                      {c.pixCopiaCola && (
                        <button
                          onClick={() => copiarPix(c.pixCopiaCola!, c.id)}
                          className="text-xs text-green-400 underline mt-1"
                        >
                          {copiado === c.id ? '✅ Copiado!' : '📋 Pix'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Formulário cobrança individual */}
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
              <input value={valor} onChange={e => setValor(e.target.value)} type="number" className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 mt-1 text-white" />
            </div>
            <div>
              <label className="text-sm text-gray-400">Vencimento</label>
              <input value={vencimento} onChange={e => setVencimento(e.target.value)} type="date" className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 mt-1 text-white" />
            </div>
            <div>
              <label className="text-sm text-gray-400">Descrição</label>
              <input value={descricao} onChange={e => setDescricao(e.target.value)} type="text" className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 mt-1 text-white" />
            </div>
            <button onClick={gerarCobranca} disabled={gerando} className="w-full bg-green-600 text-white py-3 rounded-lg font-bold disabled:opacity-50">
              {gerando ? 'Gerando Pix...' : 'Gerar Cobrança com Pix'}
            </button>
          </div>
        </div>
      )}

      {/* Formulário cobrança em lote */}
      {mostrarLote && (
        <div className="bg-gray-900 rounded-xl p-4 border border-blue-800 mb-6">
          <p className="font-bold mb-1">📋 Cobrança em Lote</p>
          <p className="text-gray-400 text-xs mb-4">Gera Pix para vários atletas de uma vez</p>
          <div className="space-y-3 mb-4">
            <div>
              <label className="text-sm text-gray-400">Valor (R$)</label>
              <input value={valorLote} onChange={e => setValorLote(e.target.value)} type="number" className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 mt-1 text-white" />
            </div>
            <div>
              <label className="text-sm text-gray-400">Vencimento</label>
              <input value={vencimentoLote} onChange={e => setVencimentoLote(e.target.value)} type="date" className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 mt-1 text-white" />
            </div>
            <div>
              <label className="text-sm text-gray-400">Descrição</label>
              <input value={descricaoLote} onChange={e => setDescricaoLote(e.target.value)} type="text" className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 mt-1 text-white" />
            </div>
          </div>
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm text-gray-400">Selecionar atletas</label>
              <button onClick={selecionarTodos} className="text-xs text-blue-400 underline">
                {atletasSelecionados.length === atletas.length ? 'Desmarcar todos' : 'Selecionar todos'}
              </button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {atletas.map(a => (
                <label key={a.id} className="flex items-center gap-3 bg-gray-800 rounded-lg p-3 cursor-pointer">
                  <input type="checkbox" checked={atletasSelecionados.includes(a.id)} onChange={() => toggleAtleta(a.id)} className="w-4 h-4 accent-blue-500" />
                  <span className="text-sm text-white">{a.nome}</span>
                </label>
              ))}
            </div>
          </div>
          {progressoLote && (
            <div className="bg-blue-600/10 border border-blue-600/30 rounded-xl p-3 mb-4">
              <p className="text-blue-400 text-sm font-bold mb-1">Gerando {progressoLote.atual} de {progressoLote.total}...</p>
              <p className="text-gray-400 text-xs">{progressoLote.nome}</p>
              <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${(progressoLote.atual / progressoLote.total) * 100}%` }} />
              </div>
            </div>
          )}
          <button onClick={gerarCobrancaLote} disabled={gerandoLote || atletasSelecionados.length === 0 || !vencimentoLote} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold disabled:opacity-50">
            {gerandoLote ? `Gerando... (${progressoLote?.atual || 0}/${progressoLote?.total || 0})` : `Gerar para ${atletasSelecionados.length} atleta${atletasSelecionados.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      )}

      {/* Abas filtro */}
      {!loading && cobrancas.length > 0 && (
        <div className="flex gap-2 mb-4">
          <button onClick={() => setAba('todas')} className={`px-3 py-1 rounded-full text-xs font-bold transition ${aba === 'todas' ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400'}`}>
            Todas ({cobrancas.length})
          </button>
          <button onClick={() => setAba('inadimplentes')} className={`px-3 py-1 rounded-full text-xs font-bold transition ${aba === 'inadimplentes' ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400'}`}>
            🚨 Atraso ({inadimplentes.reduce((s, i) => s + i.cobrancas.length, 0)})
          </button>
        </div>
      )}

      {/* Modal QR Code */}
      {pixAtivo && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6">
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-sm border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <p className="font-bold text-lg">📲 Pagar com Pix</p>
              <button onClick={() => setPixAtivo(null)} className="text-gray-400 text-xl">✕</button>
            </div>
            <p className="text-center text-gray-400 text-sm mb-4">{nomeAtleta(pixAtivo.atletaId)} · R$ {Number(pixAtivo.valor).toFixed(2)}</p>
            {pixAtivo.pixQrCode ? (
              <div className="flex justify-center mb-4">
                <img src={`data:image/png;base64,${pixAtivo.pixQrCode}`} alt="QR Code Pix" className="w-52 h-52 rounded-xl border border-gray-700" />
              </div>
            ) : (
              <div className="w-52 h-52 mx-auto bg-gray-800 rounded-xl flex items-center justify-center mb-4">
                <p className="text-gray-500 text-sm">QR Code indisponível</p>
              </div>
            )}
            {pixAtivo.pixCopiaCola && (
              <>
                <p className="text-gray-400 text-xs text-center mb-2">ou use o Pix Copia e Cola</p>
                <button onClick={() => copiarPix(pixAtivo.pixCopiaCola!, pixAtivo.id)} className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold text-sm transition">
                  {copiado === pixAtivo.id ? '✅ Copiado!' : '📋 Copiar código Pix'}
                </button>
              </>
            )}
            <p className="text-center text-gray-500 text-xs mt-4">Vencimento: {new Date(pixAtivo.vencimento).toLocaleDateString('pt-BR')}</p>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && <p className="text-gray-400 text-center mt-10">Carregando...</p>}

      {/* Empty state */}
      {!loading && cobrancas.length === 0 && !mostrarForm && !mostrarLote && (
        <div className="text-center text-gray-500 mt-20">
          <p className="text-5xl mb-4">💳</p>
          <p className="text-lg">Nenhuma cobrança gerada</p>
          <p className="text-sm mt-2">Clique em "+ Cobrança" para começar</p>
        </div>
      )}

      {/* Lista de cobranças */}
      <div className="space-y-3">
        {cobrancasFiltradas.map(c => (
          <div key={c.id} className={`bg-gray-900 rounded-xl p-4 border ${c.status === 'VENCIDO' || (c.status === 'PENDENTE' && c.vencimento < new Date().toISOString().split('T')[0]) ? 'border-red-800' : 'border-gray-800'}`}>
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
            <p className="text-gray-500 text-xs mb-3">Vencimento: {new Date(c.vencimento).toLocaleDateString('pt-BR')}</p>
            {c.status === 'PENDENTE' && (c.pixCopiaCola || c.pixQrCode) && (
              <div className="flex gap-2">
                {c.pixQrCode && (
                  <button onClick={() => setPixAtivo(c)} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-medium transition">📲 Ver QR Code</button>
                )}
                {c.pixCopiaCola && (
                  <button onClick={() => copiarPix(c.pixCopiaCola!, c.id)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2 rounded-lg text-sm font-medium transition">
                    {copiado === c.id ? '✅ Copiado!' : '📋 Copiar Pix'}
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 flex justify-around p-4">
        <a href="/dashboard" className="text-gray-400 text-xs text-center">🏠<br/>Início</a>
        <a href="/atletas" className="text-gray-400 text-xs text-center">👥<br/>Atletas</a>
        <a href="/presenca" className="text-gray-400 text-xs text-center">✅<br/>Presença</a>
        <a href="/financeiro" className="text-green-500 text-xs text-center">💰<br/>Financeiro</a>
      </nav>
    </div>
  )
}