'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { salvarBranding, uploadLogo } from './actions'
import BottomNav from '@/components/ui/BottomNav'

const T = { bg:'#0A0E1A', surface:'#0D1220', primary:'#4169E1', text:'#F0F4FF', muted:'rgba(240,244,255,0.45)', border:'rgba(240,244,255,0.08)', green:'#00D67A', red:'#FF4444' }
const SYNE = 'Syne, sans-serif'
const INTER = 'Inter, sans-serif'

const PALETAS = [
  { nome:'Azul Royal (padrão)', primary:'#4169E1', secondary:'#1A3FA8', texto:'#ffffff' },
  { nome:'Verde', primary:'#16a34a', secondary:'#15803d', texto:'#ffffff' },
  { nome:'Vermelho', primary:'#dc2626', secondary:'#b91c1c', texto:'#ffffff' },
  { nome:'Laranja', primary:'#ea580c', secondary:'#c2410c', texto:'#ffffff' },
  { nome:'Roxo', primary:'#7c3aed', secondary:'#6d28d9', texto:'#ffffff' },
  { nome:'Preto & Dourado', primary:'#ca8a04', secondary:'#a16207', texto:'#000000' },
  { nome:'Azul Marinho', primary:'#0f172a', secondary:'#1e293b', texto:'#ffffff' },
  { nome:'Rosa', primary:'#db2777', secondary:'#be185d', texto:'#ffffff' },
]

export default function BrandingPage() {
  const [escolaId, setEscolaId]       = useState<string | null>(null)
  const [nomEscola, setNomEscola]     = useState('Minha Escola')
  const [corPrimaria, setCorPrimaria] = useState('#4169E1')
  const [corSecundaria, setCorSec]   = useState('#1A3FA8')
  const [corTexto, setCorTexto]       = useState('#ffffff')
  const [logoUrl, setLogoUrl]         = useState('')
  const [previewLogo, setPreviewLogo] = useState<string | null>(null)
  const [uploadando, setUploadando]   = useState(false)
  const [salvando, setSalvando]       = useState(false)
  const [msg, setMsg]                 = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/escola-ativa').then(r => r.json()).then(d => {
      if (!d.escolaId) return
      setEscolaId(d.escolaId)
      supabase.from('Escola').select('nome, corPrimaria, corSecundaria, corTexto, logoUrl')
        .eq('id', d.escolaId).single()
        .then(({ data }) => {
          if (!data) return
          setNomEscola(data.nome || '')
          setCorPrimaria(data.corPrimaria || '#4169E1')
          setCorSec(data.corSecundaria || '#1A3FA8')
          setCorTexto(data.corTexto || '#ffffff')
          setLogoUrl(data.logoUrl || '')
        })
    })
  }, [])

  async function handleArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    // Preview local
    const reader = new FileReader()
    reader.onload = ev => setPreviewLogo(ev.target?.result as string)
    reader.readAsDataURL(file)
    // Upload
    setUploadando(true)
    const fd = new FormData()
    fd.append('logo', file)
    const res = await uploadLogo(fd)
    setUploadando(false)
    if (res.ok && res.url) {
      setLogoUrl(res.url)
      setMsg('✅ Logo enviada!')
    } else {
      setMsg('❌ Erro no upload: ' + res.error)
    }
  }

  async function salvar() {
    setSalvando(true)
    setMsg('')
    const res = await salvarBranding({ corPrimaria, corSecundaria: corSecundaria, corTexto, logoUrl })
    setMsg(res.ok ? '✅ Visual salvo com sucesso!' : '❌ ' + res.message)
    setSalvando(false)
  }

  const SEC: React.CSSProperties = { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: 18, marginBottom: 14 }
  const LBL: React.CSSProperties = { fontSize: 10, color: T.muted, textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', marginBottom: 4, fontFamily: SYNE, fontWeight: 700 }

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: INTER, paddingBottom: 80 }}>

      {/* HEADER */}
      <div style={{ background: `linear-gradient(135deg, ${corPrimaria}22 0%, #0D1220 100%)`, borderBottom: `1px solid ${corPrimaria}30`, padding: '20px 20px 20px' }}>
        <a href="/configuracoes" style={{ fontSize: 12, color: T.muted, textDecoration: 'none', display: 'block', marginBottom: 8 }}>← Configurações</a>
        <h1 style={{ fontFamily: SYNE, fontWeight: 900, fontSize: 22, color: T.text, margin: 0, textTransform: 'uppercase', letterSpacing: -0.5 }}>Visual da Escola</h1>
        <p style={{ fontSize: 12, color: T.muted, margin: '4px 0 0' }}>Cores e logo do seu app</p>
      </div>

      <div style={{ padding: '16px 16px' }}>

        {/* PREVIEW */}
        <div style={{ ...SEC, borderLeft: `3px solid ${corPrimaria}` }}>
          <p style={{ fontFamily: SYNE, fontWeight: 800, fontSize: 11, color: corPrimaria, textTransform: 'uppercase', letterSpacing: 0.8, margin: '0 0 12px' }}>Preview</p>
          <div style={{ background: '#0A0E1A', borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
            {(previewLogo || logoUrl)
              ? <img src={previewLogo || logoUrl} style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'contain', background: 'white', padding: 2 }} alt="logo" />
              : <div style={{ width: 36, height: 36, borderRadius: 8, background: `${corPrimaria}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>⚽</div>
            }
            <div>
              <p style={{ fontFamily: SYNE, fontWeight: 800, fontSize: 14, color: corPrimaria, margin: '0 0 2px', textTransform: 'uppercase' }}>{nomEscola.split('—').pop()?.trim() || nomEscola}</p>
              <p style={{ fontSize: 11, color: T.muted, margin: 0 }}>Dashboard</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <div style={{ flex: 1, background: corPrimaria, borderRadius: 8, padding: '10px', textAlign: 'center', fontFamily: SYNE, fontWeight: 700, fontSize: 12, color: corTexto }}>Botão primário</div>
            <div style={{ flex: 1, background: `${corPrimaria}20`, border: `1px solid ${corPrimaria}40`, borderRadius: 8, padding: '10px', textAlign: 'center', fontFamily: SYNE, fontWeight: 700, fontSize: 12, color: corPrimaria }}>Botão secundário</div>
          </div>
        </div>

        {/* LOGO */}
        <div style={SEC}>
          <p style={{ fontFamily: SYNE, fontWeight: 800, fontSize: 13, color: T.text, textTransform: 'uppercase', letterSpacing: 0.5, margin: '0 0 12px' }}>🖼 Logo da Escola</p>
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/jpg,image/webp" onChange={handleArquivo} style={{ display: 'none' }} />

          <div onClick={() => fileRef.current?.click()}
            style={{ border: `2px dashed ${logoUrl || previewLogo ? T.green : T.border}`, borderRadius: 12, padding: 20, textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
            {uploadando ? (
              <p style={{ color: T.muted, fontSize: 13 }}>⏳ Enviando...</p>
            ) : (previewLogo || logoUrl) ? (
              <div>
                <img src={previewLogo || logoUrl} alt="logo" style={{ maxHeight: 80, maxWidth: 200, objectFit: 'contain', borderRadius: 8, display: 'block', margin: '0 auto 10px' }} />
                <p style={{ fontSize: 12, color: T.green, margin: 0 }}>✅ Logo carregada — clique para trocar</p>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: 32, margin: '0 0 8px' }}>📁</p>
                <p style={{ fontSize: 13, color: T.text, margin: '0 0 4px', fontWeight: 600 }}>Clique para selecionar o logo</p>
                <p style={{ fontSize: 11, color: T.muted, margin: 0 }}>PNG, JPG ou WebP · máx 5MB</p>
              </div>
            )}
          </div>
        </div>

        {/* PALETAS */}
        <div style={SEC}>
          <p style={{ fontFamily: SYNE, fontWeight: 800, fontSize: 13, color: T.text, textTransform: 'uppercase', letterSpacing: 0.5, margin: '0 0 12px' }}>🎨 Paletas prontas</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {PALETAS.map(p => {
              const ativa = p.primary === corPrimaria
              return (
                <button key={p.nome} onClick={() => { setCorPrimaria(p.primary); setCorSec(p.secondary); setCorTexto(p.texto) }}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, border: `1px solid ${ativa ? p.primary : T.border}`, background: ativa ? `${p.primary}18` : 'transparent', cursor: 'pointer', textAlign: 'left' }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: p.primary, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: ativa ? p.primary : T.muted, fontWeight: ativa ? 700 : 400, fontFamily: ativa ? SYNE : INTER }}>{p.nome}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* CORES PERSONALIZADAS */}
        <div style={SEC}>
          <p style={{ fontFamily: SYNE, fontWeight: 800, fontSize: 13, color: T.text, textTransform: 'uppercase', letterSpacing: 0.5, margin: '0 0 14px' }}>✏️ Cores personalizadas</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { label: 'Cor principal', sub: 'Títulos e botões', val: corPrimaria, set: setCorPrimaria },
              { label: 'Cor secundária', sub: 'Hover e gradientes', val: corSecundaria, set: setCorSec },
            ].map(({ label, sub, val, set }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: 13, color: T.text, margin: '0 0 2px', fontWeight: 600 }}>{label}</p>
                  <p style={{ fontSize: 11, color: T.muted, margin: 0 }}>{sub}</p>
                </div>
                <input type="color" value={val} onChange={e => set(e.target.value)}
                  style={{ width: 44, height: 44, borderRadius: 10, border: `1px solid ${T.border}`, cursor: 'pointer', padding: 2, background: 'transparent' }} />
              </div>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: 13, color: T.text, margin: '0 0 2px', fontWeight: 600 }}>Texto nos botões</p>
                <p style={{ fontSize: 11, color: T.muted, margin: 0 }}>Claro ou escuro</p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {[['#ffffff','Claro'],['#000000','Escuro']].map(([c,l]) => (
                  <button key={c} onClick={() => setCorTexto(c)}
                    style={{ padding: '8px 14px', borderRadius: 8, border: `1px solid ${corTexto === c ? corPrimaria : T.border}`, background: corTexto === c ? `${corPrimaria}20` : 'transparent', color: corTexto === c ? corPrimaria : T.muted, fontFamily: SYNE, fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {msg && (
          <div style={{ background: msg.includes('✅') ? `${T.green}10` : 'rgba(255,68,68,0.1)', border: `1px solid ${msg.includes('✅') ? T.green+'30' : 'rgba(255,68,68,0.3)'}`, borderRadius: 10, padding: '11px 14px', marginBottom: 14 }}>
            <p style={{ fontSize: 13, color: msg.includes('✅') ? T.green : T.red, margin: 0 }}>{msg}</p>
          </div>
        )}

        <button onClick={salvar} disabled={salvando}
          style={{ width: '100%', background: corPrimaria, color: corTexto, padding: '15px', borderRadius: 12, fontFamily: SYNE, fontWeight: 900, fontSize: 14, border: 'none', cursor: salvando ? 'not-allowed' : 'pointer', textTransform: 'uppercase', letterSpacing: 0.5, opacity: salvando ? 0.6 : 1 }}>
          {salvando ? 'Salvando...' : '💾 Salvar Visual'}
        </button>

      </div>
      <BottomNav />
    </div>
  )
}
