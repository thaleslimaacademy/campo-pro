'use client'
import { usePerfil } from '@/lib/usePerfil'
import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Suspense } from 'react'

type Atleta = {
  id: string
  nome: string
  fotoUrl: string | null
  turmaId: string | null
}

function NovaMensagemForm() {
  const { escolaId } = usePerfil()
  const searchParams = useSearchParams()
  const router = useRouter()

  const tipoInicial = searchParams.get('tipo') || 'TODOS'
  const turmaIdParam = searchParams.get('turmaId') || ''
  const turmaNomeParam = searchParams.get('turmaNome') || ''

  const [tipo, setTipo] = useState(tipoInicial)
  const [titulo, setTitulo] = useState('')
  const [conteudo, setConteudo] = useState('')
  const [turmas, setTurmas] = useState<any[]>([])
  const [turmaId, setTurmaId] = useState(turmaIdParam)
  const [atletas, setAtletas] = useState<Atleta[]>([])
  const [atletasSelecionados, setAtletasSelecionados] = useState<string[]>([])
  const [enviando, setEnviando] = useState(false)
  const [resultado, setResultado] = useState<{ enviados: number; erros: number } | null>(null)

  // ── Tokens visuais ──
  const syne = 'Syne, sans-serif'
  const neon = '#FF6B00'
  const gold = '#FFD700'
  const bg = 'linear-gradient(160deg,#0F0F1A,#0F0F1A,#111003)'
  const cardBg = 'rgba(255,255,255,0.03)'
  const cardBorder = '1px solid rgba(255,255,255,0.07)'
  const inputStyle = { width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px 12px', color: '#F0F0F0', fontFamily: 'Inter,sans-serif', fontSize: '13px', marginTop: '6px', outline: 'none', boxSizing: 'border-box' as const }

  useEffect(() => {
    if (!escolaId) return
    async function carregar() {
      const { data: t } = await supabase.from('Turma').select('*').eq('escolaId', escolaId!).eq('ativa', true).order('nome')
      setTurmas(t || [])
      const { data: a } = await supabase.from('Atleta').select('id, nome, fotoUrl, turmaId').eq('escolaId', escolaId!).eq('ativo', true).order('nome')
      setAtletas(a || [])
    }
    carregar()
  }, [escolaId])

  function toggleAtleta(id: string) {
    setAtletasSelecionados(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id])
  }

  async function enviar() {
    if (!conteudo) return alert('Digite o conteúdo da mensagem')
    setEnviando(true)

    const instanceId = process.env.NEXT_PUBLIC_ZAPI_INSTANCE_ID
    const token = process.env.NEXT_PUBLIC_ZAPI_TOKEN
    const clientToken = process.env.NEXT_PUBLIC_ZAPI_CLIENT_TOKEN

    let atletasParaEnviar: string[] = []
    if (tipo === 'TODOS') atletasParaEnviar = atletas.map(a => a.id)
    else if (tipo === 'TURMA' && turmaId) atletasParaEnviar = atletas.filter(a => a.turmaId === turmaId).map(a => a.id)
    else if (tipo === 'INDIVIDUAL') atletasParaEnviar = atletasSelecionados

    if (atletasParaEnviar.length === 0) { alert('Nenhum atleta selecionado'); setEnviando(false); return }

    const { data: responsaveis } = await supabase
      .from('Responsavel').select('atletaId, whatsapp, telefone')
      .in('atletaId', atletasParaEnviar).eq('principal', true)

    let enviados = 0, erros = 0
    for (const resp of responsaveis || []) {
      const numero = (resp.whatsapp || resp.telefone || '').replace(/\D/g, '')
      if (!numero || numero.length < 10) { erros++; continue }
      const numeroFormatado = numero.startsWith('55') ? numero : '55' + numero
      try {
        await fetch(
          'https://api.z-api.io/instances/' + instanceId + '/token/' + token + '/send-text',
          { method: 'POST', headers: { 'Content-Type': 'application/json', 'Client-Token': clientToken || '' }, body: JSON.stringify({ phone: numeroFormatado, message: conteudo }) }
        )
        enviados++
      } catch { erros++ }
    }

    await supabase.from('Mensagem').insert({
      escolaId: escolaId!, titulo: titulo || null, conteudo, tipo,
      turmaId: turmaId || null, atletaIds: atletasParaEnviar, totalEnviados: enviados,
    })

    setResultado({ enviados, erros })
    setEnviando(false)
  }

  // ── Resultado ──
  if (resultado) return (
    <div style={{ minHeight: '100vh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ background: cardBg, border: resultado.enviados > 0 ? '1px solid rgba(57,255,20,0.2)' : '1px solid rgba(239,68,68,0.2)', borderRadius: '20px', padding: '32px 24px', textAlign: 'center', width: '100%', maxWidth: '360px' }}>
        <div style={{ fontSize: '56px', marginBottom: '16px' }}>{resultado.enviados > 0 ? '✅' : '❌'}</div>
        <h2 style={{ fontFamily: syne, fontWeight: 800, fontSize: '22px', color: resultado.enviados > 0 ? neon : '#F87171', marginBottom: '8px' }}>
          {resultado.enviados > 0 ? 'Mensagens enviadas!' : 'Erro no envio'}
        </h2>
        <p style={{ color: neon, fontFamily: syne, fontWeight: 700, fontSize: '18px', marginBottom: '4px' }}>{resultado.enviados} enviadas com sucesso</p>
        {resultado.erros > 0 && <p style={{ color: '#F87171', fontSize: '13px' }}>{resultado.erros} erro{resultado.erros !== 1 ? 's' : ''}</p>}
        <button
          onClick={() => router.push('/mensagens')}
          style={{ width: '100%', background: 'linear-gradient(135deg,#FF6B00,#2bcc0f)', color: '#0F0F1A', padding: '14px', borderRadius: '12px', fontSize: '14px', fontWeight: 800, fontFamily: syne, border: 'none', cursor: 'pointer', marginTop: '24px', boxShadow: '0 0 20px rgba(57,255,20,0.25)' }}
        >
          Ver histórico
        </button>
      </div>
    </div>
  )

  const atletasFiltrados = tipo === 'TURMA' && turmaId ? atletas.filter(a => a.turmaId === turmaId) : atletas
  const totalParaEnviar = tipo === 'TODOS' ? atletas.length : tipo === 'TURMA' && turmaId ? atletas.filter(a => a.turmaId === turmaId).length : atletasSelecionados.length

  return (
    <div style={{ minHeight: '100vh', background: bg, color: '#F0F0F0', fontFamily: 'Inter,sans-serif', paddingBottom: '96px' }}>

      {/* ── HEADER ── */}
      <div style={{ padding: '20px 20px 0', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <a href="/mensagens" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', textDecoration: 'none' }}>← Voltar</a>
        <h1 style={{ fontFamily: syne, fontWeight: 800, fontSize: '20px', color: '#F0F0F0', margin: 0 }}>📲 Nova Mensagem</h1>
      </div>

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

        {/* ── TIPO ── */}
        <div style={{ background: cardBg, border: cardBorder, borderRadius: '16px', padding: '16px' }}>
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '10px' }}>Enviar para</p>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[
              { value: 'TODOS', label: '📢 Todos' },
              { value: 'TURMA', label: '👥 Turma' },
              { value: 'INDIVIDUAL', label: '👤 Individual' },
            ].map(t => (
              <button
                key={t.value}
                onClick={() => setTipo(t.value)}
                style={{ flex: 1, padding: '10px 4px', borderRadius: '10px', fontSize: '11px', fontWeight: 700, fontFamily: syne, border: 'none', cursor: 'pointer', transition: 'all 0.2s', background: tipo === t.value ? 'linear-gradient(135deg,#FF6B00,#2bcc0f)' : 'rgba(255,255,255,0.05)', color: tipo === t.value ? '#0F0F1A' : 'rgba(255,255,255,0.5)' }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── SELEÇÃO TURMA ── */}
        {tipo === 'TURMA' && (
          <div style={{ background: cardBg, border: cardBorder, borderRadius: '16px', padding: '16px' }}>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>Turma</p>
            <select value={turmaId} onChange={e => setTurmaId(e.target.value)} style={{ ...inputStyle, appearance: 'none' as const }}>
              <option value="">Selecione uma turma...</option>
              {turmas.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
            </select>
            {turmaId && (
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '8px' }}>
                {atletas.filter(a => a.turmaId === turmaId).length} atletas nesta turma
              </p>
            )}
          </div>
        )}

        {/* ── SELEÇÃO INDIVIDUAL ── */}
        {tipo === 'INDIVIDUAL' && (
          <div style={{ background: cardBg, border: cardBorder, borderRadius: '16px', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.8px', margin: 0 }}>Selecionar atletas</p>
              {atletasSelecionados.length > 0 && (
                <span style={{ fontSize: '11px', color: neon, fontWeight: 700 }}>{atletasSelecionados.length} selecionado{atletasSelecionados.length !== 1 ? 's' : ''}</span>
              )}
            </div>
            <div style={{ maxHeight: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {atletas.map(a => {
                const sel = atletasSelecionados.includes(a.id)
                return (
                  <div
                    key={a.id}
                    onClick={() => toggleAtleta(a.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '10px', cursor: 'pointer', background: sel ? 'rgba(57,255,20,0.07)' : 'rgba(255,255,255,0.03)', border: sel ? '1px solid rgba(57,255,20,0.25)' : '1px solid rgba(255,255,255,0.05)', transition: 'all 0.15s' }}
                  >
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: sel ? '2px solid #FF6B00' : '2px solid rgba(255,255,255,0.2)', background: sel ? '#FF6B00' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {sel && <span style={{ color: '#0F0F1A', fontSize: '10px', fontWeight: 900 }}>✓</span>}
                    </div>
                    {a.fotoUrl
                      ? <img src={a.fotoUrl} alt={a.nome} style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                      : <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'rgba(57,255,20,0.1)', border: '1px solid rgba(57,255,20,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: neon, flexShrink: 0 }}>{a.nome[0]}</div>
                    }
                    <p style={{ fontSize: '13px', color: '#F0F0F0', margin: 0 }}>{a.nome}</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── MENSAGEM ── */}
        <div style={{ background: cardBg, border: cardBorder, borderRadius: '16px', padding: '16px' }}>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Título (opcional)</label>
            <input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ex: Aviso importante" style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Mensagem *</label>
            <textarea
              value={conteudo}
              onChange={e => setConteudo(e.target.value)}
              rows={5}
              placeholder="Digite a mensagem que será enviada via WhatsApp..."
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px 12px', color: '#F0F0F0', fontFamily: 'Inter,sans-serif', fontSize: '13px', marginTop: '6px', outline: 'none', boxSizing: 'border-box' as const, resize: 'vertical' as const }}
            />
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '4px', textAlign: 'right' as const }}>{conteudo.length} caracteres</p>
          </div>
        </div>

        {/* ── RESUMO ── */}
        <div style={{ background: totalParaEnviar > 0 ? 'rgba(57,255,20,0.04)' : 'rgba(255,255,255,0.03)', border: totalParaEnviar > 0 ? '1px solid rgba(57,255,20,0.15)' : cardBorder, borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '20px' }}>📊</span>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', margin: 0 }}>
            {tipo === 'TODOS' && ('Será enviado para ' + atletas.length + ' atletas (todos os responsáveis)')}
            {tipo === 'TURMA' && turmaId && ('Será enviado para ' + atletas.filter(a => a.turmaId === turmaId).length + ' atletas da turma')}
            {tipo === 'TURMA' && !turmaId && 'Selecione uma turma'}
            {tipo === 'INDIVIDUAL' && ('Será enviado para ' + atletasSelecionados.length + ' atleta' + (atletasSelecionados.length !== 1 ? 's' : '') + ' selecionado' + (atletasSelecionados.length !== 1 ? 's' : ''))}
          </p>
        </div>

        {/* ── BOTÃO ENVIAR ── */}
        <button
          onClick={enviar}
          disabled={enviando || !conteudo}
          style={{ width: '100%', background: (enviando || !conteudo) ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg,#FF6B00,#2bcc0f)', color: (enviando || !conteudo) ? 'rgba(255,255,255,0.3)' : '#0F0F1A', padding: '16px', borderRadius: '14px', fontSize: '15px', fontWeight: 800, fontFamily: syne, border: 'none', cursor: (enviando || !conteudo) ? 'not-allowed' : 'pointer', boxShadow: (enviando || !conteudo) ? 'none' : '0 0 24px rgba(57,255,20,0.25)', transition: 'all 0.3s' }}
        >
          {enviando ? 'Enviando...' : '📲 Enviar Mensagem'}
        </button>

      </div>

      {/* ── NAV ── */}
      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-around', padding: '12px 0 20px', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(5,5,5,0.95)', backdropFilter: 'blur(10px)' }}>
        {[
          { href: '/dashboard', label: 'Inicio', icon: '🏠' },
          { href: '/atletas', label: 'Atletas', icon: '👥' },
          { href: '/presenca', label: 'Presença', icon: '✅' },
          { href: '/financeiro', label: 'Financeiro', icon: '💰' },
        ].map(item => (
          <a key={item.href} href={item.href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', textDecoration: 'none' }}>
            <span style={{ fontSize: '16px' }}>{item.icon}</span>
            <span style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'rgba(255,255,255,0.4)', fontFamily: syne }}>{item.label}</span>
          </a>
        ))}
      </nav>
    </div>
  )
}

export default function NovaMensagem() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#0F0F1A,#0F0F1A,#111003)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Inter,sans-serif' }}>Carregando...</p>
      </div>
    }>
      <NovaMensagemForm />
    </Suspense>
  )
}
