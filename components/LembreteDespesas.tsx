'use client'
import { useEffect, useState } from 'react'
import { diasSemLancarDespesa } from '@/app/(app)/financeiro/gestao/actions'

/** Lembrete semanal: aparece quando ninguem lanca despesa ha 7 dias ou mais. */
export default function LembreteDespesas() {
  const [dias, setDias] = useState<number | null>(null)
  useEffect(() => { diasSemLancarDespesa().then(setDias).catch(() => {}) }, [])
  if (dias == null || dias < 7) return null
  return (
    <a href="/financeiro/gestao" style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#FFFBEB', border: '1px solid #F3D58A', borderRadius: 10, padding: '10px 14px', marginBottom: 8, textDecoration: 'none' }}>
      <span style={{ fontSize: 16 }}>📌</span>
      <span style={{ fontSize: 12, color: '#7A5A12', fontWeight: 700 }}>{dias >= 999 ? 'Lance as despesas da escola para ver o financeiro completo' : `Nenhuma despesa lançada há ${dias} dias — lance os gastos da semana`}</span>
      <span style={{ fontSize: 14, color: '#7A5A12', marginLeft: 'auto' }}>›</span>
    </a>
  )
}
