'use client'
import { useState, useEffect } from 'react'

const SYNE = 'Syne, sans-serif'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return new Uint8Array([...rawData].map(c => c.charCodeAt(0)))
}

export default function PushNotificationButton({ atletaId, escolaId }: { atletaId: string; escolaId: string }) {
  const [inscrito, setInscrito] = useState(false)
  const [permissao, setPermissao] = useState<string>('default')
  const [loading, setLoading] = useState(false)
  const [suporte, setSuporte] = useState(true)

  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      setSuporte(false); return
    }
    setPermissao(Notification.permission)
    navigator.serviceWorker.getRegistration().then(reg => {
      if (reg) reg.pushManager.getSubscription().then(sub => setInscrito(!!sub))
    })
  }, [])

  async function toggleNotificacoes() {
    setLoading(true)
    try {
      if (inscrito) {
        const reg = await navigator.serviceWorker.getRegistration()
        const sub = await reg?.pushManager.getSubscription()
        if (sub) await sub.unsubscribe()
        setInscrito(false)
      } else {
        const perm = await Notification.requestPermission()
        setPermissao(perm)
        if (perm !== 'granted') { setLoading(false); return }
        const reg = await navigator.serviceWorker.register('/sw.js')
        await navigator.serviceWorker.ready
        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
        const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(vapidKey) })
        await fetch('/api/push/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ subscription: sub.toJSON(), atletaId, escolaId }) })
        setInscrito(true)
      }
    } catch (e) { console.error('Push error:', e) }
    setLoading(false)
  }

  if (!suporte) return null
  if (permissao === 'denied') return (
    <div style={{ background:'rgba(255,68,68,0.08)', border:'1px solid rgba(255,68,68,0.2)', borderRadius:12, padding:'12px 14px', textAlign:'center', margin:'8px 0' }}>
      <p style={{ fontSize:12, color:'rgba(240,244,255,0.5)', margin:0 }}>🔕 Notificações bloqueadas — ative nas configurações do navegador</p>
    </div>
  )

  return (
    <button onClick={toggleNotificacoes} disabled={loading}
      style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:10, background: inscrito ? 'rgba(0,214,122,0.1)' : 'rgba(65,105,225,0.1)', border:`1px solid ${inscrito ? 'rgba(0,214,122,0.3)' : 'rgba(65,105,225,0.3)'}`, color: inscrito ? '#00D67A' : '#4169E1', padding:'13px 16px', borderRadius:12, fontFamily:SYNE, fontWeight:700, fontSize:13, cursor:loading?'not-allowed':'pointer', textTransform:'uppercase', letterSpacing:0.5, opacity:loading?0.6:1, margin:'8px 0' }}>
      <span style={{ fontSize:18 }}>{loading ? '⏳' : inscrito ? '🔔' : '🔕'}</span>
      {loading ? 'Aguarde...' : inscrito ? 'Notificações ativas — toque para desativar' : 'Ativar notificações'}
    </button>
  )
}
