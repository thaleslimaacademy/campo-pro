'use client'
import { usePerfil } from '@/lib/usePerfil'
import AdminGuard from '@/components/AdminGuard'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { salvarConfiguracoes } from './actions'

function ConfiguracoesInner() {
  const { escolaId } = usePerfil()
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [erro, setErro] = useState('')
  const [slug, setSlug] = useState('')
  const [form, setForm] = useState({
    nome: '', telefone: '', whatsapp: '', email: '',
    endereco: '', cidade: '', estado: '', cep: '',
    valorMensalidade: '150', diaVencimento: '10',
    instagramUrl: '', facebookUrl: '',
    multaAtraso: 0, jurosAoMes: 0, valorDesconto: 0,
  })

  const syne = 'Syne, sans-serif'
  const neon = '#FF6B00'
  const gold = '#FFD700'
  const muted = 'rgba(255,255,255,0.4)'
  const card = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '16px', marginBottom: '12px' }
  const inputStyle = { width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px', color: '#F0F0F0', fontFamily: 'Inter, sans-serif', fontSize: '13px', marginTop: '4px', boxSizing: 'border-box' as const }
  const labelStyle = { fontSize: '10px', color: muted, textTransform: 'uppercase' as const, letterSpacing: '0.8px' }
  const sectionTitle = { fontFamily: syne, fontWeight: 700, fontSize: '13px', color: neon, marginBottom: '14px' }

  useEffect(() => {
    const saved = localStorage.getItem('configuracoes_saved')
    if (saved === 'true') {
      setSucesso(true)
      localStorage.removeItem('configuracoes_saved')
      setTimeout(() => setSucesso(false), 4000)
    }
    async function carregar() {
      const { data } = await supabase.from('Escola').select('*').eq('id', escolaId!).single()
      if (data) {
        setSlug(data.slug || '')
        setForm({
          nome: data.nome || '', telefone: data.telefone || '',
          whatsapp: data.whatsapp || '', email: data.email || '',
          endereco: data.endereco || '', cidade: data.cidade || '',
          estado: data.estado || '', cep: data.cep || '',
          valorMensalidade: data.valorMensalidade?.toString() || '150',
          diaVencimento: data.diaVencimento?.toString() || '10',
          instagramUrl: data.instagramUrl || '', facebookUrl: data.facebookUrl || '',
          multaAtraso: Number(data.multaAtraso || 0),
          jurosAoMes: Number(data.jurosAoMes || 0),
          valorDesconto: Number(data.valorDesconto || 0),
        })
      }
      setLoading(false)
    }
    carregar()
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  async function salvar() {
    setSalvando(true)
    setErro('')
    const result = await salvarConfiguracoes({
      nome: form.nome, telefone: form.telefone, whatsapp: form.whatsapp,
      email: form.email, endereco: form.endereco, cidade: form.cidade,
      estado: form.estado, cep: form.cep,
      valorMensalidade: parseFloat(form.valorMensalidade) || 0,
      diaVencimento: parseInt(form.diaVencimento) || 10,
      instagramUrl: form.instagramUrl, facebookUrl: form.facebookUrl,
      multaAtraso: form.multaAtraso, jurosAoMes: form.jurosAoMes,
      valorDesconto: form.valorDesconto,
    })
    setSalvando(false)
    if (!result.ok) { setErro(result.message || 'Erro ao salvar.'); return }
    localStorage.setItem('configuracoes_saved', 'true')
    window.location.reload()
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: muted, fontFamily: 'Inter, sans-serif' }}>Carregando...</p>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '80px', color: '#F0F0F0', fontFamily: 'Inter, sans-serif' }}>

      <div style={{ padding: '20px 20px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
          <a href="/dashboard" style={{ color: muted, fontSize: '13px', textDecoration: 'none' }}>Voltar</a>
          <div>
            <div style={{ fontSize: '10px', color: muted, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '2px' }}>Escola</div>
            <div style={{ fontFamily: syne, fontSize: '24px', fontWeight: 800, color: '#F0F0F0' }}>Configuracoes</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '0 20px' }}>

        {sucesso && (
          <div style={{ background: 'rgba(57,255,20,0.1)', border: '1px solid rgba(57,255,20,0.3)', borderRadius: '12px', padding: '12px', textAlign: 'center', marginBottom: '16px' }}>
            <p style={{ color: neon, fontFamily: syne, fontWeight: 800, margin: 0 }}>Configuracoes salvas!</p>
          </div>
        )}

        {erro && (
          <div style={{ background: 'rgba(255,70,70,0.1)', border: '1px solid rgba(255,70,70,0.3)', borderRadius: '12px', padding: '12px', textAlign: 'center', marginBottom: '16px' }}>
            <p style={{ color: '#ff5555', fontFamily: syne, fontWeight: 700, margin: 0 }}>{erro}</p>
          </div>
        )}

        {/* Dados da escola */}
        <div style={card}>
          <p style={sectionTitle}>Dados da Escola</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div><label style={labelStyle}>Nome da escola</label><input name="nome" value={form.nome} onChange={handleChange} style={inputStyle} /></div>
            <div><label style={labelStyle}>E-mail</label><input name="email" value={form.email} onChange={handleChange} type="email" style={inputStyle} placeholder="email@escola.com" /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div><label style={labelStyle}>Telefone</label><input name="telefone" value={form.telefone} onChange={handleChange} style={inputStyle} /></div>
              <div><label style={labelStyle}>WhatsApp</label><input name="whatsapp" value={form.whatsapp} onChange={handleChange} style={inputStyle} /></div>
            </div>
          </div>
        </div>

        {/* Endereco */}
        <div style={card}>
          <p style={sectionTitle}>Endereco</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div><label style={labelStyle}>CEP</label><input name="cep" value={form.cep} onChange={handleChange} style={inputStyle} /></div>
            <div><label style={labelStyle}>Endereco</label><input name="endereco" value={form.endereco} onChange={handleChange} style={inputStyle} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
              <div><label style={labelStyle}>Cidade</label><input name="cidade" value={form.cidade} onChange={handleChange} style={inputStyle} /></div>
              <div><label style={labelStyle}>UF</label><input name="estado" value={form.estado} onChange={handleChange} maxLength={2} style={inputStyle} /></div>
            </div>
          </div>
        </div>

        {/* Financeiro */}
        <div style={card}>
          <p style={sectionTitle}>Financeiro</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div><label style={labelStyle}>Mensalidade (R$)</label><input name="valorMensalidade" value={form.valorMensalidade} onChange={handleChange} type="number" style={inputStyle} /></div>
              <div>
                <label style={labelStyle}>Dia de vencimento</label>
                <select name="diaVencimento" value={form.diaVencimento} onChange={handleChange} style={inputStyle}>
                  {[1, 5, 10, 15, 20, 25, 30].map(d => <option key={d} value={d}>Dia {d}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              <div><label style={labelStyle}>Desconto antecip. (R$)</label><input name="valorDesconto" value={form.valorDesconto} onChange={e => setForm(p => ({...p, valorDesconto: Number(e.target.value)}))} type="number" style={inputStyle} /></div>
              <div><label style={labelStyle}>Multa atraso (R$)</label><input name="multaAtraso" value={form.multaAtraso} onChange={e => setForm(p => ({...p, multaAtraso: Number(e.target.value)}))} type="number" style={inputStyle} /></div>
              <div><label style={labelStyle}>Juros/mes (%)</label><input name="jurosAoMes" value={form.jurosAoMes} onChange={e => setForm(p => ({...p, jurosAoMes: Number(e.target.value)}))} type="number" style={inputStyle} /></div>
            </div>
          </div>
        </div>

        {/* Redes Sociais */}
        <div style={card}>
          <p style={sectionTitle}>Redes Sociais</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div><label style={labelStyle}>Instagram</label><input name="instagramUrl" value={form.instagramUrl} onChange={handleChange} style={inputStyle} placeholder="https://instagram.com/suaescola" /></div>
            <div><label style={labelStyle}>Facebook</label><input name="facebookUrl" value={form.facebookUrl} onChange={handleChange} style={inputStyle} placeholder="https://facebook.com/suaescola" /></div>
          </div>
        </div>

        {/* Links Publicos */}
        {slug && (
          <div style={{ background: 'rgba(255,107,0,0.06)', border: '1px solid rgba(255,107,0,0.2)', borderRadius: '16px', padding: '16px', marginBottom: '12px' }}>
            <p style={{ fontFamily: syne, fontWeight: 700, fontSize: '13px', color: neon, marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>🔗 Links Públicos</p>
            <p style={{ fontSize: '11px', color: muted, marginBottom: '12px' }}>Compartilhe estes links com os responsáveis e clientes.</p>
            {[
              { label: '🛍️ Loja', url: `https://gestaofc.com.br/loja/${slug}` },
              { label: '📷 Galeria', url: `https://gestaofc.com.br/galeria/${slug}` },
            ].map(({ label, url }) => (
              <div key={label} style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '10px', color: muted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>{label}</div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px 12px', fontSize: '11px', color: 'rgba(255,255,255,0.6)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{url}</div>
                  <button onClick={() => { navigator.clipboard.writeText(url) }}
                    style={{ background: 'rgba(255,107,0,0.15)', border: '1px solid rgba(255,107,0,0.3)', color: neon, borderRadius: '10px', padding: '10px 14px', fontSize: '11px', fontFamily: syne, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
                    Copiar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        {/* Botao salvar */}
        <button onClick={salvar} disabled={salvando} style={{ width: '100%', background: 'linear-gradient(135deg,#FF6B00,#00cc00)', color: '#000', padding: '16px', borderRadius: '14px', fontFamily: syne, fontWeight: 800, fontSize: '15px', border: 'none', cursor: 'pointer', boxShadow: '0 0 20px rgba(57,255,20,0.3)', marginBottom: '10px', opacity: salvando ? 0.6 : 1 }}>
          {salvando ? 'Salvando...' : 'Salvar Configuracoes'}
        </button>

        <a href="/branding" style={{ display: 'block', background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', color: '#a78bfa', padding: '14px', borderRadius: '14px', fontFamily: syne, fontWeight: 700, fontSize: '13px', textAlign: 'center', textDecoration: 'none', marginBottom: '10px' }}>
          Personalizar Visual do App
        </a>

        <a href="/mensagens-cobranca" style={{ display: 'block', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', color: '#60a5fa', padding: '14px', borderRadius: '14px', fontFamily: syne, fontWeight: 700, fontSize: '13px', textAlign: 'center', textDecoration: 'none', marginBottom: '10px' }}>
          Personalizar Mensagens WhatsApp
        </a>
      </div>

      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-around', padding: '12px 0 20px', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(5,5,5,0.95)', backdropFilter: 'blur(10px)' }}>
        {[
          { href: '/dashboard', label: 'Inicio' },
          { href: '/atletas', label: 'Atletas' },
          { href: '/presenca', label: 'Presenca' },
          { href: '/financeiro', label: 'Financeiro' },
        ].map(item => (
          <a key={item.href} href={item.href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', textDecoration: 'none' }}>
            <span style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px', color: muted, fontFamily: syne }}>{item.label}</span>
          </a>
        ))}
      </nav>
    </div>
  )
}

export default function Configuracoes(props: any) {
  return <AdminGuard><ConfiguracoesInner {...props} /></AdminGuard>
}
