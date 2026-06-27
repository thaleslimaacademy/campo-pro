'use client'
import { usePlano, type Plano } from '@/lib/usePlano'
import Link from 'next/link'

const PLANO_LABEL: Record<Plano, string> = { BASICO: 'Básico', PRO: 'Pro', ELITE: 'Elite' }
const PLANO_COR:   Record<Plano, string> = { BASICO: '#7DD3FC', PRO: '#4169E1', ELITE: '#FFD700' }

interface Props { feature: string; planoMinimo: Plano; children: React.ReactNode }

export default function PlanoGate({ feature, planoMinimo, children }: Props) {
  const { temAcesso, isLoaded, trialAtivo } = usePlano()

  if (!isLoaded) return (
    <div style={{ minHeight:'60vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <p style={{ color:'rgba(240,244,255,0.4)', fontFamily:'Inter,sans-serif', fontSize:13 }}>Carregando...</p>
    </div>
  )

  if (temAcesso(feature)) return <>{children}</>

  // Trial vencido ou plano insuficiente
  const cor   = PLANO_COR[planoMinimo]
  const label = PLANO_LABEL[planoMinimo]

  return (
    <div style={{ minHeight:'70vh', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ background:'#0D1220', border:`1px solid ${cor}33`, borderRadius:20, padding:'36px 28px', maxWidth:340, textAlign:'center' }}>
        <div style={{ fontSize:48, marginBottom:16 }}>🔒</div>
        <h2 style={{ fontFamily:'Syne,sans-serif', fontWeight:900, fontSize:20, color:'#F0F4FF', marginBottom:8 }}>
          Recurso exclusivo
        </h2>
        <p style={{ color:'rgba(240,244,255,0.5)', fontFamily:'Inter,sans-serif', fontSize:13, lineHeight:1.6, marginBottom:24 }}>
          {trialAtivo
            ? `Esta funcionalidade requer o plano `
            : `Esta funcionalidade está disponível a partir do plano `}
          <strong style={{ color: cor }}>{label}</strong>.
        </p>
        <Link href="/planos" style={{ display:'block', width:'100%', padding:'14px 0', background: cor, color: planoMinimo === 'ELITE' ? '#0A0E1A' : '#fff', borderRadius:12, fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:14, textDecoration:'none', textTransform:'uppercase', letterSpacing:0.5 }}>
          Ver planos e fazer upgrade
        </Link>
        <Link href="/dashboard" style={{ display:'block', marginTop:12, color:'rgba(240,244,255,0.35)', fontFamily:'Inter,sans-serif', fontSize:13, textDecoration:'none' }}>
          Voltar ao início
        </Link>
      </div>
    </div>
  )
}
