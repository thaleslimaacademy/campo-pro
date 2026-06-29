'use client'
import { useState, useEffect } from 'react'

const T = { bg:'#0A0E1A', surface:'#0D1220', primary:'#4169E1', green:'#00D67A', gold:'#FFD700', red:'#FF4444', text:'#F0F4FF', muted:'rgba(240,244,255,0.4)', border:'rgba(240,244,255,0.08)' }
const SYNE = 'Syne, sans-serif'
const INTER = 'Inter, sans-serif'

type Status = { conectado: boolean; instancia: string | null; status: string }

export default function WhatsAppConfig() {
  const [status, setStatus]     = useState<Status | null>(null)
  const [qrCode, setQrCode]     = useState<string | null>(null)
  const [pairingCode, setPairingCode] = useState<string | null>(null)
  const [loading, setLoading]   = useState(true)
  const [conectando, setConectando] = useState(false)
  const [desconectando, setDesconectando] = useState(false)
  const [polling, setPolling]   = useState(false)

  async function verificarStatus() {
    const res = await fetch('/api/whatsapp-config')
    const data = await res.json()
    setStatus(data)
    if (data.conectado) { setQrCode(null); setPairingCode(null) }
    return data
  }

  useEffect(() => {
    verificarStatus().finally(() => setLoading(false))
  }, [])

  // Polling enquanto aguarda conexão
  useEffect(() => {
    if (!polling) return
    const timer = setInterval(async () => {
      const s = await verificarStatus()
      if (s.conectado) { setPolling(false); clearInterval(timer) }
    }, 4000)
    return () => clearInterval(timer)
  }, [polling])

  async function conectar() {
    setConectando(true)
    const res = await fetch('/api/whatsapp-config', { method: 'POST' })
    const data = await res.json()
    setQrCode(data.qrCode)
    setPairingCode(data.pairingCode)
    setConectando(false)
    setPolling(true)
  }

  async function desconectar() {
    if (!confirm('Desconectar o WhatsApp desta escola?')) return
    setDesconectando(true)
    await fetch('/api/whatsapp-config', { method: 'DELETE' })
    setPolling(false)
    await verificarStatus()
    setDesconectando(false)
  }

  if (loading) return (
    <div style={{ padding: '20px 0', textAlign: 'center' }}>
      <p style={{ color: T.muted, fontFamily: INTER, fontSize: 13 }}>Verificando conexão...</p>
    </div>
  )

  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <p style={{ fontFamily: SYNE, fontWeight: 800, fontSize: 14, color: T.text, margin: '0 0 4px' }}>📲 WhatsApp</p>
          <p style={{ fontSize: 12, color: T.muted, margin: 0 }}>Envio automático de cobranças, convocações e notificações</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: status?.conectado ? T.green : polling ? T.gold : T.red }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: status?.conectado ? T.green : polling ? T.gold : T.red, fontFamily: SYNE }}>
            {status?.conectado ? 'Conectado' : polling ? 'Aguardando...' : 'Desconectado'}
          </span>
        </div>
      </div>

      {status?.instancia && (
        <div style={{ background: `${T.primary}08`, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px', marginBottom: 14 }}>
          <p style={{ fontSize: 11, color: T.muted, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: 0.8 }}>Instância</p>
          <p style={{ fontSize: 13, color: T.text, margin: 0, fontFamily: 'monospace' }}>{status.instancia}</p>
        </div>
      )}

      {status?.conectado ? (
        <div>
          <div style={{ background: `${T.green}08`, border: `1px solid ${T.green}20`, borderRadius: 10, padding: 14, marginBottom: 14, textAlign: 'center' }}>
            <p style={{ fontFamily: SYNE, fontWeight: 700, fontSize: 13, color: T.green, margin: '0 0 4px' }}>✅ WhatsApp conectado</p>
            <p style={{ fontSize: 12, color: T.muted, margin: 0 }}>Mensagens automáticas estão sendo enviadas pelo número desta escola</p>
          </div>
          <button onClick={desconectar} disabled={desconectando}
            style={{ width: '100%', background: 'rgba(255,68,68,0.08)', border: '1px solid rgba(255,68,68,0.25)', color: T.red, padding: '11px', borderRadius: 8, fontFamily: SYNE, fontWeight: 700, fontSize: 12, cursor: 'pointer', textTransform: 'uppercase', opacity: desconectando ? 0.6 : 1 }}>
            {desconectando ? 'Desconectando...' : '🔌 Desconectar WhatsApp'}
          </button>
        </div>
      ) : qrCode ? (
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: T.muted, marginBottom: 12 }}>Abra o WhatsApp no celular → Menu → Dispositivos conectados → Conectar dispositivo → Escanear QR Code</p>
          <div style={{ background: '#fff', padding: 12, borderRadius: 12, display: 'inline-block', marginBottom: 12 }}>
            <img src={qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`} alt="QR Code WhatsApp" style={{ width: 200, height: 200, display: 'block' }} />
          </div>
          {!qrCode && pairingCode && (
            <div style={{ background: `${T.gold}10`, border: `1px solid ${T.gold}30`, borderRadius: 10, padding: 12, marginBottom: 12 }}>
              <p style={{ fontSize: 11, color: T.muted, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: 0.8 }}>Ou use o código de pareamento</p>
              <p style={{ fontFamily: 'monospace', fontSize: 20, fontWeight: 700, color: T.gold, margin: 0, letterSpacing: 4 }}>{pairingCode}</p>
            </div>
          )}
          <p style={{ fontSize: 11, color: T.muted }}>
            {polling ? '⏳ Aguardando conexão...' : 'QR Code gerado'}
          </p>
          <button onClick={conectar} style={{ marginTop: 12, background: 'transparent', border: `1px solid ${T.border}`, color: T.muted, padding: '8px 16px', borderRadius: 8, fontFamily: SYNE, fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
            🔄 Gerar novo QR Code
          </button>
        </div>
      ) : (
        <div>
          <p style={{ fontSize: 13, color: T.muted, marginBottom: 16, lineHeight: 1.6 }}>
            Conecte o WhatsApp desta escola para enviar mensagens automáticas de cobranças, convocações e notificações diretamente pelo seu número.
          </p>
          <button onClick={conectar} disabled={conectando}
            style={{ width: '100%', background: T.primary, color: T.text, padding: '13px', borderRadius: 10, fontFamily: SYNE, fontWeight: 800, fontSize: 13, border: 'none', cursor: conectando ? 'not-allowed' : 'pointer', textTransform: 'uppercase', letterSpacing: 0.5, opacity: conectando ? 0.6 : 1 }}>
            {conectando ? 'Gerando QR Code...' : '📱 Conectar WhatsApp'}
          </button>
        </div>
      )}
    </div>
  )
}
