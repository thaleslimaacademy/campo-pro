'use client'
import { SignUp } from '@clerk/nextjs'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function SignUpContent() {
  const params = useSearchParams()
  const plano  = params.get('plano') || 'pro'
  const periodo = params.get('periodo') || 'mensal'

  return (
    <div style={{ minHeight: '100vh', background: '#F6F8F7', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'Inter, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 480 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <img src="/icon-192.png" alt="GestãoFC" style={{ width: 56, height: 56, borderRadius: 14, display: 'block', margin: '0 auto 12px' }} />
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 900, fontSize: 24, color: '#1F2937', margin: '0 0 6px', letterSpacing: -0.5 }}>Criar conta</h1>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(0,214,122,0.1)', border: '1px solid rgba(0,214,122,0.25)', borderRadius: 20, padding: '4px 14px' }}>
            <span style={{ fontSize: 12, color: '#16A34A', fontWeight: 700 }}>🎉 15 dias grátis — plano {plano.charAt(0).toUpperCase()+plano.slice(1)}</span>
          </div>
        </div>

        <SignUp
          fallbackRedirectUrl={`/onboarding?plano=${plano}&periodo=${periodo}`}
          appearance={{
            variables: {
              colorPrimary: '#2EA866',
              colorBackground: '#FFFFFF',
              colorText: '#1F2937',
              colorInputBackground: '#F3F5F4',
              colorInputText: '#1F2937',
              borderRadius: '10px',
              fontFamily: 'Inter, sans-serif',
            },
            elements: {
              card: { border: '1px solid rgba(46,168,102,0.2)', boxShadow: '0 8px 30px rgba(16,24,40,0.08)' },
              headerTitle: { display: 'none' },
              headerSubtitle: { display: 'none' },
            }
          }}
        />

        <p style={{ textAlign: 'center', fontSize: 12, color: '#6B7280', marginTop: 16 }}>
          Já tem conta? <a href="/login" style={{ color: '#2EA866', textDecoration: 'none' }}>Entrar</a>
        </p>
      </div>
    </div>
  )
}

export default function SignUpPage() {
  return <Suspense><SignUpContent /></Suspense>
}
