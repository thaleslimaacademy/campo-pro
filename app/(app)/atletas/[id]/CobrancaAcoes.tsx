'use client'
import { useState } from 'react'

type Props = {
  cobrancaId: string
  status: string
  atletaId: string
  escolaId: string
}

export default function CobrancaAcoes({ cobrancaId, status, atletaId, escolaId }: Props) {
  const [loading, setLoading] = useState<string | null>(null)
  const [msg, setMsg] = useState('')

  async function marcarPago() {
    setLoading('pago')
    const r = await fetch('/api/cobranca/acao', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cobrancaId, acao: 'pago' }),
    })
    const d = await r.json()
    setMsg(d.error ? d.error : 'Marcado como pago!')
    setLoading(null)
    setTimeout(() => window.location.reload(), 1000)
  }

  async function reenviarCobranca() {
    setLoading('reenviar')
    const r = await fetch('/api/cobranca/acao', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cobrancaId, atletaId, escolaId, acao: 'reenviar' }),
    })
    const d = await r.json()
    setMsg(d.error ? d.error : 'Cobranca reenviada no WhatsApp!')
    setLoading(null)
  }

  if (status === 'PAGO' || status === 'CANCELADO') return null

  return (
    <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
      {msg && <span style={{ fontSize: 10, color: '#4ADE80', width: '100%' }}>{msg}</span>}
      <button
        onClick={marcarPago}
        disabled={loading === 'pago'}
        style={{ fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(74,222,128,0.4)', background: 'rgba(74,222,128,0.1)', color: '#4ADE80', cursor: 'pointer', opacity: loading === 'pago' ? 0.5 : 1 }}
      >
        {loading === 'pago' ? '...' : 'Pago'}
      </button>
      <button
        onClick={reenviarCobranca}
        disabled={loading === 'reenviar'}
        style={{ fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(0,191,255,0.4)', background: 'rgba(0,191,255,0.1)', color: '#00BFFF', cursor: 'pointer', opacity: loading === 'reenviar' ? 0.5 : 1 }}
      >
        {loading === 'reenviar' ? '...' : 'Reenviar'}
      </button>
    </div>
  )
}
