'use client'
import { useEffect, useState } from 'react'

const C = {
  blue: '#4169E1', green: '#2EA866', greenDark: '#23874F', greenSoft: '#E7F5ED',
  text: '#1F2937', muted: '#6B7280', border: '#E3E8E5', warnSoft: '#FEF3C7', warn: '#B45309',
}
const SYNE = 'Syne, sans-serif'

type Estado =
  | 'carregando'
  | 'pronto'          // pode ativar
  | 'ativo'           // este celular ja recebe
  | 'negado'          // bloqueou nas configuracoes
  | 'iphone-instalar' // iPhone: precisa adicionar a tela de inicio
  | 'iphone-safari'   // iPhone fora do Safari
  | 'sem-suporte'     // navegador dentro do WhatsApp/Instagram etc.

function base64ParaUint8(b64: string) {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4)
  const raw = window.atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)))
}

type EventoInstalar = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }

export default function AtivarAvisos({ token }: { token: string }) {
  const [estado, setEstado] = useState<Estado>('carregando')
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState('')
  const [copiado, setCopiado] = useState(false)
  const [instalar, setInstalar] = useState<EventoInstalar | null>(null)

  useEffect(() => {
    const ua = navigator.userAgent
    const iphone = /iPhone|iPad|iPod/i.test(ua)
    const instalado = window.matchMedia('(display-mode: standalone)').matches
      || (navigator as Navigator & { standalone?: boolean }).standalone === true
    const temPush = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window

    const onPrompt = (e: Event) => { e.preventDefault(); setInstalar(e as EventoInstalar) }
    window.addEventListener('beforeinstallprompt', onPrompt)

    ;(async () => {
      if (iphone && !instalado) {
        const safari = /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS|Instagram|FBAN|FBAV|WhatsApp/i.test(ua)
        setEstado(safari ? 'iphone-instalar' : 'iphone-safari')
        return
      }
      if (!temPush) { setEstado('sem-suporte'); return }
      if (Notification.permission === 'denied') { setEstado('negado'); return }
      try {
        const reg = await navigator.serviceWorker.getRegistration()
        const sub = await reg?.pushManager.getSubscription()
        setEstado(sub && Notification.permission === 'granted' ? 'ativo' : 'pronto')
      } catch {
        setEstado('pronto')
      }
    })()
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  async function ativar() {
    setErro(''); setOcupado(true)
    try {
      const perm = await Notification.requestPermission()
      if (perm !== 'granted') { setEstado(perm === 'denied' ? 'negado' : 'pronto'); return }
      const reg = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready
      const chave = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
      const sub = (await reg.pushManager.getSubscription())
        || await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: base64ParaUint8(chave) })
      const r = await fetch('/api/push/subscribe', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, subscription: sub.toJSON() }),
      })
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'Falha ao salvar')
      setEstado('ativo')
    } catch (e) {
      setErro('Não foi possível ativar agora. Tente de novo em instantes.')
      console.error('push', e)
    } finally {
      setOcupado(false)
    }
  }

  async function desativar() {
    setOcupado(true)
    try {
      const reg = await navigator.serviceWorker.getRegistration()
      const sub = await reg?.pushManager.getSubscription()
      if (sub) {
        await fetch('/api/push/subscribe', {
          method: 'DELETE', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, endpoint: sub.endpoint }),
        })
        await sub.unsubscribe()
      }
      setEstado('pronto')
    } finally {
      setOcupado(false)
    }
  }

  async function copiarLink() {
    try { await navigator.clipboard.writeText(window.location.href); setCopiado(true); setTimeout(() => setCopiado(false), 2500) } catch {}
  }

  const card: React.CSSProperties = { background: '#fff', border: `1px solid ${C.border}`, borderRadius: 18, padding: 18, margin: '8px 0' }
  const titulo: React.CSSProperties = { fontFamily: SYNE, fontWeight: 800, fontSize: 16, color: C.text, margin: '0 0 4px' }
  const texto: React.CSSProperties = { fontSize: 13, color: C.muted, margin: 0, lineHeight: 1.5 }
  const botao = (cor: string, fundo: string): React.CSSProperties => ({
    width: '100%', marginTop: 14, padding: '14px 16px', borderRadius: 12, border: 'none', background: fundo, color: cor,
    fontFamily: SYNE, fontWeight: 800, fontSize: 14, cursor: ocupado ? 'not-allowed' : 'pointer', opacity: ocupado ? 0.6 : 1,
  })
  const passo = (n: number, t: React.ReactNode) => (
    <li style={{ display: 'flex', gap: 10, alignItems: 'flex-start', margin: '8px 0', fontSize: 13, color: C.text }}>
      <span style={{ flexShrink: 0, width: 22, height: 22, borderRadius: 11, background: C.blue, color: '#fff', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{n}</span>
      <span style={{ lineHeight: 1.45 }}>{t}</span>
    </li>
  )

  if (estado === 'carregando') return null

  if (estado === 'ativo') return (
    <div style={{ ...card, background: C.greenSoft, borderColor: '#BFE5CF' }}>
      <p style={{ ...titulo, color: C.greenDark }}>🔔 Avisos ativos neste celular</p>
      <p style={texto}>Comunicados, convocações e lembretes da escolinha chegam aqui como notificação.</p>
      <button onClick={desativar} disabled={ocupado} style={{ ...botao(C.muted, 'transparent'), border: `1px solid ${C.border}`, fontSize: 12, padding: 10 }}>
        Desativar neste celular
      </button>
    </div>
  )

  if (estado === 'pronto') return (
    <div style={card}>
      <p style={titulo}>🔔 Receba os avisos no celular</p>
      <p style={texto}>Comunicados, convocações e lembretes de pagamento chegam como notificação, sem depender do WhatsApp.</p>
      <button onClick={ativar} disabled={ocupado} style={botao('#fff', C.green)}>
        {ocupado ? 'Ativando…' : 'Ativar avisos no celular'}
      </button>
      {instalar && (
        <button onClick={async () => { await instalar.prompt(); setInstalar(null) }} style={{ ...botao(C.blue, '#fff'), border: `1px solid ${C.blue}` }}>
          📲 Instalar o app na tela inicial
        </button>
      )}
      {erro && <p style={{ ...texto, color: '#DC2626', marginTop: 10 }}>{erro}</p>}
    </div>
  )

  if (estado === 'iphone-instalar') return (
    <div style={card}>
      <p style={titulo}>🔔 Avisos no iPhone: 3 passos</p>
      <p style={texto}>No iPhone, os avisos só funcionam com o app adicionado à tela de início.</p>
      <ol style={{ listStyle: 'none', padding: 0, margin: '10px 0 0' }}>
        {passo(1, <>Toque no botão <b>Compartilhar</b> do Safari (quadrado com a seta para cima ⬆️).</>)}
        {passo(2, <>Escolha <b>Adicionar à Tela de Início</b> e depois <b>Adicionar</b>.</>)}
        {passo(3, <>Abra o app <b>GestãoFC Pais</b> pelo ícone e toque em <b>Ativar avisos</b>.</>)}
      </ol>
      <p style={{ ...texto, fontSize: 12, marginTop: 8 }}>Precisa do iOS 16.4 ou mais recente.</p>
    </div>
  )

  if (estado === 'iphone-safari') return (
    <div style={{ ...card, background: C.warnSoft, borderColor: '#FCD34D' }}>
      <p style={{ ...titulo, color: C.warn }}>🔔 Abra este link no Safari</p>
      <p style={texto}>No iPhone, os avisos só podem ser ativados pelo Safari. Copie o link e cole no Safari.</p>
      <button onClick={copiarLink} style={botao('#fff', C.blue)}>{copiado ? 'Link copiado ✅' : 'Copiar link'}</button>
    </div>
  )

  if (estado === 'negado') return (
    <div style={{ ...card, background: C.warnSoft, borderColor: '#FCD34D' }}>
      <p style={{ ...titulo, color: C.warn }}>🔕 Avisos bloqueados neste celular</p>
      <p style={texto}>
        Para liberar: toque no cadeado ao lado do endereço do site (ou em Configurações do app) → <b>Notificações</b> → <b>Permitir</b>.
        Depois recarregue esta página.
      </p>
    </div>
  )

  // sem-suporte: geralmente o navegador interno do WhatsApp/Instagram
  return (
    <div style={{ ...card, background: C.warnSoft, borderColor: '#FCD34D' }}>
      <p style={{ ...titulo, color: C.warn }}>🔔 Abra no Chrome para ativar os avisos</p>
      <p style={texto}>Este navegador não permite notificações. Toque nos 3 pontinhos ⋮ e escolha <b>Abrir no Chrome</b>, ou copie o link.</p>
      <button onClick={copiarLink} style={botao('#fff', C.blue)}>{copiado ? 'Link copiado ✅' : 'Copiar link'}</button>
    </div>
  )
}
