'use client'
import PlanoGate from '@/components/PlanoGate'
import { usePerfil } from '@/lib/usePerfil'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Mensagem = {
  id: string
  titulo: string | null
  conteudo: string
  tipo: string
  totalEnviados: number
  criadoEm: string
}

export default function Mensagens() {
  const { escolaId } = usePerfil()
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function carregar() {
      const { data } = await supabase
        .from('Mensagem')
        .select('*')
        .eq('escolaId', escolaId!)
        .order('criadoEm', { ascending: false })
        .limit(50)
      setMensagens(data || [])
      setLoading(false)
    }
    carregar()
  }, [])

  const tipoCor: Record<string, string> = {
    TURMA: 'text-purple-400 bg-purple-400/10',
    TODOS: 'text-blue-400 bg-blue-400/10',
    INDIVIDUAL: 'text-green-400 bg-green-400/10',
  }

  return (
    <PlanoGate feature="mensagens" planoMinimo="PRO">
    <div style={{ minHeight: "100vh", color: "#F0F0F0", padding: "20px 20px 80px", fontFamily: "Inter, sans-serif" }}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <a href="/dashboard" className="text-gray-400">← Voltar</a>
          <h1 className="text-xl font-bold">📲 Mensagens</h1>
        </div>
        <a href="/mensagens/nova" className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium">
          + Nova
        </a>
      </div>

      {/* Ações rápidas */}
      <div className="grid grid-cols-1 gap-3 mb-6">
        <a href="/mensagens/nova?tipo=TODOS" className="bg-blue-600/20 border border-blue-600/30 rounded-xl p-4 flex items-center gap-3">
          <span className="text-2xl">📢</span>
          <div>
            <p className="font-bold text-blue-400">Mensagem para Todos</p>
            <p className="text-gray-400 text-xs">Envia para todos os responsáveis</p>
          </div>
        </a>
        <a href="/turmas" className="bg-purple-600/20 border border-purple-600/30 rounded-xl p-4 flex items-center gap-3">
          <span className="text-2xl">👥</span>
          <div>
            <p className="font-bold text-purple-400">Mensagem por Turma</p>
            <p className="text-gray-400 text-xs">Selecione uma turma para enviar</p>
          </div>
        </a>
        <a href="/mensagens/nova?tipo=INDIVIDUAL" className="bg-green-600/20 border border-green-600/30 rounded-xl p-4 flex items-center gap-3">
          <span className="text-2xl">👤</span>
          <div>
            <p className="font-bold text-green-400">Mensagem Individual</p>
            <p className="text-gray-400 text-xs">Selecione um atleta específico</p>
          </div>
        </a>
      </div>

      {/* Histórico */}
      <p className="font-bold text-sm text-gray-400 mb-3">📋 Histórico de Mensagens</p>

      {loading && <p className="text-gray-400 text-center mt-10">Carregando...</p>}

      {!loading && mensagens.length === 0 && (
        <div className="text-center text-gray-500 mt-10">
          <p className="text-4xl mb-3">📭</p>
          <p>Nenhuma mensagem enviada ainda</p>
        </div>
      )}

      <div className="space-y-3">
        {mensagens.map(m => (
          <div key={m.id} style={{ background: "rgba(255,255,255,0.04)", borderRadius: "16px", padding: "16px", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex justify-between items-start mb-2">
              <p className="font-bold text-sm">{m.titulo || 'Sem título'}</p>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${tipoCor[m.tipo] || 'text-gray-400 bg-gray-800'}`}>
                {m.tipo}
              </span>
            </div>
            <p className="text-gray-400 text-xs mb-2 line-clamp-2">{m.conteudo}</p>
            <div className="flex justify-between items-center">
              <p className="text-gray-500 text-xs">
                {new Date(m.criadoEm).toLocaleDateString('pt-BR')} às {new Date(m.criadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>
              <p className="text-gray-500 text-xs">{m.totalEnviados} enviado{m.totalEnviados !== 1 ? 's' : ''}</p>
            </div>
          </div>
        ))}
      </div>

      <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, display: "flex", justifyContent: "space-around", padding: "12px 0 20px", borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(5,5,5,0.95)", backdropFilter: "blur(10px)" }}>
        <a href="/dashboard" style={{ textDecoration: "none", color: "rgba(255,255,255,0.4)", fontSize: "9px", textTransform: "uppercase", fontFamily: "Syne, sans-serif" }}>Inicio</a>
        <a href="/atletas" className="text-gray-400 text-xs text-center">👥<br/>Atletas</a>
        <a href="/presenca" style={{ textDecoration: "none", color: "rgba(255,255,255,0.4)", fontSize: "9px", textTransform: "uppercase", fontFamily: "Syne, sans-serif" }}>Presenca</a>
        <a href="/financeiro" style={{ textDecoration: "none", color: "rgba(255,255,255,0.4)", fontSize: "9px", textTransform: "uppercase", fontFamily: "Syne, sans-serif" }}>Financeiro</a>
      </nav>
    </div>
    </PlanoGate>
  )
}
