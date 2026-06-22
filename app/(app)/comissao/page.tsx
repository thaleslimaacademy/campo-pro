'use client'

import { useEffect, useState } from 'react'
import { usePerfil } from '@/lib/usePerfil'
import { useRouter } from 'next/navigation'

const SYNE = 'Syne, sans-serif'
const INTER = 'Inter, sans-serif'
const NAVY = '#0A0E1A'
const BLUE = '#4169E1'
const CYAN = '#00BFFF'
const SKY = '#7DD3FC'
const OFF = '#F0F4FF'
const CARD = 'rgba(65,105,225,0.08)'
const BORDER = 'rgba(65,105,225,0.25)'

const ROLES = [
  { value: 'admin',      label: 'Admin',      desc: 'Acesso total', cor: '#00BFFF' },
  { value: 'diretor',    label: 'Diretor',    desc: 'Admin sem configuracoes', cor: '#7DD3FC' },
  { value: 'professor',  label: 'Professor',  desc: 'Atletas, presenca, turmas', cor: '#4ADE80' },
  { value: 'preparador', label: 'Preparador', desc: 'Atletas, presenca, turmas', cor: '#FB923C' },
]

type Usuario = { id: string; nome: string; email: string; perfil: string; ativo: boolean; clerkUserId: string | null }

export default function ComissaoPage() {
  const { isAdmin, isLoaded } = usePerfil()
  const router = useRouter()
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ nome: '', email: '', perfil: 'professor' })
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [mostrarForm, setMostrarForm] = useState(false)

  const carregar = () => {
    setLoading(true)
    fetch('/api/usuarios').then(r => r.json()).then(d => setUsuarios(d.usuarios ?? [])).finally(() => setLoading(false))
  }

  useEffect(() => { if (isLoaded) carregar() }, [isLoaded])

  const adicionar = async () => {
    setErro(''); setSucesso('')
    if (!form.nome || !form.email) return setErro('Nome e e-mail sao obrigatorios')
    setSalvando(true)
    const r = await fetch('/api/usuarios', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    const d = await r.json()
    setSalvando(false)
    if (d.error) return setErro(d.error)
    setSucesso('Membro adicionado! Ele tera acesso ao fazer login com este e-mail.')
    setForm({ nome: '', email: '', perfil: 'professor' })
    setMostrarForm(false)
    carregar()
  }

  const toggleAtivo = async (u: Usuario) => {
    await fetch('/api/usuarios', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: u.id, ativo: !u.ativo }) })
    carregar()
  }

  const alterarRole = async (u: Usuario, perfil: string) => {
    await fetch('/api/usuarios', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: u.id, perfil }) })
    carregar()
  }

  const roleColor = (r: string) => {
    const role = ROLES.find(x => x.value === r)
    return role?.cor ?? SKY
  }

  if (!isLoaded) return null

  return (
    <div style={{ minHeight: '100vh', background: NAVY, paddingBottom: 88, fontFamily: INTER, color: OFF }}>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css" />

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1A3FA8 0%, #4169E1 100%)', padding: '16px 16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => router.back()} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: OFF }}>
            <i className="ti ti-arrow-left" style={{ fontSize: 18 }} />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: SYNE, fontWeight: 700, fontSize: 18, color: OFF, textTransform: 'uppercase', letterSpacing: 1 }}>Comissao Tecnica</div>
            <div style={{ fontSize: 12, color: SKY }}>Gestao de acessos e perfis</div>
          </div>
          {isAdmin && (
            <button
              onClick={() => { setMostrarForm(!mostrarForm); setErro(''); setSucesso('') }}
              style={{ background: mostrarForm ? 'rgba(255,107,107,0.2)' : 'rgba(0,191,255,0.2)', border: mostrarForm ? '1px solid rgba(255,107,107,0.4)' : '1px solid rgba(0,191,255,0.4)', borderRadius: 8, padding: '6px 14px', color: mostrarForm ? '#FF6B6B' : CYAN, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: SYNE, display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <i className={mostrarForm ? 'ti ti-x' : 'ti ti-plus'} style={{ fontSize: 14 }} />
              {mostrarForm ? 'Fechar' : 'Adicionar'}
            </button>
          )}
        </div>
      </div>

      <div style={{ padding: '16px 16px 0' }}>

        {/* Form adicionar */}
        {isAdmin && mostrarForm && (
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderLeft: '3px solid #4169E1', borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <div style={{ fontFamily: SYNE, fontWeight: 700, fontSize: 13, color: OFF, marginBottom: 14, textTransform: 'uppercase', letterSpacing: 0.5 }}>Novo Membro</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input
                placeholder="Nome completo"
                value={form.nome}
                onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                style={{ width: '100%', background: 'rgba(65,105,225,0.1)', border: `1px solid ${BORDER}`, borderRadius: 8, padding: '10px 14px', color: OFF, fontFamily: INTER, fontSize: 14, boxSizing: 'border-box' as const, outline: 'none' }}
              />
              <input
                placeholder="E-mail (usado no login Google)"
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                style={{ width: '100%', background: 'rgba(65,105,225,0.1)', border: `1px solid ${BORDER}`, borderRadius: 8, padding: '10px 14px', color: OFF, fontFamily: INTER, fontSize: 14, boxSizing: 'border-box' as const, outline: 'none' }}
              />
              <select
                value={form.perfil}
                onChange={e => setForm(f => ({ ...f, perfil: e.target.value }))}
                style={{ width: '100%', background: 'rgba(65,105,225,0.1)', border: `1px solid ${BORDER}`, borderRadius: 8, padding: '10px 14px', color: OFF, fontFamily: INTER, fontSize: 14, boxSizing: 'border-box' as const, cursor: 'pointer' }}
              >
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label} — {r.desc}</option>)}
              </select>
              {erro && <div style={{ color: '#FF6B6B', fontSize: 12, fontFamily: INTER }}>{erro}</div>}
              {sucesso && <div style={{ color: '#4ADE80', fontSize: 12, fontFamily: INTER }}>{sucesso}</div>}
              <button
                onClick={adicionar}
                disabled={salvando}
                style={{ background: BLUE, color: '#fff', border: 'none', borderRadius: 8, padding: '12px', fontFamily: SYNE, fontWeight: 700, fontSize: 14, cursor: salvando ? 'not-allowed' : 'pointer', opacity: salvando ? 0.7 : 1, textTransform: 'uppercase', letterSpacing: 0.5 }}
              >
                {salvando ? 'Salvando...' : 'Adicionar Membro'}
              </button>
            </div>
          </div>
        )}

        {sucesso && !mostrarForm && (
          <div style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: 10, padding: '10px 14px', marginBottom: 12, fontSize: 13, color: '#4ADE80' }}>
            {sucesso}
          </div>
        )}

        {/* Lista equipe */}
        <div style={{ fontFamily: SYNE, fontWeight: 700, fontSize: 11, color: SKY, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10, opacity: 0.7 }}>
          Equipe ({usuarios.length})
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: SKY, fontSize: 13 }}>Carregando...</div>
        ) : usuarios.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'rgba(240,244,255,0.3)', fontSize: 13 }}>Nenhum membro cadastrado.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {usuarios.map(u => (
              <div
                key={u.id}
                style={{ background: CARD, border: `1px solid ${u.ativo ? BORDER : 'rgba(255,107,107,0.25)'}`, borderRadius: 12, padding: '14px 16px', opacity: u.ativo ? 1 : 0.6 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: `${roleColor(u.perfil)}22`, border: `2px solid ${roleColor(u.perfil)}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SYNE, fontWeight: 900, fontSize: 14, color: roleColor(u.perfil), flexShrink: 0 }}>
                      {u.nome.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontFamily: SYNE, fontWeight: 700, fontSize: 14, color: OFF }}>{u.nome}</div>
                      <div style={{ fontSize: 11, color: 'rgba(240,244,255,0.45)', marginTop: 1 }}>{u.email}</div>
                      <div style={{ fontSize: 10, color: u.clerkUserId && u.clerkUserId !== 'pending' ? '#4ADE80' : '#FBBF24', marginTop: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <i className={u.clerkUserId && u.clerkUserId !== 'pending' ? 'ti ti-circle-check' : 'ti ti-clock'} style={{ fontSize: 11 }} />
                        {u.clerkUserId && u.clerkUserId !== 'pending' ? 'Conta vinculada' : 'Aguardando primeiro acesso'}
                      </div>
                    </div>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => toggleAtivo(u)}
                      style={{ background: u.ativo ? 'rgba(255,107,107,0.1)' : 'rgba(74,222,128,0.1)', color: u.ativo ? '#FF6B6B' : '#4ADE80', border: `1px solid ${u.ativo ? 'rgba(255,107,107,0.3)' : 'rgba(74,222,128,0.3)'}`, borderRadius: 8, padding: '5px 12px', fontSize: 11, fontFamily: SYNE, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' as const }}
                    >
                      {u.ativo ? 'Desativar' : 'Reativar'}
                    </button>
                  )}
                </div>
                {isAdmin && (
                  <select
                    value={u.perfil}
                    onChange={e => alterarRole(u, e.target.value)}
                    style={{ background: `${roleColor(u.perfil)}11`, border: `1px solid ${roleColor(u.perfil)}44`, borderRadius: 8, padding: '6px 12px', color: roleColor(u.perfil), fontFamily: SYNE, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
                  >
                    {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                )}
                {!isAdmin && (
                  <div style={{ display: 'inline-block', background: `${roleColor(u.perfil)}11`, border: `1px solid ${roleColor(u.perfil)}44`, borderRadius: 8, padding: '5px 12px', color: roleColor(u.perfil), fontFamily: SYNE, fontWeight: 700, fontSize: 12 }}>
                    {ROLES.find(r => r.value === u.perfil)?.label ?? u.perfil}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
