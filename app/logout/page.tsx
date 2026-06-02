'use client'
import { useClerk } from '@clerk/nextjs'
import { useEffect } from 'react'

export default function LogoutPage() {
  const { signOut } = useClerk()

  useEffect(() => {
    signOut().then(() => {
      window.location.href = '/login'
    })
  }, [])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050505' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg,#39FF14,#00aa00)', margin: '0 auto 16px', boxShadow: '0 0 20px rgba(57,255,20,0.4)' }}></div>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Inter, sans-serif', fontSize: '14px' }}>Saindo...</p>
      </div>
    </div>
  )
}
