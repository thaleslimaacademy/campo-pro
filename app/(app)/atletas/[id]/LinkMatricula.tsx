'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { usePerfil } from '@/lib/usePerfil'

const T = { primary:'#4169E1', green:'#00D67A', text:'#F0F4FF', muted:'rgba(240,244,255,0.4)', border:'rgba(240,244,255,0.08)', surface:'#0D1220' }
const SYNE = 'Syne, sans-serif'

export default function LinkMatricula({ atletaNome, whatsappResponsavel }: { atletaNome?: string; whatsappResponsavel?: string }) {
  const { escolaId } = usePerfil()
  const [slug, setSlug]         = useState('')
  const [escolaNome, setEscolaNome] = useState('')
  const [copiado, setCopiado]   = useState(false)

  useEffect(() => {
    if (!escolaId) return
    supabase.from('Escola').select('slug, nome').eq('id', escolaId).single()
      .then(({ data }) => { if (data) { setSlug(data.slug); setEscolaNome(data.nome) } })
  }, [escolaId])

  const link = slug ? `https://gestaofc.com.br/matricula/${slug}` : ''

  function copiar() {
    if (!link) return
    navigator.clipboard.writeText(link)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  function enviarWhatsApp() {
    const whatsapp = whatsappResponsavel || prompt('WhatsApp do responsável:')
    if (!whatsapp || !link) return
    const numero = whatsapp.replace(/\D/g, '')
    const n = numero.startsWith('55') ? numero : `55${numero}`
    const msg = encodeURIComponent(
      `Olá! 👋\n\nAcesse o link abaixo para fazer a pré-matrícula${atletaNome ? ` de *${atletaNome}*` : ''} na *${escolaNome || 'nossa academia'}*:\n\n${link}\n\n_Preencha a ficha e assine o contrato digital. Nossa equipe analisará e confirmará em breve!_ ⚽`
    )
    window.open(`https://wa.me/${n}?text=${msg}`, '_blank')
  }

  if (!link) return null

  return (
    <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderLeft:`3px solid ${T.primary}`, borderRadius:12, padding:14, marginBottom:12 }}>
      <p style={{ fontFamily:SYNE, fontWeight:700, fontSize:11, color:T.primary, textTransform:'uppercase', letterSpacing:0.8, margin:'0 0 8px' }}>📲 Link de Pré-matrícula</p>
      <p style={{ fontSize:11, color:T.muted, wordBreak:'break-all', margin:'0 0 10px' }}>{link}</p>
      <div style={{ display:'flex', gap:8 }}>
        <button onClick={copiar} style={{ flex:1, background:copiado?`${T.green}15`:T.primary, border:`1px solid ${copiado?T.green+'30':T.primary}`, color:T.text, padding:'10px', borderRadius:8, fontFamily:SYNE, fontWeight:700, fontSize:12, cursor:'pointer', textTransform:'uppercase', transition:'all 0.2s' }}>
          {copiado ? '✅ Copiado!' : '📋 Copiar'}
        </button>
        <button onClick={enviarWhatsApp} style={{ flex:1, background:`${T.green}12`, border:`1px solid ${T.green}30`, color:T.green, padding:'10px', borderRadius:8, fontFamily:SYNE, fontWeight:700, fontSize:12, cursor:'pointer', textTransform:'uppercase' }}>
          📲 WhatsApp
        </button>
      </div>
    </div>
  )
}
