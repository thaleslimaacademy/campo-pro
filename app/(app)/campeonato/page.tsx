'use client'
import PlanoGate from '@/components/PlanoGate'
import { usePerfil } from '@/lib/usePerfil'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Campeonato {
  id: string
  nome: string
  formato: string
  status: string
  dataInicio: string
  dataFim: string
  descricao: string
  createdAt: string
}

export default function Campeonatos() {
  const { escolaId } = usePerfil()
  const [campeonatos, setCampeonatos] = useState<Campeonato[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [form, setForm] = useState({
    nome: '',
    formato: 'grupos',
    dataInicio: '',
    dataFim: '',
    descricao: '',
  })

  async function carregar() {
    const { data } = await supabase
      .from('Campeonato')
      .select('*')
      .eq('escolaId', escolaId!)
      .order('createdAt', { ascending: false })
    setCampeonatos(data || [])
    setLoading(false)
  }

  useEffect(() => { if (escolaId) carregar() }, [escolaId])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  async function salvar() {
    if (!form.nome) return alert('Nome obrigatorio.')
    setSalvando(true)

    const { error } = await supabase.from('Campeonato').insert({
      escolaId: escolaId!,
      nome: form.nome,
      formato: form.formato,
      dataInicio: form.dataInicio || null,
      dataFim: form.dataFim || null,
      descricao: form.descricao,
      status: 'rascunho',
    })

    if (error) {
      alert('Erro: ' + error.message)
    } else {
      setSucesso(true)
      setForm({ nome: '', formato: 'grupos', dataInicio: '', dataFim: '', descricao: '' })
      setShowForm(false)
      carregar()
      setTimeout(() => setSucesso(false), 3000)
    }
    setSalvando(false)
  }

  async function excluir(id: string) {
    if (!confirm('Excluir este campeonato?')) return
    await supabase.from('SumulaEvento').delete().eq('jogoId', id)
    await supabase.from('CampeonatoJogo').delete().eq('campeonatoId', id)
    await supabase.from('CampeonatoAtleta').delete().in('timeId',
      (await supabase.from('CampeonatoTime').select('id').eq('campeonatoId', id)).data?.map(t => t.id) || []
    )
    await supabase.from('CampeonatoTime').delete().eq('campeonatoId', id)
    await supabase.from('Campeonato').delete().eq('id', id)
    carregar()
  }

  const statusLabel: Record<string, string> = {
    rascunho: 'Rascunho',
    inscricoes: 'Inscricoes',
    andamento: 'Em andamento',
    encerrado: 'Encerrado',
  }

  const statusColor: Record<string, string> = {
    rascunho: 'bg-gray-700 text-gray-300',
    inscricoes: 'bg-blue-600/20 text-blue-400',
    andamento: 'bg-green-600/20 text-green-400',
    encerrado: 'bg-red-600/20 text-red-400',
  }

  const formatoLabel: Record<string, string> = {
    grupos: 'Fase de Grupos',
    'mata-mata': 'Mata-Mata',
    misto: 'Grupos + Mata-Mata',
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "rgba(255,255,255,0.4)", fontFamily: "Inter, sans-serif" }}>Carregando...</p>
      </div>
    )
  }

  return (
    <PlanoGate feature="campeonatos" planoMinimo="PRO">
    <div style={{ minHeight: "100vh", color: "#F0F0F0", padding: "20px 20px 80px", fontFamily: "Inter, sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <a href="/dashboard" style={{ color: "rgba(255,255,255,0.4)", textDecoration: "none", fontSize: "13px" }}>Voltar</a>
          <h1 style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "22px", color: "#F0F0F0" }}>Campeonatos</h1>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{ background: "linear-gradient(135deg,#FF6B00,#00cc00)", color: "#000", padding: "10px 18px", borderRadius: "12px", fontSize: "12px", fontWeight: 800, fontFamily: "Syne, sans-serif", border: "none", cursor: "pointer" }}
        >
          {showForm ? 'Fechar' : '+ Novo'}
        </button>
      </div>

      {sucesso && (
        <div style={{ background: "rgba(57,255,20,0.1)", border: "1px solid rgba(57,255,20,0.3)", borderRadius: "12px", padding: "12px", textAlign: "center", marginBottom: "16px" }}>
          <p style={{ color: "#FF6B00", fontFamily: "Syne, sans-serif", fontWeight: 700, margin: 0 }}>Campeonato criado!</p>
        </div>
      )}

      {showForm && (
        <div style={{ background: "rgba(212,175,55,0.04)", border: "1px solid rgba(212,175,55,0.15)", borderRadius: "16px", padding: "16px", marginBottom: "20px" }}>
          <p style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "14px", color: "#FFD700", marginBottom: "16px" }}>Novo Campeonato</p>
          <div className="space-y-3">
            <div>
              <label style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.8px" }}>Nome *</label>
              <input name="nome" value={form.nome} onChange={handleChange} style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "12px", color: "#F0F0F0", fontFamily: "Inter, sans-serif", fontSize: "13px", marginTop: "4px", boxSizing: "border-box" }} placeholder="Ex: Copa Verao 2026" />
            </div>
            <div>
              <label style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.8px" }}>Formato</label>
              <select name="formato" value={form.formato} onChange={handleChange} style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "12px", color: "#F0F0F0", fontFamily: "Inter, sans-serif", fontSize: "13px", marginTop: "4px", boxSizing: "border-box" }}>
                <option value="grupos">Fase de Grupos</option>
                <option value="mata-mata">Mata-Mata</option>
                <option value="misto">Grupos + Mata-Mata</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.8px" }}>Data inicio</label>
                <input name="dataInicio" value={form.dataInicio} onChange={handleChange} type="date" style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "12px", color: "#F0F0F0", fontFamily: "Inter, sans-serif", fontSize: "13px", marginTop: "4px", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.8px" }}>Data fim</label>
                <input name="dataFim" value={form.dataFim} onChange={handleChange} type="date" style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "12px", color: "#F0F0F0", fontFamily: "Inter, sans-serif", fontSize: "13px", marginTop: "4px", boxSizing: "border-box" }} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.8px" }}>Descricao</label>
              <textarea name="descricao" value={form.descricao} onChange={handleChange} style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "12px", color: "#F0F0F0", fontFamily: "Inter, sans-serif", fontSize: "13px", marginTop: "4px", boxSizing: "border-box" }} rows={2} placeholder="Detalhes do campeonato..." />
            </div>
            <button onClick={salvar} disabled={salvando} style={{ width: "100%", background: "linear-gradient(135deg,#FF6B00,#00cc00)", color: "#000", padding: "14px", borderRadius: "12px", fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "13px", border: "none", cursor: "pointer" }}>
              {salvando ? 'Salvando...' : 'Criar Campeonato'}
            </button>
          </div>
        </div>
      )}

      {campeonatos.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <p className="text-4xl mb-3">🏆</p>
          <p style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: "16px", color: "#F0F0F0", marginBottom: "8px" }}>Nenhum campeonato ainda.</p>
          <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)" }}>Clique em + Novo para criar.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {campeonatos.map(c => (
            <div key={c.id} style={{ background: "rgba(255,255,255,0.04)", borderRadius: "16px", padding: "14px", border: "1px solid rgba(255,255,255,0.07)", marginBottom: "10px" }}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "16px", color: "#F0F0F0", margin: "0 0 4px" }}>{c.nome}</p>
                  <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", margin: 0 }}>{formatoLabel[c.formato]}</p>
                </div>
                <span className={"text-xs px-2 py-1 rounded-full font-bold " + statusColor[c.status]}>
                  {statusLabel[c.status]}
                </span>
              </div>
              {(c.dataInicio || c.dataFim) && (
                <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", marginBottom: "10px" }}>
                  {"📅 " + (c.dataInicio ? new Date(c.dataInicio + 'T00:00:00').toLocaleDateString('pt-BR') : '') + (c.dataFim ? " ate " + new Date(c.dataFim + 'T00:00:00').toLocaleDateString('pt-BR') : '')}
                </p>
              )}
              {c.descricao && <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", marginBottom: "10px" }}>{c.descricao}</p>}
              <div className="flex gap-2">
                <a href={"/campeonato/" + c.id} style={{ flex: 1, background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.25)", color: "#FFD700", textAlign: "center", padding: "10px", borderRadius: "10px", fontSize: "12px", fontWeight: 700, fontFamily: "Syne, sans-serif", textDecoration: "none" }}>
                  Gerenciar
                </a>
                <button onClick={() => excluir(c.id)} style={{ background: "rgba(255,70,70,0.08)", color: "#ff5555", padding: "10px 12px", borderRadius: "10px", fontSize: "12px", border: "none", cursor: "pointer" }}>
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, display: "flex", justifyContent: "space-around", padding: "12px 0 20px", borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(5,5,5,0.95)", backdropFilter: "blur(10px)" }}>
        <a href="/dashboard" style={{ textDecoration: "none", color: "rgba(255,255,255,0.4)", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.5px", fontFamily: "Syne, sans-serif" }}>Inicio</a>
        <a href="/atletas" style={{ textDecoration: "none", color: "rgba(255,255,255,0.4)", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.5px", fontFamily: "Syne, sans-serif" }}>Atletas</a>
        <a href="/presenca" style={{ textDecoration: "none", color: "rgba(255,255,255,0.4)", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.5px", fontFamily: "Syne, sans-serif" }}>Presenca</a>
        <a href="/financeiro" style={{ textDecoration: "none", color: "rgba(255,255,255,0.4)", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.5px", fontFamily: "Syne, sans-serif" }}>Financeiro</a>
      </nav>
    </div>
  )
}