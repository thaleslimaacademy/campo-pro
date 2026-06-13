'use client'
import { useEffect, useState } from 'react'
import { listarComissao, convidarMembro, toggleMembroAtivo, excluirMembro } from './actions'

const C = { bg: '#0F0F1A', surface: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.07)', orange: '#FF6B00', gold: '#FFD700', muted: 'rgba(255,255,255,0.4)', text: '#F0F0F0' }
const SYNE = 'Syne, sans-serif'

const PERFIS = [
  { value: 'diretor',    label: 'Diretor',            cargo: 'Diretor' },
  { value: 'professor',  label: 'Professor',          cargo: 'Professor' },
  { value: 'preparador', label: 'Preparador Físico',  cargo: 'Preparador Físico' },
]

type Membro = {
  id: string; nome: string; email: string; telefone?: string; whatsapp?: string
  cargo: string; perfil: string; ativo: boolean; contaCriada: boolean; tokenConvite: string
}

export default function ComissaoPage() {
  const [membros, setMembros] = useState<Membro[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [linkGerado, setLinkGerado] = useState('')
  const [copiado, setCopiado] = useState(false)
  const [form, setForm] = useState({ nome: '', email: '', whatsapp: '', cargo: 'Professor', perfil: 'professor' })

  useEffect(() => {
    listarComissao().then(d => setMembros(d as Membro[])).finally(() => setLoading(false))
  }, [])

  const handle = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    if (name === 'perfil') {
      const p = PERFIS.find(x => x.value === value)
      setForm(prev => ({ ...prev, perfil: value, cargo: p?.cargo || value }))
    } else {
      setForm(prev => ({ ...prev, [name]: value }))
    }
  }

  const convidar = async () => {
    if (!form.nome || !form.email) { alert('Preencha nome e email'); return }
    setSalvando(true)
    try {
      const r = await convidarMembro(form)
      setLinkGerado(r.linkConvite)
      setMembros(await listarComissao() as Membro[])
      setForm({ nome: '', email: '', whatsapp: '', cargo: 'Professor', perfil: 'professor' })
      setShowForm(false)
    } catch (e) { alert((e as Error).message) }
    finally { setSalvando(false) }
  }

  const copiar = (link: string) => {
    navigator.clipboard.writeText(link)
    setCopiado(true); setTimeout(() => setCopiado(false), 2000)
  }

  const perfilLabel = (p: string) => PERFIS.find(x => x.value === p)?.label || p
  const perfilCor = (p: string) => p === 'diretor' ? C.gold : p === 'preparador' ? '#60a5fa' : C.orange

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, padding: '20px 20px 80px', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <div style={{ fontSize: '10px', color: C.muted, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '2px' }}>Gestão</div>
          <div style={{ fontFamily: SYNE, fontSize: '24px', fontWeight: 800 }}>Comissão Técnica</div>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          style={{ background: 'linear-gradient(135deg,#FF6B00,#FFD700)', color: '#000', border: 'none', borderRadius: '12px', padding: '10px 18px', fontFamily: SYNE, fontWeight: 800, fontSize: '12px', cursor: 'pointer' }}>
          + Convidar
        </button>
      </div>

      {/* Link gerado */}
      {linkGerado && (
        <div style={{ background: 'rgba(255,107,0,0.08)', border: '1px solid rgba(255,107,0,0.3)', borderRadius: '14px', padding: '14px', marginBottom: '16px' }}>
          <p style={{ fontFamily: SYNE, fontWeight: 700, fontSize: '12px', color: C.orange, marginBottom: '8px' }}>✅ Convite gerado! Compartilhe o link:</p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '10px', fontSize: '11px', color: C.muted, wordBreak: 'break-all' }}>{linkGerado}</div>
            <button onClick={() => copiar(linkGerado)}
              style={{ background: C.orange, color: '#000', border: 'none', borderRadius: '8px', padding: '10px 16px', fontFamily: SYNE, fontWeight: 700, fontSize: '11px', cursor: 'pointer', flexShrink: 0 }}>
              {copiado ? '✓' : 'Copiar'}
            </button>
          </div>
        </div>
      )}

      {/* Formulário */}
      {showForm && (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '16px', marginBottom: '16px' }}>
          <p style={{ fontFamily: SYNE, fontWeight: 700, fontSize: '13px', color: C.orange, marginBottom: '14px' }}>Novo membro</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { name: 'nome', label: 'Nome completo *', placeholder: 'Ex: João Silva' },
              { name: 'email', label: 'Email *', placeholder: 'joao@email.com' },
              { name: 'whatsapp', label: 'WhatsApp (para enviar convite)', placeholder: '(34) 99999-9999' },
            ].map(f => (
              <div key={f.name}>
                <label style={{ fontSize: '10px', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.8px' }}>{f.label}</label>
                <input name={f.name} value={(form as any)[f.name]} onChange={handle} placeholder={f.placeholder}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, borderRadius: '10px', padding: '11px', color: C.text, fontSize: '13px', marginTop: '4px', boxSizing: 'border-box' as const }} />
              </div>
            ))}
            <div>
              <label style={{ fontSize: '10px', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Perfil de acesso *</label>
              <select name="perfil" value={form.perfil} onChange={handle}
                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, borderRadius: '10px', padding: '11px', color: C.text, fontSize: '13px', marginTop: '4px' }}>
                {PERFIS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
              <button onClick={() => setShowForm(false)}
                style={{ flex: 1, background: 'transparent', border: `1px solid ${C.border}`, color: C.muted, borderRadius: '10px', padding: '12px', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={convidar} disabled={salvando}
                style={{ flex: 2, background: C.orange, color: '#000', border: 'none', borderRadius: '10px', padding: '12px', fontFamily: SYNE, fontWeight: 800, fontSize: '13px', cursor: 'pointer', opacity: salvando ? 0.7 : 1 }}>
                {salvando ? 'Enviando...' : 'Gerar convite'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <p style={{ color: C.muted, textAlign: 'center', padding: '40px' }}>Carregando...</p>
      ) : membros.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>👨‍💼</div>
          <p style={{ fontFamily: SYNE, fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Nenhum membro</p>
          <p style={{ fontSize: '13px', color: C.muted }}>Convide membros da comissão técnica</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {membros.map(m => (
            <div key={m.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontFamily: SYNE, fontWeight: 700, fontSize: '15px' }}>{m.nome}</span>
                    {!m.ativo && <span style={{ fontSize: '10px', color: '#ff5555', background: 'rgba(255,85,85,0.1)', borderRadius: '20px', padding: '2px 8px' }}>Inativo</span>}
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', color: perfilCor(m.perfil), background: `${perfilCor(m.perfil)}18`, borderRadius: '20px', padding: '2px 10px', fontWeight: 600 }}>{perfilLabel(m.perfil)}</span>
                    <span style={{ fontSize: '11px', color: C.muted, background: 'rgba(255,255,255,0.05)', borderRadius: '20px', padding: '2px 10px' }}>{m.cargo}</span>
                    <span style={{ fontSize: '11px', color: m.contaCriada ? '#4ade80' : C.gold, background: m.contaCriada ? 'rgba(74,222,128,0.1)' : 'rgba(255,215,0,0.1)', borderRadius: '20px', padding: '2px 10px' }}>
                      {m.contaCriada ? '✓ Ativo' : '⏳ Aguardando'}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: C.muted }}>{m.email}</div>
                  {m.whatsapp && <div style={{ fontSize: '12px', color: C.muted }}>{m.whatsapp}</div>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginLeft: '12px' }}>
                  {!m.contaCriada && (
                    <button onClick={() => copiar('https://gestaofc.com.br/convite/' + m.tokenConvite)}
                      style={{ background: 'rgba(255,107,0,0.15)', border: '1px solid rgba(255,107,0,0.3)', color: C.orange, borderRadius: '8px', padding: '6px 12px', fontSize: '11px', fontFamily: SYNE, fontWeight: 700, cursor: 'pointer' }}>
                      Copiar link
                    </button>
                  )}
                  <button onClick={async () => { await toggleMembroAtivo(m.id, !m.ativo); setMembros(await listarComissao() as Membro[]) }}
                    style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, color: C.muted, borderRadius: '8px', padding: '6px 12px', fontSize: '11px', cursor: 'pointer' }}>
                    {m.ativo ? 'Desativar' : 'Ativar'}
                  </button>
                  <button onClick={async () => { if (confirm('Excluir ' + m.nome + '?')) { await excluirMembro(m.id); setMembros(prev => prev.filter(x => x.id !== m.id)) } }}
                    style={{ background: 'rgba(255,85,85,0.08)', border: '1px solid rgba(255,85,85,0.2)', color: '#ff5555', borderRadius: '8px', padding: '6px 12px', fontSize: '11px', cursor: 'pointer' }}>
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-around', padding: '12px 0 20px', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(5,5,5,0.95)', backdropFilter: 'blur(10px)' }}>
        {[
          { href: '/dashboard', label: 'Inicio' },
          { href: '/atletas', label: 'Atletas' },
          { href: '/presenca', label: 'Presenca' },
          { href: '/financeiro', label: 'Financeiro' },
        ].map(item => (
          <a key={item.href} href={item.href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', textDecoration: 'none' }}>
            <span style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'rgba(255,255,255,0.4)', fontFamily: SYNE }}>{item.label}</span>
          </a>
        ))}
      </nav>
    </div>
  )
}
