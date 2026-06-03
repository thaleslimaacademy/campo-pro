'use client'
import { usePerfil } from '@/lib/usePerfil'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Professor {
  id: string
  nome: string
  email: string
  telefone: string
  whatsapp: string
  cargo: string
  fotoUrl: string
  ativo: boolean
  contaCriada: boolean
  tokenConvite: string
  createdAt: string
}

export default function ComissaoTecnica() {
  const { escolaId } = usePerfil()
  const [professores, setProfessores] = useState<Professor[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [copiado, setCopiado] = useState<string | null>(null)
  const [form, setForm] = useState({
    nome: '',
    email: '',
    telefone: '',
    whatsapp: '',
    cargo: 'Professor',
  })

  async function carregar() {
    const { data } = await supabase
      .from('Professor')
      .select('*')
      .eq('escolaId', escolaId!)
      .order('createdAt', { ascending: false })
    setProfessores(data || [])
    setLoading(false)
  }

  useEffect(() => { if (escolaId) carregar() }, [escolaId])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  async function salvar() {
    if (!form.nome || !form.email) return alert('Nome e e-mail são obrigatórios.')
    setSalvando(true)
    const { error } = await supabase.from('Professor').insert({
      escolaId: escolaId!,
      nome: form.nome,
      email: form.email,
      telefone: form.telefone,
      whatsapp: form.whatsapp,
      cargo: form.cargo,
      ativo: true,
      contaCriada: false,
    })
    if (error) {
      alert('Erro ao salvar: ' + error.message)
    } else {
      setSucesso(true)
      setForm({ nome: '', email: '', telefone: '', whatsapp: '', cargo: 'Professor' })
      setShowForm(false)
      carregar()
      setTimeout(() => setSucesso(false), 3000)
    }
    setSalvando(false)
  }

  async function toggleAtivo(id: string, ativo: boolean) {
    await supabase.from('Professor').update({ ativo: !ativo }).eq('id', id)
    carregar()
  }

  async function excluir(id: string) {
    if (!confirm('Excluir este membro?')) return
    await supabase.from('Professor').delete().eq('id', id)
    carregar()
  }

  function copiarLink(token: string, whatsapp: string, nome: string) {
    const link = 'https://campo-pro.vercel.app/convite/' + token
    navigator.clipboard.writeText(link)
    setCopiado(token)
    setTimeout(() => setCopiado(null), 3000)
  }

  function enviarWhatsApp(token: string, whatsapp: string, nome: string) {
    const link = 'https://campo-pro.vercel.app/convite/' + token
    const numero = whatsapp.replace(/\D/g, '')
    const numeroFormatado = numero.startsWith('55') ? numero : '55' + numero
    const mensagem = encodeURIComponent(
      'Olá ' + nome + '! 👋\n\nVocê foi convidado para fazer parte da Comissão Técnica da *Thales Lima Football Academy*.\n\nAcesse o link abaixo para criar sua conta e ter acesso ao app:\n\n' + link + '\n\n_Este link é exclusivo e intransferível._'
    )
    window.open('https://wa.me/' + numeroFormatado + '?text=' + mensagem, '_blank')
  }

  const cargos = ['Professor', 'Treinador', 'Auxiliar Técnico', 'Preparador Físico', 'Goleiro Treinador', 'Coordenador']

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "rgba(255,255,255,0.4)", fontFamily: "Inter, sans-serif" }}>Carregando...</p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: "100vh", color: "#F0F0F0", padding: "20px 20px 80px", fontFamily: "Inter, sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <a href="/dashboard" style={{ color: "rgba(255,255,255,0.4)", textDecoration: "none", fontSize: "13px" }}>Voltar</a>
          <h1 style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "22px", color: "#F0F0F0" }}>Comissao Tecnica</h1>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{ background: "linear-gradient(135deg,#39FF14,#00cc00)", color: "#000", padding: "10px 18px", borderRadius: "12px", fontSize: "12px", fontWeight: 800, fontFamily: "Syne, sans-serif", border: "none", cursor: "pointer" }}
        >
          {showForm ? 'Fechar' : '+ Adicionar'}
        </button>
      </div>

      {sucesso && (
        <div style={{ background: "rgba(57,255,20,0.1)", border: "1px solid rgba(57,255,20,0.3)", borderRadius: "12px", padding: "12px", textAlign: "center", marginBottom: "16px" }}>
          <p style={{ color: "#39FF14", fontFamily: "Syne, sans-serif", fontWeight: 700, margin: 0 }}>Membro adicionado!</p>
        </div>
      )}

      {showForm && (
        <div style={{ background: "rgba(57,255,20,0.04)", border: "1px solid rgba(57,255,20,0.15)", borderRadius: "16px", padding: "16px", marginBottom: "20px" }}>
          <p style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "14px", color: "#39FF14", marginBottom: "16px" }}>Novo Membro</p>
          <div className="space-y-3">
            <div>
              <label style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.8px" }}>Nome completo *</label>
              <input name="nome" value={form.nome} onChange={handleChange} style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "12px", color: "#F0F0F0", fontFamily: "Inter, sans-serif", fontSize: "13px", marginTop: "4px", boxSizing: "border-box" }} placeholder="Nome do professor" />
            </div>
            <div>
              <label style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.8px" }}>E-mail *</label>
              <input name="email" value={form.email} onChange={handleChange} type="email" style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "12px", color: "#F0F0F0", fontFamily: "Inter, sans-serif", fontSize: "13px", marginTop: "4px", boxSizing: "border-box" }} placeholder="email@professor.com" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.8px" }}>Telefone</label>
                <input name="telefone" value={form.telefone} onChange={handleChange} style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "12px", color: "#F0F0F0", fontFamily: "Inter, sans-serif", fontSize: "13px", marginTop: "4px", boxSizing: "border-box" }} placeholder="(34) 9999-9999" />
              </div>
              <div>
                <label style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.8px" }}>WhatsApp</label>
                <input name="whatsapp" value={form.whatsapp} onChange={handleChange} style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "12px", color: "#F0F0F0", fontFamily: "Inter, sans-serif", fontSize: "13px", marginTop: "4px", boxSizing: "border-box" }} placeholder="5534999999999" />
              </div>
            </div>
            <div>
              <label style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.8px" }}>Cargo</label>
              <select name="cargo" value={form.cargo} onChange={handleChange} style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "12px", color: "#F0F0F0", fontFamily: "Inter, sans-serif", fontSize: "13px", marginTop: "4px", boxSizing: "border-box" }}>
                {cargos.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <button onClick={salvar} disabled={salvando} style={{ width: "100%", background: "linear-gradient(135deg,#39FF14,#00cc00)", color: "#000", padding: "14px", borderRadius: "12px", fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "13px", border: "none", cursor: "pointer" }}>
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      )}

      {professores.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <p className="text-4xl mb-3">👨‍💼</p>
          <p style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: "16px", color: "#F0F0F0" }}>Nenhum membro cadastrado.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {professores.map(p => (
            <div key={p.id} style={{ background: "rgba(255,255,255,0.04)", borderRadius: "16px", padding: "14px", border: "1px solid rgba(255,255,255,0.07)", marginBottom: "10px" }}>
              <div className="flex items-start justify-between mb-3">
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "44px", height: "44px", background: "rgba(57,255,20,0.1)", border: "1px solid rgba(57,255,20,0.2)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0 }}>T</div>
                  <div>
                    <p style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: "14px", color: "#F0F0F0", margin: "0 0 2px" }}>{p.nome}</p>
                    <p style={{ color: "#39FF14", fontSize: "12px", fontWeight: 600, margin: "0 0 2px" }}>{p.cargo}</p>
                    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px", margin: 0 }}>{p.email}</p>
                    {p.whatsapp && <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px", margin: "2px 0 0" }}>{p.whatsapp}</p>}
                  </div>
                </div>
                <div className="flex flex-col gap-2 items-end">
                  <span style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '20px', fontWeight: 700, fontFamily: 'Syne, sans-serif', background: p.ativo ? 'rgba(57,255,20,0.1)' : 'rgba(255,70,70,0.1)', color: p.ativo ? '#39FF14' : '#ff5555', border: p.ativo ? '1px solid rgba(57,255,20,0.2)' : '1px solid rgba(255,70,70,0.2)' }}>
                    {p.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                  <span style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '20px', background: p.contaCriada ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.05)', color: p.contaCriada ? '#60a5fa' : 'rgba(255,255,255,0.4)', border: p.contaCriada ? '1px solid rgba(59,130,246,0.2)' : '1px solid rgba(255,255,255,0.07)' }}>
                    {p.contaCriada ? '✅ Conta criada' : '⏳ Aguardando'}
                  </span>
                </div>
              </div>

              {!p.contaCriada && p.tokenConvite && (
                <div style={{ background: "rgba(212,175,55,0.07)", border: "1px solid rgba(212,175,55,0.2)", borderRadius: "12px", padding: "12px", marginBottom: "10px" }}>
                  <p style={{ color: "#D4AF37", fontSize: "10px", fontWeight: 700, fontFamily: "Syne, sans-serif", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.8px" }}>Link de Convite</p>
                  <p className="text-gray-400 text-xs break-all mb-2">
                    {'campo-pro.vercel.app/convite/' + p.tokenConvite.slice(0, 16) + '...'}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => copiarLink(p.tokenConvite, p.whatsapp, p.nome)}
                      style={{ flex: 1, background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)", padding: "8px", borderRadius: "8px", fontSize: "11px", fontWeight: 700, border: "none", cursor: "pointer" }}
                    >
                      {copiado === p.tokenConvite ? '✅ Copiado!' : '📋 Copiar'}
                    </button>
                    {p.whatsapp && (
                      <button
                        onClick={() => enviarWhatsApp(p.tokenConvite, p.whatsapp, p.nome)}
                        style={{ flex: 1, background: "rgba(57,255,20,0.08)", color: "#39FF14", padding: "8px", borderRadius: "8px", fontSize: "11px", fontWeight: 700, border: "none", cursor: "pointer" }}
                      >
                        📲 WhatsApp
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button onClick={() => toggleAtivo(p.id, p.ativo)} style={{ flex: 1, background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)", padding: "10px", borderRadius: "10px", fontSize: "11px", border: "none", cursor: "pointer" }}>
                  {p.ativo ? '🔒 Bloquear' : '🔓 Ativar'}
                </button>
                <button onClick={() => excluir(p.id)} style={{ background: "rgba(255,70,70,0.08)", color: "#ff5555", padding: "10px 14px", borderRadius: "10px", fontSize: "11px", border: "none", cursor: "pointer" }}>
                  🗑️
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