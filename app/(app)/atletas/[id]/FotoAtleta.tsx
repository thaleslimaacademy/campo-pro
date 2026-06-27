'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

const T = { primary:'#4169E1', cobalt:'#1A3FA8', text:'#F0F4FF', muted:'rgba(240,244,255,0.4)', green:'#00D67A' }
const SYNE = 'Syne, sans-serif'

export default function FotoAtleta({ atletaId, fotoUrl, nome }: { atletaId: string; fotoUrl: string | null; nome: string }) {
  const [foto, setFoto]         = useState<string | null>(fotoUrl)
  const [uploading, setUploading] = useState(false)

  async function uploadFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const ext  = file.name.split('.').pop()
    const path = `${atletaId}.${ext}`
    const { error } = await supabase.storage.from('atletas').upload(path, file, { upsert: true })
    if (error) { alert('Erro ao enviar foto: ' + error.message); setUploading(false); return }
    const { data } = supabase.storage.from('atletas').getPublicUrl(path)
    const novaUrl  = data.publicUrl + '?t=' + Date.now()
    await supabase.from('Atleta').update({ fotoUrl: novaUrl }).eq('id', atletaId)
    setFoto(novaUrl)
    setUploading(false)
  }

  return (
    <div style={{ position:'relative', flexShrink:0 }}>
      <label style={{ cursor:'pointer', display:'block' }}>
        {foto ? (
          <img src={foto} alt={nome} style={{ width:64, height:64, borderRadius:'50%', objectFit:'cover', border:`2px solid ${T.primary}` }} />
        ) : (
          <div style={{ width:64, height:64, background:`linear-gradient(135deg, ${T.primary}, ${T.cobalt})`, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:SYNE, fontWeight:900, fontSize:22, color:T.text }}>
            {nome[0].toUpperCase()}
          </div>
        )}
        <div style={{ position:'absolute', bottom:-2, right:-2, width:22, height:22, background:uploading?'rgba(240,244,255,0.2)':T.primary, border:`2px solid #0A0E1A`, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10 }}>
          {uploading ? '⏳' : '📷'}
        </div>
        <input type="file" accept="image/*" onChange={uploadFoto} style={{ display:'none' }} disabled={uploading} />
      </label>
    </div>
  )
}
