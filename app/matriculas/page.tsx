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
  criadoEm: string
}

function MatriculasInner() {
  const { escolaId } = usePerfil()
  const [matriculas, setMatriculas] = useState<Matricula[]>([])
  const [loading, setLoading] = useState(true)
  const [selecionada, setSelecionada] = useState<Matricula | null>(null)
  const [processando, setProcessando] = useState(false)
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

  async function enviarWhatsAppAprovacao(matricula: Matricula, tokenPais: string) {
    try {
      const instanceId = process.env.NEXT_PUBLIC_ZAPI_INSTANCE_ID
      const token = process.env.NEXT_PUBLIC_ZAPI_TOKEN
      const clientToken = process.env.NEXT_PUBLIC_ZAPI_CLIENT_TOKEN

      if (!instanceId || !token) return

      const numero = matricula.whatsappResponsavel.replace(/\D/g, '')
      const numeroFormatado = numero.startsWith('55') ? numero : `55${numero}`
      const nomeResp = matricula.nomeResponsavel.split(' ')[0]
      const linkPais = `https://campo-pro.vercel.app/pais/${tokenPais}`

      const mensagem =
        `Olá ${nomeResp}! 🎉\n\n` +
        `A matrícula de *${matricula.nomeAtleta}* foi *APROVADA*!\n\n` +
        `✅ Seu filho(a) já está matriculado(a) na *Thales Lima Football Academy*.\n\n` +
        `📱 Acompanhe a presença e mensalidades pelo link:\n${linkPais}\n\n` +
        `Bem-vindo(a) à família! ⚽\n` +
        `_Thales Lima Football Academy — Iturama/MG_`

      await fetch(
        `https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Client-Token': clientToken || '',
          },
          body: JSON.stringify({
            phone: numeroFormatado,
            message: mensagem,
          }),
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
      const instanceId = process.env.NEXT_PUBLIC_ZAPI_INSTANCE_ID
      const token = process.env.NEXT_PUBLIC_ZAPI_TOKEN
      const clientToken = process.env.NEXT_PUBLIC_ZAPI_CLIENT_TOKEN

      if (instanceId && token) {
        const numero = matricula.whatsappResponsavel.replace(/\D/g, '')
        const numeroFormatado = numero.startsWith('55') ? numero : `55${numero}`
        const nomeResp = matricula.nomeResponsavel.split(' ')[0]

        const mensagem =
          `Olá ${nomeResp},\n\n` +
          `Infelizmente a pré-matrícula de *${matricula.nomeAtleta}* não foi aprovada no momento.\n\n` +
          `Entre em contato conosco para mais informações.\n\n` +
          `_Thales Lima Football Academy — Iturama/MG_`

        await fetch(
          `https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Client-Token': clientToken || '',
            },
            body: JSON.stringify({ phone: numeroFormatado, message: mensagem }),
          }
        )
      }
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
      <div className="min-h-screen bg-gray-950 text-white p-6 pb-24">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setSelecionada(null)} className="text-gray-400">← Voltar</button>
          <h1 className="text-xl font-bold">📋 Pré-matrícula</h1>
        </div>

        <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-4 ${statusCor[selecionada.status]}`}>
          {selecionada.status}
        </div>

        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-4">
          <p className="text-green-500 font-bold text-sm mb-3">⚽ Dados do Atleta</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Nome</span>
              <span className="font-bold">{selecionada.nomeAtleta}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Nascimento</span>
              <span>{new Date(selecionada.dataNascimento).toLocaleDateString('pt-BR')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">CPF</span>
              <span>{selecionada.cpf || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">RG</span>
              <span>{selecionada.rg || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Posição</span>
              <span>{selecionada.posicao || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Telefone</span>
              <span>{selecionada.telefone || '—'}</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-4">
          <p className="text-green-500 font-bold text-sm mb-3">📍 Endereço</p>
          <p className="text-sm text-white">
            {selecionada.endereco}{selecionada.numero ? `, ${selecionada.numero}` : ''} — {selecionada.bairro}
          </p>
          <p className="text-sm text-gray-400">{selecionada.cidade} - {selecionada.estado} · CEP {selecionada.cep}</p>
        </div>

        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-4">
          <p className="text-green-500 font-bold text-sm mb-3">👤 Responsável</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Nome</span>
              <span className="font-bold">{selecionada.nomeResponsavel}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">WhatsApp</span>
              <a href={`https://wa.me/55${selecionada.whatsappResponsavel.replace(/\D/g, '')}`} target="_blank" className="text-green-400 underline">
                {selecionada.whatsappResponsavel}
              </a>
            </div>
            {selecionada.emailResponsavel && (
              <div className="flex justify-between">
                <span className="text-gray-400">E-mail</span>
                <span>{selecionada.emailResponsavel}</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-6">
          <p className="text-green-500 font-bold text-sm mb-3">✍️ Assinatura Digital</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Assinado por</span>
              <span className="font-bold italic">{selecionada.nomeAssinatura || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Data/hora</span>
              <span>{selecionada.dataAssinatura ? new Date(selecionada.dataAssinatura).toLocaleString('pt-BR') : '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Contrato aceito</span>
              <span className="text-green-400">✅ Sim</span>
            </div>
          </div>
        </div>

        {selecionada.status === 'PENDENTE' && (
          <div className="space-y-3">
            <button
              onClick={() => aprovar(selecionada)}
              disabled={processando}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-bold text-lg disabled:opacity-50"
            >
              {processando ? 'Processando...' : '✅ Aprovar e notificar WhatsApp'}
            </button>
            <button
              onClick={() => recusar(selecionada)}
              disabled={processando}
              className="w-full bg-red-600/20 hover:bg-red-600/30 text-red-400 py-3 rounded-xl font-bold disabled:opacity-50"
            >
              ❌ Recusar e notificar WhatsApp
            </button>
          </div>
        )}

        {selecionada.status === 'APROVADO' && (
          <div className="bg-green-600/10 border border-green-600/30 rounded-xl p-4 text-center">
            <p className="text-green-400 font-bold">✅ Matrícula aprovada</p>
            <p className="text-gray-400 text-sm mt-1">Atleta já está na lista de matriculados</p>
          </div>
        )}

        {selecionada.status === 'RECUSADO' && (
          <div className="bg-red-600/10 border border-red-600/30 rounded-xl p-4 text-center">
            <p className="text-red-400 font-bold">❌ Matrícula recusada</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 pb-24">
      <div className="flex items-center gap-3 mb-6">
        <a href="/dashboard" className="text-gray-400">← Voltar</a>
        <h1 className="text-xl font-bold">📋 Pré-matrículas</h1>
        {pendentes > 0 && (
          <span className="bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded-full">{pendentes}</span>
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
            className="w-full bg-gray-900 rounded-xl p-4 border border-gray-800 text-left"
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

      <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 flex justify-around p-4">
        <a href="/dashboard" className="text-gray-400 text-xs text-center">🏠<br/>Início</a>
        <a href="/atletas" className="text-gray-400 text-xs text-center">👥<br/>Atletas</a>
        <a href="/presenca" className="text-gray-400 text-xs text-center">✅<br/>Presença</a>
        <a href="/financeiro" className="text-gray-400 text-xs text-center">💰<br/>Financeiro</a>
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
