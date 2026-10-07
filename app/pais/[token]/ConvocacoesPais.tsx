'use client'
import { useState } from 'react'
import { responderConvocacao } from './actions'

export type ConvPais = { id: string; titulo: string; data: string; horario: string; local: string; status: string }

export default function ConvocacoesPais({ token, itens, nomeAtleta }: { token: string; itens: ConvPais[]; nomeAtleta: string }) {
  const [lista, setLista] = useState(itens)
  const [ocupado, setOcupado] = useState<string | null>(null)
  if (!lista.length) return null

  async function responder(id: string, r: 'confirmado' | 'recusado') {
    setOcupado(id)
    try {
      await responderConvocacao(token, id, r)
      setLista(l => l.map(c => (c.id === id ? { ...c, status: r } : c)))
    } catch (e) { alert((e as Error).message) } finally { setOcupado(null) }
  }

  const btn = (cor: string, bg: string): React.CSSProperties => ({ flex: 1, padding: '12px', borderRadius: 10, border: 'none', background: bg, color: cor, fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: 'Syne, sans-serif' })

  return (
    <div style={{ background: '#fff', border: '1px solid #E3E8E5', borderRadius: 18, padding: 18 }}>
      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#4169E1', margin: '0 0 10px' }}>⚽ Convocações</p>
      {lista.map(c => (
        <div key={c.id} style={{ borderTop: '1px solid #EEF1EF', padding: '12px 0 4px' }}>
          <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 15, color: '#1F2937', margin: 0 }}>{c.titulo}</p>
          <p style={{ fontSize: 13, color: '#6B7280', margin: '4px 0 10px' }}>📅 {c.data} às {c.horario} · 📍 {c.local}</p>
          {c.status === 'confirmado' && <p style={{ fontSize: 13, fontWeight: 700, color: '#23874F', margin: '0 0 8px' }}>✅ Presença de {nomeAtleta.split(' ')[0]} confirmada</p>}
          {c.status === 'recusado' && <p style={{ fontSize: 13, fontWeight: 700, color: '#B91C1C', margin: '0 0 8px' }}>❌ Você avisou que {nomeAtleta.split(' ')[0]} não vai</p>}
          <div style={{ display: 'flex', gap: 8, opacity: ocupado === c.id ? 0.6 : 1 }}>
            {c.status !== 'confirmado' && <button disabled={ocupado === c.id} onClick={() => responder(c.id, 'confirmado')} style={btn('#fff', '#2EA866')}>Confirmo presença</button>}
            {c.status !== 'recusado' && <button disabled={ocupado === c.id} onClick={() => responder(c.id, 'recusado')} style={btn('#B91C1C', '#FDECEC')}>Não poderá ir</button>}
          </div>
        </div>
      ))}
    </div>
  )
}
