'use client'
import { useState } from 'react'

const T = { primary:'#2EA866', text:'#1F2937', green:'#16A34A', border:'rgba(16,24,40,0.1)' }
const SYNE = 'Syne, sans-serif'

export default function CopiarLink({ link }: { link: string }) {
  const [copiado, setCopiado] = useState(false)

  function copiar() {
    navigator.clipboard.writeText(link)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <button onClick={copiar} style={{ width:'100%', background:copiado?`${T.green}18`:T.primary, border:`1px solid ${copiado?T.green+'44':T.primary}`, color:'#fff', padding:'12px', borderRadius:8, fontFamily:SYNE, fontWeight:800, fontSize:12, cursor:'pointer', textTransform:'uppercase', letterSpacing:0.5, transition:'all 0.2s' }}>
      {copiado ? '✅ Copiado!' : '📋 Copiar Link'}
    </button>
  )
}
