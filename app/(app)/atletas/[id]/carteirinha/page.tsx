'use client'

import { useEffect, useState, useRef, useTransition } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import QRCode from 'qrcode'
import { getCarteirinhaData, salvarLogoEscola, salvarCoresEscola } from './actions'

const SYNE = 'Syne, sans-serif'
const INTER = 'Inter, sans-serif'

const PALETA_BG = [
  { label: 'Navy', value: '#0A0E1A' },
  { label: 'Preto', value: '#000000' },
  { label: 'Branco', value: '#FFFFFF' },
  { label: 'Cinza', value: '#1C1C2E' },
  { label: 'Verde', value: '#0A1F0A' },
  { label: 'Vinho', value: '#1A0A0E' },
]

const PALETA_ACCENT = [
  { label: 'Azul', value: '#4169E1' },
  { label: 'Ciano', value: '#00BFFF' },
  { label: 'Verde', value: '#00D67A' },
  { label: 'Dourado', value: '#FFD700' },
  { label: 'Vermelho', value: '#FF4444' },
  { label: 'Roxo', value: '#8B5CF6' },
  { label: 'Laranja', value: '#FF6B35' },
  { label: 'Rosa', value: '#EC4899' },
]

const PALETA_TEXTO = [
  { label: 'Off-white', value: '#F0F4FF' },
  { label: 'Branco', value: '#FFFFFF' },
  { label: 'Preto', value: '#000000' },
  { label: 'Cinza', value: '#888888' },
]

type Atleta = { id: string; nome: string; posicao: string | null; dataNascimento: string | null; cpf: string | null; fotoUrl: string | null; tokenPais: string | null; turmaId: string | null }
type Turma  = { id: string; nome: string }
type Escola = { id: string; nome: string; cidade: string | null; estado: string | null; logoUrl: string | null; corPrimaria: string | null; corSecundaria: string | null; corTexto: string | null }

export default function Carteirinha() {
  const params = useParams()
  const id = params.id as string
  const carteirinhaRef = useRef<HTMLDivElement>(null)

  const [atleta,  setAtleta]  = useState<Atleta | null>(null)
  const [turma,   setTurma]   = useState<Turma | null>(null)
  const [escola,  setEscola]  = useState<Escola | null>(null)
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [editando, setEditando] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [, startSave] = useTransition()

  // Cores editáveis (iniciam com os valores da escola)
  const [bgColor,     setBgColor]     = useState('#0A0E1A')
  const [accentColor, setAccentColor] = useState('#4169E1')
  const [textColor,   setTextColor]   = useState('#F0F4FF')
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  const numero = id.slice(0, 8).toUpperCase()

  useEffect(() => {
    async function carregar() {
      const d = await getCarteirinhaData(id)
      setAtleta(d.atleta as Atleta)
      setTurma(d.turma as Turma | null)
      setEscola(d.escola as Escola)
      if (d.escola) {
        setBgColor(d.escola.corPrimaria || '#0A0E1A')
        setAccentColor(d.escola.corSecundaria || '#4169E1')
        setTextColor(d.escola.corTexto || '#F0F4FF')
        setLogoPreview(d.escola.logoUrl || null)
      }
      if (d.atleta?.tokenPais) {
        const qr = await QRCode.toDataURL('https://gestaofc.com.br/pais/' + d.atleta.tokenPais, { width: 120, margin: 1 })
        setQrCodeUrl(qr)
      }
      setLoading(false)
    }
    carregar()
  }, [id])

  async function uploadLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !escola) return
    setUploadingLogo(true)
    const ext = file.name.split('.').pop()
    const path = `${escola.id}/logo.${ext}`
    const { error } = await supabase.storage.from('escolas').upload(path, file, { upsert: true })
    if (error) { alert('Erro: ' + error.message); setUploadingLogo(false); return }
    const { data } = supabase.storage.from('escolas').getPublicUrl(path)
    const url = data.publicUrl + '?t=' + Date.now()
    await salvarLogoEscola(url)
    setLogoPreview(url)
    setEscola(prev => prev ? { ...prev, logoUrl: url } : prev)
    setUploadingLogo(false)
  }

  function salvarCores() {
    startSave(async () => {
      await salvarCoresEscola(bgColor, accentColor, textColor)
      setEscola(prev => prev ? { ...prev, corPrimaria: bgColor, corSecundaria: accentColor, corTexto: textColor } : prev)
      setEditando(false)
    })
  }

  function imprimir() {
    const conteudo = carteirinhaRef.current
    if (!conteudo) return
    const janela = window.open('', '_blank', 'width=400,height=300')
    if (!janela) return
    janela.document.write(
      '<!DOCTYPE html><html><head><title>Carteirinha - ' + atleta?.nome + '</title>' +
      '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=Inter:wght@400;600&display=swap">' +
      '<style>* { margin: 0; padding: 0; box-sizing: border-box; } @page { size: 85.6mm 54mm; margin: 0; } body { width: 85.6mm; height: 54mm; overflow: hidden; }</style>' +
      '</head><body>' + conteudo.outerHTML + '</body></html>'
    )
    janela.document.close()
    setTimeout(() => { janela.print(); janela.close() }, 800)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0A0E1A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'rgba(240,244,255,0.4)', fontFamily: INTER }}>Carregando...</p>
    </div>
  )
  if (!atleta) return (
    <div style={{ minHeight: '100vh', background: '#0A0E1A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'rgba(240,244,255,0.4)', fontFamily: INTER }}>Atleta não encontrado.</p>
    </div>
  )

  const nascimento = atleta.dataNascimento
    ? new Date(atleta.dataNascimento.includes('T') ? atleta.dataNascimento : atleta.dataNascimento + 'T12:00:00').toLocaleDateString('pt-BR')
    : null

  const validade = new Date()
  validade.setFullYear(validade.getFullYear() + 1)
  const validadeStr = validade.toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' })

  const isDark = bgColor === '#FFFFFF' || bgColor === '#F0F4FF' ? false : true
  const borderColor = accentColor + '44'
  const mutedColor = textColor + '70'
  const escola_nome = escola?.nome || 'GESTÃO FC'
  const cidade_estado = escola?.cidade && escola?.estado ? `${escola.cidade} - ${escola.estado}` : 'Iturama - MG'

  return (
    <div style={{ minHeight: '100vh', background: '#0A0E1A', color: '#F0F4FF', fontFamily: INTER, paddingBottom: 80 }}>

      {/* HEADER */}
      <div style={{ background: '#4169E1', padding: '20px 20px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 10, color: 'rgba(240,244,255,0.65)', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 700, marginBottom: 4 }}>Atleta</div>
            <div style={{ fontFamily: SYNE, fontWeight: 900, fontSize: 22, color: '#F0F4FF', letterSpacing: -0.5, textTransform: 'uppercase' }}>🪪 Carteirinha</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setEditando(!editando)} style={{ background: 'rgba(240,244,255,0.15)', border: '1px solid rgba(240,244,255,0.2)', color: '#F0F4FF', borderRadius: 8, padding: '8px 14px', fontFamily: SYNE, fontWeight: 700, fontSize: 11, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {editando ? 'Fechar' : '✏️ Editar'}
            </button>
            <button onClick={imprimir} style={{ background: '#F0F4FF', color: '#4169E1', borderRadius: 8, padding: '8px 14px', fontFamily: SYNE, fontWeight: 800, fontSize: 11, border: 'none', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              🖨️ Imprimir
            </button>
          </div>
        </div>
      </div>

      {/* PAINEL DE EDIÇÃO */}
      {editando && (
        <div style={{ margin: '16px 20px', background: '#0D1220', border: '1px solid rgba(65,105,225,0.2)', borderLeft: '3px solid #4169E1', borderRadius: 8, padding: 16 }}>
          <p style={{ fontFamily: SYNE, fontWeight: 800, fontSize: 12, color: '#4169E1', marginBottom: 14, textTransform: 'uppercase', letterSpacing: 0.5 }}>Personalizar carteirinha</p>

          {/* LOGO */}
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 10, color: 'rgba(240,244,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>Logo da escolinha</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" style={{ width: 64, height: 64, objectFit: 'contain', background: '#fff', borderRadius: 8, padding: 4 }} />
              ) : (
                <div style={{ width: 64, height: 64, background: '#121A2E', border: '1px dashed rgba(65,105,225,0.4)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>⚽</div>
              )}
              <label style={{ background: '#4169E1', color: '#F0F4FF', borderRadius: 6, padding: '8px 14px', fontFamily: SYNE, fontWeight: 700, fontSize: 11, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {uploadingLogo ? 'Enviando...' : 'Escolher logo'}
                <input type="file" accept="image/*" onChange={uploadLogo} style={{ display: 'none' }} disabled={uploadingLogo} />
              </label>
              <p style={{ fontSize: 10, color: 'rgba(240,244,255,0.35)' }}>PNG ou SVG recomendado</p>
            </div>
          </div>

          {/* COR DE FUNDO */}
          <div style={{ marginBottom: 14 }}>
            <p style={{ fontSize: 10, color: 'rgba(240,244,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>Cor de fundo</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              {PALETA_BG.map(c => (
                <button key={c.value} onClick={() => setBgColor(c.value)} title={c.label}
                  style={{ width: 32, height: 32, borderRadius: 6, background: c.value, border: bgColor === c.value ? '2px solid #00BFFF' : '1px solid rgba(240,244,255,0.15)', cursor: 'pointer', transition: 'border 0.15s' }} />
              ))}
              <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} title="Cor personalizada"
                style={{ width: 32, height: 32, borderRadius: 6, border: '1px solid rgba(240,244,255,0.2)', cursor: 'pointer', padding: 2, background: 'transparent' }} />
            </div>
          </div>

          {/* COR DE DESTAQUE */}
          <div style={{ marginBottom: 14 }}>
            <p style={{ fontSize: 10, color: 'rgba(240,244,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>Cor de destaque</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              {PALETA_ACCENT.map(c => (
                <button key={c.value} onClick={() => setAccentColor(c.value)} title={c.label}
                  style={{ width: 32, height: 32, borderRadius: 6, background: c.value, border: accentColor === c.value ? '2px solid #fff' : '1px solid rgba(240,244,255,0.15)', cursor: 'pointer', transition: 'border 0.15s' }} />
              ))}
              <input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)} title="Cor personalizada"
                style={{ width: 32, height: 32, borderRadius: 6, border: '1px solid rgba(240,244,255,0.2)', cursor: 'pointer', padding: 2, background: 'transparent' }} />
            </div>
          </div>

          {/* COR DO TEXTO */}
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 10, color: 'rgba(240,244,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>Cor do texto</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              {PALETA_TEXTO.map(c => (
                <button key={c.value} onClick={() => setTextColor(c.value)} title={c.label}
                  style={{ width: 32, height: 32, borderRadius: 6, background: c.value, border: textColor === c.value ? '2px solid #00BFFF' : '1px solid rgba(240,244,255,0.15)', cursor: 'pointer', transition: 'border 0.15s' }} />
              ))}
              <input type="color" value={textColor} onChange={e => setTextColor(e.target.value)} title="Cor personalizada"
                style={{ width: 32, height: 32, borderRadius: 6, border: '1px solid rgba(240,244,255,0.2)', cursor: 'pointer', padding: 2, background: 'transparent' }} />
            </div>
          </div>

          <button onClick={salvarCores} style={{ background: '#4169E1', color: '#F0F4FF', padding: '12px 20px', borderRadius: 8, fontFamily: SYNE, fontWeight: 800, fontSize: 12, border: 'none', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 0.5, width: '100%' }}>
            Salvar configurações
          </button>
        </div>
      )}

      {/* PREVIEW */}
      <p style={{ color: 'rgba(240,244,255,0.4)', fontSize: 11, textAlign: 'center', margin: editando ? '8px 0 12px' : '16px 0 12px' }}>Preview — tamanho CNH (85.6 × 54mm)</p>

      <div style={{ display: 'flex', justifyContent: 'center', padding: '0 20px 24px' }}>
        <div ref={carteirinhaRef} style={{
          width: '85.6mm', height: '54mm',
          background: bgColor,
          borderRadius: 8,
          padding: '3.5mm',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          position: 'relative', overflow: 'hidden',
          fontFamily: 'Arial, sans-serif',
          border: `1px solid ${borderColor}`,
        }}>

          {/* Faixa topo */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: `linear-gradient(90deg, ${accentColor}, ${accentColor}88)` }} />

          {/* Círculos decorativos */}
          <div style={{ position: 'absolute', bottom: '-12mm', right: '-12mm', width: '40mm', height: '40mm', borderRadius: '50%', border: `1px solid ${accentColor}15` }} />
          <div style={{ position: 'absolute', bottom: '-20mm', right: '-20mm', width: '60mm', height: '60mm', borderRadius: '50%', border: `1px solid ${accentColor}08` }} />

          {/* HEADER DO CARD */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2mm' }}>
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" style={{ width: '12mm', height: '12mm', objectFit: 'contain', background: 'white', borderRadius: 3, padding: 2 }} />
              ) : (
                <div style={{ width: '12mm', height: '12mm', background: accentColor + '20', border: `0.5px solid ${accentColor}50`, borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>⚽</div>
              )}
              <div>
                <p style={{ color: mutedColor, fontSize: '4.5px', fontWeight: 'bold', letterSpacing: '0.8px', margin: 0 }}>ASSOCIAÇÃO ESPORTIVA</p>
                <p style={{ color: textColor, fontSize: '6px', fontWeight: 'bold', margin: '1px 0 0', letterSpacing: '0.3px' }}>{escola_nome.toUpperCase()}</p>
              </div>
            </div>
            <div style={{ background: accentColor + '20', border: `0.5px solid ${accentColor}50`, borderRadius: '3px', padding: '2px 5px', textAlign: 'center', flexShrink: 0 }}>
              <p style={{ color: mutedColor, fontSize: '3.5px', margin: 0, letterSpacing: '0.5px' }}>Nº</p>
              <p style={{ color: accentColor, fontSize: '5.5px', fontWeight: 'bold', margin: 0 }}>{numero}</p>
            </div>
          </div>

          {/* CORPO */}
          <div style={{ display: 'flex', gap: '3mm', alignItems: 'flex-start', flex: 1, marginTop: '2.5mm', position: 'relative', zIndex: 1 }}>

            {/* FOTO 4×3 */}
            <div style={{ flexShrink: 0 }}>
              {atleta.fotoUrl ? (
                <img src={atleta.fotoUrl} alt={atleta.nome}
                  style={{ width: '16mm', height: '21.3mm', objectFit: 'cover', objectPosition: 'center center', borderRadius: '3px', border: `1.5px solid ${accentColor}60` }} />
              ) : (
                <div style={{ width: '16mm', height: '21.3mm', background: accentColor + '15', borderRadius: '3px', border: `1.5px dashed ${accentColor}40`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                  <span style={{ color: accentColor, fontSize: '10px' }}>👤</span>
                  <span style={{ color: mutedColor, fontSize: '3.5px', textAlign: 'center' }}>FOTO</span>
                </div>
              )}
            </div>

            {/* DADOS */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5mm' }}>
              <div>
                <p style={{ color: textColor, fontSize: '7.5px', fontWeight: 'bold', margin: 0, lineHeight: 1.2 }}>{atleta.nome.toUpperCase()}</p>
                <p style={{ color: accentColor, fontSize: '5.5px', fontWeight: 'bold', margin: '1px 0 0', letterSpacing: '0.3px' }}>{atleta.posicao || 'Atleta'}</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5mm' }}>
                {nascimento && (
                  <div>
                    <p style={{ color: mutedColor, fontSize: '4px', margin: 0, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Nascimento</p>
                    <p style={{ color: textColor, fontSize: '5px', margin: '0.5mm 0 0', fontWeight: '600' }}>{nascimento}</p>
                  </div>
                )}
                {atleta.cpf && (
                  <div>
                    <p style={{ color: mutedColor, fontSize: '4px', margin: 0, letterSpacing: '0.5px', textTransform: 'uppercase' }}>CPF</p>
                    <p style={{ color: textColor, fontSize: '5px', margin: '0.5mm 0 0', fontWeight: '600' }}>{atleta.cpf}</p>
                  </div>
                )}
                {turma && (
                  <div>
                    <p style={{ color: mutedColor, fontSize: '4px', margin: 0, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Turma</p>
                    <p style={{ color: '#FFD700', fontSize: '5px', margin: '0.5mm 0 0', fontWeight: '700' }}>{turma.nome}</p>
                  </div>
                )}
                <div>
                  <p style={{ color: mutedColor, fontSize: '4px', margin: 0, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Validade</p>
                  <p style={{ color: textColor, fontSize: '5px', margin: '0.5mm 0 0', fontWeight: '600' }}>{validadeStr}</p>
                </div>
              </div>
            </div>

            {/* QR CODE */}
            {qrCodeUrl && (
              <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1mm' }}>
                <div style={{ background: '#fff', borderRadius: 2, padding: 2 }}>
                  <img src={qrCodeUrl} alt="QR" style={{ width: '13mm', height: '13mm', display: 'block' }} />
                </div>
                <p style={{ color: mutedColor, fontSize: '3.5px', textAlign: 'center', margin: 0 }}>Área dos Pais</p>
              </div>
            )}
          </div>

          {/* RODAPÉ */}
          <div style={{ borderTop: `0.5px solid ${textColor}15`, paddingTop: '1.5mm', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
            <p style={{ color: mutedColor, fontSize: '3.5px', margin: 0 }}>{cidade_estado} · gestaofc.com.br</p>
            <p style={{ color: accentColor, fontSize: '4.5px', fontWeight: 'bold', margin: 0, letterSpacing: '0.5px' }}>ATLETA OFICIAL</p>
          </div>
        </div>
      </div>

      <p style={{ color: 'rgba(240,244,255,0.25)', fontSize: 11, textAlign: 'center', padding: '0 24px' }}>
        No diálogo de impressão defina o tamanho como Personalizado 85.6 × 54mm ou imprima em A4 e recorte.
      </p>
    </div>
  )
}
