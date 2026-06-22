'use client'
import { useClerk } from '@clerk/nextjs'

export default function AcessoNegado() {
  const { signOut } = useClerk()
  return (<>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css" />
    <div style={{ minHeight: '100vh', background: '#0A0E1A', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#F0F0F0', fontFamily: 'Inter, sans-serif', padding: '20px', textAlign: 'center' }}>
      <div style={{ width: 80, height: 80, borderRadius: 20, background: "rgba(255,107,107,0.1)", border: "1px solid rgba(255,107,107,0.3)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}><i className="ti ti-lock" style={{ fontSize: 36, color: "#FF6B6B" }} /></div>
      <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 800, color: '#FF6B6B', marginBottom: 12 }}>Acesso não autorizado</h1>
      <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', maxWidth: 400, marginBottom: 32, lineHeight: 1.6 }}>
        Sua conta não tem permissão de acesso ao GestãoFC. Entre em contato com o administrador da sua academia.
      </p>
      <button
        onClick={() => signOut({ redirectUrl: '/home' })}
        style={{ background: '#4169E1', color: '#fff', border: 'none', borderRadius: 12, padding: '14px 28px', fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>
        Sair
      </button>
    </div>
    </>)
}
