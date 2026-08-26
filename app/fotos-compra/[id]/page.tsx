'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

type FotoLink = { numero: number; url: string }

const T = {
  bg: '#0A0E1A', surface: '#0D1220', primary: '#4169E1', text: '#F0F4FF',
  muted: 'rgba(240,244,255,0.45)', border: 'rgba(240,244,255,0.08)', green: '#00D67A', red: '#FF4444',
}
const SYNE = 'Syne, sans-serif'
const INTER = 'Inter, sans-serif'

export default function FotosCompraPage() {
  const params = useParams()
  const id = params.id as string
  const [compradorNome, setCompradorNome] = useState('')
  const [fotos, setFotos] = useState<FotoLink[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    fetch('/api/fotos-compra?id=' + id)
      .then(async res => {
        const data = await res.json()
        if (!res.ok) { setErro(data.error || 'Erro ao carregar'); return }
        setCompradorNome(data.compradorNome || '')
        setFotos(data.fotos || [])
      })
      .catch(() => setErro('Erro ao carregar'))
      .finally(() => setLoading(false))
  }, [id])

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: INTER, padding: '24px 16px', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 480 }}>
        <h1 style={{ fontFamily: SYNE, fontWeight: 800, fontSize: 20, marginBottom: 4 }}>📷 Suas fotos</h1>
        {compradorNome && <p style={{ color: T.muted, fontSize: 13, marginBottom: 20 }}>Olá, {compradorNome.split(' ')[0]}!</p>}

        {loading && <p style={{ color: T.muted }}>Carregando...</p>}
        {erro && <p style={{ color: T.red }}>{erro}</p>}

        {!loading && !erro && fotos.length === 0 && (
          <p style={{ color: T.muted }}>Nenhuma foto encontrada.</p>
        )}

        {fotos.map(f => (
          <a
            key={f.numero}
            href={f.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12,
              padding: '14px 16px', marginBottom: 10, textDecoration: 'none', color: T.text,
            }}
          >
            <span style={{ fontFamily: SYNE, fontWeight: 700, fontSize: 13 }}>Foto {f.numero}</span>
            <span style={{ background: `${T.green}15`, color: T.green, border: `1px solid ${T.green}30`, borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 700 }}>
              ⬇️ Baixar
            </span>
          </a>
        ))}

        <p style={{ color: T.muted, fontSize: 11, marginTop: 20, textAlign: 'center' }}>
          Os links expiram 24h após abrir esta página — volte aqui e recarregue se precisar depois.
        </p>
      </div>
    </div>
  )
}
