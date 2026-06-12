'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function EditarAtleta() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [ativo, setAtivo] = useState(true)
  const [form, setForm] = useState({
    nome: '',
    dataNascimento: '',
    cpf: '',
    rg: '',
    posicao: '',
    telefone: '',
    cep: '',
    endereco: '',
    numero: '',
    bairro: '',
    cidade: '',
    estado: '',
    nomeResponsavel: '',
    whatsappResponsavel: '',
    planoMensalidade: 'STANDARD',
    diaVencimento: '10',
    escolaEstuda: '',
    serieEstuda: '',
    turnoEstuda: '',
  })
  const [responsavelId, setResponsavelId] = useState<string | null>(null)

  useEffect(() => {
    async function carregar() {
      const { data: atleta } = await supabase
        .from('Atleta')
        .select('*')
        .eq('id', id)
        .single()

      if (atleta) {
        setAtivo(atleta.ativo ?? true)
        setForm(prev => ({
          ...prev,
          nome: atleta.nome || '',
          dataNascimento: atleta.dataNascimento || '',
          cpf: atleta.cpf || '',
          rg: atleta.rg || '',
          posicao: atleta.posicao || '',
          telefone: atleta.telefone || '',
          cep: atleta.cep || '',
          endereco: atleta.endereco || '',
          numero: atleta.numero || '',
          bairro: atleta.bairro || '',
          cidade: atleta.cidade || '',
          estado: atleta.estado || '',
          planoMensalidade: atleta.planoMensalidade || 'STANDARD',
          diaVencimento: atleta.diaVencimento?.toString() || '10',
          escolaEstuda: atleta.escolaEstuda || '',
          serieEstuda: atleta.serieEstuda || '',
          turnoEstuda: atleta.turnoEstuda || '',
        }))
      }

      const { data: responsaveis } = await supabase
        .from('Responsavel')
        .select('*')
        .eq('atletaId', id)
        .eq('principal', true)
        .limit(1)

      if (responsaveis?.[0]) {
        setResponsavelId(responsaveis[0].id)
        setForm(prev => ({
          ...prev,
          nomeResponsavel: responsaveis[0].nome || '',
          whatsappResponsavel: responsaveis[0].whatsapp || '',
        }))
      }

      setLoading(false)
    }
    carregar()
  }, [id])

  async function buscarCep(cep: string) {
    if (cep.replace(/\D/g, '').length !== 8) return
    const res = await fetch(`https://viacep.com.br/ws/${cep.replace(/\D/g, '')}/json/`)
    const data = await res.json()
    if (!data.erro) {
      setForm(prev => ({
        ...prev,
        endereco: data.logradouro,
        bairro: data.bairro,
        cidade: data.localidade,
        estado: data.uf,
      }))
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (name === 'cep') buscarCep(value)
  }

  async function salvar() {
    setSalvando(true)
    await supabase
      .from('Atleta')
      .update({
        nome: form.nome,
        dataNascimento: form.dataNascimento,
        cpf: form.cpf,
        rg: form.rg,
        posicao: form.posicao,
        telefone: form.telefone,
        cep: form.cep,
        endereco: form.endereco,
        numero: form.numero,
        bairro: form.bairro,
        cidade: form.cidade,
        estado: form.estado,
        planoMensalidade: form.planoMensalidade,
        diaVencimento: Number(form.diaVencimento) || 10,
        escolaEstuda: form.escolaEstuda || null,
        serieEstuda: form.serieEstuda || null,
        turnoEstuda: form.turnoEstuda || null,
      })
      .eq('id', id)

    if (responsavelId) {
      await supabase
        .from('Responsavel')
        .update({
          nome: form.nomeResponsavel,
          whatsapp: form.whatsappResponsavel,
          telefone: form.whatsappResponsavel,
        })
        .eq('id', responsavelId)
    }

    setSucesso(true)
    setTimeout(() => router.push(`/atletas/${id}`), 1500)
    setSalvando(false)
  }

  async function bloquear() {
    const novoStatus = !ativo
    const acao = novoStatus ? 'reativar' : 'bloquear'
    if (!confirm(`Deseja ${acao} este atleta?`)) return
    await supabase.from('Atleta').update({ ativo: novoStatus }).eq('id', id)
    setAtivo(novoStatus)
    alert(`Atleta ${novoStatus ? 'reativado' : 'bloqueado'} com sucesso!`)
  }

  async function excluir() {
    if (!confirm('Tem certeza que deseja EXCLUIR este atleta? Esta ação não pode ser desfeita.')) return
    if (!confirm('Confirma a exclusão permanente?')) return
    await supabase.from('Presenca').delete().eq('atletaId', id)
    await supabase.from('Cobranca').delete().eq('atletaId', id)
    await supabase.from('Responsavel').delete().eq('atletaId', id)
    await supabase.from('Avaliacao').delete().eq('atletaId', id)
    await supabase.from('Atleta').delete().eq('id', id)
    router.push('/atletas')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <p className="text-gray-400">Carregando...</p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: "100vh", color: "#F0F0F0", padding: "20px 20px 80px", fontFamily: "Inter, sans-serif" }}>
      <div className="flex items-center gap-3 mb-6">
        <a href={`/atletas/${id}`} className="text-gray-400">← Voltar</a>
        <h1 className="text-xl font-bold">✏️ Editar Atleta</h1>
      </div>

      {sucesso && (
        <div className="bg-green-600/20 border border-green-600/30 rounded-xl p-3 mb-4 text-center">
          <p className="text-green-400 font-bold">✅ Dados salvos! Redirecionando...</p>
        </div>
      )}

      {/* Status do atleta */}
      {!ativo && (
        <div className="bg-red-600/10 border border-red-600/30 rounded-xl p-3 mb-4 text-center">
          <p className="text-red-400 font-bold">⛔ Atleta bloqueado</p>
        </div>
      )}

      <div className="space-y-4">
        <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: "16px", padding: "16px", border: "1px solid rgba(255,255,255,0.07)" }}>
          <p className="text-green-500 font-bold text-sm mb-4">⚽ Dados do Atleta</p>
          <div className="space-y-3">
            <div>
              <label style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.8px" }}>Nome completo *</label>
              <input name="nome" value={form.nome} onChange={handleChange} required style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "12px", color: "#F0F0F0", fontFamily: "Inter, sans-serif", fontSize: "13px", marginTop: "4px", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.8px" }}>Data de nascimento</label>
              <input name="dataNascimento" value={form.dataNascimento} onChange={handleChange} type="date" style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "12px", color: "#F0F0F0", fontFamily: "Inter, sans-serif", fontSize: "13px", marginTop: "4px", boxSizing: "border-box" }} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.8px" }}>CPF</label>
                <input name="cpf" value={form.cpf} onChange={handleChange} style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "12px", color: "#F0F0F0", fontFamily: "Inter, sans-serif", fontSize: "13px", marginTop: "4px", boxSizing: "border-box" }} placeholder="000.000.000-00" />
              </div>
              <div>
                <label style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.8px" }}>RG</label>
                <input name="rg" value={form.rg} onChange={handleChange} style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "12px", color: "#F0F0F0", fontFamily: "Inter, sans-serif", fontSize: "13px", marginTop: "4px", boxSizing: "border-box" }} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.8px" }}>Plano de Mensalidade</label>
            <select
              name="planoMensalidade"
              value={form.planoMensalidade}
              onChange={handleChange}
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px', color: '#F0F0F0', fontFamily: 'Inter, sans-serif', fontSize: '13px', marginTop: '4px' }}
            >
              <option value="AMIGO">Amigo - R$ 80,00</option>
              <option value="STANDARD">Standard - R$ 85,00</option>
              <option value="BABYFUT">BabyFut - R$ 100,00</option>
            </select>
            </div>
            </div>
            <div>
              <label style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.8px" }}>Dia de Vencimento</label>
              <select name="diaVencimento" value={form.diaVencimento} onChange={handleChange} style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "12px", color: "#F0F0F0", fontFamily: "Inter, sans-serif", fontSize: "13px", marginTop: "4px", boxSizing: "border-box" as const }}>
                {[5,10,15,20,25].map(d => <option key={d} value={d}>Dia {d}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
            <label style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.8px" }}>Posição</label>
                <select name="posicao" value={form.posicao} onChange={handleChange} style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "12px", color: "#F0F0F0", fontFamily: "Inter, sans-serif", fontSize: "13px", marginTop: "4px", boxSizing: "border-box" }}>
                  <option value="">Selecione</option>
                  <option>Goleiro</option>
                  <option>Zagueiro</option>
                  <option>Lateral</option>
                  <option>Volante</option>
                  <option>Meia</option>
                  <option>Atacante</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.8px" }}>Telefone</label>
                <input name="telefone" value={form.telefone} onChange={handleChange} type="tel" style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "12px", color: "#F0F0F0", fontFamily: "Inter, sans-serif", fontSize: "13px", marginTop: "4px", boxSizing: "border-box" }} />
              </div>
            </div>
          </div>
        </div>

        <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: "16px", padding: "16px", border: "1px solid rgba(255,255,255,0.07)" }}>
          <p className="text-green-500 font-bold text-sm mb-4">📍 Endereço</p>
          <div className="space-y-3">
            <div>
              <label style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.8px" }}>CEP</label>
              <input name="cep" value={form.cep} onChange={handleChange} maxLength={9} style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "12px", color: "#F0F0F0", fontFamily: "Inter, sans-serif", fontSize: "13px", marginTop: "4px", boxSizing: "border-box" }} placeholder="00000-000" />
              <p className="text-xs text-gray-500 mt-1">Digite o CEP para preencher automaticamente</p>
            </div>
            <div>
              <label style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.8px" }}>Endereço</label>
              <input name="endereco" value={form.endereco} onChange={handleChange} style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "12px", color: "#F0F0F0", fontFamily: "Inter, sans-serif", fontSize: "13px", marginTop: "4px", boxSizing: "border-box" }} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.8px" }}>Número</label>
                <input name="numero" value={form.numero} onChange={handleChange} style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "12px", color: "#F0F0F0", fontFamily: "Inter, sans-serif", fontSize: "13px", marginTop: "4px", boxSizing: "border-box" }} />
              </div>
              <div className="col-span-2">
                <label style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.8px" }}>Bairro</label>
                <input name="bairro" value={form.bairro} onChange={handleChange} style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "12px", color: "#F0F0F0", fontFamily: "Inter, sans-serif", fontSize: "13px", marginTop: "4px", boxSizing: "border-box" }} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.8px" }}>Cidade</label>
                <input name="cidade" value={form.cidade} onChange={handleChange} style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "12px", color: "#F0F0F0", fontFamily: "Inter, sans-serif", fontSize: "13px", marginTop: "4px", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.8px" }}>Estado</label>
                <input name="estado" value={form.estado} onChange={handleChange} maxLength={2} style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "12px", color: "#F0F0F0", fontFamily: "Inter, sans-serif", fontSize: "13px", marginTop: "4px", boxSizing: "border-box" }} />
              </div>
            </div>
          </div>
        </div>

        <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: "16px", padding: "16px", border: "1px solid rgba(255,255,255,0.07)" }}>
          <p className="text-green-500 font-bold text-sm mb-4">👤 Responsável</p>
          <div className="space-y-3">
            <div>
              <label style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.8px" }}>Nome do responsável</label>
              <input name="nomeResponsavel" value={form.nomeResponsavel} onChange={handleChange} style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "12px", color: "#F0F0F0", fontFamily: "Inter, sans-serif", fontSize: "13px", marginTop: "4px", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.8px" }}>WhatsApp</label>
              <input name="whatsappResponsavel" value={form.whatsappResponsavel} onChange={handleChange} type="tel" style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "12px", color: "#F0F0F0", fontFamily: "Inter, sans-serif", fontSize: "13px", marginTop: "4px", boxSizing: "border-box" }} />
            </div>
          </div>
        </div>

        <button
          onClick={salvar}
          disabled={salvando}
          style={{ width: "100%", background: "linear-gradient(135deg,#FF6B00,#00cc00)", color: "#000", padding: "16px", borderRadius: "14px", fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "14px", border: "none", cursor: "pointer" }}
        >
          {salvando ? 'Salvando...' : '💾 Salvar Alterações'}
        </button>

        {/* Ações perigosas */}
        <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: "16px", padding: "16px", border: "1px solid rgba(255,255,255,0.07)" }}>
          <p className="text-gray-400 text-sm mb-3">⚠️ Ações</p>
          <div className="space-y-2">
            <button
              onClick={bloquear}
              className={`w-full py-3 rounded-xl font-bold text-sm ${ativo ? 'bg-yellow-600/20 text-yellow-400 border border-yellow-600/30' : 'bg-green-600/20 text-green-400 border border-green-600/30'}`}
            >
              {ativo ? '⛔ Bloquear Atleta' : '✅ Reativar Atleta'}
            </button>
            <button
              onClick={excluir}
              className="w-full py-3 rounded-xl font-bold text-sm bg-red-600/20 text-red-400 border border-red-600/30"
            >
              🗑️ Excluir Atleta Permanentemente
            </button>
          </div>
        </div>
      </div>

      <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, display: "flex", justifyContent: "space-around", padding: "12px 0 20px", borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(5,5,5,0.95)", backdropFilter: "blur(10px)" }}>
        <a href="/dashboard" style={{ textDecoration: "none", color: "rgba(255,255,255,0.4)", fontSize: "9px", textTransform: "uppercase", fontFamily: "Syne, sans-serif" }}>Inicio</a>
        <a href="/atletas" style={{ textDecoration: "none", color: "#FF6B00", fontSize: "9px", textTransform: "uppercase", fontFamily: "Syne, sans-serif", fontWeight: 700 }}>Atletas</a>
        <a href="/presenca" style={{ textDecoration: "none", color: "rgba(255,255,255,0.4)", fontSize: "9px", textTransform: "uppercase", fontFamily: "Syne, sans-serif" }}>Presenca</a>
        <a href="/financeiro" style={{ textDecoration: "none", color: "rgba(255,255,255,0.4)", fontSize: "9px", textTransform: "uppercase", fontFamily: "Syne, sans-serif" }}>Financeiro</a>
      </nav>
    </div>
  )
}