'use client'
import { use, useEffect, useState } from 'react'
import { listarAlbunsPublicos, getEscolaInfo } from './actions'

const SYNE = 'Syne, sans-serif'
const INTER = 'Inter, sans-serif'
type Album = { id: string; titulo: string; descricao: string | null; dataEvento: string | null; capa: string | null }
type EscolaInfo = { id: string; nome: string; logoUrl: string | null; corPrimaria: string | null; corSecundaria: string | null; cidade: string | null }

export default function GaleriaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const [albuns, setAlbuns] = useState<Album[]>([])
  const [escola, setEscola] = useState<EscolaInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      listarAlbunsPublicos(slug),
      getEscolaInfo(slug),
    ]).then(([a, e]) => {
      setAlbuns(a as Album[])
      setEscola(e as EscolaInfo)
    }).finally(() => setLoading(false))
  }, [slug])

  const bg     = escola?.corPrimaria  || '#0A0E1A'
  const accent = escola?.corSecundaria || '#4169E1'
  const isDark = bg !== '#FFFFFF' && bg !== '#F0F4FF'
  const textCol = isDark ? '#F0F4FF' : '#0A0E1A'
  const muted   = isDark ? 'rgba(240,244,255,0.45)' : 'rgba(10,14,26,0.5)'

  return (
    <div style={{ minHeight: '100vh', background: bg, color: textCol, fontFamily: INTER }}>

      {/* HEADER */}
      <div style={{ background: `linear-gradient(135deg, ${accent}22 0%, ${bg} 100%)`, borderBottom: `1px solid ${accent}25`, padding: '20px 20px 24px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 14 }}>
          {escola?.logoUrl ? (
            <img src={escola.logoUrl} alt={escola.nome} style={{ width: 52, height: 52, borderRadius: 12, objectFit: 'contain', background: 'white', padding: 3 }} />
          ) : (
            <div style={{ width: 52, height: 52, borderRadius: 12, background: `${accent}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>📸</div>
          )}
          <div>
            <div style={{ fontFamily: SYNE, fontWeight: 900, fontSize: 20, color: accent, letterSpacing: -0.3 }}>Galeria de Fotos</div>
            <div style={{ fontSize: 12, color: muted, marginTop: 2 }}>{escola?.nome || slug} {escola?.cidade ? `· ${escola.cidade}` : ''}</div>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 20px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p style={{ color: muted, fontSize: 14 }}>Carregando álbuns...</p>
          </div>
        ) : albuns.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>📷</div>
            <p style={{ fontFamily: SYNE, fontWeight: 700, fontSize: 16, color: textCol, margin: '0 0 8px' }}>Nenhum álbum disponível ainda</p>
            <p style={{ fontSize: 13, color: muted }}>Em breve novas fotos serão publicadas aqui.</p>
          </div>
        ) : (
          <>
            <p style={{ fontSize: 11, color: muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16, fontFamily: SYNE, fontWeight: 700 }}>{albuns.length} álbum{albuns.length !== 1 ? 's' : ''}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
              {albuns.map(a => (
                <a key={a.id} href={`/galeria/${slug}/${a.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                  <div style={{ background: `${accent}08`, border: `1px solid ${accent}20`, borderRadius: 14, overflow: 'hidden', transition: 'transform 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
                    onMouseLeave={e => (e.currentTarget.style.transform = 'none')}>
                    {a.capa ? (
                      <img src={a.capa} alt={a.titulo} style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }} />
                    ) : (
                      <div style={{ width: '100%', height: 160, background: `${accent}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>📷</div>
                    )}
                    <div style={{ padding: '12px 14px 14px' }}>
                      <p style={{ fontFamily: SYNE, fontWeight: 800, fontSize: 14, color: textCol, margin: '0 0 4px', lineHeight: 1.3 }}>{a.titulo}</p>
                      {a.dataEvento && <p style={{ fontSize: 11, color: muted, margin: 0 }}>{new Date(a.dataEvento + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>}
                      {a.descricao && <p style={{ fontSize: 12, color: muted, margin: '6px 0 0', lineHeight: 1.5 }}>{a.descricao}</p>}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </>
        )}
      </div>

      <div style={{ textAlign: 'center', padding: '20px 0 32px', borderTop: `1px solid ${accent}15`, marginTop: 20 }}>
        <p style={{ fontSize: 11, color: muted }}>Powered by <span style={{ color: accent, fontWeight: 700 }}>GestãoFC</span></p>
      </div>
    </div>
  )
}
