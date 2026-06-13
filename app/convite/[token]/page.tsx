'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { supabase } from '@/lib/supabase'
import { ativarContaProfessor } from './actions'

interface Professor {
  id: string
  nome: string
  email: string
  cargo: string
  perfil: string
  escolaId: string
  ativo: boolean
  contaCriada: boolean
}

export default function Convite() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string
  const { user, isLoaded } = useUser()

  const [professor, setProfessor] = useState<Professor | null>(null)
  const [loading, setLoading] = useState(true)
  const [processando, setProcessando] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [erro, setErro] = useState('')

  // Tokens visuais
  const syne = 'Syne, sans-serif'
  const neon = '#39FF14'
  const gold = '#D4AF37'
  const bg = 'linear-gradient(160deg,#0a1a06,#050505,#111003)'
  const cardBg = 'rgba(255,255,255,0.03)'
  const cardBorder = '1px solid rgba(255,255,255,0.07)'

  useEffect(() => {
    async function carregar() {
      const { data } = await supabase
        .from('Professor')
        .select('*')
        .eq('tokenConvite', token)
        .single()
      setProfessor(data)
      setLoading(false)
    }
    carregar()
  }, [token])

  async function ativarConta() {
    if (!user || !professor) return
    setProcessando(true)
    setErro('')
    const result = await ativarContaProfessor(
      user.id,
      professor.id,
      professor.escolaId,
      professor.nome,
      professor.email,
      professor.perfil || 'professor'
    )
    if (!result.ok) {
      setErro('Erro: ' + result.message)
      setProcessando(false)
      return
    }
    setSucesso(true)
    setProcessando(false)
    setTimeout(() => { router.push('/dashboard') }, 2000)
  }

  const wrap = (children: React.ReactNode) => (
    <div style={{ minHeight: '100vh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      {children}
    </div>
  )

  // ── Loading ──
  if (loading || !isLoaded) return wrap(
    <p style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Inter,sans-serif' }}>Carregando...</p>
  )

  // ── Link inválido ──
  if (!professor) return wrap(
    <div style={{ textAlign: 'center' }}>
      <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: 'rgba(255,60,60,0.1)', border: '1px solid rgba(255,60,60,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', margin: '0 auto 16px' }}>❌</div>
      <h2 style={{ fontFamily: syne, fontWeight: 800, fontSize: '20px', color: '#F0F0F0', marginBottom: '8px' }}>Link inválido</h2>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>Este link não existe ou já foi utilizado.</p>
    </div>
  )

  // ── Conta já ativada ──
  if (professor.contaCriada) return wrap(
    <div style={{ textAlign: 'center' }}>
      <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: 'rgba(57,255,20,0.08)', border: '1px solid rgba(57,255,20,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', margin: '0 auto 16px' }}>✅</div>
      <h2 style={{ fontFamily: syne, fontWeight: 800, fontSize: '20px', color: '#F0F0F0', marginBottom: '8px' }}>Conta já ativada</h2>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginBottom: '24px' }}>Este convite já foi utilizado.</p>
      <a
        href="/dashboard"
        style={{ display: 'inline-block', background: 'linear-gradient(135deg,#39FF14,#2bcc0f)', color: '#050505', padding: '12px 28px', borderRadius: '12px', fontWeight: 800, fontSize: '14px', fontFamily: syne, textDecoration: 'none', boxShadow: '0 0 20px rgba(57,255,20,0.25)' }}
      >
        Acessar o app →
      </a>
    </div>
  )

  // ── Sucesso ──
  if (sucesso) return wrap(
    <div style={{ textAlign: 'center' }}>
      <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: 'rgba(57,255,20,0.08)', border: '1px solid rgba(57,255,20,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', margin: '0 auto 16px' }}>🎉</div>
      <h2 style={{ fontFamily: syne, fontWeight: 800, fontSize: '22px', color: neon, marginBottom: '8px' }}>Conta ativada!</h2>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>Redirecionando para o dashboard...</p>
    </div>
  )

  const loginUrl = '/login?redirect_url=' + encodeURIComponent('/convite/' + token)

  // ── Convite principal ──
  return (
    <div style={{ minHeight: '100vh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '360px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ position: 'relative', display: 'inline-block', marginBottom: '12px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(57,255,20,0.08)', border: '1px solid rgba(57,255,20,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', margin: '0 auto' }}>⚽</div>
          </div>
          <h1 style={{ fontFamily: syne, fontWeight: 800, fontSize: '18px', color: neon, margin: '0 0 6px' }}>
            Thales Lima Football Academy
          </h1>
          <span style={{ display: 'inline-block', fontSize: '11px', color: gold, background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)', borderRadius: '20px', padding: '3px 12px', letterSpacing: '0.05em' }}>
            Convite para Comissão Técnica
          </span>
        </div>

        {/* Card professor */}
        <div style={{ background: cardBg, border: '1px solid rgba(212,175,55,0.2)', borderRadius: '16px', padding: '16px', marginBottom: '20px' }}>
          <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>Você foi convidado como</p>
          <p style={{ fontFamily: syne, fontWeight: 800, fontSize: '18px', color: '#F0F0F0', margin: '0 0 4px' }}>{professor.nome}</p>
          <span style={{ display: 'inline-block', fontSize: '12px', color: gold, background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: '20px', padding: '2px 10px', fontWeight: 600 }}>
            {professor.cargo}
          </span>
        </div>

        {/* Erro */}
        {erro && (
          <div style={{ background: 'rgba(255,60,60,0.07)', border: '1px solid rgba(255,60,60,0.25)', borderRadius: '12px', padding: '12px', marginBottom: '16px' }}>
            <p style={{ color: '#ff5555', fontSize: '13px', margin: 0 }}>{erro}</p>
          </div>
        )}

        {/* Ações */}
        {!user ? (
          <div>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', textAlign: 'center', marginBottom: '16px', lineHeight: '1.5' }}>
              Para ativar seu convite, faça login ou crie sua conta
            </p>
            <a
              href={loginUrl}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', background: 'linear-gradient(135deg,#39FF14,#2bcc0f)', color: '#050505', padding: '16px', borderRadius: '14px', fontWeight: 800, fontSize: '15px', fontFamily: syne, textDecoration: 'none', boxShadow: '0 0 24px rgba(57,255,20,0.25)', boxSizing: 'border-box' }}
            >
              Fazer login ⚽
            </a>
          </div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{ background: cardBg, border: cardBorder, borderRadius: '12px', padding: '12px 16px', marginBottom: '20px' }}>
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>Logado como</p>
              <p style={{ fontFamily: syne, fontWeight: 700, fontSize: '14px', color: '#F0F0F0', margin: 0 }}>{user.emailAddresses[0]?.emailAddress}</p>
            </div>
            <button
              onClick={ativarConta}
              disabled={processando}
              style={{ width: '100%', background: processando ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg,#39FF14,#2bcc0f)', color: processando ? 'rgba(255,255,255,0.3)' : '#050505', padding: '16px', borderRadius: '14px', fontWeight: 800, fontSize: '15px', fontFamily: syne, border: 'none', cursor: processando ? 'not-allowed' : 'pointer', boxShadow: processando ? 'none' : '0 0 24px rgba(57,255,20,0.25)', transition: 'all 0.3s' }}
            >
              {processando ? 'Ativando conta...' : 'Ativar minha conta ✓'}
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
