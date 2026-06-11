'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function FotoAtleta({ atletaId, fotoUrl, nome }: {
  atletaId: string
  fotoUrl: string | null
  nome: string
}) {
  const [foto, setFoto] = useState<string | null>(fotoUrl)
  const [uploading, setUploading] = useState(false)

  async function uploadFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)

    const ext = file.name.split('.').pop()
    const path = `${atletaId}.${ext}`

    const { error } = await supabase.storage
      .from('atletas')
      .upload(path, file, { upsert: true })

    if (error) {
      alert('Erro ao enviar foto: ' + error.message)
      setUploading(false)
      return
    }

    const { data } = supabase.storage
      .from('atletas')
      .getPublicUrl(path)

    const novaUrl = data.publicUrl + '?t=' + Date.now()

    await supabase
      .from('Atleta')
      .update({ fotoUrl: novaUrl })
      .eq('id', atletaId)

    setFoto(novaUrl)
    setUploading(false)
  }

  return (
    <div className="relative">
      <label className="cursor-pointer block">
        {foto ? (
          <img
            src={foto}
            alt={nome}
            className="w-16 h-16 rounded-full object-cover border-2 border-green-500"
          />
        ) : (
          <div className="w-16 h-16 bg-green-900 rounded-full flex items-center justify-center text-2xl font-bold text-green-400">
            {nome[0]}
          </div>
        )}
        <div className="absolute -bottom-1 -right-1 bg-green-600 rounded-full w-6 h-6 flex items-center justify-center text-xs">
          {uploading ? '⏳' : '📷'}
        </div>
        <input
          type="file"
          accept="image/*"
          onChange={uploadFoto}
          className="hidden"
          disabled={uploading}
        />
      </label>
    </div>
  )
}