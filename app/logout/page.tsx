'use client'
import { useClerk } from '@clerk/nextjs'
import { useEffect } from 'react'

export default function LogoutPage() {
  const { signOut } = useClerk()

  useEffect(() => {
    signOut().then(() => {
      window.location.href = '/home'
    })
  }, [])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0A0E1A' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg,#4169E1,#1A3FA8)', margin: '0 auto 16px', boxShadow: '0 0 20px rgba(65,105,225,0.4)' }}></div>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Inter, sans-serif', fontSize: '14px' }}>Saindo...</p>
      </div>
    </div>
  )
}
