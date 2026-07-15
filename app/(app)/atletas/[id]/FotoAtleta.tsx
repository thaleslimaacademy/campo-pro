'use client'
import { useState } from 'react'
import { salvarFotoAtleta } from './foto-actions'

const T = { primary:'#4169E1', cobalt:'#1A3FA8', text:'#F0F4FF', muted:'rgba(240,244,255,0.4)', green:'#00D67A' }
const SYNE = 'Syne, sans-serif'

const MAX_PX  = 600   // foto de perfil nao precisa mais que isso
const QUALIDADE = 0.85

// Comprime no navegador: 3MB -> ~60KB. Evita estourar o limite de tempo
// do server action na Vercel (plano Hobby = 10s).
async function comprimirImagem(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file)
  let { width, height } = bitmap

  if (width > height && width > MAX_PX) {
    height = Math.round((height * MAX_PX) / width)
    width = MAX_PX
  } else if (height > MAX_PX) {
    width = Math.round((width * MAX_PX) / height)
    height = MAX_PX
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Navegador nao suporta canvas')
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  return canvas.toDataURL('image/jpeg', QUALIDADE)
}

export default function FotoAtleta({ atletaId, fotoUrl, nome }: { atletaId: string; fotoUrl: string | null; nome: string }) {
  const [foto, setFoto]         = useState<string | null>(fotoUrl)
  const [uploading, setUploading] = useState(false)

  async function uploadFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      // comprime antes de enviar — sempre sai JPEG
      const base64 = await comprimirImagem(file)
      const { url } = await salvarFotoAtleta(atletaId, base64, 'jpg')
      setFoto(url)
    } catch (err: any) {
      alert('Erro ao enviar foto: ' + (err?.message || err))
    }
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
