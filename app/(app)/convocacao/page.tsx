'use client'
import PlanoGate from '@/components/PlanoGate'
import { usePerfil } from '@/lib/usePerfil'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Convocacao {
  id: string
  titulo: string
  tipo: string
  data: string
  horario: string
  local: string
  descricao: string
  status: string
  createdAt: string
}

interface Atleta {
  id: string
  nome: string
  fotoUrl: string | null
  turmaId: string | null
  dataNascimento: string | null
}

interface Turma {
  id: string
  nome: string
}

export default function Convocacoes() {
  const { escolaId } = usePerfil()
  const [convocacoes, setConvocacoes] = useState<Convocacao[]>([])
  const [atletas, setAtletas] = useState<Atleta[]>([])
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [atletasSelecionados, setAtletasSelecionados] = useState<string[]>([])
  const [filtroTurma, setFiltroTurma] = useState('')
  const [filtroAno, setFiltroAno] = useState('')
  const [filtroNome, setFiltroNome] = useState('')
  const [form, setForm] = useState({
    titulo: '',
    tipo: 'amistoso',
    data: '',
    horario: '',
    local: '',
    descricao: '',
  })

  async function carregar() {
    const { data: conv } = await supabase
      .from('Convocacao')
      .select('*')
      .eq('escolaId', escolaId!)
      .order('data', { ascending: false })
    setConvocacoes(conv || [])

    const { data: ats } = await supabase
      .from('Atleta')
      .select('id, nome, fotoUrl, turmaId, dataNascimento')
      .eq('escolaId', escolaId!)
      .eq('ativo', true)
      .order('nome')
    setAtletas(ats || [])

    const { data: tms } = await supabase
      .from('Turma')
      .select('id, nome')
      .eq('escolaId', escolaId!)
      .eq('ativa', true)
      .order('nome')
    setTurmas(tms || [])

    setLoading(false)
  }

  useEffect(() => { if (escolaId) carregar() }, [escolaId])

  const atletasFiltrados = atletas.filter(a => {
    const matchTurma = filtroTurma === '' || a.turmaId === filtroTurma
    const matchAno = filtroAno === '' || (a.dataNascimento && new Date(a.dataNascimento).getFullYear().toString() === filtroAno)
    const matchNome = filtroNome === '' || a.nome.toLowerCase().includes(filtroNome.toLowerCase())
    return matchTurma && matchAno && matchNome
  })

  const anosDisponiveis = [...new Set(
    atletas
      .filter(a => a.dataNascimento)
      .map(a => new Date(a.dataNascimento!).getFullYear().toString())
  )].sort((a, b) => parseInt(b) - parseInt(a))

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  function toggleAtleta(id: string) {
    setAtletasSelecionados(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    )
  }

  function selecionarFiltrados() {
    const idsFiltrados = atletasFiltrados.map(a => a.id)
    const todosSelecionados = idsFiltrados.every(id => atletasSelecionados.includes(id))
    if (todosSelecionados) {
      setAtletasSelecionados(prev => prev.filter(id => !idsFiltrados.includes(id)))
    } else {
      setAtletasSelecionados(prev => [...new Set([...prev, ...idsFiltrados])])
    }
  }

  function selecionarTodos() {
    if (atletasSelecionados.length === atletas.length) {
      setAtletasSelecionados([])
    } else {
      setAtletasSelecionados(atletas.map(a => a.id))
    }
  }

  async function salvar() {
    if (!form.titulo || !form.data || !form.horario) {
      return alert('Titulo, data e horario sao obrigatorios.')
    }
    if (atletasSelecionados.length === 0) {
      return alert('Selecione pelo menos um atleta.')
    }
    setSalvando(true)

    const { data: conv, error } = await supabase
      .from('Convocacao')
      .insert({
        escolaId: escolaId!,
        titulo: form.titulo,
        tipo: form.tipo,
        data: form.data,
        horario: form.horario,
        local: form.local,
        descricao: form.descricao,
        status: 'aberta',
      })
      .select()
      .single()

    if (error || !conv) {
      alert('Erro: ' + error?.message)
      setSalvando(false)
      return
    }

    await supabase.from('ConvocacaoAtleta').insert(
      atletasSelecionados.map(atletaId => ({
        convocacaoId: conv.id,
        atletaId,
        status: 'pendente',
      }))
    )

    setSucesso(true)
    setForm({ titulo: '', tipo: 'amistoso', data: '', horario: '', local: '', descricao: '' })
    setAtletasSelecionados([])
    setFiltroTurma('')
    setFiltroAno('')
    setFiltroNome('')
    setShowForm(false)
    carregar()
    setTimeout(() => setSucesso(false), 3000)
    setSalvando(false)
  }

  async function encerrar(id: string) {
    await supabase.from('Convocacao').update({ status: 'encerrada' }).eq('id', id)
    carregar()
  }

  async function excluir(id: string) {
    if (!confirm('Excluir esta convocacao?')) return
    await supabase.from('ConvocacaoAtleta').delete().eq('convocacaoId', id)
    await supabase.from('Convocacao').delete().eq('id', id)
    carregar()
  }

  const tipoLabel: Record<string, string> = {
    amistoso: 'Amistoso',
    'jogo-treino': 'Jogo-Treino',
    campeonato: 'Campeonato',
    treino: 'Treino',
  }

  const tipoColor: Record<string, string> = {
    amistoso: 'bg-blue-600/20 text-blue-400',
    'jogo-treino': 'bg-purple-600/20 text-purple-400',
    campeonato: 'bg-yellow-600/20 text-yellow-400',
    treino: 'bg-green-600/20 text-green-400',
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "rgba(255,255,255,0.4)", fontFamily: "Inter, sans-serif" }}>Carregando...</p>
      </div>
    )
  }

  return (
    <PlanoGate feature="convocacoes" planoMinimo="PRO">
    <div style={{ minHeight: "100vh", color: "#F0F0F0", padding: "20px 20px 80px", fontFamily: "Inter, sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <a href="/dashboard" style={{ color: "rgba(255,255,255,0.4)", textDecoration: "none", fontSize: "13px" }}>Voltar</a>
          <h1 style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "22px", color: "#F0F0F0" }}>Convocacoes</h1>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{ background: "linear-gradient(135deg,#FF6B00,#00cc00)", color: "#000", padding: "10px 18px", borderRadius: "12px", fontSize: "12px", fontWeight: 800, fontFamily: "Syne, sans-serif", border: "none", cursor: "pointer" }}
        >
          {showForm ? 'Fechar' : '+ Nova'}
        </button>
      </div>

      {sucesso && (
        <div style={{ background: "rgba(57,255,20,0.1)", border: "1px solid rgba(57,255,20,0.3)", borderRadius: "12px", padding: "12px", textAlign: "center", marginBottom: "16px" }}>
          <p style={{ color: "#FF6B00", fontFamily: "Syne, sans-serif", fontWeight: 700, margin: 0 }}>Convocacao criada!</p>
        </div>
      )}

      {showForm && (
        <div style={{ background: "rgba(57,255,20,0.04)", border: "1px solid rgba(57,255,20,0.15)", borderRadius: "16px", padding: "16px", marginBottom: "20px" }}>
          <p style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "14px", color: "#FF6B00", marginBottom: "16px" }}>Nova Convocacao</p>
          <div className="space-y-3">
            <div>
              <label style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.8px" }}>Titulo *</label>
              <input name="titulo" value={form.titulo} onChange={handleChange} style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "12px", color: "#F0F0F0", fontFamily: "Inter, sans-serif", fontSize: "13px", marginTop: "4px", boxSizing: "border-box" }} placeholder="Ex: Jogo contra Rivais FC" />
            </div>
            <div>
              <label style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.8px" }}>Tipo</label>
              <select name="tipo" value={form.tipo} onChange={handleChange} style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "12px", color: "#F0F0F0", fontFamily: "Inter, sans-serif", fontSize: "13px", marginTop: "4px", boxSizing: "border-box" }}>
                <option value="amistoso">Amistoso</option>
                <option value="jogo-treino">Jogo-Treino</option>
                <option value="campeonato">Campeonato</option>
                <option value="treino">Treino</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.8px" }}>Data *</label>
                <input name="data" value={form.data} onChange={handleChange} type="date" style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "12px", color: "#F0F0F0", fontFamily: "Inter, sans-serif", fontSize: "13px", marginTop: "4px", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.8px" }}>Horario *</label>
                <input name="horario" value={form.horario} onChange={handleChange} type="time" style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "12px", color: "#F0F0F0", fontFamily: "Inter, sans-serif", fontSize: "13px", marginTop: "4px", boxSizing: "border-box" }} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.8px" }}>Local</label>
              <input name="local" value={form.local} onChange={handleChange} style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "12px", color: "#F0F0F0", fontFamily: "Inter, sans-serif", fontSize: "13px", marginTop: "4px", boxSizing: "border-box" }} placeholder="Ex: Campo Municipal" />
            </div>
            <div>
              <label style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.8px" }}>Descricao</label>
              <textarea name="descricao" value={form.descricao} onChange={handleChange} style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "12px", color: "#F0F0F0", fontFamily: "Inter, sans-serif", fontSize: "13px", marginTop: "4px", boxSizing: "border-box" }} rows={2} placeholder="Informacoes adicionais..." />
            </div>

            <div style={{ border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "12px" }}>
              <div className="flex justify-between items-center mb-3">
                <label style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: 700 }}>Atletas *</label>
                <button onClick={selecionarTodos} style={{ fontSize: "11px", color: "#FF6B00", fontWeight: 700, background: "none", border: "none", cursor: "pointer" }}>
                  {atletasSelecionados.length === atletas.length ? 'Desmarcar todos' : 'Todos'}
                </button>
              </div>

              <div className="space-y-2 mb-3">
                <input
                  value={filtroNome}
                  onChange={e => setFiltroNome(e.target.value)}
                  style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "8px 10px", color: "#F0F0F0", fontSize: "12px", marginBottom: "6px" }}
                  placeholder="Buscar por nome..."
                />
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={filtroTurma}
                    onChange={e => setFiltroTurma(e.target.value)}
                    style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "8px 10px", color: "#F0F0F0", fontSize: "12px", marginBottom: "6px" }}
                  >
                    <option value="">Todas as turmas</option>
                    {turmas.map(t => (
                      <option key={t.id} value={t.id}>{t.nome}</option>
                    ))}
                  </select>
                  <select
                    value={filtroAno}
                    onChange={e => setFiltroAno(e.target.value)}
                    style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "8px 10px", color: "#F0F0F0", fontSize: "12px", marginBottom: "6px" }}
                  >
                    <option value="">Todos os anos</option>
                    {anosDisponiveis.map(ano => (
                      <option key={ano} value={ano}>{ano}</option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-xs text-gray-500">{atletasFiltrados.length} atleta(s) no filtro</p>
                  <button onClick={selecionarFiltrados} style={{ fontSize: "11px", color: "#60a5fa", fontWeight: 700, background: "none", border: "none", cursor: "pointer" }}>
                    Selecionar filtrados
                  </button>
                </div>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {atletasFiltrados.map(a => (
                  <div
                    key={a.id}
                    onClick={() => toggleAtleta(a.id)}
                    className={"flex items-center gap-3 p-2 rounded-lg cursor-pointer " + (atletasSelecionados.includes(a.id) ? 'bg-green-600/20 border border-green-600/40' : 'bg-gray-800')}
                  >
                    <div className={"w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 " + (atletasSelecionados.includes(a.id) ? 'bg-green-600 border-green-600' : 'border-gray-600')}>
                      {atletasSelecionados.includes(a.id) && <span className="text-white text-xs">✓</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{a.nome}</p>
                      {a.dataNascimento && (
                        <p className="text-xs text-gray-500">{new Date(a.dataNascimento).getFullYear()}</p>
                      )}
                    </div>
                    {a.turmaId && (
                      <p className="text-xs text-gray-500 truncate">
                        {turmas.find(t => t.id === a.turmaId)?.nome || ''}
                      </p>
                    )}
                  </div>
                ))}
                {atletasFiltrados.length === 0 && (
                  <p className="text-gray-500 text-sm text-center py-4">Nenhum atleta encontrado.</p>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">{atletasSelecionados.length} atleta(s) selecionado(s)</p>
            </div>

            <button onClick={salvar} disabled={salvando} style={{ width: "100%", background: "linear-gradient(135deg,#FF6B00,#00cc00)", color: "#000", padding: "14px", borderRadius: "12px", fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "13px", border: "none", cursor: "pointer" }}>
              {salvando ? 'Salvando...' : 'Criar Convocacao'}
            </button>
          </div>
        </div>
      )}

      {convocacoes.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <p className="text-4xl mb-3">📣</p>
          <p style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: "16px", color: "#F0F0F0", marginBottom: "8px" }}>Nenhuma convocacao ainda.</p>
          <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)" }}>Clique em + Nova para criar.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {convocacoes.map(c => (
            <div key={c.id} style={{ background: "rgba(255,255,255,0.04)", borderRadius: "16px", padding: "14px", border: "1px solid rgba(255,255,255,0.07)", marginBottom: "10px" }}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: "15px", color: "#F0F0F0" }}>{c.titulo}</p>
                  <span className={"text-xs px-2 py-1 rounded-full font-bold mt-1 inline-block " + (tipoColor[c.tipo] || 'bg-gray-700 text-gray-300')}>
                    {tipoLabel[c.tipo] || c.tipo}
                  </span>
                </div>
                <span className={"text-xs px-2 py-1 rounded-full font-bold " + (c.status === 'aberta' ? 'bg-green-600/20 text-green-400' : 'bg-gray-700 text-gray-400')}>
                  {c.status === 'aberta' ? 'Aberta' : 'Encerrada'}
                </span>
              </div>
              <div className="space-y-1 mb-3">
                <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginBottom: "2px" }}>{"📅 " + new Date(c.data + 'T00:00:00').toLocaleDateString('pt-BR') + " - " + c.horario}</p>
                {c.local && <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginBottom: "2px" }}>{"📍 " + c.local}</p>}
                {c.descricao && <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>{c.descricao}</p>}
              </div>
              <div className="flex gap-2">
                <a href={"/convocacao/" + c.id} style={{ flex: 1, background: "rgba(57,255,20,0.08)", border: "1px solid rgba(57,255,20,0.2)", color: "#FF6B00", textAlign: "center", padding: "10px", borderRadius: "10px", fontSize: "12px", fontWeight: 700, fontFamily: "Syne, sans-serif", textDecoration: "none" }}>
                  Ver detalhes
                </a>
                {c.status === 'aberta' && (
                  <button onClick={() => encerrar(c.id)} style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)", padding: "10px 12px", borderRadius: "10px", fontSize: "12px", border: "none", cursor: "pointer" }}>
                    Encerrar
                  </button>
                )}
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
    </PlanoGate>
  )
}
