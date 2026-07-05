'use client'
import { UserButton, useUser } from '@clerk/nextjs'
import { useEffect, useState } from 'react'

const SYNE = 'Syne, sans-serif'

type EscolaOpt = { id: string; nome: string }
type EscolaAtiva = { id: string; nome: string; logoUrl: string | null }

export default function AccountButton() {
  const { user } = useUser()
  const [open, setOpen]             = useState(false)
  const [escola, setEscola]         = useState<EscolaAtiva | null>(null)
  const [escolaId, setEscolaId]     = useState<string | null>(null)
  const [escolas, setEscolas]       = useState<EscolaOpt[]>([])
  const [isSuperAdmin, setIsSuper]  = useState(false)
  const [trocando, setTrocando]     = useState<string | null>(null)
  const [carregado, setCarregado]   = useState(false)

  // Carrega escola ativa da API server-side — respeita cookie
  function carregar() {
    fetch('/api/escola-ativa')
      .then(r => r.json())
      .then(d => {
        setEscolaId(d.escolaId)
        setEscola(d.escola)
        setEscolas(d.todasEscolas || [])
        setIsSuper(d.isSuperAdmin)
        setCarregado(true)
      })
  }

  useEffect(() => { carregar() }, [])

  async function trocarEscola(id: string) {
    if (id === escolaId) return
    setTrocando(id)
    await fetch('/api/super-admin/switch-escola', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ escolaId: id }),
    })
    setOpen(false)
    window.location.href = '/dashboard'
  }

  const nomeAbrev = (nome: string) =>
    nome?.includes('—') ? nome.split('—').pop()?.trim() || nome : nome

  const logoUrl = escola?.logoUrl

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => { setOpen(v => !v); if (!carregado) carregar() }}
        style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 14, padding: '8px 14px 8px 8px', cursor: 'pointer', color: '#fff' }}>
        {logoUrl
          ? <img src={logoUrl} style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'contain', background: 'white', padding: 2 }} alt="logo" />
          : <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(65,105,225,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>⚽</div>
        }
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontFamily: SYNE, fontWeight: 700, fontSize: 12, color: '#fff', lineHeight: 1.2, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {escola ? nomeAbrev(escola.nome) : '...'}
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', lineHeight: 1.2 }}>{user?.firstName ?? 'Admin'}</div>
        </div>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginLeft: 2 }}>▼</span>
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 9998 }} />
          <div style={{ position: 'fixed', top: 68, right: 12, zIndex: 9999, background: '#0D1220', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 16, width: 270, maxWidth: 'calc(100vw - 24px)', boxShadow: '0 20px 60px rgba(0,0,0,0.8)' }}>

            {/* Cabeçalho */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              {logoUrl
                ? <img src={logoUrl} style={{ width: 44, height: 44, borderRadius: 12, objectFit: 'contain', background: 'white', padding: 3 }} alt="logo" />
                : <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(65,105,225,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>⚽</div>
              }
              <div>
                <div style={{ fontFamily: SYNE, fontWeight: 800, fontSize: 14, color: '#F0F4FF' }}>
                  {escola ? nomeAbrev(escola.nome) : '...'}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{user?.primaryEmailAddress?.emailAddress}</div>
              </div>
            </div>

            {/* Trocar escola */}
            {isSuperAdmin && escolas.length > 1 && (
              <div style={{ marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <p style={{ fontSize: 10, color: 'rgba(240,244,255,0.35)', textTransform: 'uppercase', letterSpacing: 1, fontFamily: SYNE, margin: '0 0 8px' }}>Trocar escolinha</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {escolas.map(e => {
                    const ativa = e.id === escolaId
                    return (
                      <button key={e.id}
                        onClick={() => !ativa && !trocando && trocarEscola(e.id)}
                        disabled={!!trocando || ativa}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 10, border: `1px solid ${ativa ? 'rgba(65,105,225,0.5)' : 'rgba(255,255,255,0.07)'}`, background: ativa ? 'rgba(65,105,225,0.18)' : 'rgba(255,255,255,0.02)', cursor: ativa ? 'default' : 'pointer', width: '100%', textAlign: 'left' }}>
                        <span style={{ fontSize: 13, color: ativa ? '#7DD3FC' : 'rgba(255,255,255,0.75)', fontWeight: ativa ? 700 : 400, fontFamily: ativa ? SYNE : 'Inter,sans-serif' }}>
                          {trocando === e.id ? 'Entrando...' : nomeAbrev(e.nome)}
                        </span>
                        {ativa && <span style={{ fontSize: 9, fontWeight: 800, color: '#4169E1', background: 'rgba(65,105,225,0.2)', padding: '2px 8px', borderRadius: 4, textTransform: 'uppercase' }}>ATIVA</span>}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Links */}
            {([
              { href: '/configuracoes', label: '⚙️  Configurações' },
              { href: '/financeiro/planos', label: '💎  Planos' },
              isSuperAdmin ? { href: '/super-admin', label: '⚡  Super Admin' } : null,
            ].filter(Boolean) as { href: string; label: string }[]).map(item => (
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
