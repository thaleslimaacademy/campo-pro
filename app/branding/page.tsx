'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { usePerfil } from '@/lib/usePerfil'
import { salvarBranding } from './actions'

const PALETAS = [
  { nome: 'Verde (padrão)', primary: '#16a34a', secondary: '#15803d', texto: '#ffffff' },
  { nome: 'Azul Royal', primary: '#1d4ed8', secondary: '#1e40af', texto: '#ffffff' },
  { nome: 'Vermelho', primary: '#dc2626', secondary: '#b91c1c', texto: '#ffffff' },
  { nome: 'Laranja', primary: '#ea580c', secondary: '#c2410c', texto: '#ffffff' },
  { nome: 'Roxo', primary: '#7c3aed', secondary: '#6d28d9', texto: '#ffffff' },
  { nome: 'Preto & Dourado', primary: '#ca8a04', secondary: '#a16207', texto: '#000000' },
  { nome: 'Azul Marinho', primary: '#0f172a', secondary: '#1e293b', texto: '#ffffff' },
  { nome: 'Rosa', primary: '#db2777', secondary: '#be185d', texto: '#ffffff' },
]

export default function BrandingPage() {
  const { escolaId, isLoaded, isAdmin } = usePerfil()
  const [corPrimaria, setCorPrimaria] = useState('#16a34a')
  const [corSecundaria, setCorSecundaria] = useState('#15803d')
  const [corTexto, setCorTexto] = useState('#ffffff')
  const [logoUrl, setLogoUrl] = useState('')
  const [nomEscola, setNomEscola] = useState('Campo Pro')
  const [salvando, setSalvando] = useState(false)
  const [resultado, setResultado] = useState('')

  // ── Tokens visuais ──
  const syne = 'Syne, sans-serif'
  const neon = '#39FF14'
  const gold = '#D4AF37'
  const bg = 'linear-gradient(160deg,#0a1a06,#050505,#111003)'
  const cardBg = 'rgba(255,255,255,0.03)'
  const cardBorder = '1px solid rgba(255,255,255,0.07)'

  useEffect(() => {
    if (!escolaId) return
    supabase.from('Escola')
      .select('nome, corPrimaria, corSecundaria, corTexto, logoUrl')
      .eq('id', escolaId).single()
      .then(({ data }) => {
        if (data) {
          setCorPrimaria(data.corPrimaria || '#16a34a')
          setCorSecundaria(data.corSecundaria || '#15803d')
          setCorTexto(data.corTexto || '#ffffff')
          setLogoUrl(data.logoUrl || '')
          setNomEscola(data.nome || 'Campo Pro')
        }
      })
  }, [escolaId])

  async function salvar() {
    setSalvando(true)
    setResultado('')
    const res = await salvarBranding({ corPrimaria, corSecundaria, corTexto, logoUrl })
    setResultado(res.ok ? '✅ Visual salvo! Recarregue o app para ver.' : '❌ ' + res.message)
    setSalvando(false)
  }

  if (!isLoaded) return (
    <div style={{ minHeight: '100vh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Inter,sans-serif' }}>Carregando...</p>
    </div>
  )

  if (!isAdmin) return (
    <div style={{ minHeight: '100vh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'rgba(255,255,255,0.4)' }}>Acesso negado</p>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: bg, color: '#F0F0F0', fontFamily: 'Inter,sans-serif', paddingBottom: '96px' }}>

      {/* ── HEADER ── */}
      <div style={{ padding: '20px 20px 0', marginBottom: '16px' }}>
        <a href="/configuracoes" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', textDecoration: 'none' }}>← Configurações</a>
        <h1 style={{ fontFamily: syne, fontWeight: 800, fontSize: '22px', color: neon, margin: '8px 0 2px' }}>Visual da Escola</h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', margin: 0 }}>Personalize as cores e logo do seu app</p>
      </div>

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

        {/* ── PREVIEW ── */}
        <div style={{ background: cardBg, border: '1px solid rgba(57,255,20,0.15)', borderRadius: '16px', padding: '16px' }}>
          <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '12px', fontFamily: syne }}>Preview</p>
          <div style={{ background: '#030712', borderRadius: '12px', padding: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }} onError={() => setLogoUrl('')} />
              ) : (
                <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: corPrimaria, color: corTexto, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '16px' }}>
                  {nomEscola.charAt(0)}
                </div>
              )}
              <div>
                <p style={{ fontWeight: 700, color: corPrimaria, margin: 0, fontSize: '14px' }}>{nomEscola}</p>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: 0 }}>segunda-feira, 1 de junho</p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
              <div style={{ background: '#111827', borderRadius: '8px', padding: '10px' }}>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', margin: '0 0 2px' }}>Alunos Ativos</p>
                <p style={{ color: '#fff', fontWeight: 800, fontSize: '20px', margin: 0 }}>42</p>
              </div>
              <div style={{ background: '#111827', borderRadius: '8px', padding: '10px' }}>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', margin: '0 0 2px' }}>Receita</p>
                <p style={{ color: corPrimaria, fontWeight: 800, fontSize: '20px', margin: 0 }}>R$6.720</p>
              </div>
            </div>
            <button style={{ width: '100%', background: corPrimaria, color: corTexto, borderRadius: '8px', padding: '8px', fontSize: '12px', fontWeight: 700, border: 'none' }}>
              Novo Atleta
            </button>
          </div>
        </div>

        {/* ── PALETAS ── */}
        <div style={{ background: cardBg, border: cardBorder, borderRadius: '16px', padding: '16px' }}>
          <p style={{ fontFamily: syne, fontWeight: 700, fontSize: '12px', color: gold, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>🎨 Paletas prontas</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {PALETAS.map(p => (
              <button
                key={p.nome}
                onClick={() => { setCorPrimaria(p.primary); setCorSecundaria(p.secondary); setCorTexto(p.texto) }}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderRadius: '10px', border: corPrimaria === p.primary ? '1px solid rgba(57,255,20,0.4)' : '1px solid rgba(255,255,255,0.07)', background: corPrimaria === p.primary ? 'rgba(57,255,20,0.06)' : 'rgba(255,255,255,0.03)', cursor: 'pointer', textAlign: 'left' }}
              >
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: p.primary, flexShrink: 0 }} />
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>{p.nome}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── CORES PERSONALIZADAS ── */}
        <div style={{ background: cardBg, border: cardBorder, borderRadius: '16px', padding: '16px' }}>
          <p style={{ fontFamily: syne, fontWeight: 700, fontSize: '12px', color: gold, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '14px' }}>🖌️ Cores personalizadas</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '13px', color: '#F0F0F0', margin: 0 }}>Cor principal</p>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', margin: '2px 0 0' }}>Títulos e botões</p>
              </div>
              <input type="color" value={corPrimaria} onChange={e => setCorPrimaria(e.target.value)} style={{ width: '44px', height: '36px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: 'none' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '13px', color: '#F0F0F0', margin: 0 }}>Cor secundária</p>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', margin: '2px 0 0' }}>Hover e gradientes</p>
              </div>
              <input type="color" value={corSecundaria} onChange={e => setCorSecundaria(e.target.value)} style={{ width: '44px', height: '36px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: 'none' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontSize: '13px', color: '#F0F0F0', margin: 0 }}>Texto nos botões</p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setCorTexto('#ffffff')}
                  style={{ padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', background: corTexto === '#ffffff' ? '#ffffff' : 'rgba(255,255,255,0.05)', color: corTexto === '#ffffff' ? '#000' : 'rgba(255,255,255,0.5)', border: corTexto === '#ffffff' ? 'none' : '1px solid rgba(255,255,255,0.1)' }}
                >
                  Claro
                </button>
                <button
                  onClick={() => setCorTexto('#000000')}
                  style={{ padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', background: corTexto === '#000000' ? '#000' : 'rgba(255,255,255,0.05)', color: corTexto === '#000000' ? '#fff' : 'rgba(255,255,255,0.5)', border: corTexto === '#000000' ? '1px solid rgba(255,255,255,0.3)' : '1px solid rgba(255,255,255,0.1)' }}
                >
                  Escuro
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── LOGO ── */}
        <div style={{ background: cardBg, border: cardBorder, borderRadius: '16px', padding: '16px' }}>
          <p style={{ fontFamily: syne, fontWeight: 700, fontSize: '12px', color: gold, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>🖼️ Logo da escola</p>
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '10px' }}>Cole o link de uma imagem (PNG ou JPG)</p>
          <input
            type="text"
            value={logoUrl}
            onChange={e => setLogoUrl(e.target.value)}
            placeholder="https://exemplo.com/logo.png"
            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px 14px', color: '#F0F0F0', fontFamily: 'Inter,sans-serif', fontSize: '13px', outline: 'none', boxSizing: 'border-box' as const }}
          />
          {logoUrl && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
              <img src={logoUrl} alt="Preview" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.15)' }} onError={() => {}} />
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>Preview da logo</span>
            </div>
          )}
        </div>

        {/* ── RESULTADO ── */}
        {resultado && (
          <div style={{ background: resultado.startsWith('✅') ? 'rgba(57,255,20,0.06)' : 'rgba(239,68,68,0.07)', border: resultado.startsWith('✅') ? '1px solid rgba(57,255,20,0.2)' : '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', padding: '12px 16px' }}>
            <p style={{ color: resultado.startsWith('✅') ? neon : '#F87171', fontSize: '13px', margin: 0, textAlign: 'center' }}>{resultado}</p>
          </div>
        )}

        {/* ── BOTÃO SALVAR ── */}
        <button
          onClick={salvar}
          disabled={salvando}
          style={{ width: '100%', background: salvando ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg,#39FF14,#2bcc0f)', color: salvando ? 'rgba(255,255,255,0.3)' : '#050505', padding: '16px', borderRadius: '14px', fontSize: '15px', fontWeight: 800, fontFamily: syne, border: 'none', cursor: salvando ? 'not-allowed' : 'pointer', boxShadow: salvando ? 'none' : '0 0 24px rgba(57,255,20,0.25)' }}
        >
          {salvando ? 'Salvando...' : '💾 Salvar Visual'}
        </button>

      </div>

      {/* ── NAV ── */}
      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-around', padding: '12px 0 20px', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(5,5,5,0.95)', backdropFilter: 'blur(10px)' }}>
        {[
          { href: '/dashboard', label: 'Inicio', icon: '🏠' },
          { href: '/atletas', label: 'Atletas', icon: '👥' },
          { href: '/presenca', label: 'Presença', icon: '✅' },
          { href: '/financeiro', label: 'Financeiro', icon: '💰' },
        ].map(item => (
          <a key={item.href} href={item.href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', textDecoration: 'none' }}>
            <span style={{ fontSize: '16px' }}>{item.icon}</span>
            <span style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'rgba(255,255,255,0.4)', fontFamily: syne }}>{item.label}</span>
          </a>
        ))}
      </nav>
    </div>
  )
}
