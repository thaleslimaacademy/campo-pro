'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'
import { revalidatePath } from 'next/cache'

export async function salvarFotoAtleta(atletaId: string, base64: string, ext: string) {
  const buf = Buffer.from(base64.replace(/^data:.+;base64,/, ''), 'base64')
  const path = `${atletaId}.${ext}`

  const { error: uploadError } = await supabaseAdmin.storage
    .from('atletas')
    .upload(path, buf, { contentType: `image/${ext}`, upsert: true })

  if (uploadError) throw new Error('Erro ao enviar foto: ' + uploadError.message)

  const { data } = supabaseAdmin.storage.from('atletas').getPublicUrl(path)
  const url = data.publicUrl + '?t=' + Date.now()

  const { error: updateError } = await supabaseAdmin
    .from('Atleta')
    .update({ fotoUrl: url })
    .eq('id', atletaId)

  if (updateError) throw new Error('Erro ao salvar foto no banco: ' + updateError.message)

  revalidatePath(`/atletas/${atletaId}`)
  return { ok: true, url }
}
