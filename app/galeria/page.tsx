'use client'

import { useEffect, useState } from 'react'
import { listarAlbunsPublicos } from './actions'

const C = { bg: '#F6F8F7', surface: '#FFFFFF', orange: '#C2410C', gold: '#B7791F', text: '#1F2937', muted: '#6B7280', border: 'rgba(16,24,40,0.1)' }
const SYNE = 'Syne, sans-serif'

type Album = { id: string; titulo: string; descricao: string | null; dataEvento: string | null; capa: string | null }

export default function GaleriaPage() {
  const [albuns, setAlbuns] = useState<Album[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listarAlbunsPublicos().then(d => setAlbuns(d as Album[])).finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text }}>
      {/* Header */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E3E8E5', padding: '20px 20px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src="/gestaofc-logo.png" style={{ width: 40, height: 40, borderRadius: 10 }} alt="logo"
            onError={e => (e.currentTarget.style.display = 'none')} />
          <div>
            <div style={{ fontFamily: SYNE, fontWeight: 800, fontSize: 18, color: '#1F2937' }}>Galeria de Fotos</div>
            <div style={{ fontSize: 11, color: '#374151' }}>Thales Lima Football Academy</div>
          </div>
        </div>
      </div>

      <div style={{ padding: 20, maxWidth: 800, margin: '0 auto' }}>
        {loading ? (
          <p style={{ color: C.muted, textAlign: 'center', padding: 40 }}>Carregando...</p>
        ) : albuns.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📷</div>
            <p style={{ color: C.muted }}>Nenhum álbum disponível ainda.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
            {albuns.map(a => (
              <a key={a.id} href={`/galeria/${a.id}`} style={{ background: C.surface, borderRadius: 16, overflow: 'hidden', textDecoration: 'none', border: `1px solid ${C.border}`, display: 'block' }}>
                <div style={{ aspectRatio: '16/9', background: `${C.orange}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {a.capa
                    ? <img src={a.capa} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={a.titulo} />
                    : <span style={{ fontSize: 40 }}>📸</span>
                  }
                </div>
                <div style={{ padding: '14px 16px' }}>
                  <div style={{ fontFamily: SYNE, fontWeight: 700, fontSize: 15, color: C.text, marginBottom: 4 }}>{a.titulo}</div>
                  {a.descricao && <div style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>{a.descricao}</div>}
                  {a.dataEvento && <div style={{ fontSize: 11, color: C.orange }}>📅 {a.dataEvento.slice(0, 10).split('-').reverse().join('/')}</div>}
                  <div style={{ marginTop: 10, display: 'inline-block', background: `${C.orange}18`, color: C.orange, borderRadius: 8, padding: '4px 10px', fontSize: 11, fontWeight: 600 }}>
                    Ver fotos →
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}