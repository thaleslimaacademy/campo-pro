'use client'

import { useEffect, useState } from 'react'
import { usePerfil } from '@/lib/usePerfil'

const C = {
  bg: '#0F0F1A', surface: '#1A1A2E', surface2: '#16213E',
  orange: '#FF6B00', gold: '#FFD700', green: '#00C896',
  red: '#FF4757', text: '#F0F0F0',
  muted: 'rgba(240,240,240,0.45)', border: 'rgba(255,255,255,0.08)',
}
const SYNE = 'Syne, sans-serif'
const INTER = 'Inter, sans-serif'

const ROLES = [
  { value: 'admin',      label: 'Admin',      desc: 'Acesso total' },
  { value: 'diretor',    label: 'Diretor',    desc: 'Admin sem configurações' },
  { value: 'professor',  label: 'Professor',  desc: 'Atletas, presença, turmas, campeonatos' },
  { value: 'preparador', label: 'Preparador', desc: 'Atletas, presença, turmas' },
]

type Usuario = { id: string; nome: string; email: string; perfil: string; ativo: boolean; clerkUserId: string | null }

export default function ComissaoPage() {
  const { isAdmin, isLoaded } = usePerfil()
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ nome: '', email: '', perfil: 'professor' })
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')

  const carregar = () => {
    setLoading(true)
    fetch('/api/usuarios').then(r => r.json()).then(d => setUsuarios(d.usuarios ?? [])).finally(() => setLoading(false))
  }

  useEffect(() => { if (isLoaded) carregar() }, [isLoaded])

  const adicionar = async () => {
    setErro(''); setSucesso('')
    if (!form.nome || !form.email) return setErro('Nome e e-mail são obrigatórios')
    setSalvando(true)
    const r = await fetch('/api/usuarios', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    const d = await r.json()
    setSalvando(false)
    if (d.error) return setErro(d.error)
    setSucesso('Usuário adicionado! Ele terá acesso ao fazer login com este e-mail.')
    setForm({ nome: '', email: '', perfil: 'professor' })
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

  if (!isLoaded) return null
  if (!isAdmin) return (
    <div style={{ padding: 32, textAlign: 'center', color: C.muted, fontFamily: INTER }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
      <p>Apenas administradores podem acessar esta página.</p>
    </div>
  )

  const roleColor = (r: string) => r === 'admin' ? C.orange : r === 'diretor' ? C.gold : r === 'professor' ? C.green : C.muted

  return (
    <div style={{ padding: '24px 16px 80px', maxWidth: 600, margin: '0 auto' }}>

      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20, marginBottom: 24 }}>
        <div style={{ fontFamily: SYNE, fontWeight: 700, fontSize: 15, color: C.text, marginBottom: 16 }}>➕ Adicionar membro</div>
        <input placeholder="Nome completo" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
          style={{ width: '100%', background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 14px', color: C.text, fontFamily: INTER, fontSize: 14, marginBottom: 10, boxSizing: 'border-box' as const }} />
        <input placeholder="E-mail (usado no login Google)" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          style={{ width: '100%', background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 14px', color: C.text, fontFamily: INTER, fontSize: 14, marginBottom: 10, boxSizing: 'border-box' as const }} />
        <select value={form.perfil} onChange={e => setForm(f => ({ ...f, perfil: e.target.value }))}
          style={{ width: '100%', background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 14px', color: C.text, fontFamily: INTER, fontSize: 14, marginBottom: 14, boxSizing: 'border-box' as const }}>
          {ROLES.map(r => <option key={r.value} value={r.value}>{r.label} — {r.desc}</option>)}
        </select>
        {erro && <div style={{ color: C.red, fontSize: 12, marginBottom: 10, fontFamily: INTER }}>{erro}</div>}
        {sucesso && <div style={{ color: C.green, fontSize: 12, marginBottom: 10, fontFamily: INTER }}>{sucesso}</div>}
        <button onClick={adicionar} disabled={salvando}
          style={{ width: '100%', background: C.orange, color: '#fff', border: 'none', borderRadius: 10, padding: 12, fontFamily: SYNE, fontWeight: 700, fontSize: 14, cursor: salvando ? 'not-allowed' : 'pointer', opacity: salvando ? 0.7 : 1 }}>
          {salvando ? 'Salvando...' : 'Adicionar'}
        </button>
      </div>

      <div style={{ fontFamily: SYNE, fontWeight: 700, fontSize: 13, color: C.muted, textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 12 }}>
        Equipe ({usuarios.length})
      </div>

      {loading ? <p style={{ color: C.muted, fontFamily: INTER, fontSize: 13 }}>Carregando...</p>
        : usuarios.length === 0 ? <p style={{ color: C.muted, fontFamily: INTER, fontSize: 13 }}>Nenhum usuário cadastrado.</p>
        : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {usuarios.map(u => (
              <div key={u.id} style={{ background: C.surface, border: `1px solid ${u.ativo ? C.border : C.red + '44'}`, borderRadius: 14, padding: '14px 16px', opacity: u.ativo ? 1 : 0.55 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontFamily: SYNE, fontWeight: 700, fontSize: 14, color: C.text }}>{u.nome}</div>
                    <div style={{ fontSize: 11, color: C.muted, fontFamily: INTER, marginTop: 2 }}>{u.email}</div>
                    <div style={{ fontSize: 10, color: u.clerkUserId ? C.green : C.gold, fontFamily: INTER, marginTop: 3 }}>
                      {u.clerkUserId ? '🟢 Conta vinculada' : '⏳ Aguardando primeiro acesso'}
                    </div>
                  </div>
                  <button onClick={() => toggleAtivo(u)}
                    style={{ background: u.ativo ? C.red + '22' : C.green + '22', color: u.ativo ? C.red : C.green, border: `1px solid ${u.ativo ? C.red + '55' : C.green + '55'}`, borderRadius: 8, padding: '5px 12px', fontSize: 11, fontFamily: SYNE, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' as const }}>
                    {u.ativo ? 'Desativar' : 'Reativar'}
                  </button>
                </div>
                <select value={u.perfil} onChange={e => alterarRole(u, e.target.value)}
                  style={{ background: C.surface2, border: `1px solid ${roleColor(u.perfil)}55`, borderRadius: 8, padding: '6px 10px', color: roleColor(u.perfil), fontFamily: SYNE, fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
            ))}
          </div>
        )}
    </div>
  )
}
