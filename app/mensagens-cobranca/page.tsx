'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { usePerfil } from '@/lib/usePerfil'
import { salvarMensagens } from '../configuracoes/actions-mensagens'

const VARIAVEIS = [
  { tag: '{nome_responsavel}', desc: 'Nome do responsável' },
  { tag: '{nome_atleta}', desc: 'Nome do atleta' },
  { tag: '{nome_escola}', desc: 'Nome da escola' },
  { tag: '{valor}', desc: 'Valor da cobrança' },
  { tag: '{data_vencimento}', desc: 'Data de vencimento' },
  { tag: '{dias_atraso}', desc: 'Dias em atraso (inadimplente)' },
  { tag: '{dias_para_vencer}', desc: 'Dias para vencer (lembrete)' },
]

export default function MensagensCobranca() {
  const { escolaId, isLoaded, isAdmin } = usePerfil()
  const [msgInadimplente, setMsgInadimplente] = useState('')
  const [msgLembrete, setMsgLembrete] = useState('')
  const [msgAniversario, setMsgAniversario] = useState('')
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [resultado, setResultado] = useState('')

  useEffect(() => {
    if (!escolaId) return
    async function carregar() {
      const { data } = await supabase
        .from('Escola')
        .select('msgInadimplente, msgLembrete, msgAniversario')
        .eq('id', escolaId)
        .single()
      if (data) {
        setMsgInadimplente(data.msgInadimplente || '')
        setMsgLembrete(data.msgLembrete || '')
        setMsgAniversario(data.msgAniversario || '')
      }
      setLoading(false)
    }
    carregar()
  }, [escolaId])

  async function salvar() {
    setSalvando(true)
    setResultado('')
    const res = await salvarMensagens({ msgInadimplente, msgLembrete, msgAniversario })
    setResultado(res.ok ? '✅ Salvo com sucesso!' : '❌ ' + res.message)
    setSalvando(false)
  }

  if (!isLoaded) return <div className="min-h-screen bg-gray-950 flex items-center justify-center"><p className="text-gray-400">Carregando...</p></div>
  if (!isAdmin) return <div className="min-h-screen bg-gray-950 flex items-center justify-center"><p className="text-gray-400">Acesso negado</p></div>

  return (
    <div style={{ minHeight: "100vh", color: "#F0F0F0", padding: "20px 20px 80px", fontFamily: "Inter, sans-serif" }}>
      <div className="flex items-center gap-2 mb-6">
        <a href="/configuracoes" className="text-gray-400 text-sm">← Configurações</a>
      </div>

      <h1 className="text-xl font-bold text-green-500 mb-1">📲 Mensagens WhatsApp</h1>
      <p className="text-gray-400 text-sm mb-6">Personalize as mensagens enviadas automaticamente</p>

      <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: "16px", padding: "16px", border: "1px solid rgba(255,255,255,0.07)", marginBottom: "12px" }}>
        <p className="text-xs text-gray-400 mb-2 font-bold">Variáveis disponíveis:</p>
        <div className="flex flex-wrap gap-2">
          {VARIAVEIS.map(v => (
            <span key={v.tag} className="bg-gray-800 text-green-400 text-xs px-2 py-1 rounded font-mono" title={v.desc}>
              {v.tag}
            </span>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-gray-400 text-center py-8">Carregando mensagens...</p>
      ) : (
        <div className="space-y-6">
          <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: "16px", padding: "16px", border: "1px solid rgba(255,255,255,0.07)" }}>
            <p className="font-bold text-red-400 mb-1">🔴 Mensagem de Inadimplência</p>
            <p className="text-gray-500 text-xs mb-3">Enviada a cada 3 dias para cobranças vencidas</p>
            <textarea
              value={msgInadimplente}
              onChange={e => setMsgInadimplente(e.target.value)}
              rows={8}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white text-sm font-mono resize-none"
              placeholder="Mensagem para inadimplentes..."
            />
          </div>

          <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: "16px", padding: "16px", border: "1px solid rgba(255,255,255,0.07)" }}>
            <p className="font-bold text-yellow-400 mb-1">⚠️ Mensagem de Lembrete</p>
            <p className="text-gray-500 text-xs mb-3">Enviada quando falta 3 dias ou no dia do vencimento</p>
            <textarea
              value={msgLembrete}
              onChange={e => setMsgLembrete(e.target.value)}
              rows={8}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white text-sm font-mono resize-none"
              placeholder="Mensagem de lembrete..."
            />
          </div>

          <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: "16px", padding: "16px", border: "1px solid rgba(255,255,255,0.07)" }}>
            <p className="font-bold text-green-400 mb-1">🎂 Mensagem de Aniversário</p>
            <p className="text-gray-500 text-xs mb-3">Enviada no dia do aniversário do atleta</p>
            <textarea
              value={msgAniversario}
              onChange={e => setMsgAniversario(e.target.value)}
              rows={6}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white text-sm font-mono resize-none"
              placeholder="Mensagem de aniversário..."
            />
          </div>

          {resultado && (
            <p className="text-center text-sm py-2">{resultado}</p>
          )}

          <button
            onClick={salvar}
            disabled={salvando}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold disabled:opacity-50"
          >
            {salvando ? 'Salvando...' : '💾 Salvar Mensagens'}
          </button>
        </div>
      )}

      <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, display: "flex", justifyContent: "space-around", padding: "12px 0 20px", borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(5,5,5,0.95)", backdropFilter: "blur(10px)" }}>
        <a href="/dashboard" className="text-gray-400 text-xs text-center">🏠 Início</a>
        <a href="/atletas" className="text-gray-400 text-xs text-center">👥 Atletas</a>
        <a href="/presenca" className="text-gray-400 text-xs text-center">✅ Presença</a>
        <a href="/financeiro" className="text-gray-400 text-xs text-center">💰 Financeiro</a>
      </nav>
    </div>
  )
}
