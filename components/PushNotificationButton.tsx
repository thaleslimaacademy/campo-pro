'use client'
import { useEffect, useState } from 'react'

interface Props {
  atletaId: string
  escolaId: string
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i)
  return outputArray
}

export default function PushNotificationButton({ atletaId, escolaId }: Props) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'active' | 'denied'>('idle')

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return
    if (Notification.permission === 'granted') setStatus('active')
    else if (Notification.permission === 'denied') setStatus('denied')
  }, [])

  const ativar = async () => {
    if (!('serviceWorker' in navigator)) return
    setStatus('loading')
    try {
      const reg = await navigator.serviceWorker.ready
      const perm = await Notification.requestPermission()
      if (perm !== 'granted') { setStatus('denied'); return }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
      })

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ atletaId, escolaId, subscription: sub.toJSON() }),
      })
      setStatus('active')
    } catch (e) {
      console.error(e)
      setStatus('idle')
    }
  }

  if (status === 'active') return (
    <div style={{ textAlign: 'center', padding: '10px', fontSize: 12, color: 'rgba(57,255,20,0.7)' }}>
      🔔 Notificações ativadas
    </div>
  )

  if (status === 'denied') return (
    <div style={{ textAlign: 'center', padding: '10px', fontSize: 11, color: 'rgba(255,68,68,0.6)' }}>
      Notificações bloqueadas no navegador
    </div>
  )

  return (
    <button onClick={ativar} disabled={status === 'loading'}
      style={{ width: '100%', background: 'rgba(57,255,20,0.08)', border: '1px solid rgba(57,255,20,0.25)', color: '#39FF14', padding: '12px', borderRadius: 12, cursor: 'pointer', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 13, marginBottom: 12 }}>
      {status === 'loading' ? '⏳ Ativando...' : '🔔 Ativar notificações'}
    </button>
  )
}
