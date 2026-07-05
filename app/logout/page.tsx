'use client'
import { useClerk } from '@clerk/nextjs'
import { useEffect } from 'react'

export default function LogoutPage() {
  const { signOut } = useClerk()

  useEffect(() => {
    // Limpa cookie de override de escola antes de sair
    fetch('/api/super-admin/switch-escola', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ escolaId: null }),
    }).finally(() => {
      signOut({ redirectUrl: '/login' })
    })
  }, [])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0A0E1A' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#4169E1,#1A3FA8)', margin: '0 auto 16px' }} />
        <p style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Inter, sans-serif', fontSize: 14 }}>Saindo...</p>
      </div>
    </div>
  )
}
