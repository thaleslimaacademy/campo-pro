'use client'
import AdminGuard from '@/components/AdminGuard'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Rematricula {
  id: string
  nomeAtleta: string
  dataNascimento: string
  cpf: string
  rg: string
  nomeResponsavel: string
  cpfResponsavel: string
  whatsappResponsavel: string
  emailResponsavel: string
  status: string
  criadoEm: string
  atletaId_rematricula: string
  posicao: string
}

function RematriculasInner() {
  const [rematriculas, setRematriculas] = useState<Rematricula[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<'PENDENTE' | 'APROVADO' | 'REJEITADO'>('PENDENTE')
  const [processando, setProcessando] = useState<string | null>(null)

  async function carregar() {
    const { data } = await supabase
      .from('Matricula')
      .select('*')
      .eq('tipo', 'rematricula')
      .order('criadoEm', { ascending: false })
    setRematriculas(data || [])
    setLoading(false)
  }

  useEffect(() => { carregar() }, [])

  async function aprovar(id: string, atletaId: string) {
    if (!confirm('Confirmar rematricula deste atleta?')) return
    setProcessando(id)
    await supabase.from('Matricula').update({ status: 'APROVADO' }).eq('id', id)
    if (atletaId) {
      await supabase.from('Atleta').update({ ativo: true }).eq('id', atletaId)
    }
    carregar()
    setProcessando(null)
  }

  async function rejeitar(id: string) {
    if (!confirm('Rejeitar esta rematricula?')) return
    setProcessando(id)
    await supabase.from('Matricula').update({ status: 'REJEITADO' }).eq('id', id)
    carregar()
    setProcessando(null)
  }

  const filtradas = rematriculas.filter(r => r.status === filtro)
  const pendentes = rematriculas.filter(r => r.status === 'PENDENTE').length

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <p className="text-gray-400">Carregando...</p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: "100vh", color: "#F0F0F0", padding: "20px 20px 80px", fontFamily: "Inter, sans-serif" }}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <a href="/dashboard" className="text-gray-400">Voltar</a>
          <h1 className="text-xl font-bold">Rematriculas</h1>
        </div>
        {pendentes > 0 && (
          <span className="bg-yellow-500 text-black text-sm font-bold w-8 h-8 rounded-full flex items-center justify-center">
            {pendentes}
          </span>
        )}
      </div>

      <div className="flex gap-2 mb-4">
        {(['PENDENTE', 'APROVADO', 'REJEITADO'] as const).map(s => (
          <button
            key={s}
            onClick={() => setFiltro(s)}
            className={"flex-1 py-2 rounded-xl text-xs font-bold " + (filtro === s ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400')}
          >
            {s === 'PENDENTE' ? 'Pendentes' : s === 'APROVADO' ? 'Aprovadas' : 'Rejeitadas'}
            {s === 'PENDENTE' && pendentes > 0 ? ' (' + pendentes + ')' : ''}
          </button>
        ))}
      </div>

      {filtradas.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🔄</p>
          <p className="text-gray-400">
            {filtro === 'PENDENTE' ? 'Nenhuma rematricula pendente.' :
             filtro === 'APROVADO' ? 'Nenhuma rematricula aprovada.' :
             'Nenhuma rematricula rejeitada.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtradas.map(r => (
            <div key={r.id} style={{ background: "rgba(255,255,255,0.04)", borderRadius: "16px", padding: "16px", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-bold text-white text-lg">{r.nomeAtleta}</p>
                  <p className="text-green-500 text-sm">{r.posicao}</p>
                  {r.dataNascimento && (
                    <p className="text-gray-400 text-xs">
                      {new Date(r.dataNascimento + 'T12:00:00').toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>
                <span className={"text-xs px-2 py-1 rounded-full font-bold " + (
                  r.status === 'PENDENTE' ? 'bg-yellow-600/20 text-yellow-400' :
                  r.status === 'APROVADO' ? 'bg-green-600/20 text-green-400' :
                  'bg-red-600/20 text-red-400'
                )}>
                  {r.status}
                </span>
              </div>

              <div className="space-y-1 mb-3">
                {r.cpf && <p className="text-gray-400 text-xs">CPF atleta: {r.cpf}</p>}
                {r.rg && <p className="text-gray-400 text-xs">RG atleta: {r.rg}</p>}
              </div>

              <div className="bg-gray-800 rounded-xl p-3 mb-3">
                <p className="text-gray-400 text-xs font-bold mb-1">Responsavel</p>
                <p className="text-white text-sm font-bold">{r.nomeResponsavel}</p>
                {r.cpfResponsavel && <p className="text-gray-400 text-xs">CPF: {r.cpfResponsavel}</p>}
                {r.whatsappResponsavel && <p className="text-gray-400 text-xs">WhatsApp: {r.whatsappResponsavel}</p>}
                {r.emailResponsavel && <p className="text-gray-400 text-xs">Email: {r.emailResponsavel}</p>}
              </div>

              <p className="text-gray-500 text-xs mb-3">
                {"Enviado em: " + new Date(r.criadoEm).toLocaleDateString('pt-BR') + " as " + new Date(r.criadoEm).toLocaleTimeString('pt-BR')}
              </p>

              {r.status === 'PENDENTE' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => aprovar(r.id, r.atletaId_rematricula)}
                    disabled={processando === r.id}
                    className="flex-1 bg-green-600 text-white py-2 rounded-xl font-bold text-sm disabled:opacity-50"
                  >
                    {processando === r.id ? 'Processando...' : 'Aprovar'}
                  </button>
                  <button
                    onClick={() => rejeitar(r.id)}
                    disabled={processando === r.id}
                    className="flex-1 bg-red-600/20 text-red-400 py-2 rounded-xl font-bold text-sm disabled:opacity-50"
                  >
                    Rejeitar
                  </button>
                  {r.whatsappResponsavel && (
                    <a
                    
                      href={"https://wa.me/" + r.whatsappResponsavel.replace(/[^0-9]/g, "")}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-gray-800 text-gray-300 px-3 py-2 rounded-xl text-sm"
                    >
                      WA
                    </a>
                  )}
                </div>
              )}

              {r.status === 'APROVADO' && r.atletaId_rematricula && (
                <a
                  href={"/atletas/" + r.atletaId_rematricula}
                  className="w-full bg-green-600/20 text-green-400 text-center py-2 rounded-xl text-sm font-bold block"
                >
                  Ver ficha do atleta
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, display: "flex", justifyContent: "space-around", padding: "12px 0 20px", borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(5,5,5,0.95)", backdropFilter: "blur(10px)" }}>
        <a href="/dashboard" className="text-gray-400 text-xs text-center">inicio</a>
        <a href="/atletas" className="text-gray-400 text-xs text-center">Atletas</a>
        <a href="/presenca" className="text-gray-400 text-xs text-center">Presenca</a>
        <a href="/financeiro" className="text-gray-400 text-xs text-center">Financeiro</a>
      </nav>
    </div>
  )
}

export default function Rematriculas(props: any) {
  return (
    <AdminGuard>
      <RematriculasInner {...props} />
    </AdminGuard>
  )
}
