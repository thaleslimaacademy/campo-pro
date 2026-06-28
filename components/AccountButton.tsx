'use client'
import { UserButton, useUser } from '@clerk/nextjs'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { usePerfil } from '@/lib/usePerfil'

const SUPER_ADMINS = ['user_3EXUg6OJIqPWv0lmQFxafYkeHGR']
const SYNE = 'Syne, sans-serif'
type EscolaOpt = { id: string; nome: string }

export default function AccountButton() {
  const { user } = useUser()
  const { escolaId } = usePerfil()
  const [nomeEscola, setNomeEscola] = useState('GestãoFC')
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [escolas, setEscolas] = useState<EscolaOpt[]>([])
  const [trocando, setTrocando] = useState(false)
  const isSuperAdmin = SUPER_ADMINS.includes(user?.id || '')

  useEffect(() => {
    if (!escolaId) return
    supabase.from('Escola').select('nome, logoUrl').eq('id', escolaId).single()
      .then(({ data }) => { if (data) { setNomeEscola(data.nome); setLogoUrl(data.logoUrl) } })
  }, [escolaId])

  useEffect(() => {
    if (!isSuperAdmin || !open) return
    supabase.from('Escola').select('id, nome').order('nome')
      .then(({ data }) => { if (data) setEscolas(data) })
  }, [isSuperAdmin, open])

  async function trocarEscola(id: string) {
    setTrocando(true)
    await fetch('/api/super-admin/switch-escola', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ escolaId: id }),
    })
    setOpen(false)
    window.location.href = '/dashboard'
  }

  const nomeAbrev = nomeEscola.includes('—') ? nomeEscola.split('—').pop()?.trim() : nomeEscola

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(v => !v)}
        style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 14, padding: '8px 14px 8px 8px', cursor: 'pointer', color: '#fff' }}>
        {logoUrl
          ? <img src={logoUrl} style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'contain', background: 'white', padding: 2 }} alt="logo" />
          : <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(65,105,225,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>⚽</div>
        }
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontFamily: SYNE, fontWeight: 700, fontSize: 12, color: '#fff', lineHeight: 1.2, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nomeAbrev}</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', lineHeight: 1.2 }}>{user?.firstName ?? 'Admin'}</div>
        </div>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginLeft: 2 }}>▼</span>
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 98 }} />
          <div style={{ position: 'absolute', right: 0, top: '110%', zIndex: 99, background: '#0D1220', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 16, minWidth: 250, boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}>

            {/* Cabeçalho */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              {logoUrl
                ? <img src={logoUrl} style={{ width: 44, height: 44, borderRadius: 12, objectFit: 'contain', background: 'white', padding: 3 }} alt="logo" />
                : <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(65,105,225,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>⚽</div>
              }
              <div>
                <div style={{ fontFamily: SYNE, fontWeight: 800, fontSize: 14, color: '#F0F4FF' }}>{nomeAbrev}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{user?.primaryEmailAddress?.emailAddress}</div>
              </div>
            </div>

            {/* Trocar escola (super admin) */}
            {isSuperAdmin && escolas.length > 1 && (
              <div style={{ marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <p style={{ fontSize: 10, color: 'rgba(240,244,255,0.35)', textTransform: 'uppercase', letterSpacing: 1, fontFamily: SYNE, margin: '0 0 8px' }}>Trocar escolinha</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {escolas.map(e => {
                    const ativa = e.id === escolaId
                    return (
                      <button key={e.id} onClick={() => !ativa && !trocando && trocarEscola(e.id)} disabled={trocando || ativa}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', borderRadius: 10, border: `1px solid ${ativa ? 'rgba(65,105,225,0.4)' : 'rgba(255,255,255,0.06)'}`, background: ativa ? 'rgba(65,105,225,0.15)' : 'transparent', cursor: ativa ? 'default' : 'pointer', width: '100%', textAlign: 'left' }}>
                        <span style={{ fontSize: 13, color: ativa ? '#4169E1' : 'rgba(255,255,255,0.7)', fontWeight: ativa ? 700 : 400, fontFamily: ativa ? SYNE : 'Inter,sans-serif' }}>
                          {e.nome.includes('—') ? e.nome.split('—').pop()?.trim() : e.nome}
                        </span>
                        {ativa && <span style={{ fontSize: 9, fontWeight: 800, color: '#4169E1', background: 'rgba(65,105,225,0.15)', padding: '2px 7px', borderRadius: 4, textTransform: 'uppercase' }}>Ativa</span>}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Links */}
            {[
              { href: '/configuracoes', label: '⚙️  Configurações' },
              { href: '/financeiro/planos', label: '💎  Planos' },
              isSuperAdmin ? { href: '/super-admin', label: '⚡  Super Admin' } : null,
            ].filter(Boolean).map(item => (
              <a key={item!.href} href={item!.href} onClick={() => setOpen(false)}
                style={{ display: 'block', padding: '10px 12px', borderRadius: 10, color: 'rgba(255,255,255,0.75)', textDecoration: 'none', fontSize: 13, marginBottom: 2 }}>
                {item!.label}
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
