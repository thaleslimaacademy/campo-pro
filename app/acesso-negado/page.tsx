'use client'
import { useClerk } from '@clerk/nextjs'

export default function AcessoNegado() {
  const { signOut } = useClerk()
  return (
    <div style={{ minHeight: '100vh', background: '#0F0F1A', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#F0F0F0', fontFamily: 'Inter, sans-serif', padding: '20px', textAlign: 'center' }}>
      <div style={{ fontSize: 64, marginBottom: 24 }}>🚫</div>
      <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 800, color: '#FF6B00', marginBottom: 12 }}>Acesso não autorizado</h1>
      <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', maxWidth: 400, marginBottom: 32, lineHeight: 1.6 }}>
        Sua conta não tem acesso ao GestaoFC. Entre em contato com o administrador da sua escola para solicitar acesso.
      </p>
      <button
        onClick={() => signOut({ redirectUrl: '/login' })}
        style={{ background: '#FF6B00', color: '#000', border: 'none', borderRadius: 12, padding: '14px 28px', fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>
        Sair
      </button>
    </div>
  )
}
