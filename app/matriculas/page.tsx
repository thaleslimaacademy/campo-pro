'use client'
import { usePerfil } from '@/lib/usePerfil'
import AdminGuard from '@/components/AdminGuard'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Matricula = {
  id: string
  nomeAtleta: string
  dataNascimento: string
  cpf: string | null
  rg: string | null
  posicao: string | null
  telefone: string | null
  cep: string | null
  endereco: string | null
  numero: string | null
  bairro: string | null
  cidade: string | null
  estado: string | null
  nomeResponsavel: string
  whatsappResponsavel: string
  emailResponsavel: string | null
  nomeAssinatura: string | null
  dataAssinatura: string | null
  status: string
  atletaId: string | null
  criadoEm: string
}

function MatriculasInner() {
  const { escolaId } = usePerfil()
  const [matriculas, setMatriculas] = useState<Matricula[]>([])
  const [loading, setLoading] = useState(true)
  const [selecionada, setSelecionada] = useState<Matricula | null>(null)
  const [processando, setProcessando] = useState(false)
  const [gerandoCobranca, setGerandoCobranca] = useState(false)
  const [filtro, setFiltro] = useState<'PENDENTE' | 'APROVADO' | 'RECUSADO'>('PENDENTE')

  async function carregar() {
    const { data } = await supabase
      .from('Matricula')
      .select('*')
      .eq('escolaId', escolaId!)
      .order('criadoEm', { ascending: false })
    setMatriculas(data || [])
    setLoading(false)
  }

  useEffect(() => { if (escolaId) carregar() }, [escolaId])

  async function gerarCobrancaAtleta(atletaId: string, nomeAtleta: string) {
    setGerandoCobranca(true)
    try {
      const hoje = new Date()
      const vencimento = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 10).toISOString().split('T')[0]
      const res = await fetch('/api/cobranca', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          atletaId,
          valor: 100,
          vencimento,
          descricao: 'Mensalidade',
        }),
      })
      const data = await res.json()
      if (data.sucesso) {
        alert('Cobranca gerada para ' + nomeAtleta + '!')
      } else {
        alert('Erro: ' + JSON.stringify(data))
      }
    } catch (err) {
      alert('Erro ao gerar cobranca')
    }
    setGerandoCobranca(false)
  }

  async function enviarWhatsAppAprovacao(matricula: Matricula, tokenPais: string) {
    try {
      const res = await fetch('/api/whatsapp-aprovacao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          whatsapp: matricula.whatsappResponsavel,
          nomeResponsavel: matricula.nomeResponsavel,
          nomeAtleta: matricula.nomeAtleta,
          tokenPais,
          tipo: 'aprovacao',
        }),
      })
      const data = await res.json()
      console.log('WhatsApp aprovacao:', data)
    } catch (err) {
      console.error('Erro WhatsApp aprovacao:', err)
    }
  }
      )
    } catch (err) {
      console.error('Erro WhatsApp aprovação:', err)
    }
  }

  async function aprovar(matricula: Matricula) {
    setProcessando(true)

    const atletaId = crypto.randomUUID()
    const tokenPais = crypto.randomUUID()

    const { error: erroAtleta } = await supabase.from('Atleta').insert({
      id: atletaId,
      escolaId: escolaId!,
      nome: matricula.nomeAtleta,
      dataNascimento: matricula.dataNascimento,
      cpf: matricula.cpf,
      rg: matricula.rg,
      posicao: matricula.posicao,
      telefone: matricula.telefone,
      cep: matricula.cep,
      endereco: matricula.endereco,
      numero: matricula.numero,
      bairro: matricula.bairro,
      cidade: matricula.cidade,
      estado: matricula.estado,
      tokenPais,
      ativo: true,
    })

    if (erroAtleta) {
      alert('Erro ao criar atleta: ' + erroAtleta.message)
      setProcessando(false)
      return
    }

    await supabase.from('Responsavel').insert({
      id: crypto.randomUUID(),
      atletaId,
      nome: matricula.nomeResponsavel,
      telefone: matricula.whatsappResponsavel,
      whatsapp: matricula.whatsappResponsavel,
      principal: true,
    })

    await supabase
      .from('Matricula')
      .update({ status: 'APROVADO', atletaId })
      .eq('id', matricula.id)

    // Envia WhatsApp de aprovação
    await enviarWhatsAppAprovacao(matricula, tokenPais)

    setSelecionada(null)
    await carregar()
    setProcessando(false)
    alert(`✅ ${matricula.nomeAtleta} aprovado! WhatsApp enviado para ${matricula.nomeResponsavel}.`)
  }

  async function recusar(matricula: Matricula) {
    setProcessando(true)

    try {
      await fetch('/api/whatsapp-aprovacao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          whatsapp: matricula.whatsappResponsavel,
          nomeResponsavel: matricula.nomeResponsavel,
          nomeAtleta: matricula.nomeAtleta,
          tokenPais: '',
          tipo: 'recusa',
        }),
      })
    } catch (err) {
      console.error('Erro WhatsApp recusa:', err)
    }

    await supabase
      .from('Matricula')
      .update({ status: 'RECUSADO' })
      .eq('id', matricula.id)

    setSelecionada(null)
    await carregar()
    setProcessando(false)
  }

  const filtradas = matriculas.filter(m => m.status === filtro)
  const pendentes = matriculas.filter(m => m.status === 'PENDENTE').length

  const statusCor: Record<string, string> = {
    PENDENTE: 'text-yellow-400 bg-yellow-400/10',
    APROVADO: 'text-green-400 bg-green-400/10',
    RECUSADO: 'text-red-400 bg-red-400/10',
  }

  if (selecionada) {
    return (
      <div style={{ minHeight: "100vh", color: "#F0F0F0", padding: "20px 20px 80px", fontFamily: "Inter, sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
          <button onClick={() => setSelecionada(null)} style={{ color: "rgba(255,255,255,0.4)", background: "none", border: "none", cursor: "pointer", fontSize: "13px" }}>Voltar</button>
          <h1 style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "22px", color: "#F0F0F0" }}>Pre-matricula</h1>
        </div>

        <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-4 ${statusCor[selecionada.status]}`}>
          {selecionada.status}
        </div>

        <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: "16px", padding: "14px", border: "1px solid rgba(255,255,255,0.07)", marginBottom: "12px" }}>
          <p style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: "12px", color: "#39FF14", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "1px" }}>Dados do Atleta</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>Nome</span>
              <span className="font-bold">{selecionada.nomeAtleta}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>Nascimento</span>
              <span>{new Date(selecionada.dataNascimento).toLocaleDateString('pt-BR')}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>CPF</span>
              <span>{selecionada.cpf || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>RG</span>
              <span>{selecionada.rg || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>Posicao</span>
              <span>{selecionada.posicao || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>Telefone</span>
              <span>{selecionada.telefone || '—'}</span>
            </div>
          </div>
        </div>

        <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: "16px", padding: "14px", border: "1px solid rgba(255,255,255,0.07)", marginBottom: "12px" }}>
          <p style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: "12px", color: "#39FF14", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "1px" }}>Endereco</p>
          <p className="text-sm text-white">
            {selecionada.endereco}{selecionada.numero ? `, ${selecionada.numero}` : ''} — {selecionada.bairro}
          </p>
          <p className="text-sm text-gray-400">{selecionada.cidade} - {selecionada.estado} · CEP {selecionada.cep}</p>
        </div>

        <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: "16px", padding: "14px", border: "1px solid rgba(255,255,255,0.07)", marginBottom: "12px" }}>
          <p style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: "12px", color: "#39FF14", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "1px" }}>Responsavel</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>Nome</span>
              <span className="font-bold">{selecionada.nomeResponsavel}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>WhatsApp</span>
              <a href={`https://wa.me/55${selecionada.whatsappResponsavel.replace(/\D/g, '')}`} target="_blank" style={{ color: "#39FF14" }}>
                {selecionada.whatsappResponsavel}
              </a>
            </div>
            {selecionada.emailResponsavel && (
              <div className="flex justify-between">
                <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>E-mail</span>
                <span>{selecionada.emailResponsavel}</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-6">
          <p style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: "12px", color: "#39FF14", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "1px" }}>Assinatura Digital</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>Assinado por</span>
              <span className="font-bold italic">{selecionada.nomeAssinatura || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>Data/hora</span>
              <span>{selecionada.dataAssinatura ? new Date(selecionada.dataAssinatura).toLocaleString('pt-BR') : '—'}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>Contrato aceito</span>
              <span style={{ color: "#39FF14", fontSize: "12px" }}>Sim</span>
            </div>
          </div>
        </div>

        {selecionada.status === 'PENDENTE' && (
          <div className="space-y-3">
            <button
              onClick={() => aprovar(selecionada)}
              disabled={processando}
              style={{ width: "100%", background: "linear-gradient(135deg,#39FF14,#00cc00)", color: "#000", padding: "16px", borderRadius: "14px", fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "14px", border: "none", cursor: "pointer", boxShadow: "0 0 16px rgba(57,255,20,0.3)", marginBottom: "10px" }}
            >
              {processando ? 'Processando...' : '✅ Aprovar e notificar WhatsApp'}
            </button>
            <button
              onClick={() => recusar(selecionada)}
              disabled={processando}
              style={{ width: "100%", background: "rgba(255,70,70,0.08)", border: "1px solid rgba(255,70,70,0.25)", color: "#ff5555", padding: "14px", borderRadius: "14px", fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: "13px", cursor: "pointer" }}
            >
              ❌ Recusar e notificar WhatsApp
            </button>
          </div>
        )}

        {selecionada.status === 'APROVADO' && (
          <div style={{ background: "rgba(57,255,20,0.07)", border: "1px solid rgba(57,255,20,0.2)", borderRadius: "16px", padding: "16px", textAlign: "center", marginBottom: "12px" }}>
            <p style={{ color: "#39FF14", fontFamily: "Syne, sans-serif", fontWeight: 700, margin: "0 0 4px" }}>Matricula aprovada</p>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", margin: "0 0 14px" }}>Atleta ja esta na lista</p>
            <button
              onClick={() => gerarCobrancaAtleta(selecionada.atletaId || '', selecionada.nomeAtleta)}
              disabled={gerandoCobranca || !selecionada.atletaId}
              style={{ width: "100%", background: "linear-gradient(135deg,#D4AF37,#b8960c)", color: "#000", padding: "14px", borderRadius: "12px", fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "13px", border: "none", cursor: "pointer", opacity: gerandoCobranca ? 0.6 : 1 }}
            >
              {gerandoCobranca ? 'Gerando...' : 'Gerar Cobranca Pix'}
            </button>
          </div>
        )}

        {selecionada.status === 'RECUSADO' && (
          <div style={{ background: "rgba(255,70,70,0.07)", border: "1px solid rgba(255,70,70,0.2)", borderRadius: "16px", padding: "16px", textAlign: "center" }}>
            <p style={{ color: "#ff5555", fontFamily: "Syne, sans-serif", fontWeight: 700, margin: 0 }}>Matricula recusada</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ minHeight: "100vh", color: "#F0F0F0", padding: "20px 20px 80px", fontFamily: "Inter, sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
        <a href="/dashboard" style={{ color: "rgba(255,255,255,0.4)", textDecoration: "none", fontSize: "13px" }}>Voltar</a>
        <h1 style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "22px", color: "#F0F0F0" }}>Pre-matriculas</h1>
        {pendentes > 0 && (
          <span style={{ background: "#D4AF37", color: "#000", fontSize: "10px", fontWeight: 800, padding: "2px 8px", borderRadius: "20px", fontFamily: "Syne, sans-serif" }}>{pendentes}</span>
        )}
      </div>

      <div className="flex gap-2 mb-6">
        {(['PENDENTE', 'APROVADO', 'RECUSADO'] as const).map(s => (
          <button
            key={s}
            onClick={() => setFiltro(s)}
            className={`px-3 py-1 rounded-full text-xs font-bold transition ${
              filtro === s
                ? s === 'PENDENTE' ? 'bg-yellow-500 text-black'
                  : s === 'APROVADO' ? 'bg-green-600 text-white'
                  : 'bg-red-600 text-white'
                : 'bg-gray-800 text-gray-400'
            }`}
          >
            {s} ({matriculas.filter(m => m.status === s).length})
          </button>
        ))}
      </div>

      {loading && <p className="text-gray-400 text-center mt-20">Carregando...</p>}

      {!loading && filtradas.length === 0 && (
        <div className="text-center text-gray-500 mt-20">
          <p className="text-5xl mb-4">📋</p>
          <p className="text-lg">Nenhuma pré-matrícula {filtro.toLowerCase()}</p>
        </div>
      )}

      <div className="space-y-3">
        {filtradas.map(m => (
          <button
            key={m.id}
            onClick={() => setSelecionada(m)}
            style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "16px", padding: "14px", textAlign: "left", cursor: "pointer", marginBottom: "8px" }}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold">{m.nomeAtleta}</p>
                <p className="text-gray-400 text-sm">{m.posicao || 'Sem posição'} · {m.cidade || 'Sem cidade'}</p>
                <p className="text-gray-500 text-xs mt-1">Responsável: {m.nomeResponsavel}</p>
              </div>
              <div className="text-right">
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${statusCor[m.status]}`}>
                  {m.status}
                </span>
                <p className="text-gray-500 text-xs mt-2">
                  {new Date(m.criadoEm).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>

      <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, display: "flex", justifyContent: "space-around", padding: "12px 0 20px", borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(5,5,5,0.95)", backdropFilter: "blur(10px)" }}>
        <a href="/dashboard" style={{ textDecoration: "none", color: "rgba(255,255,255,0.4)", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.5px", fontFamily: "Syne, sans-serif" }}>Inicio</a>
        <a href="/atletas" style={{ textDecoration: "none", color: "rgba(255,255,255,0.4)", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.5px", fontFamily: "Syne, sans-serif" }}>Atletas</a>
        <a href="/presenca" style={{ textDecoration: "none", color: "rgba(255,255,255,0.4)", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.5px", fontFamily: "Syne, sans-serif" }}>Presenca</a>
        <a href="/financeiro" style={{ textDecoration: "none", color: "rgba(255,255,255,0.4)", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.5px", fontFamily: "Syne, sans-serif" }}>Financeiro</a>
      </nav>
    </div>
  )
}
export default function Matriculas(props: any) {
  return (
    <AdminGuard>
      <MatriculasInner {...props} />
    </AdminGuard>
  )
}
