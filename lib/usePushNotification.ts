'use client'
import { useState, useEffect } from 'react'

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return new Uint8Array([...rawData].map(c => c.charCodeAt(0)))
}

export function usePushNotification(atletaId: string, escolaId: string) {
  const [permissao, setPermissao] = useState<NotificationPermission>('default')
  const [inscrito, setInscrito] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (typeof Notification !== 'undefined') setPermissao(Notification.permission)
    checkInscricao()
  }, [])

  async function checkInscricao() {
    if (!('serviceWorker' in navigator)) return
    const reg = await navigator.serviceWorker.getRegistration()
    if (!reg) return
    const sub = await reg.pushManager.getSubscription()
    setInscrito(!!sub)
  }

  async function ativarNotificacoes() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return
    setLoading(true)
    try {
      const perm = await Notification.requestPermission()
      setPermissao(perm)
      if (perm !== 'granted') { setLoading(false); return }

      const reg = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
      })

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: sub.toJSON(), atletaId, escolaId }),
      })
      setInscrito(true)
    } catch (e) { console.error('Push error:', e) }
    setLoading(false)
  }

  async function desativarNotificacoes() {
    const reg = await navigator.serviceWorker.getRegistration()
    if (!reg) return
    const sub = await reg.pushManager.getSubscription()
    if (sub) await sub.unsubscribe()
    setInscrito(false)
  }

  return { permissao, inscrito, loading, ativarNotificacoes, desativarNotificacoes }
}
