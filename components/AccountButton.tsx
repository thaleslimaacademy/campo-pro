'use client'

import { UserButton, useUser } from '@clerk/nextjs'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { usePerfil } from '@/lib/usePerfil'

export default function AccountButton() {
  const { user } = useUser()
  const { escolaId } = usePerfil()
  const [nomeEscola, setNomeEscola] = useState('Gestão FC')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!escolaId) return
    supabase.from('Escola').select('nome').eq('id', escolaId).single()
      .then(({ data }) => { if (data) setNomeEscola(data.nome) })
  }, [escolaId])

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(v => !v)}
        style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 14, padding: '8px 14px 8px 8px', cursor: 'pointer', color: '#fff' }}>
        <img src="/gestaofc-logo.svg" style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover' }} alt="logo"
          onError={e => (e.currentTarget.style.display = 'none')} />
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 12, color: '#fff', lineHeight: 1.2 }}>{nomeEscola}</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', lineHeight: 1.2 }}>{user?.firstName ?? 'Admin'}</div>
        </div>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginLeft: 2 }}>▼</span>
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 98 }} />
          <div style={{ position: 'absolute', right: 0, top: '110%', zIndex: 99, background: '#1A1A2E', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 16, minWidth: 220, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <img src="/gestaofc-logo.svg" style={{ width: 44, height: 44, borderRadius: 12 }} alt="logo"
                onError={e => (e.currentTarget.style.display = 'none')} />
              <div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 14, color: '#fff' }}>{nomeEscola}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{user?.primaryEmailAddress?.emailAddress}</div>
              </div>
            </div>
            {[
              { href: '/configuracoes', label: '⚙️  Configurações' },
              { href: '/planos', label: '💎  Planos' },
            ].map(item => (
              <a key={item.href} href={item.href} onClick={() => setOpen(false)}
                style={{ display: 'block', padding: '10px 12px', borderRadius: 10, color: 'rgba(255,255,255,0.75)', textDecoration: 'none', fontSize: 13, marginBottom: 2 }}>
                {item.label}
              </a>
            ))}
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <UserButton />
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Gerenciar conta</span>
            </div>
            <a href="/logout" style={{ display: 'block', marginTop: 8, padding: '10px 12px', borderRadius: 10, color: '#FF4757', textDecoration: 'none', fontSize: 13 }}>
              🚪  Sair
            </a>
          </div>
        </>
      )}
    </div>
  )
}
