'use client'
import { usePushNotification } from '@/lib/usePushNotification'

const T = { primary:'#4169E1', green:'#00D67A', red:'#FF4444', text:'#F0F4FF', muted:'rgba(240,244,255,0.5)', border:'rgba(240,244,255,0.1)' }
const SYNE = 'Syne, sans-serif'

export default function BotaoPushNotification({ atletaId, escolaId }: { atletaId: string; escolaId: string }) {
  const { permissao, inscrito, loading, ativarNotificacoes, desativarNotificacoes } = usePushNotification(atletaId, escolaId)

  if (!('Notification' in window) && typeof window !== 'undefined') return null

  if (permissao === 'denied') return (
    <div style={{ background:'rgba(255,68,68,0.08)', border:'1px solid rgba(255,68,68,0.2)', borderRadius:10, padding:'10px 14px', textAlign:'center' }}>
      <p style={{ fontSize:12, color:T.muted, margin:0 }}>🔕 Notificações bloqueadas nas configurações do navegador</p>
    </div>
  )

  return (
    <button onClick={inscrito ? desativarNotificacoes : ativarNotificacoes} disabled={loading}
      style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:10, background: inscrito ? `${T.green}10` : `${T.primary}10`, border:`1px solid ${inscrito ? T.green+'30' : T.primary+'30'}`, color: inscrito ? T.green : T.primary, padding:'13px 16px', borderRadius:12, fontFamily:SYNE, fontWeight:700, fontSize:13, cursor:loading?'not-allowed':'pointer', textTransform:'uppercase', letterSpacing:0.5, opacity:loading?0.6:1 }}>
      <span style={{ fontSize:18 }}>{loading ? '⏳' : inscrito ? '🔔' : '🔕'}</span>
      {loading ? 'Aguarde...' : inscrito ? 'Notificações ativas' : 'Ativar notificações'}
    </button>
  )
}
