'use client'
import { usePerfil } from '@/lib/usePerfil'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const T = { bg: '#0A0E1A', surface: '#0D1220', primary: '#4169E1', accent: '#00BFFF', text: '#F0F4FF', muted: 'rgba(240,244,255,0.4)', border: 'rgba(240,244,255,0.08)', green: '#00D67A', red: '#FF4444' }
const SYNE = 'Syne, sans-serif'
const INP: React.CSSProperties = { width: '100%', background: '#080C15', border: '1px solid rgba(240,244,255,0.1)', borderRadius: 8, padding: '11px 14px', color: T.text, fontFamily: 'Inter, sans-serif', fontSize: 13, marginTop: 4, boxSizing: 'border-box' }
const LBL: React.CSSProperties = { fontSize: 10, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.8px' }

const TIPOS = [
  { value: 'campo', label: 'Campo de Futebol' },
  { value: 'quadra', label: 'Quadra Poliesportiva' },
  { value: 'ginasio', label: 'Ginásio' },
  { value: 'sala', label: 'Sala de Treino' },
  { value: 'piscina', label: 'Piscina' },
  { value: 'outro', label: 'Outro' },
]

const TIPO_ICON: Record<string, string> = {
  campo: 'ti-ball-football', quadra: 'ti-volleyball', ginasio: 'ti-building',
  sala: 'ti-door', piscina: 'ti-droplet', outro: 'ti-map-pin',
}

type Local = {
  id: string; nome: string; tipo: string; endereco: string | null; numero: string | null
  bairro: string | null; cidade: string | null; estado: string | null; cep: string | null
  capacidade: number | null; ativo: boolean; criadoEm: string
}

const FORM_VAZIO = { nome: '', tipo: 'campo', endereco: '', numero: '', bairro: '', cidade: '', estado: '', cep: '', capacidade: '' }

export default function LocaisTreino() {
  const { escolaId } = usePerfil()
  const [locais, setLocais] = useState<Local[]>([])
  const [loading, setLoading] = useState(true)
  const [criando, setCriando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [editando, setEditando] = useState<Local | null>(null)
  const [form, setForm] = useState(FORM_VAZIO)

  async function carregar() {
    const { data } = await supabase.from('LocalTreino').select('*').eq('escolaId', escolaId!).eq('ativo', true).order('nome')
    setLocais(data || [])
    setLoading(false)
  }

  useEffect(() => { if (escolaId) carregar() }, [escolaId])

  async function buscarCep(cep: string) {
    if (cep.replace(/\D/g, '').length !== 8) return
    const res = await fetch(`https://viacep.com.br/ws/${cep.replace(/\D/g, '')}/json/`)
    const data = await res.json()
    if (!data.erro) setForm(p => ({ ...p, endereco: data.logradouro, bairro: data.bairro, cidade: data.localidade, estado: data.uf }))
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target
    setForm(p => ({ ...p, [name]: value }))
    if (name === 'cep') buscarCep(value)
  }

  function abrirEditar(local: Local) {
    setEditando(local)
    setForm({
      nome: local.nome, tipo: local.tipo,
      endereco: local.endereco || '', numero: local.numero || '',
      bairro: local.bairro || '', cidade: local.cidade || '',
      estado: local.estado || '', cep: local.cep || '',
      capacidade: local.capacidade?.toString() || '',
    })
    setCriando(true)
  }

  function fecharForm() { setCriando(false); setEditando(null); setForm(FORM_VAZIO) }

  async function salvar() {
    if (!form.nome) return alert('Nome obrigatório.')
    setSalvando(true)
    const payload = {
      nome: form.nome, tipo: form.tipo,
      endereco: form.endereco || null, numero: form.numero || null,
      bairro: form.bairro || null, cidade: form.cidade || null,
      estado: form.estado || null, cep: form.cep || null,
      capacidade: form.capacidade ? Number(form.capacidade) : null,
    }
    if (editando) {
      await supabase.from('LocalTreino').update(payload).eq('id', editando.id)
    } else {
      await supabase.from('LocalTreino').insert({ ...payload, escolaId: escolaId!, ativo: true })
    }
    fecharForm()
    await carregar()
    setSalvando(false)
  }

  async function excluir(id: string) {
    if (!confirm('Excluir este local?')) return
    await supabase.from('LocalTreino').update({ ativo: false }).eq('id', id)
    carregar()
  }

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: 'Inter, sans-serif', paddingBottom: 80 }}>
      {/* HEADER */}
      <div style={{ background: T.primary, padding: '20px 20px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 10, color: 'rgba(240,244,255,0.65)', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 700, marginBottom: 4 }}>Elenco</div>
            <div style={{ fontFamily: SYNE, fontWeight: 900, fontSize: 26, color: T.text, letterSpacing: -0.8, textTransform: 'uppercase' }}>
              Locais <span style={{ color: T.accent, fontStyle: 'italic' }}>{locais.length}</span>
            </div>
          </div>
          <button onClick={() => { fecharForm(); setCriando(v => !v) }} style={{ background: T.text, color: T.primary, borderRadius: 8, padding: '10px 16px', fontFamily: SYNE, fontWeight: 800, fontSize: 12, border: 'none', cursor: 'pointer', textTransform: 'uppercase' }}>
            {criando ? 'Fechar' : '+ Novo'}
          </button>
        </div>
      </div>

      {/* FORMULÁRIO */}
      {criando && (
        <div style={{ margin: '16px 20px', background: T.surface, border: `1px solid ${T.primary}33`, borderLeft: `3px solid ${T.primary}`, borderRadius: 8, padding: 16 }}>
          <p style={{ fontFamily: SYNE, fontWeight: 800, fontSize: 13, color: T.primary, marginBottom: 14, textTransform: 'uppercase' }}>
            {editando ? 'Editar Local' : 'Novo Local de Treino'}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={LBL}>Nome do local *</label>
              <input name="nome" value={form.nome} onChange={handleChange} style={INP} placeholder="Ex: Campo Municipal, Quadra do Clube..." />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={LBL}>Tipo</label>
                <select name="tipo" value={form.tipo} onChange={handleChange} style={INP}>
                  {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label style={LBL}>Capacidade (pessoas)</label>
                <input name="capacidade" value={form.capacidade} onChange={handleChange} type="number" min={0} style={INP} placeholder="Ex: 50" />
              </div>
            </div>
            <div>
              <label style={LBL}>CEP</label>
              <input name="cep" value={form.cep} onChange={handleChange} maxLength={9} style={INP} placeholder="00000-000" />
              <p style={{ fontSize: 11, color: T.muted, marginTop: 3 }}>Preenche endereço automaticamente</p>
            </div>
            <div>
              <label style={LBL}>Endereço</label>
              <input name="endereco" value={form.endereco} onChange={handleChange} style={INP} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 10 }}>
              <div>
                <label style={LBL}>Número</label>
                <input name="numero" value={form.numero} onChange={handleChange} style={INP} />
              </div>
              <div>
                <label style={LBL}>Bairro</label>
                <input name="bairro" value={form.bairro} onChange={handleChange} style={INP} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px', gap: 10 }}>
              <div>
                <label style={LBL}>Cidade</label>
                <input name="cidade" value={form.cidade} onChange={handleChange} style={INP} />
              </div>
              <div>
                <label style={LBL}>UF</label>
                <input name="estado" value={form.estado} onChange={handleChange} maxLength={2} style={INP} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={salvar} disabled={salvando || !form.nome}
                style={{ flex: 1, background: T.primary, color: T.text, padding: 13, borderRadius: 8, fontFamily: SYNE, fontWeight: 800, fontSize: 13, border: 'none', cursor: 'pointer', textTransform: 'uppercase', opacity: salvando || !form.nome ? 0.5 : 1 }}>
                {salvando ? 'Salvando...' : editando ? 'Salvar edição' : 'Criar local'}
              </button>
              <button onClick={fecharForm}
                style={{ flex: 1, background: 'transparent', color: T.muted, padding: 13, borderRadius: 8, fontFamily: SYNE, fontWeight: 700, fontSize: 13, border: `1px solid ${T.border}`, cursor: 'pointer' }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LISTA */}
      <div style={{ padding: '16px 20px' }}>
        {loading && <p style={{ color: T.muted, textAlign: 'center', padding: 40, fontSize: 13 }}>Carregando...</p>}

        {!loading && locais.length === 0 && !criando && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <i className="ti ti-map-pin-off" style={{ fontSize: 48, color: T.border, display: 'block', marginBottom: 12 }} aria-hidden="true"></i>
            <p style={{ fontFamily: SYNE, fontWeight: 800, fontSize: 16, color: T.text, marginBottom: 6, textTransform: 'uppercase' }}>Nenhum local cadastrado</p>
            <p style={{ fontSize: 13, color: T.muted }}>Clique em + Novo para adicionar</p>
          </div>
        )}

        {locais.map(local => (
          <div key={local.id} style={{ background: T.surface, border: `1px solid ${T.border}`, borderLeft: `3px solid ${T.primary}`, borderRadius: 8, padding: 16, marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 8, background: `${T.primary}18`, border: `1px solid ${T.primary}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className={`ti ${TIPO_ICON[local.tipo] || 'ti-map-pin'}`} style={{ fontSize: 18, color: T.primary }} aria-hidden="true"></i>
                </div>
                <div>
                  <p style={{ fontFamily: SYNE, fontWeight: 900, fontSize: 14, color: T.text, margin: '0 0 3px', textTransform: 'uppercase' }}>{local.nome}</p>
                  <span style={{ fontSize: 9, fontWeight: 800, color: T.accent, background: `${T.accent}15`, padding: '2px 8px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {TIPOS.find(t => t.value === local.tipo)?.label || local.tipo}
                  </span>
                </div>
              </div>
              {local.capacidade && (
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontFamily: SYNE, fontWeight: 900, fontSize: 18, color: T.primary }}>{local.capacidade}</div>
                  <div style={{ fontSize: 9, color: T.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>Capacidade</div>
                </div>
              )}
            </div>

            {(local.endereco || local.cidade) && (
              <p style={{ fontSize: 11, color: T.muted, margin: '8px 0 10px', display: 'flex', alignItems: 'center', gap: 4 }}>
                <i className="ti ti-map-pin" style={{ fontSize: 12 }} aria-hidden="true"></i>
                {[local.endereco, local.numero, local.bairro, local.cidade, local.estado].filter(Boolean).join(', ')}
              </p>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => abrirEditar(local)}
                style={{ flex: 1, background: `${T.primary}15`, border: `1px solid ${T.primary}33`, color: T.primary, padding: '9px', borderRadius: 8, fontSize: 12, fontWeight: 800, fontFamily: SYNE, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                <i className="ti ti-edit" style={{ marginRight: 4 }} aria-hidden="true"></i>Editar
              </button>
              <button onClick={() => excluir(local.id)}
                style={{ background: 'rgba(255,68,68,0.08)', color: T.red, padding: '9px 14px', borderRadius: 8, fontSize: 12, border: '1px solid rgba(255,68,68,0.2)', cursor: 'pointer' }}>
                <i className="ti ti-trash" aria-hidden="true"></i>
              </button>
            </div>
          </div>
        ))}
      </div>

      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-around', padding: '10px 0 20px', borderTop: `1px solid ${T.border}`, background: 'rgba(10,14,26,0.97)', backdropFilter: 'blur(12px)', zIndex: 50 }}>
        {[{ href: '/dashboard', label: 'Início', icon: 'ti-home' }, { href: '/atletas', label: 'Atletas', icon: 'ti-users' }, { href: '/presenca', label: 'Presença', icon: 'ti-check' }, { href: '/financeiro/caixa', label: 'Financeiro', icon: 'ti-wallet' }].map(item => (
          <a key={item.href} href={item.href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, textDecoration: 'none' }}>
            <i className={`ti ${item.icon}`} style={{ fontSize: 22, color: T.muted }} aria-hidden="true"></i>
            <span style={{ fontSize: 9, fontFamily: SYNE, fontWeight: 700, color: T.muted, letterSpacing: '0.5px', textTransform: 'uppercase' }}>{item.label}</span>
          </a>
        ))}
      </nav>
    </div>
  )
}
