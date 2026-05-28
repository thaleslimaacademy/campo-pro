'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Suspense } from 'react'

type Atleta = {
  id: string
  nome: string
  fotoUrl: string | null
  turmaId: string | null
  responsaveis?: { whatsapp: string | null; telefone: string | null }[]
}

function NovaMensagemForm() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const tipoInicial = searchParams.get('tipo') || 'TODOS'
  const turmaIdParam = searchParams.get('turmaId') || ''
  const turmaNomeParam = searchParams.get('turmaNome') || ''

  const [tipo, setTipo] = useState(tipoInicial)
  const [titulo, setTitulo] = useState('')
  const [conteudo, setConteudo] = useState('')
  const [turmas, setTurmas] = useState<any[]>([])
  const [turmaId, setTurmaId] = useState(turmaIdParam)
  const [atletas, setAtletas] = useState<Atleta[]>([])
  const [atletasSelecionados, setAtletasSelecionados] = useState<string[]>([])
  const [enviando, setEnviando] = useState(false)
  const [resultado, setResultado] = useState<{ enviados: number; erros: number } | null>(null)

  useEffect(() => {
    async function carregar() {
      const { data: t } = await supabase.from('Turma').select('*').eq('escolaId', 'escola-demo').eq('ativa', true).order('nome')
      setTurmas(t || [])

      const { data: a } = await supabase
        .from('Atleta')
        .select('id, nome, fotoUrl, turmaId')
        .eq('escolaId', 'escola-demo')
        .eq('ativo', true)
        .order('nome')
      setAtletas(a || [])
    }
    carregar()
  }, [])

  function toggleAtleta(id: string) {
    setAtletasSelecionados(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    )
  }

  async function enviar() {
    if (!conteudo) return alert('Digite o conteúdo da mensagem')
    setEnviando(true)

    const instanceId = process.env.NEXT_PUBLIC_ZAPI_INSTANCE_ID
    const token = process.env.NEXT_PUBLIC_ZAPI_TOKEN
    const clientToken = process.env.NEXT_PUBLIC_ZAPI_CLIENT_TOKEN

    let atletasParaEnviar: string[] = []

    if (tipo === 'TODOS') {
      atletasParaEnviar = atletas.map(a => a.id)
    } else if (tipo === 'TURMA' && turmaId) {
      atletasParaEnviar = atletas.filter(a => a.turmaId === turmaId).map(a => a.id)
    } else if (tipo === 'INDIVIDUAL') {
      atletasParaEnviar = atletasSelecionados
    }

    if (atletasParaEnviar.length === 0) {
      alert('Nenhum atleta selecionado')
      setEnviando(false)
      return
    }

    // Busca responsáveis
    const { data: responsaveis } = await supabase
      .from('Responsavel')
      .select('atletaId, whatsapp, telefone')
      .in('atletaId', atletasParaEnviar)
      .eq('principal', true)

    let enviados = 0
    let erros = 0

    for (const resp of responsaveis || []) {
      const numero = (resp.whatsapp || resp.telefone || '').replace(/\D/g, '')
      if (!numero || numero.length < 10) { erros++; continue }
      const numeroFormatado = numero.startsWith('55') ? numero : `55${numero}`

      try {
        await fetch(
          `https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Client-Token': clientToken || '' },
            body: JSON.stringify({ phone: numeroFormatado, message: conteudo }),
          }
        )
        enviados++
      } catch {
        erros++
      }
    }

    // Salva no histórico
    await supabase.from('Mensagem').insert({
      escolaId: 'escola-demo',
      titulo: titulo || null,
      conteudo,
      tipo,
      turmaId: turmaId || null,
      atletaIds: atletasParaEnviar,
      totalEnviados: enviados,
    })

    setResultado({ enviados, erros })
    setEnviando(false)
  }

  if (resultado) {
    return (
      <div className="min-h-screen bg-gray-950 text-white p-6 flex flex-col items-center justify-center">
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 text-center w-full max-w-sm">
          <p className="text-5xl mb-4">{resultado.enviados > 0 ? '✅' : '❌'}</p>
          <p className="text-xl font-bold mb-2">Mensagens enviadas!</p>
          <p className="text-green-400 font-bold text-lg">{resultado.enviados} enviadas com sucesso</p>
          {resultado.erros > 0 && <p className="text-red-400 text-sm mt-1">{resultado.erros} erros</p>}
          <button onClick={() => router.push('/mensagens')} className="w-full bg-green-600 text-white py-3 rounded-xl font-bold mt-6">
            Ver histórico
          </button>
        </div>
      </div>
    )
  }

  const atletasFiltrados = tipo === 'TURMA' && turmaId
    ? atletas.filter(a => a.turmaId === turmaId)
    : atletas

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 pb-24">
      <div className="flex items-center gap-3 mb-6">
        <a href="/mensagens" className="text-gray-400">← Voltar</a>
        <h1 className="text-xl font-bold">📲 Nova Mensagem</h1>
      </div>

      {/* Tipo */}
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-4">
        <p className="text-sm text-gray-400 mb-3">Enviar para:</p>
        <div className="flex gap-2">
          {[
            { value: 'TODOS', label: '📢 Todos' },
            { value: 'TURMA', label: '👥 Turma' },
            { value: 'INDIVIDUAL', label: '👤 Individual' },
          ].map(t => (
            <button
              key={t.value}
              onClick={() => setTipo(t.value)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${tipo === t.value ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Seleção de turma */}
      {tipo === 'TURMA' && (
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-4">
          <p className="text-sm text-gray-400 mb-2">Selecione a turma:</p>
          <select value={turmaId} onChange={e => setTurmaId(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white">
            <option value="">Selecione...</option>
            {turmas.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
          </select>
          {turmaId && (
            <p className="text-xs text-gray-500 mt-2">
              {atletas.filter(a => a.turmaId === turmaId).length} atletas nesta turma
            </p>
          )}
        </div>
      )}

      {/* Seleção individual */}
      {tipo === 'INDIVIDUAL' && (
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-4">
          <p className="text-sm text-gray-400 mb-3">Selecione os atletas:</p>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {atletas.map(a => (
              <div
                key={a.id}
                onClick={() => toggleAtleta(a.id)}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition ${atletasSelecionados.includes(a.id) ? 'bg-green-600/20 border border-green-600/30' : 'bg-gray-800'}`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${atletasSelecionados.includes(a.id) ? 'bg-green-600 border-green-600' : 'border-gray-600'}`}>
                  {atletasSelecionados.includes(a.id) && <span className="text-white text-xs">✓</span>}
                </div>
                {a.fotoUrl
                  ? <img src={a.fotoUrl} alt={a.nome} className="w-8 h-8 rounded-full object-cover" />
                  : <div className="w-8 h-8 bg-green-900 rounded-full flex items-center justify-center text-xs font-bold text-green-400">{a.nome[0]}</div>
                }
                <p className="text-sm">{a.nome}</p>
              </div>
            ))}
          </div>
          {atletasSelecionados.length > 0 && (
            <p className="text-xs text-green-400 mt-2">{atletasSelecionados.length} selecionado{atletasSelecionados.length !== 1 ? 's' : ''}</p>
          )}
        </div>
      )}

      {/* Mensagem */}
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-4">
        <div className="mb-3">
          <label className="text-xs text-gray-400">Título (opcional)</label>
          <input value={titulo} onChange={e => setTitulo(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 mt-1 text-white" placeholder="Ex: Aviso importante" />
        </div>
        <div>
          <label className="text-xs text-gray-400">Mensagem *</label>
          <textarea
            value={conteudo}
            onChange={e => setConteudo(e.target.value)}
            rows={5}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 mt-1 text-white resize-none"
            placeholder="Digite a mensagem que será enviada via WhatsApp..."
          />
          <p className="text-xs text-gray-500 mt-1">{conteudo.length} caracteres</p>
        </div>
      </div>

      {/* Resumo */}
      <div className="bg-gray-800 rounded-xl p-3 mb-4">
        <p className="text-xs text-gray-400">
          {tipo === 'TODOS' && `Será enviado para ${atletas.length} atletas (todos os responsáveis)`}
          {tipo === 'TURMA' && turmaId && `Será enviado para ${atletas.filter(a => a.turmaId === turmaId).length} atletas da turma`}
          {tipo === 'TURMA' && !turmaId && 'Selecione uma turma'}
          {tipo === 'INDIVIDUAL' && `Será enviado para ${atletasSelecionados.length} atleta${atletasSelecionados.length !== 1 ? 's' : ''} selecionado${atletasSelecionados.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      <button
        onClick={enviar}
        disabled={enviando || !conteudo}
        className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-lg disabled:opacity-50"
      >
        {enviando ? 'Enviando...' : '📲 Enviar Mensagem'}
      </button>

      <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 flex justify-around p-4">
        <a href="/dashboard" className="text-gray-400 text-xs text-center">🏠<br/>Início</a>
        <a href="/atletas" className="text-gray-400 text-xs text-center">👥<br/>Atletas</a>
        <a href="/presenca" className="text-gray-400 text-xs text-center">✅<br/>Presença</a>
        <a href="/financeiro" className="text-gray-400 text-xs text-center">💰<br/>Financeiro</a>
      </nav>
    </div>
  )
}

export default function NovaMensagem() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-950 text-white flex items-center justify-center"><p className="text-gray-400">Carregando...</p></div>}>
      <NovaMensagemForm />
    </Suspense>
  )
}