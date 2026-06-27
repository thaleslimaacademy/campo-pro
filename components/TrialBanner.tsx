'use client'
import { usePlano } from '@/lib/usePlano'
import Link from 'next/link'

const SYNE = 'Syne, sans-serif'
const INTER = 'Inter, sans-serif'

export default function TrialBanner() {
  const { trialAtivo, trialVencido, diasRestantes, isLoaded } = usePlano()

  if (!isLoaded) return null

  // Trial ativo — banner de contagem
  if (trialAtivo) return (
    <div style={{ background: diasRestantes <= 3 ? 'rgba(255,68,68,0.1)' : 'rgba(65,105,225,0.1)', border: `1px solid ${diasRestantes <= 3 ? 'rgba(255,68,68,0.3)' : 'rgba(65,105,225,0.3)'}`, borderRadius: 10, padding: '10px 14px', margin: '0 16px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <div>
        <p style={{ fontFamily: SYNE, fontWeight: 800, fontSize: 12, color: diasRestantes <= 3 ? '#FF4444' : '#4169E1', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {diasRestantes <= 3 ? '⚠️ ' : '🎉 '}Período de Teste ELITE
        </p>
        <p style={{ fontFamily: INTER, fontSize: 11, color: 'rgba(240,244,255,0.5)', margin: 0 }}>
          {diasRestantes === 1 ? 'Último dia!' : `${diasRestantes} dias restantes`} — todas as funcionalidades liberadas
        </p>
      </div>
      <Link href="/planos" style={{ background: '#4169E1', color: '#F0F4FF', borderRadius: 6, padding: '6px 12px', fontFamily: SYNE, fontWeight: 700, fontSize: 11, textDecoration: 'none', textTransform: 'uppercase', letterSpacing: 0.3, flexShrink: 0 }}>
        Assinar
      </Link>
    </div>
  )

  // Trial vencido — banner de urgência
  if (trialVencido) return (
    <div style={{ background: 'rgba(255,68,68,0.12)', border: '1px solid rgba(255,68,68,0.35)', borderRadius: 10, padding: '12px 14px', margin: '0 16px 12px', textAlign: 'center' }}>
      <p style={{ fontFamily: SYNE, fontWeight: 900, fontSize: 13, color: '#FF4444', margin: '0 0 6px', textTransform: 'uppercase' }}>⛔ Período de Teste Encerrado</p>
      <p style={{ fontFamily: INTER, fontSize: 12, color: 'rgba(240,244,255,0.5)', margin: '0 0 10px' }}>Assine um plano para continuar usando todas as funcionalidades.</p>
      <Link href="/planos" style={{ display: 'inline-block', background: '#4169E1', color: '#F0F4FF', borderRadius: 8, padding: '10px 20px', fontFamily: SYNE, fontWeight: 800, fontSize: 13, textDecoration: 'none', textTransform: 'uppercase' }}>
        Ver planos
      </Link>
    </div>
  )

  return null
}
