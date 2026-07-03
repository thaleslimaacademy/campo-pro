'use client'
import { useState } from 'react'

type Props = { cobrancaId: string; status: string; atletaId: string; escolaId: string }

const SYNE = 'Syne, sans-serif'

export default function CobrancaAcoes({ cobrancaId, status, atletaId, escolaId }: Props) {
  const [loading, setLoading] = useState<string | null>(null)
  const [feito, setFeito]     = useState<string | null>(null)

  async function marcarPago() {
    setLoading('pago')
    await fetch('/api/cobranca/acao', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cobrancaId }) })
    setLoading(null); setFeito('pago')
    setTimeout(() => window.location.reload(), 800)
  }

  async function reenviar() {
    setLoading('reenviar')
    await fetch('/api/cobranca/acao', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cobrancaId, atletaId, escolaId }) })
    setLoading(null); setFeito('reenviar')
    setTimeout(() => setFeito(null), 3000)
  }

  async function excluir() {
    if (!confirm('Excluir esta cobrança?')) return
    setLoading('excluir')
    await fetch('/api/cobranca/acao', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cobrancaId }) })
    setLoading(null); setFeito('excluir')
    setTimeout(() => window.location.reload(), 500)
  }

  if (status === 'PAGO' || status === 'CANCELADO') return null

  const btn = (label: string, key: string, cor: string, onClick: () => void) => (
    <button key={key} onClick={onClick} disabled={!!loading}
      style={{ fontSize: 11, fontWeight: 800, padding: '7px 14px', borderRadius: 8, border: `1px solid ${cor}44`, background: `${cor}12`, color: cor, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: SYNE, opacity: loading ? 0.5 : 1, textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap' }}>
      {loading === key ? '...' : feito === key && key !== 'reenviar' ? '✓' : feito === 'reenviar' && key === 'reenviar' ? '✅ Enviado!' : label}
    </button>
  )

  return (
    <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
      {btn('✓ Pago', 'pago', '#00D67A', marcarPago)}
      {btn('📲 Reenviar', 'reenviar', '#4169E1', reenviar)}
      {btn('🗑 Excluir', 'excluir', '#FF4444', excluir)}
    </div>
  )
}
