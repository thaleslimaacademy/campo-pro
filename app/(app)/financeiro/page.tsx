'use client'
import { usePerfil } from '@/lib/usePerfil'
import AdminGuard from '@/components/AdminGuard'

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

function FinanceiroInner() {
  const { escolaId } = usePerfil()
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
      .eq('escolaId', escolaId!)
      .eq('ativo', true)

    setAtletas(atletasData || [])
    if (atletasData && atletasData.length > 0) setAtletaId(atletasData[0].id)

    const { data: cobrancasData } = await supabase
      .from('Cobranca')
      .select('id, valor, vencimento, status, pixCopiaCola, pixQrCode, descricao, atletaId')
      .eq('escolaId', escolaId!)
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

  useEffect(() => { if (escolaId) carregar() }, [escolaId])

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

  async function excluirCobranca(cobrancaId: string) {
    if (!confirm('Cancelar esta cobranca? Ela tambem sera cancelada no Asaas.')) return
    try {
      const res = await fetch('/api/cobranca/cancelar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cobrancaId }),
      })
      const data = await res.json()
      if (!data.sucesso) alert('Erro ao cancelar: ' + (data.error || 'desconhecido'))
    } catch (err: any) {
      alert('Erro: ' + err.message)
    }
    await carregar()
  }

  async function marcarComoPago(cobrancaId: string, enviarRecibo = false) {
    if (!confirm('Confirmar pagamento manual desta cobrança?')) return
    const cobranca = cobrancas.find(c => c.id === cobrancaId)
    const { error } = await supabase
      .from('Cobranca')
      .update({ status: 'PAGO' })
      .eq('id', cobrancaId)
    if (error) { alert('Erro: ' + error.message); return }

    if (enviarRecibo && cobranca) {
      const atleta = atletas.find(a => a.id === cobranca.atletaId)
      const { data: responsaveis } = await supabase
        .from('Responsavel').select('nome, whatsapp')
        .eq('atletaId', cobranca.atletaId).limit(1)
      const resp = responsaveis?.[0]
      if (resp?.whatsapp && atleta) {
        const dataVenc = new Date(cobranca.vencimento + 'T12:00:00').toLocaleDateString('pt-BR')
        const msg = encodeURIComponent(
          'Ola ' + resp.nome.split(' ')[0] + '! Recibo de pagamento\n\n' +
          'Atleta: *' + atleta.nome + '*\n' +
          'Descricao: ' + (cobranca.descricao || 'Mensalidade') + '\n' +
          'Valor: *R$ ' + Number(cobranca.valor).toFixed(2) + '*\n' +
          'Vencimento: ' + dataVenc + '\n' +
          'Status: *PAGO*\n\n' +
          'Obrigado pelo pagamento!'
        )
        const numero = resp.whatsapp.replace(/\D/g, '')
        const numeroFmt = numero.startsWith('55') ? numero : '55' + numero
        window.open('https://wa.me/' + numeroFmt + '?text=' + msg, '_blank')
      }
    }
    await carregar()
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
    <div style={{ minHeight: "100vh", color: "#F0F4FF", padding: "20px 20px 80px", fontFamily: "Inter, sans-serif" }}>

      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "24px", color: "#F0F4FF" }}>Financeiro</h1>
        <div className="flex gap-2">
          <button
            onClick={() => { setMostrarLote(!mostrarLote); setMostrarForm(false) }}
            style={{ background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)", color: "#60a5fa", padding: "8px 14px", borderRadius: "10px", fontSize: "12px", fontWeight: 700, fontFamily: "Syne, sans-serif", cursor: "pointer" }}
          >
            📋 Lote
          </button>
          <button
            onClick={() => { setMostrarForm(!mostrarForm); setMostrarLote(false) }}
            style={{ background: "linear-gradient(135deg,#4169E1,#00cc00)", color: "#000", padding: "8px 14px", borderRadius: "10px", fontSize: "12px", fontWeight: 800, fontFamily: "Syne, sans-serif", cursor: "pointer", boxShadow: "0 0 12px rgba(57,255,20,0.3)" }}
          >
            + Cobrança
          </button>
        </div>
      </div>

      {/* Card inadimplentes */}
      {!loading && inadimplentes.length > 0 && (
        <button
          onClick={() => setAba(aba === 'inadimplentes' ? 'todas' : 'inadimplentes')}
          style={{ width: "100%", background: "rgba(255,70,70,0.07)", border: "1px solid rgba(255,70,70,0.25)", borderRadius: "16px", padding: "14px", marginBottom: "16px", textAlign: "left", cursor: "pointer" }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p style={{ color: "#ff5555", fontWeight: 700, fontFamily: "Syne, sans-serif", fontSize: "14px" }}>Inadimplentes</p>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", marginTop: "4px" }}>
                {inadimplentes.length} {inadimplentes.length === 1 ? 'atleta' : 'atletas'} com pagamento em atraso
              </p>
              <p style={{ color: "#ff5555", fontSize: "12px", fontWeight: 700, marginTop: "4px", fontFamily: "Syne, sans-serif" }}>
                Total: R$ {inadimplentes.reduce((s, i) => s + i.totalDevido, 0).toFixed(2)}
              </p>
            </div>
            <span style={{ background: "#ff5555", color: "#000", fontSize: "16px", fontWeight: 800, width: "36px", height: "36px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Syne, sans-serif" }}>
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
        <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: "16px", padding: "16px", border: "1px solid rgba(57,255,20,0.2)", marginBottom: "16px" }}>
          <p style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "16px", color: "#4169E1", marginBottom: "16px" }}>Nova Cobranca</p>
          <div className="space-y-3">
            <div>
              <label style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.8px" }}>Atleta</label>
              <select value={atletaId} onChange={e => setAtletaId(e.target.value)} style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "12px", color: "#F0F4FF", fontFamily: "Inter, sans-serif", fontSize: "13px", marginTop: "4px", boxSizing: "border-box" }}>
                {atletas.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.8px" }}>Valor (R$)</label>
              <input value={valor} onChange={e => setValor(e.target.value)} type="number" style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "12px", color: "#F0F4FF", fontFamily: "Inter, sans-serif", fontSize: "13px", marginTop: "4px", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.8px" }}>Vencimento</label>
              <input value={vencimento} onChange={e => setVencimento(e.target.value)} type="date" style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "12px", color: "#F0F4FF", fontFamily: "Inter, sans-serif", fontSize: "13px", marginTop: "4px", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.8px" }}>Descrição</label>
              <input value={descricao} onChange={e => setDescricao(e.target.value)} type="text" style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "12px", color: "#F0F4FF", fontFamily: "Inter, sans-serif", fontSize: "13px", marginTop: "4px", boxSizing: "border-box" }} />
            </div>
            <button onClick={gerarCobranca} disabled={gerando} style={{ width: "100%", background: "linear-gradient(135deg,#4169E1,#00cc00)", color: "#000", padding: "14px", borderRadius: "12px", fontWeight: 800, fontFamily: "Syne, sans-serif", fontSize: "13px", border: "none", cursor: "pointer" }}>
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
              <label style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.8px" }}>Valor (R$)</label>
              <input value={valorLote} onChange={e => setValorLote(e.target.value)} type="number" style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "12px", color: "#F0F4FF", fontFamily: "Inter, sans-serif", fontSize: "13px", marginTop: "4px", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.8px" }}>Vencimento</label>
              <input value={vencimentoLote} onChange={e => setVencimentoLote(e.target.value)} type="date" style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "12px", color: "#F0F4FF", fontFamily: "Inter, sans-serif", fontSize: "13px", marginTop: "4px", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.8px" }}>Descrição</label>
              <input value={descricaoLote} onChange={e => setDescricaoLote(e.target.value)} type="text" style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "12px", color: "#F0F4FF", fontFamily: "Inter, sans-serif", fontSize: "13px", marginTop: "4px", boxSizing: "border-box" }} />
            </div>
          </div>
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.8px" }}>Selecionar atletas</label>
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
          <button onClick={() => setAba('todas')} style={{ padding: "6px 14px", borderRadius: "20px", fontSize: "11px", fontWeight: 800, fontFamily: "Syne, sans-serif", cursor: "pointer", background: aba === "todas" ? "#4169E1" : "rgba(255,255,255,0.05)", color: aba === "todas" ? "#000" : "rgba(255,255,255,0.4)", border: "none" }}>
            Todas ({cobrancas.length})
          </button>
          <button onClick={() => setAba('inadimplentes')} style={{ padding: "6px 14px", borderRadius: "20px", fontSize: "11px", fontWeight: 800, fontFamily: "Syne, sans-serif", cursor: "pointer", background: aba === "inadimplentes" ? "#ff5555" : "rgba(255,255,255,0.05)", color: aba === "inadimplentes" ? "#fff" : "rgba(255,255,255,0.4)", border: "none" }}>
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
      {loading && <p style={{ color: "rgba(255,255,255,0.4)", textAlign: "center", padding: "40px 0" }}>Carregando...</p>}

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
          <div key={c.id} style={{ background: "rgba(255,255,255,0.04)", borderRadius: "16px", padding: "14px", border: c.status === "VENCIDO" || (c.status === "PENDENTE" && c.vencimento < new Date().toISOString().split("T")[0]) ? "1px solid rgba(255,70,70,0.25)" : "1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex justify-between items-start mb-2">
              <div>
                <p style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: "14px", color: "#F0F4FF" }}>{nomeAtleta(c.atletaId)}</p>
                <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>{c.descricao || 'Mensalidade'}</p>
              </div>
              <div className="text-right">
                <p style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, color: "#4169E1", fontSize: "14px" }}>R$ {Number(c.valor).toFixed(2)}</p>
                <p style={{ fontSize: "10px", color: c.status === "PAGO" ? "#4169E1" : c.status === "VENCIDO" ? "#ff5555" : c.status === "PENDENTE" ? "#FFD700" : "rgba(255,255,255,0.4)", fontFamily: "Syne, sans-serif", fontWeight: 700 }}>{c.status}</p>
              </div>
            </div>
            <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", marginBottom: "10px" }}>Venc: {new Date(c.vencimento).toLocaleDateString('pt-BR')}</p>
            {c.status === 'PENDENTE' && (
              <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                {c.pixQrCode && (
                  <button onClick={() => setPixAtivo(c)} style={{ flex: 1, background: "rgba(57,255,20,0.1)", border: "1px solid rgba(57,255,20,0.3)", color: "#4169E1", padding: "10px", borderRadius: "10px", fontSize: "12px", fontWeight: 700, fontFamily: "Syne, sans-serif", cursor: "pointer" }}>Ver QR Code</button>
                )}
                {c.pixCopiaCola && (
                  <button onClick={() => copiarPix(c.pixCopiaCola!, c.id)} style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#F0F4FF", padding: "10px", borderRadius: "10px", fontSize: "12px", fontWeight: 700, fontFamily: "Syne, sans-serif", cursor: "pointer" }}>
                    {copiado === c.id ? 'Copiado!' : 'Copiar Pix'}
                  </button>
                )}
                <button onClick={() => marcarComoPago(c.id, true)} style={{ flex: 1, background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.3)", color: "#FFD700", padding: "10px", borderRadius: "10px", fontSize: "12px", fontWeight: 700, fontFamily: "Syne, sans-serif", cursor: "pointer" }}>
                  Pago + Recibo
                </button>
                <button onClick={() => excluirCobranca(c.id)} style={{ background: "rgba(255,70,70,0.08)", border: "1px solid rgba(255,70,70,0.2)", color: "#ff5555", padding: "10px 12px", borderRadius: "10px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
                  Excluir
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Nav */}
      <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, display: "flex", justifyContent: "space-around", padding: "12px 0 20px", borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(5,5,5,0.95)", backdropFilter: "blur(10px)" }}>
        <a href="/dashboard" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3px", textDecoration: "none", color: "rgba(255,255,255,0.4)", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.5px", fontFamily: "Syne, sans-serif" }}>Inicio</a>
        <a href="/atletas" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3px", textDecoration: "none", color: "rgba(255,255,255,0.4)", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.5px", fontFamily: "Syne, sans-serif" }}>Atletas</a>
        <a href="/presenca" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3px", textDecoration: "none", color: "rgba(255,255,255,0.4)", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.5px", fontFamily: "Syne, sans-serif" }}>Presenca</a>
        <a href="/financeiro" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3px", textDecoration: "none", color: "#4169E1", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.5px", fontFamily: "Syne, sans-serif", fontWeight: 700 }}>Financeiro</a>
      </nav>
    </div>
  )
}
export default function Financeiro(props: any) {
  return (
    <AdminGuard>
      <FinanceiroInner {...props} />
    </AdminGuard>
  )
}
